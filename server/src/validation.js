const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 422;
  }
}

const isValidDate = (value) => DATE_RE.test(value) && !Number.isNaN(Date.parse(value));

const toDateOnly = (value) => new Date(`${value}T00:00:00Z`);

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

/** Valida os parâmetros de uma consulta de disponibilidade. */
export const validateAvailability = (q) => {
  const arrival_date = String(q.arrival_date || "");
  const departure_date = String(q.departure_date || "");
  const adults = Number(q.adults);
  const kids = Number(q.kids ?? 0);
  const ages = Array.isArray(q.ages) ? q.ages.map(Number) : [];

  if (!isValidDate(arrival_date) || !isValidDate(departure_date)) {
    throw new ValidationError("Datas inválidas. Use o formato YYYY-MM-DD.");
  }
  if (toDateOnly(departure_date) <= toDateOnly(arrival_date)) {
    throw new ValidationError("A data de check-out deve ser maior que a de check-in.");
  }
  if (!Number.isInteger(adults) || adults < 1) {
    throw new ValidationError("Informe ao menos 1 adulto.");
  }
  if (!Number.isInteger(kids) || kids < 0) {
    throw new ValidationError("Número de crianças inválido.");
  }
  if (kids > 0 && ages.length !== kids) {
    throw new ValidationError("Informe a idade de cada criança.");
  }
  if (ages.some((age) => !Number.isInteger(age) || age < 0 || age > 17)) {
    throw new ValidationError("Idades de crianças inválidas.");
  }

  return { arrival_date, departure_date, adults, kids, ages };
};

/** Valida a reserva + hóspede (comum a cartão e PIX, sem dados de pagamento). */
export const validateStayGuest = (body) => {
  const base = validateAvailability(body);

  // Aceita o formato atual (rooms[]) e o legado (room_id/rateplan_id) para que
  // frontend e backend possam ser publicados sem uma janela de incompatibilidade.
  const rawRooms = Array.isArray(body.rooms) && body.rooms.length
    ? body.rooms
    : (body.room_id ? [{ room_id: body.room_id, rateplan_id: body.rateplan_id }] : []);
  if (!rawRooms.length) throw new ValidationError("Selecione ao menos uma acomodação.");
  const seenRoomIds = new Set();
  const rooms = rawRooms.map((r) => {
    const roomId = String(r?.room_id || "").trim();
    const rateplanId = Number(r?.rateplan_id);
    if (!roomId) throw new ValidationError("Categoria de quarto não informada.");
    if (!Number.isInteger(rateplanId) || rateplanId <= 0) {
      throw new ValidationError("Plano tarifário inválido.");
    }
    if (seenRoomIds.has(roomId)) {
      throw new ValidationError("Cada acomodação só pode ser selecionada uma vez.");
    }
    seenRoomIds.add(roomId);
    return { roomId, rateplanId };
  });

  const guest = body.guest || {};
  const firstName = String(guest.first_name || "").trim();
  const phone = onlyDigits(guest.phone);
  if (!firstName) throw new ValidationError("Nome do hóspede é obrigatório.");
  if (phone.length < 10) throw new ValidationError("Telefone do hóspede é obrigatório e deve ser válido.");
  const guestType = guest.type === "company" ? "company" : "guest";
  const documentType = ["cpf", "rg", "passport"].includes(guest.document_type) ? guest.document_type : undefined;
  if (guest.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guest.email)) {
    throw new ValidationError("E-mail do hóspede inválido.");
  }

  // Identificador de sessão da Asksuite (_askSI), quando a reserva veio do
  // link direto que a IA deles gera — usado pra vincular a compra ao
  // atendimento no rastreio de conversão deles.
  const askSi = String(body.ask_si || "").trim().slice(0, 200) || undefined;

  return {
    ...base,
    rooms,
    askSi,
    comment: String(body.comment || "").slice(0, 500),
    guest: {
      first_name: firstName,
      last_name: String(guest.last_name || "").trim() || undefined,
      document: onlyDigits(guest.document) || undefined,
      document_type: documentType,
      phone,
      email: String(guest.email || "").trim() || undefined,
      type: guestType
    }
  };
};

