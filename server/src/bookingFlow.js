import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { checkAvailability, createBooking, addBookingPayment, ArtaxError } from "./artaxnet.js";
import { authorize, capture, refund, createPix, getPixTransaction, pixStatusOf, pixData } from "./rede.js";
import { itauTxid, createCob, getCob, cobPaid, cobCanceled } from "./itau.js";
import { ValidationError, validateOneCard } from "./validation.js";
import { sendBookingConfirmation } from "./email.js";
import { notifyAsksuiteBooking, notifyAsksuitePurchase } from "./partners.js";

const nightsBetween = (arrival, departure) =>
  Math.max(1, Math.round((new Date(departure) - new Date(arrival)) / 86_400_000));

/** Dispara o e-mail de confirmação (fire-and-forget; nunca derruba a reserva). */
const fireConfirmationEmail = ({ input, rooms, totalPrice, bookingId, method, tid }) => {
  const to = input?.guest?.email;
  if (!to) return;
  sendBookingConfirmation({
    to,
    guestName: [input.guest.first_name, input.guest.last_name].filter(Boolean).join(" "),
    rooms: rooms.map((r) => ({ name: r.option.roomName, price: r.totalPrice })),
    checkIn: input.arrival_date,
    checkOut: input.departure_date,
    nights: nightsBetween(input.arrival_date, input.departure_date),
    adults: input.adults,
    kids: input.kids,
    totalPrice,
    bookingId,
    method,
    tid
  }).catch((e) => console.error("[email] falha inesperada:", e.message));
};

/** Notifica parceiros (ex.: Asksuite) quando a reserva é confirmada — para rastreio de conversão. */
const fireAsksuiteNotification = ({ input, rooms, totalPrice, bookingId, method, tid }) => {
  notifyAsksuiteBooking({
    event: "booking.confirmed",
    booking_id: bookingId,
    arrival_date: input.arrival_date,
    departure_date: input.departure_date,
    nights: nightsBetween(input.arrival_date, input.departure_date),
    rooms: rooms.map((r) => ({ id: r.roomId, name: r.option.roomName, price: r.totalPrice })),
    guests: { adults: input.adults, kids: input.kids },
    guest: {
      first_name: input.guest?.first_name,
      last_name: input.guest?.last_name,
      email: input.guest?.email,
      phone: input.guest?.phone
    },
    payment: { method, amount: totalPrice, currency: "BRL", tid },
    confirmed_at: new Date().toISOString()
  }).catch((e) => console.error("[asksuite] falha inesperada:", e.message));
};

/**
 * Notifica a Asksuite da compra vinculada à sessão de atendimento (_askSI),
 * no formato pedido pelo Felippe (17/08/2026). Só dispara se a reserva
 * carregar um _askSI (ou seja, veio do link direto que a IA deles gera).
 * Payload ainda não confirmado por eles como definitivo — ajustar quando
 * o endpoint real estiver pronto.
 */
const fireAsksuitePurchaseTracking = ({ input, rooms, totalPrice, bookingId }) => {
  const askSi = input.askSi;
  if (!askSi) return;
  notifyAsksuitePurchase({
    event: "purchase",
    products: rooms.map((r) => ({ currency: "BRL", price: r.totalPrice, quantity: 1 })),
    session: { _askSI: askSi },
    dataLayer: {
      ecommerce: {
        purchase: {
          // `revenue` é o valor total da reserva. Sem ele a Asksuite recebe os
          // preços item a item mas não o total da compra — e o painel de
          // "Reservas realizadas (R$)" fica zerado. O Pixel do front já enviava
          // esse campo; aqui faltava.
          actionField: { id: String(bookingId), revenue: Number(totalPrice || 0).toFixed(2), currency: "BRL" },
          products: rooms.map((r) => ({
            name: r.option.roomName,
            price: r.totalPrice,
            category: "",
            quantity: 1,
            currency: "BRL"
          }))
        }
      }
    }
  }).catch((e) => console.error("[asksuite] falha inesperada (purchase tracking):", e.message));
};

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

/**
 * Reconfere disponibilidade no momento da compra e calcula o total a cobrar.
 * Suporta múltiplas acomodações (tipos diferentes) numa única reserva — a
 * mesma consulta de disponibilidade (mesma ocupação) é reaproveitada para
 * resolver cada quarto selecionado, e o total é a soma de todos.
 */
