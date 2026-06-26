import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { checkAvailability, createBooking, ArtaxError } from "./artaxnet.js";
import { authorize, capture, refund, createPix, getTransaction, isPixPaid } from "./rede.js";
import { ValidationError } from "./validation.js";

const nightsBetween = (arrival, departure) =>
  Math.max(1, Math.round((new Date(departure) - new Date(arrival)) / 86_400_000));

/** Encontra a opção (quarto + rateplan) e devolve o PREÇO AUTORITATIVO do Artax. */
const resolveAuthoritativeOption = (availability, roomId, rateplanId) => {
  const rooms = availability?.rooms;
  if (!rooms || Array.isArray(rooms)) return null; // [] => sem disponibilidade
  const room = rooms[roomId] || rooms[String(roomId)];
  if (!room) return null;
  const option = room[rateplanId] || room[String(rateplanId)];
  if (!option) return null;
  const price = Number(option.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    roomName: option.room_name,
    rateplanId: Number(option.rateplan_id) || Number(rateplanId),
    price,
    capacity: option.capacity || null,
    allots: option.allots
  };
};

/** Reconfere disponibilidade no momento da compra e calcula o total a cobrar. */
const resolveStay = async (input) => {
  const availability = await checkAvailability({
    arrival_date: input.arrival_date,
    departure_date: input.departure_date,
    adults: input.adults,
    kids: input.kids,
    ages: input.ages
  });
  const option = resolveAuthoritativeOption(availability, input.roomId, input.rateplanId);
  if (!option) {
    throw new ValidationError("A opção escolhida não está mais disponível para estas datas. Refaça a busca.");
  }
  const nights = nightsBetween(input.arrival_date, input.departure_date);
  const totalPrice =
    config.artax.priceMode === "per_night" ? Number((option.price * nights).toFixed(2)) : option.price;
  return { option, totalPrice, amountCents: Math.round(totalPrice * 100) };
};

/**
 * Cria a reserva no Artax após o pagamento confirmado. Se a criação falhar,
 * estorna o pagamento (compensação) — vale para cartão e PIX.
 */
const bookStay = async ({ input, option, totalPrice, reference, tid, amountCents }) => {
  const bookingPayload = {
    arrival_date: input.arrival_date,
    departure_date: input.departure_date,
    rateplan_id: option.rateplanId,
    comment: [input.comment, `Pagamento Rede TID ${tid} ref ${reference}`].filter(Boolean).join(" | "),
    guest: input.guest,
    room_units: {
      [input.roomId]: {
        price: totalPrice,
        adults: input.adults,
        kids: input.kids,
        ages: input.ages,
        guests: [
          {
            first_name: input.guest.first_name,
            last_name: input.guest.last_name,
            document: input.guest.document,
            document_type: input.guest.document_type,
            phone: input.guest.phone,
            email: input.guest.email
          }
        ]
      }
    }
  };

  try {
    const booking = await createBooking(bookingPayload);
    return { booking_id: booking.booking_id, room: { id: input.roomId, name: option.roomName, rateplan_id: option.rateplanId } };
  } catch (error) {
    console.error("[checkout] Reserva falhou após pagamento. Estornando TID", tid,
      error instanceof ArtaxError ? error.payload : error.message);
    try {
      await refund(tid, amountCents);
      throw new Error("Não foi possível concluir a reserva. O pagamento foi cancelado (você não foi cobrado). Tente novamente.");
    } catch (refundError) {
      console.error("[checkout] FALHA NO ESTORNO — intervenção manual necessária.", { tid, reference, amountCents });
      const fatal = new Error(`Pagamento confirmado mas a reserva e o estorno falharam. Guarde o comprovante (TID ${tid}) e contate a pousada.`);
      fatal.status = 500;
      throw fatal;
    }
  }
};

/* ============ CARTÃO: pré-autoriza → cria reserva → captura ============ */
export const processCheckout = async (input) => {
  const { option, totalPrice, amountCents } = await resolveStay(input);
  const reference = `CZ-${Date.now()}-${randomUUID().slice(0, 8)}`;

  // 1) Pré-autorização (NÃO cobra ainda — só reserva o limite).
  const auth = await authorize({ amountCents, reference, installments: input.installments, card: input.card });
  if (auth.needs3DS) {
    const e = new Error("Este cartão exige autenticação 3DS (ainda não habilitada nesta versão). Use PIX ou outro cartão.");
    e.status = 402;
    throw e;
  }

  // 2) Cria a reserva no Artax (se falhar, bookStay cancela a pré-autorização → cliente não é cobrado).
  const booked = await bookStay({ input, option, totalPrice, reference, tid: auth.tid, amountCents });

  // 3) Reserva garantida → captura (só agora cobra de fato).
  let captured = true;
  try {
    await capture({ tid: auth.tid, amountCents });
  } catch (capErr) {
    captured = false;
    console.error("[checkout] Reserva criada, mas a CAPTURA falhou — capturar manualmente (TID " + auth.tid + ").", capErr.message);
  }

  return {
    booking_id: booked.booking_id,
    room: booked.room,
    payment: {
      method: "card",
      tid: auth.tid,
      authorizationCode: auth.authorizationCode,
      reference,
      installments: input.installments,
      amount: totalPrice,
      captured
    }
  };
};

/* ===================== PIX (gera QR; reserva só após pago) ===================== */
// Guarda o contexto da cobrança PIX até o pagamento ser confirmado.
// (Single instance no Railway; o PIX expira em minutos, então memória basta.)
const pendingPix = new Map();
const PIX_TTL_MS = 60 * 60 * 1000;

const cleanupPix = () => {
  const now = Date.now();
  for (const [tid, e] of pendingPix) if (now - e.createdAt > PIX_TTL_MS) pendingPix.delete(tid);
};

export const createPixCharge = async (input) => {
  cleanupPix();
  const { option, totalPrice, amountCents } = await resolveStay(input);
  const reference = `CZ-${Date.now()}-${randomUUID().slice(0, 8)}`;

  const pix = await createPix({ amountCents, reference, expiresIn: 3600 });
  if (!pix.tid) throw new Error("A Rede não retornou o identificador da cobrança PIX.");

  pendingPix.set(pix.tid, { input, option, totalPrice, amountCents, reference, bookingId: null, room: null, createdAt: Date.now() });

  return {
    tid: pix.tid,
    qrCode: pix.qrCode, // copia-e-cola (EMV)
    qrImage: pix.qrImage, // imagem do QR (se a Rede enviar)
    amount: totalPrice,
    expiresIn: 3600
  };
};

export const confirmPix = async (tid) => {
  const entry = pendingPix.get(tid);
  if (!entry) return { status: "expired" };

  // Já reservado nesta sessão? Devolve o mesmo resultado (idempotente).
  if (entry.bookingId) {
    return { status: "paid", booking_id: entry.bookingId, room: entry.room, payment: { method: "pix", tid, amount: entry.totalPrice } };
  }

  const tx = await getTransaction(tid);
  if (!isPixPaid(tx)) return { status: "pending" };

  const booked = await bookStay({
    input: entry.input,
    option: entry.option,
    totalPrice: entry.totalPrice,
    reference: entry.reference,
    tid,
    amountCents: entry.amountCents
  });
  entry.bookingId = booked.booking_id;
  entry.room = booked.room;

  return {
    status: "paid",
    booking_id: booked.booking_id,
    room: booked.room,
    payment: { method: "pix", tid, reference: entry.reference, amount: entry.totalPrice }
  };
};