/** Valida o payload de pagamento PIX (reserva + hóspede, sem cartão). */
export const validatePix = (body) => validateStayGuest(body);

/* Valida UM cartão (dados + parcelas). `label` entra nas mensagens para o
   hóspede saber a qual dos dois cartões o erro se refere. */
export const validateOneCard = (raw, maxInstallments, label = "") => {
  const card = raw || {};
  const where = label ? ` (${label})` : "";
  const cardNumber = onlyDigits(card.number);
  const cvv = onlyDigits(card.securityCode);
  const expMonth = Number(card.expirationMonth);
  const expYear = Number(card.expirationYear);
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    throw new ValidationError(`Número do cartão inválido${where}.`);
  }
  if (!String(card.holderName || "").trim()) {
    throw new ValidationError(`Nome impresso no cartão é obrigatório${where}.`);
  }
  if (!Number.isInteger(expMonth) || expMonth < 1 || expMonth > 12) {
    throw new ValidationError(`Mês de validade do cartão inválido${where}.`);
  }
  const fullYear = expYear < 100 ? 2000 + expYear : expYear;
  const now = new Date();
  const expDate = new Date(fullYear, expMonth, 0, 23, 59, 59);
  if (Number.isNaN(expDate.getTime()) || expDate < now) {
    throw new ValidationError(`Cartão vencido ou validade inválida${where}.`);
  }
  if (cvv.length < 3 || cvv.length > 4) {
    throw new ValidationError(`Código de segurança (CVV) inválido${where}.`);
  }

  const installments = Number(card.installments) || 1;
  if (!Number.isInteger(installments) || installments < 1 || installments > maxInstallments) {
    throw new ValidationError(`Número de parcelas inválido${where} (1 a ${maxInstallments}).`);
  }

  return {
    number: cardNumber,
    holderName: String(card.holderName).trim(),
    expirationMonth: expMonth,
    expirationYear: fullYear,
    securityCode: cvv,
    installments,
    // Em centavos para não arrastar erro de ponto flutuante na divisão.
    // `null` = cartão único, cobra o total; o valor é conferido contra o preço
    // autoritativo do Artax no bookingFlow, nunca contra o que o site mandou.
    amountCents: card.amount == null ? null : Math.round(Number(card.amount) * 100)
  };
};

/** Valida o payload completo do checkout por cartão (reserva + hóspede + cartão).
    Aceita `cards: [...]` (um ou dois) e também o contrato antigo `card` +
    `installments`, para não quebrar clientes que ainda enviem no formato velho. */
export const validateCheckout = (body, maxInstallments) => {
  const stay = validateStayGuest(body);

  const rawCards = Array.isArray(body.cards) && body.cards.length
    ? body.cards
    : [{ ...(body.card || {}), installments: body.installments, amount: null }];

  if (rawCards.length > 2) {
    throw new ValidationError("É possível dividir o pagamento em no máximo dois cartões.");
  }

  const cards = rawCards.map((c, i) =>
    validateOneCard(c, maxInstallments, rawCards.length > 1 ? `cartão ${i + 1}` : "")
  );

  if (cards.length > 1) {
    if (cards.some((c) => c.amountCents == null)) {
      throw new ValidationError("Informe quanto será cobrado em cada cartão.");
    }
    if (cards.some((c) => !Number.isFinite(c.amountCents) || c.amountCents <= 0)) {
      throw new ValidationError("O valor de cada cartão precisa ser maior que zero.");
    }
  }

  return {
    ...stay,
    cards,
    // Mantidos para o restante do fluxo que ainda lê o formato antigo.
    installments: cards[0].installments,
    card: {
      number: cards[0].number,
      holderName: cards[0].holderName,
      expirationMonth: cards[0].expirationMonth,
      expirationYear: cards[0].expirationYear,
      securityCode: cards[0].securityCode
    }
  };
};