const resolveStay = async (input) => {
  const availability = await checkAvailability({
    arrival_date: input.arrival_date,
    departure_date: input.departure_date,
    adults: input.adults,
    kids: input.kids,
    ages: input.ages
  });
  const nights = nightsBetween(input.arrival_date, input.departure_date);

  let grandTotal = 0;
  const rooms = input.rooms.map(({ roomId, rateplanId }) => {
    const option = resolveAuthoritativeOption(availability, roomId, rateplanId);
    if (!option) {
      throw new ValidationError("Uma das acomodações selecionadas não está mais disponível para estas datas. Refaça a busca.");
    }
    const totalPrice =
      config.artax.priceMode === "per_night" ? Number((option.price * nights).toFixed(2)) : option.price;
    grandTotal += totalPrice;
    return { roomId, option, totalPrice };
  });

  grandTotal = Number(grandTotal.toFixed(2));
  return { rooms, totalPrice: grandTotal, amountCents: Math.round(grandTotal * 100) };
};

/**
 * Cria a reserva no Artax após o pagamento confirmado. Se a criação falhar,
 * faz a compensação conforme o método:
 *  - cartão: a pré-autorização (capture:false) é cancelada → cliente NÃO é cobrado.
 *  - pix: o valor já foi recebido; não há refund PIX automático aqui, então
 *         alertamos para DEVOLUÇÃO MANUAL e orientamos o cliente a contatar a pousada.
 *
 * Suporta múltiplas acomodações: uma chave em `room_units` por quarto
 * selecionado (o Artax já aceita isso nativamente). O `rateplan_id` vai tanto
 * no nível do quarto quanto no topo do payload (com o do primeiro quarto) —
 * ainda não confirmamos com o Artax qual dos dois é lido quando os quartos
 * têm planos tarifários diferentes, então mandamos os dois por segurança.
 * IMPORTANTE: validar com uma reserva de teste real de 2 quartos antes de
 * confiar 100% nisso em produção.
 */
const bookStay = async ({ input, rooms, reference, tid, amountCents, method = "card", releaseAll, tids }) => {
  const roomNames = rooms.map((r) => r.option.roomName).join(", ");
  const guestEntry = [
    {
      first_name: input.guest.first_name,
      last_name: input.guest.last_name,
      document: input.guest.document,
      document_type: input.guest.document_type,
      phone: input.guest.phone,
      email: input.guest.email
    }
  ];

  const room_units = {};
  for (const r of rooms) {
    room_units[r.roomId] = {
      rateplan_id: r.option.rateplanId,
      price: r.totalPrice,
      adults: input.adults,
      kids: input.kids,
      ages: input.ages,
      guests: guestEntry
    };
  }

  const bookingPayload = {
    arrival_date: input.arrival_date,
    departure_date: input.departure_date,
    rateplan_id: rooms[0].option.rateplanId,
    status: config.artax.bookingStatus, // 2 = Confirmado (criada só após pagamento)
    // Com pagamento dividido, os dois TIDs vão no comentário — é por eles que a
    // recepção concilia a reserva com as transações no painel da Rede.
    comment: [
      input.comment,
      `Acomodações: ${roomNames}`,
      `Pagamento Rede TID ${(tids && tids.length ? tids.join(" + ") : tid)} ref ${reference}`
    ].filter(Boolean).join(" | "),
    guest: input.guest,
    room_units
  };

  try {
    const booking = await createBooking(bookingPayload);
    return {
      booking_id: booking.booking_id,
      rooms: rooms.map((r) => ({ id: r.roomId, name: r.option.roomName, rateplan_id: r.option.rateplanId, price: r.totalPrice }))
    };
  } catch (error) {
    console.error("[checkout] Reserva falhou após pagamento.", { method, tid, reference },
      error instanceof ArtaxError ? error.payload : error.message);

    // CARTÃO: cancela a(s) pré-autorização(ões) — libera o limite, cliente não
    // é cobrado. Com pagamento dividido, `releaseAll` estorna os dois cartões.
    if (method === "card") {
      let stuck = [];
      if (typeof releaseAll === "function") {
        stuck = await releaseAll();
      } else {
        try {
          await refund(tid, amountCents);
        } catch (refundError) {
          console.error("[checkout] FALHA NO ESTORNO — intervenção manual necessária.", { tid, reference, amountCents });
          stuck = [tid];
        }
      }
      if (!stuck.length) {
        throw new Error("Não foi possível concluir a reserva. O pagamento foi cancelado (você não foi cobrado). Tente novamente.");
      }
      const fatal = new Error(`Pagamento autorizado mas a reserva e o cancelamento falharam. Guarde o comprovante (TID ${stuck.join(", ")}) e contate a pousada.`);
      fatal.status = 500;
      throw fatal;
    }

    // PIX: o valor já foi recebido → exige devolução manual (sem refund automático aqui).
    console.error("[checkout] PIX PAGO mas a reserva falhou — DEVOLUÇÃO MANUAL necessária.", { tid, reference, amountCents });
    const fatal = new Error(`Recebemos seu PIX, mas houve uma falha ao confirmar a reserva. Guarde o comprovante (TID ${tid}) e contate a pousada para regularizar.`);
    fatal.status = 500;
    throw fatal;
  }
};

