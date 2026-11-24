import assert from "node:assert/strict";
import { test } from "node:test";
import { validateCheckout, validatePix, validateStayGuest } from "../src/validation.js";

const input = {
  arrival_date: "2030-12-02",
  departure_date: "2030-12-04",
  adults: 2,
  kids: 0,
  rooms: [{ room_id: "4700", rateplan_id: 3165 }],
  guest: {
    first_name: "Hóspede de teste",
    phone: "62999990100",
    document_type: "passport",
    document: " ab-123456 "
  },
  card: {
    number: "4111111111111111",
    holderName: "TESTE",
    expirationMonth: 12,
    expirationYear: 2099,
    securityCode: "123"
  },
  installments: 1
};

test("passaporte preserva letras em maiúsculas na reserva, cartão e Pix", () => {
  for (const validate of [validateStayGuest, validatePix, (body) => validateCheckout(body, 4)]) {
    const stay = validate(input);
    assert.equal(stay.guest.document, "AB123456");
    assert.equal(stay.guest.document_type, "passport");
  }
});

test("CPF mantém a normalização numérica", () => {
  const stay = validateStayGuest({
    ...input,
    guest: { ...input.guest, document_type: "cpf", document: "123.456.789-00" }
  });
  assert.equal(stay.guest.document, "12345678900");
  assert.equal(stay.guest.document_type, "cpf");
});

test("o documento validado chega ao hóspede e à acomodação no ARTAX", async (t) => {
  Object.assign(process.env, {
    ARTAX_BASE_URL: "https://artax-document.test",
    ARTAX_CLIENT_ID: "test-client",
    ARTAX_CLIENT_SECRET: "test-secret",
    ARTAX_PRICE_MODE: "total",
    REDE_CLIENT_ID: "test-client",
    REDE_CLIENT_SECRET: "test-secret",
    REDE_OAUTH_URL: "https://payments-document.test/oauth",
    REDE_TRANSACTIONS_URL: "https://payments-document.test/transactions",
    PAYMENT_SIMULATE: "false",
    RESEND_API_KEY: "",
    ASKSUITE_WEBHOOK_URL: "",
    ASKSUITE_PURCHASE_API_KEY: "",
    OPENAI_CONVERSIONS_ENABLED: "false"
  });
  const { processCheckout } = await import("../src/bookingFlow.js");
  const bookings = [];
  t.mock.method(globalThis, "fetch", async (rawUrl, options = {}) => {
    const url = new URL(rawUrl);
    if (url.origin === "https://artax-document.test") {
      if (url.pathname === "/rooms/availability") {
        return Response.json({ rooms: { 4700: { 3165: {
          rateplan_id: 3165, rateplan_name: "Padrão", room_name: "Suíte Standard", price: 100
        } } } });
      }
      if (url.pathname === "/booking/create") {
        bookings.push(new URLSearchParams(options.body));
        return Response.json({ booking_id: bookings.length });
      }
      if (/^\/booking\/\d+\/payments$/.test(url.pathname)) return Response.json({ message: "ok" });
    }
    if (url.origin === "https://payments-document.test") {
      if (url.pathname === "/oauth") return Response.json({ access_token: "test-token", expires_in: 3600 });
      if (url.pathname === "/transactions") return Response.json({ returnCode: "00", tid: "TEST", authorizationCode: "TEST" });
      if (url.pathname === "/transactions/TEST") return Response.json({ returnCode: "00" });
    }
    throw new Error(`Requisição inesperada no teste: ${url.origin}${url.pathname}`);
  });

  for (const [type, raw, expected] of [["passport", "ab123456", "AB123456"], ["cpf", "123.456.789-00", "12345678900"]]) {
    await processCheckout(validateCheckout({ ...input, guest: { ...input.guest, document_type: type, document: raw } }, 4));
    const booking = bookings.at(-1);
    assert.equal(booking.get("guest[document]"), expected);
    assert.equal(booking.get("guest[document_type]"), type);
    assert.equal(booking.get("room_units[4700][guests][0][document]"), expected);
    assert.equal(booking.get("room_units[4700][guests][0][document_type]"), type);
  }
});
