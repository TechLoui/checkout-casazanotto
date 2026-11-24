import assert from "node:assert/strict";
import { test } from "node:test";

Object.assign(process.env, {
  ARTAX_BASE_URL: "https://artax-coupons.test",
  ARTAX_CLIENT_ID: "test-client",
  ARTAX_CLIENT_SECRET: "test-secret",
  ARTAX_PRICE_MODE: "total",
  REDE_CLIENT_ID: "test-client",
  REDE_CLIENT_SECRET: "test-secret",
  REDE_OAUTH_URL: "https://payments-coupons.test/oauth",
  REDE_TRANSACTIONS_URL: "https://payments-coupons.test/transactions",
  PAYMENT_SIMULATE: "false",
  PIX_PROVIDER: "rede",
  RESEND_API_KEY: "",
  ASKSUITE_WEBHOOK_URL: "",
  ASKSUITE_PURCHASE_API_KEY: "",
  OPENAI_CONVERSIONS_ENABLED: "false"
});

const { config } = await import("../src/config.js");
const { checkAvailability } = await import("../src/artaxnet.js");
const { validateAvailability, validateCheckout, validatePix } = await import("../src/validation.js");
const { processCheckout, createPixCharge, confirmPix } = await import("../src/bookingFlow.js");

test("o cupom mantém o mesmo valor na cotação, cartão, Pix e reserva", async (t) => {
  let offeredCoupons = [{ code: "VERAO10", discount_type: "percentage", discount_value: 10, room_types: [], rateplans: [] }];
  let nextBooking = 100;
  let nextPayment = 1;
  const bookings = [];
  const payments = [];
  const authorizations = [];
  const couponQueries = [];
  t.mock.method(globalThis, "fetch", async (rawUrl, options = {}) => {
    const url = new URL(rawUrl);
    if (url.origin === "https://artax-coupons.test") {
      if (url.pathname === "/rooms/availability") {
        return Response.json({ rooms: { 4700: { 3165: {
          room_type_id: 4700, rateplan_id: 3165, rateplan_name: "Padrão", room_name: "Suíte Standard", price: 1000
        } } } });
      }
      if (url.pathname === "/coupons") {
        couponQueries.push(Object.fromEntries(url.searchParams));
        return Response.json({ coupons: offeredCoupons });
      }
      if (url.pathname === "/booking/create") {
        bookings.push(new URLSearchParams(options.body));
        return Response.json({ booking_id: nextBooking++ });
      }
      if (/^\/booking\/\d+\/payments$/.test(url.pathname)) {
        payments.push(JSON.parse(options.body).payments);
        return Response.json({ message: "ok" });
      }
    }
    if (url.origin === "https://payments-coupons.test") {
      if (url.pathname === "/oauth") return Response.json({ access_token: "test-token", expires_in: 3600 });
      if (url.pathname === "/transactions" && options.method === "POST") {
        const data = JSON.parse(options.body);
        authorizations.push(data);
        return Response.json({ returnCode: "00", tid: `TEST${nextPayment++}`, authorizationCode: "TEST", qrCodeResponse: { qrCodeData: "test-pix" } });
      }
      if (url.pathname.startsWith("/transactions/")) {
        return Response.json({ returnCode: "00", status: "Approved" });
      }
    }
    throw new Error(`Requisição inesperada no teste: ${url.origin}${url.pathname}`);
  });

  const input = {
    arrival_date: "2030-11-20", departure_date: "2030-11-23", adults: 2, kids: 0,
    rooms: [{ room_id: "4700", rateplan_id: 3165 }], coupon: "VERAO10", quoted_amount_cents: 90000,
    guest: { first_name: "Hóspede de teste", phone: "62999990139", document_type: "cpf", document: "00000000000" },
    card: { number: "5448280000000007", holderName: "TESTE", expirationMonth: 12, expirationYear: 2099, securityCode: "123" },
    installments: 1
  };

  const quote = await checkAvailability(validateAvailability(input));
  assert.equal(quote.rooms[4700][3165].price, 900);
  assert.equal(quote.coupon.code, "VERAO10");
  const card = await processCheckout(validateCheckout(input, 4));
  assert.equal(card.payment.amount, 900);
  assert.equal(authorizations[0].amount, 90000);
  assert.equal(bookings[0].get("room_units[4700][price]"), "900");
  assert.match(bookings[0].get("comment"), /Cupom aplicado no site: VERAO10/);
  assert.equal(bookings[0].has("coupon"), false);
  assert.equal(payments[0][0].gross_amount, 900);

  const pix = await createPixCharge(validatePix(input));
  assert.equal(pix.amount, 900);
  assert.equal(authorizations[1].amount, 90000);
  const paid = await Promise.all([confirmPix(pix.tid), confirmPix(pix.tid)]);
  assert.equal(paid[0].booking_id, paid[1].booking_id);
  assert.equal(bookings.length, 2);
  assert.equal(bookings[1].get("room_units[4700][price]"), "900");
  assert.equal(payments[1][0].gross_amount, 900);
  assert.deepEqual(couponQueries[0], { available: "1", arrival_date: input.arrival_date, departure_date: input.departure_date });

  const charged = authorizations.length;
  offeredCoupons[0].discount_value = 5;
  await assert.rejects(processCheckout(validateCheckout(input, 4)), /valor com o cupom mudou/i);
  await assert.rejects(createPixCharge(validatePix(input)), /valor com o cupom mudou/i);
  offeredCoupons = [];
  await assert.rejects(createPixCharge(validatePix(input)), /cupom/i);
  assert.equal(authorizations.length, charged);

  const couponCalls = couponQueries.length;
  await checkAvailability(validateAvailability({ ...input, coupon: undefined }));
  assert.equal(couponQueries.length, couponCalls);
  assert.throws(() => validateAvailability({ ...input, coupon: ["VERAO10"] }), /cupom/i);
  assert.throws(() => validateCheckout({ ...input, quoted_amount_cents: undefined }, 4), /confirma|busca/i);
  assert.equal(config.artax.priceMode, "total");
});