/**
 * Registra o pagamento na reserva do Artax (lança no financeiro).
 * Não derruba a reserva se falhar: a reserva já existe e o dinheiro foi
 * processado na Rede — apenas alerta para lançamento manual.
 */
const buildArtaxPayment = ({ method, totalPrice, installments = 1, confirmed = true }, index, total) => {
  const payment = {
    payment_method_id: method === "pix" ? config.artax.paymentMethodPix : config.artax.paymentMethodCard,
    gross_amount: Number(Number(totalPrice).toFixed(2)),
    installments: Math.max(1, Number(installments) || 1),
    due_date: new Date().toISOString().slice(0, 10),
    confirmed,
    obs: total > 1 ? `Pagamento via site (Rede) — cartão ${index + 1} de ${total}` : `Pagamento via site (Rede)`
  };
  if (config.artax.costCenterId) payment.cost_center_id = config.artax.costCenterId;
  return payment;
};

/* Lança um ou mais pagamentos na reserva. Vão TODOS na mesma chamada: a API do
   Artax já recebe uma lista, e mandar de uma vez evita ficar com metade do
   pagamento lançado se a segunda chamada falhasse. */
const registerArtaxPayments = async (bookingId, entries) => {
  const payments = entries.map((e, i) => buildArtaxPayment(e, i, entries.length));
  try {
    const res = await addBookingPayment(bookingId, payments);
    console.log("[checkout] Pagamento(s) lançado(s) no Artax:", {
      bookingId, qtd: payments.length, bills: res.bills?.map((b) => b.bill_id)
    });
    return true;
  } catch (err) {
    console.error("[checkout] FALHA ao lançar pagamento no Artax (lançar manualmente).",
      { bookingId, qtd: payments.length }, err instanceof ArtaxError ? err.payload : err.message);
    return false;
  }
};

const registerArtaxPayment = (bookingId, entry) => registerArtaxPayments(bookingId, [entry]);

/* Estorna todas as pré-autorizações já feitas. Usado quando uma etapa posterior
   falha: melhor liberar o limite de quem já passou do que deixar o hóspede com
   um cartão preso numa reserva que não existe. Devolve o que NÃO deu para
   estornar, para o chamador avisar que precisa de intervenção manual. */
const releaseAuthorizations = async (auths) => {
  const stuck = [];
  for (const a of auths) {
    try {
      await refund(a.tid, a.amountCents);
    } catch (err) {
      console.error("[checkout] FALHA NO ESTORNO — intervenção manual necessária.",
        { tid: a.tid, amountCents: a.amountCents }, err.message);
      stuck.push(a.tid);
    }
  }
  return stuck;
};

/* ---------- pagamento dividido com um cartão recusado ----------
   Quando um cartão aprova e o outro não, a autorização aprovada fica RETIDA e
   a sessão é guardada aqui, para o hóspede tentar outro cartão sem redigitar o
   que já passou. Nada é capturado nesse meio-tempo: é reserva de limite, não
   cobrança.

   ATENÇÃO OPERACIONAL: enquanto a sessão vive, o limite do cartão aprovado
   segue preso. Por isso o TTL é curto e existe cancelSplitSession() — a opção
   "desistir e pedir estorno" do site. Se o hóspede simplesmente fechar a aba,
   a limpeza por TTL libera automaticamente. */
