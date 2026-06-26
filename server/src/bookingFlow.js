import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { checkAvailability, createBooking, ArtaxError } from "./artaxnet.js";
import { authorizeAndCapture, refund } from "./rede.js";
import { ValidationError } from "./validation.js";

const nightsBetween = (arrival, departure) =>
  Math.max(1, Math.round((new Date(departure) - new Date(arrival)) / 86_400_000));

/**
 * Encontra a opção (quarto + rateplan) na resposta de disponibilidade e devolve
 * o PREÇO AUTORITATIVO vindo do Artax. Nunca confiamos no preço enviado pelo
 * cliente — ele poderia ser adulterado no navegador.
 */
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

/**
 * Processa um checkout completo.
 * @returns {Promise<{booking_id:number, payment:object, room:object}>}
 */
export const processCheckout = async (input) => {
  // 1) Reconfere disponibilidade e obtém o preço real no momento da compra.
  const availability = await checkAvailability({
    arrival_date: input.arrival_date,
    departure_date: input.departure_date,
    adults: input.adults,
    kids: input.kids,
    ages: input.ages
  });

  const option = resolveAuthoritativeOption(availability, input.roomId, input.rateplanId);
  if (!option) {
    throw new ValidationError(
      "A opção escolhida não está mais disponível para estas datas. Refaça a busca."
    );
  }

  // Total a cobrar conforme a interpretação configurada do preço do Artax.
  const nights = nightsBetween(input.arrival_date, input.departure_date);
  const totalPrice =
    config.artax.priceMode === "per_night"
      ? Number((option.price * nights).toFixed(2))
      : option.price;
  const amountCents = Math.round(totalPrice * 100);
  const reference = `CZ-${Date.now()}-${randomUUID().slice(0, 8)}`;

  // 2) Cobra o pagamento. Se não aprovar, RedeError sobe e nada é reservado.
  const payment = await authorizeAndCapture({
    amountCents,
    reference,
    installments: input.installments,
    card: input.card
  });

  // 3) Pagamento aprovado → cria a reserva no Artax.
  const bookingPayload = {
    arrival_date: input.arrival_date,
    departure_date: input.departure_date,
    rateplan_id: option.rateplanId,
    comment: [input.comment, `Pagamento Rede TID ${payment.tid} ref ${reference}`]
      .filter(Boolean)
      .join(" | "),
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
    return {
      booking_id: booking.booking_id,
      payment: {
        tid: payment.tid,
        nsu: payment.nsu,
        authorizationCode: payment.authorizationCode,
        reference: payment.reference,
        installments: payment.installments,
        amount: totalPrice
      },
      room: { id: input.roomId, name: option.roomName, rateplan_id: option.rateplanId }
    };
  } catch (error) {
    // 4) COMPENSAÇÃO: pagamento capturado mas reserva falhou → estorna.
    console.error(
      "[checkout] Reserva falhou após pagamento aprovado. Estornando TID",
      payment.tid,
      error instanceof ArtaxError ? error.payload : error.message
    );
    try {
      await refund(payment.tid, amountCents);
      throw new Error(
        "Não foi possível concluir a reserva, então o pagamento foi estornado. Tente novamente."
      );
    } catch (refundError) {
      // Estado que exige intervenção manual — registrar com destaque.
      console.error("[checkout] FALHA NO ESTORNO — intervenção manual necessária.", {
        tid: payment.tid,
        reference,
        amountCents
      });
      const fatal = new Error(
        "Pagamento aprovado mas a reserva e o estorno falharam. " +
          `Guarde este comprovante (TID ${payment.tid}) e contate a pousada.`
      );
      fatal.status = 500;
      throw fatal;
    }
  }
};