const pendingSplits = new Map();
const SPLIT_TTL_MS = 30 * 60 * 1000; // 30 min

const cleanupSplits = () => {
  const now = Date.now();
  for (const [id, s] of pendingSplits) {
    if (now - s.createdAt > SPLIT_TTL_MS) {
      pendingSplits.delete(id);
      // Libera o limite de quem ficou preso numa sessão abandonada.
      releaseAuthorizations(s.auths).catch(() => {});
      console.warn("[checkout] Sessão de pagamento dividido expirada — autorizações liberadas.", { id });
    }
  }
};

const partialPaymentError = ({ input, rooms, totalPrice, amountCents, reference, auths, failedIndex, failedAmountCents, reason }) => {
  cleanupSplits();
  const sessionId = randomUUID();
  pendingSplits.set(sessionId, {
    createdAt: Date.now(),
    input, rooms, totalPrice, amountCents, reference,
    auths: [...auths],
    failedIndex, failedAmountCents
  });
  const err = new Error(`O cartão ${failedIndex + 1} não foi aprovado.`);
  err.status = 402;
  err.partial = {
    sessionId,
    reason,
    failedCard: failedIndex + 1,
    pendingAmount: Number((failedAmountCents / 100).toFixed(2)),
    approved: auths.map((a, i) => ({
      card: i + 1,
      amount: Number((a.amountCents / 100).toFixed(2)),
      installments: a.installments,
      status: "authorized"
    })),
    expiresInMin: Math.round(SPLIT_TTL_MS / 60000)
  };
  console.warn("[checkout] Pagamento dividido parcial — aguardando troca de cartão.",
    { sessionId, failedCard: failedIndex + 1, pendingAmount: err.partial.pendingAmount });
  return err;
};

/** Troca o cartão recusado e conclui a reserva. */
export const retrySplitCard = async (sessionId, rawCard, maxInstallments) => {
  cleanupSplits();
  const s = pendingSplits.get(sessionId);
  if (!s) {
    const e = new Error("Esta tentativa de pagamento expirou. Refaça a reserva — nenhum valor foi cobrado.");
    e.status = 410;
    throw e;
  }
  // Mesma validação do checkout normal: formato, validade e CVV são conferidos
  // aqui antes de mandar para a Rede.
  const card = validateOneCard(rawCard, maxInstallments);
  const installments = card.installments;

  let auth;
  try {
    auth = await authorize({
      amountCents: s.failedAmountCents,
      reference: `${s.reference}-r${Date.now().toString(36)}`,
      installments,
      card
    });
  } catch (err) {
    // Continua parcial: a sessão segue viva para nova tentativa.
    const e = new Error(`Cartão recusado: ${err.message}`);
    e.status = err.status || 402;
    e.partial = {
      sessionId,
      retry: true,
      reason: err.message,
      failedCard: s.failedIndex + 1,
      pendingAmount: Number((s.failedAmountCents / 100).toFixed(2)),
      approved: s.auths.map((a, i) => ({
        card: i + 1,
        amount: Number((a.amountCents / 100).toFixed(2)),
        installments: a.installments,
        status: "authorized"
      }))
    };
    throw e;
  }
  if (auth.needs3DS) {
    const e = new Error("Este cartão exige autenticação 3DS, ainda não habilitada nesta versão. Tente outro cartão.");
    e.status = 402;
    e.partial = { sessionId, retry: true, pendingAmount: Number((s.failedAmountCents / 100).toFixed(2)) };
    throw e;
  }

  pendingSplits.delete(sessionId);
  const auths = [...s.auths, { tid: auth.tid, amountCents: s.failedAmountCents, installments, auth }];
  return finishCardCheckout({
    input: s.input, rooms: s.rooms, totalPrice: s.totalPrice,
    amountCents: s.amountCents, reference: s.reference, auths
  });
};

/** Desiste da tentativa e libera o limite do cartão que havia sido aprovado. */
export const cancelSplitSession = async (sessionId) => {
  const s = pendingSplits.get(sessionId);
  if (!s) return { released: true, alreadyGone: true };
  pendingSplits.delete(sessionId);
  const stuck = await releaseAuthorizations(s.auths);
  if (stuck.length) {
    console.error("[checkout] Cancelamento de sessão dividida: estorno falhou.", { sessionId, stuck });
    return { released: false, tids: stuck };
  }
  console.log("[checkout] Sessão de pagamento dividido cancelada e autorizações liberadas.", { sessionId });
  return { released: true };
};

/* ============ CARTÃO: pré-autoriza → cria reserva → captura ============
   Aceita até dois cartões, cada um com seu valor e seu parcelamento. A soma é
   conferida contra o preço AUTORITATIVO do Artax — nunca contra o total que o
   site enviou — e nada é cobrado se não bater exatamente. */
export const processCheckout = async (input) => {
  const { rooms, totalPrice, amountCents } = await resolveStay(input);
  const reference = `CZ-${Date.now()}-${randomUUID().slice(0, 8)}`;

  const cards = input.cards?.length ? input.cards : [{ ...input.card, installments: input.installments, amountCents: null }];
  const split = cards.length > 1;

  // Cartão único cobra o total; com divisão, a soma tem que fechar na casa dos
  // centavos. Isso roda ANTES de qualquer autorização: se não bater, ninguém é
  // cobrado — só recebe o aviso.
  const parts = split
    ? cards.map((c) => c.amountCents)
    : [amountCents];
  if (split) {
    const sum = parts.reduce((t, v) => t + v, 0);
    if (sum !== amountCents) {
      const diff = (Math.abs(sum - amountCents) / 100).toFixed(2);
      throw new ValidationError(
        sum > amountCents
          ? `A soma dos dois cartões passa R$ ${diff} do total da reserva. Ajuste os valores para somar exatamente ${totalPrice.toFixed(2)}.`
          : `Faltam R$ ${diff} para fechar o total da reserva. Ajuste os valores para somar exatamente ${totalPrice.toFixed(2)}.`
      );
    }
  }

  // 1) Pré-autorizações (NÃO cobram ainda — só reservam o limite). Em série:
  // se a segunda recusar, a primeira é estornada antes de devolver o erro.
  const auths = [];
  for (let i = 0; i < cards.length; i += 1) {
    const c = cards[i];
    const partCents = parts[i];
    const partRef = split ? `${reference}-${i + 1}` : reference;
    let auth;
    try {
      auth = await authorize({
        amountCents: partCents,
        reference: partRef,
        installments: c.installments,
        card: c
      });
    } catch (err) {
      // Se algum cartão anterior já foi aprovado, a autorização dele NÃO é
      // estornada aqui: fica retida enquanto o hóspede troca o cartão recusado.
      // Sem isso ele teria que digitar os dois de novo do zero.
      if (auths.length) {
        throw partialPaymentError({
          input, rooms, totalPrice, amountCents, reference, auths,
          failedIndex: i, failedAmountCents: partCents,
          reason: err.message
        });
      }
      const e = new Error(`Cartão ${i + 1} recusado: ${err.message} Nenhum valor foi cobrado.`);
      e.status = err.status || 402;
      throw e;
    }
    if (auth.needs3DS) {
      if (auths.length) {
        throw partialPaymentError({
          input, rooms, totalPrice, amountCents, reference, auths,
          failedIndex: i, failedAmountCents: partCents,
          reason: "Este cartão exige autenticação 3DS, ainda não habilitada nesta versão."
        });
      }
      const e = new Error(`O cartão ${i + 1} exige autenticação 3DS (ainda não habilitada nesta versão). Use PIX ou outro cartão. Nenhum valor foi cobrado.`);
      e.status = 402;
      throw e;
    }
    auths.push({ tid: auth.tid, amountCents: partCents, installments: c.installments, auth });
  }

  return finishCardCheckout({ input, rooms, totalPrice, amountCents, reference, auths });
};

/* Conclui a compra com todas as autorizações já aprovadas: cria a reserva,
   captura cada cartão e lança os pagamentos. Extraído para ser reaproveitado
   pela troca de cartão (retrySplitCard), que chega aqui com uma autorização
   antiga e uma nova. */
const finishCardCheckout = async ({ input, rooms, totalPrice, amountCents, reference, auths }) => {
  const auth = auths[0].auth;

  // 2) Cria a reserva no Artax (se falhar, cancela TODAS as pré-autorizações).
  const booked = await bookStay({
    input, rooms, reference, tid: auth.tid, amountCents,
    releaseAll: () => releaseAuthorizations(auths),
    tids: auths.map((a) => a.tid)
  });

  // 3) Reserva garantida → captura cada cartão (só agora cobra de fato).
  // A reserva já existe, então uma captura que falhe NÃO desfaz nada: fica
  // registrada como pendente para captura manual, e o pagamento entra no Artax
  // como não confirmado. Desfazer aqui seria pior — cancelaria uma reserva
  // válida por um problema que a pousada resolve pelo painel da Rede.
  const charges = [];
  for (let i = 0; i < auths.length; i += 1) {
    const a = auths[i];
    let ok = true;
    try {
      await capture({ tid: a.tid, amountCents: a.amountCents });
    } catch (capErr) {
      ok = false;
      console.error(`[checkout] Reserva criada, mas a CAPTURA do cartão ${i + 1} falhou — capturar manualmente (TID ${a.tid}).`, capErr.message);
    }
    charges.push({
      card: i + 1,
      tid: a.tid,
      amount: Number((a.amountCents / 100).toFixed(2)),
      installments: a.installments,
      status: ok ? "captured" : "pending_capture",
      authorizationCode: a.auth.authorizationCode
    });
  }
  const captured = charges.every((c) => c.status === "captured");

  // 4) Lança um pagamento por cartão na reserva do Artax (a API já aceita lista).
  const paymentRegistered = await registerArtaxPayments(
    booked.booking_id,
    charges.map((c) => ({
      method: "card",
      totalPrice: c.amount,
      installments: c.installments,
      confirmed: c.status === "captured"
    }))
  );

  // E-mail de confirmação — SÓ após o pagamento (cartão efetivamente capturado).
  // Não bloqueia a resposta ao cliente.
  if (captured) {
    fireConfirmationEmail({ input, rooms, totalPrice, bookingId: booked.booking_id, method: "card", tid: auth.tid });
    fireAsksuiteNotification({ input, rooms, totalPrice, bookingId: booked.booking_id, method: "card", tid: auth.tid });
    fireAsksuitePurchaseTracking({ input, rooms, totalPrice, bookingId: booked.booking_id });
  }

  return {
    booking_id: booked.booking_id,
    rooms: booked.rooms,
    payment: {
      method: "card",
      tid: auth.tid,
      authorizationCode: auth.authorizationCode,
      reference,
      installments: auths[0].installments,
      amount: totalPrice,
      captured,
      registered: paymentRegistered,
      split,
      // Status de cada cobrança, para o site mostrar as duas ao hóspede.
      charges
    }
  };
};

/* ===================== PIX (gera QR; reserva só após pago) ===================== */
// Guarda o contexto da cobrança PIX até o pagamento ser confirmado.
// (Single instance no Railway; o PIX expira em minutos, então memória basta.)
const pendingPix = new Map();
const PIX_TTL_MS = 60 * 60 * 1000;
const PIX_EXPIRES_MIN = Number(process.env.PIX_EXPIRES_MIN) || 15; // validade do QR Code (min)

const cleanupPix = () => {
  const now = Date.now();
  for (const [tid, e] of pendingPix) if (now - e.createdAt > PIX_TTL_MS) pendingPix.delete(tid);
};

// A Rede exige reference de até 16 caracteres alfanuméricos para o PIX.
const pixReference = () =>
  ("CZ" + Date.now().toString(36) + randomUUID().replace(/-/g, ""))
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 16);

export const createPixCharge = async (input) => {
  cleanupPix();
  const { rooms, totalPrice, amountCents } = await resolveStay(input);
  const reference = pixReference();

  let tid, qrCode, qrImage = "", expiresInSec;
  if (config.pixProvider === "itau") {
    tid = itauTxid();
    const cob = await createCob({ txid: tid, amountCents, solicitacaoPagador: "Reserva Pousada Casa Zanotto" });
    qrCode = cob.pixCopiaECola;
    expiresInSec = config.itau.expiracao;
  } else {
    const expiresAt = new Date(Date.now() + PIX_EXPIRES_MIN * 60_000);
    const pix = await createPix({ amountCents, reference, expiresAt });
    if (!pix.tid) throw new Error("A Rede não retornou o identificador da cobrança PIX.");
    tid = pix.tid;
    qrCode = pix.qrCode;
    qrImage = pix.qrImage;
    expiresInSec = PIX_EXPIRES_MIN * 60;
  }
  console.log("[pix] criado", { provider: config.pixProvider, tid, reference, amountCents });

  pendingPix.set(tid, { provider: config.pixProvider, input, rooms, totalPrice, amountCents, reference, bookingId: null, bookedRooms: null, createdAt: Date.now() });

  return {
    tid,
    qrCode, // copia-e-cola (EMV)
    qrImage, // imagem do QR em base64 (PNG) — Itaú não envia; front gera do copia-e-cola
    amount: totalPrice,
    expiresInSec
  };
};

const paidPixResult = (entry, tid) => ({
  status: "paid",
  booking_id: entry.bookingId,
  rooms: entry.bookedRooms,
  payment: { method: "pix", tid, reference: entry.reference, amount: entry.totalPrice, registered: entry.registered }
});

export const confirmPix = async (tid) => {
  const entry = pendingPix.get(tid);
  if (!entry) return { status: "expired" };

  // Já reservado? Devolve o mesmo resultado (idempotente).
  if (entry.bookingId) return paidPixResult(entry, tid);

  // Determina o status conforme o provedor (o tid já amarra à nossa cobrança).
  let paid = false;
  let canceled = false;
  if (entry.provider === "itau") {
    const cob = await getCob(tid);
    paid = cobPaid(cob);
    canceled = cobCanceled(cob);
  } else {
    const tx = await getPixTransaction(tid);
    const norm = pixStatusOf(tx).toLowerCase();
    console.log("[pix] consulta(rede)", { tid, status: norm });
    canceled = ["canceled", "cancelled", "denied", "declined"].includes(norm);
    paid = ["approv", "aprov", "conclu", "paid", "pago", "confirm", "captur", "settl"].some((s) => norm.includes(s));
  }
  if (canceled) return { status: "canceled" };
  if (!paid) return { status: "pending" }; // não pago -> NÃO cria reserva

  // IDEMPOTÊNCIA: cria a reserva UMA única vez por cobrança, mesmo com polling
  // e webhook chegando juntos. O teste+atribuição do promise é síncrono (sem
  // await no meio), então chamadas concorrentes reaproveitam o mesmo promise.
  if (!entry.bookingPromise) {
    entry.bookingPromise = (async () => {
      const booked = await bookStay({
        input: entry.input,
        rooms: entry.rooms,
        reference: entry.reference,
        tid,
        amountCents: entry.amountCents,
        method: "pix"
      });
      entry.bookingId = booked.booking_id;
      entry.bookedRooms = booked.rooms;
      entry.registered = await registerArtaxPayment(booked.booking_id, {
        method: "pix",
        totalPrice: entry.totalPrice,
        installments: 1,
        confirmed: true
      });
      // E-mail de confirmação e webhook da Asksuite — dentro do bookingPromise (roda uma vez por cobrança).
      fireConfirmationEmail({ input: entry.input, rooms: entry.rooms, totalPrice: entry.totalPrice, bookingId: booked.booking_id, method: "pix", tid });
      fireAsksuiteNotification({ input: entry.input, rooms: entry.rooms, totalPrice: entry.totalPrice, bookingId: booked.booking_id, method: "pix", tid });
      fireAsksuitePurchaseTracking({ input: entry.input, rooms: entry.rooms, totalPrice: entry.totalPrice, bookingId: booked.booking_id });
      return booked;
    })().catch((err) => {
      entry.bookingPromise = null; // libera p/ nova tentativa se falhou
      throw err;
    });
  }

  await entry.bookingPromise;
  return paidPixResult(entry, tid);
};

/**
 * Reconciliação: varre os PIX pendentes e confirma os que já foram pagos —
 * cobre o caso "cliente pagou e fechou a página" SEM depender do webhook.
 * Roda periodicamente no servidor (ver server.js). É idempotente (usa confirmPix).
 */
export const reconcilePendingPix = async () => {
  cleanupPix();
  for (const [tid, entry] of pendingPix) {
    if (entry.bookingId || entry.bookingPromise) continue; // já reservado / em andamento
    try {
      const res = await confirmPix(tid);
      if (res.status === "paid") {
        console.log("[pix] reconciliado -> reserva", res.booking_id, "tid", tid);
      }
    } catch (err) {
      console.warn("[pix] reconciliação falhou", { tid, msg: err.message });
    }
  }
};
