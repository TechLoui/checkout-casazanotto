import assert from "node:assert/strict";
import { test } from "node:test";
import { applyCouponToRooms, findAvailableCoupon } from "../src/coupons.js";
import { ValidationError } from "../src/validation.js";

const dates = { arrival_date: "2026-11-27", departure_date: "2026-11-29" };
const coupon = { code: "VERÃO10", discount_type: "percentage", discount_value: 10, room_types: [], rateplans: [] };
const availability = {
  currency: "BRL",
  rooms: {
    4700: {
      3165: { room_type_id: 4700, rateplan_id: 3165, rateplan_name: "Padrão", price: 100.05, images: ["https://example.com/room.webp"] },
      3166: { room_type_id: 4700, rateplan_id: 3166, rateplan_name: "Flexível", price: "150.00" }
    },
    4701: { 3165: { room_type_id: 4701, rateplan_id: 3165, price: 200 } }
  }
};

test("o código é exato e recebe somente trim, inclusive para códigos Unicode", () => {
  assert.equal(findAvailableCoupon(null, "  "), null);
  assert.equal(findAvailableCoupon(null, undefined), null);
  assert.equal(findAvailableCoupon({ coupons: [coupon] }, " VERÃO10 ").code, "VERÃO10");
  assert.throws(() => findAvailableCoupon({ coupons: [coupon] }, "verão10"), ValidationError);
  assert.throws(() => findAvailableCoupon({ coupons: [coupon] }, "VERAO10"), ValidationError);
  for (const invalid of [123, {}, "a\nb", "a\u200bb", "x".repeat(101)]) {
    assert.throws(() => findAvailableCoupon({ coupons: [coupon] }, invalid), ValidationError);
  }
});

test("respostas inválidas e códigos duplicados são recusados", () => {
  for (const data of [{}, { coupons: {} }, { coupons: [null] }, { coupons: [{ code: "" }] }, { coupons: [coupon, { ...coupon }] }]) {
    assert.throws(() => findAvailableCoupon(data, coupon.code), ValidationError);
  }
  assert.throws(() => findAvailableCoupon({ coupons: [] }, coupon.code), /indisponível/);
});

test("preserva metadados e arredonda o desconto ao centavo sem alterar a resposta original", () => {
  const original = structuredClone(availability);
  const result = applyCouponToRooms(availability, coupon, dates);
  const option = result.rooms[4700][3165];
  assert.equal(option.price, 90.04);
  assert.equal(option.price_per_nights, 45.02);
  assert.equal(option.original_price, 100.05);
  assert.equal(option.coupon_applied, true);
  assert.deepEqual(option.images, original.rooms[4700][3165].images);
  assert.equal(result.currency, "BRL");
  assert.deepEqual(result.coupon, { code: "VERÃO10", discount_type: "percentage", discount_value: 10 });
  assert.deepEqual(availability, original);
  assert.deepEqual(applyCouponToRooms(availability, coupon, dates), result);
});

test("normaliza preços por diária antes de aplicar o percentual", () => {
  const result = applyCouponToRooms(availability, coupon, { ...dates, priceMode: "per_night" });
  assert.equal(result.rooms[4700][3165].original_price, 200.1);
  assert.equal(result.rooms[4700][3165].price, 180.09);
  assert.equal(result.rooms[4700][3165].price_per_nights, 90.05);
});

test("as restrições de categoria e tarifa se combinam, preservando outras opções sem desconto", () => {
  const scoped = { ...coupon, room_types: [{ id: 4700, name: "Suíte" }], rateplans: ["3165"] };
  const result = applyCouponToRooms(availability, scoped, { ...dates, priceMode: "per_night" });
  assert.equal(result.rooms[4700][3165].coupon_applied, true);
  assert.equal(result.rooms[4700][3166].coupon_applied, false);
  assert.equal(result.rooms[4700][3166].price, 300);
  assert.equal(result.rooms[4700][3166].price_per_nights, 150);
  assert.equal(result.rooms[4700][3166].original_price, undefined);
  assert.equal(result.rooms[4701][3165].coupon_applied, false);
  assert.equal(result.rooms[4701][3165].price, 400);
});

test("restrições malformadas e cupons sem opção elegível falham de forma explícita", () => {
  for (const restriction of [null, "4700", {}, [null], [{}], [{ id: -1 }], [{ id: [4700] }], ["4700x"], [1.2]]) {
    assert.throws(() => applyCouponToRooms(availability, { ...coupon, room_types: restriction }, dates), ValidationError);
    assert.throws(() => findAvailableCoupon({ coupons: [{ ...coupon, rateplans: restriction }] }, coupon.code), ValidationError);
  }
  assert.throws(() => applyCouponToRooms(availability, { ...coupon, room_types: [999] }, dates), /não se aplica/);
  assert.deepEqual(applyCouponToRooms({ rooms: [] }, coupon, dates).rooms, []);
  assert.deepEqual(applyCouponToRooms({ rooms: {} }, coupon, dates).rooms, []);
  assert.deepEqual(applyCouponToRooms({ rooms: { 1: {} } }, coupon, dates).rooms, []);
});

test("tarifas B2B recebidas não ganham desconto nem fazem outra tarifa pública desaparecer", () => {
  const raw = structuredClone(availability);
  raw.rooms[4700][3863] = { rateplan_id: 3863, rateplan_name: "Tarifa NET - B2B", price: 50 };
  const result = applyCouponToRooms(raw, coupon, dates);
  assert.equal(result.rooms[4700][3863].price, 50);
  assert.equal(result.rooms[4700][3863].coupon_applied, false);
  assert.equal(result.rooms[4700][3165].coupon_applied, true);
});

test("tipos e percentuais inválidos são recusados, inclusive reservas sem valor a pagar", () => {
  assert.throws(() => applyCouponToRooms(availability, { ...coupon, discount_type: "fixed" }, dates), /tipo de cupom/);
  for (const percentage of [0, -1, 101, 1.5, "infinito", null, true, [10]]) {
    assert.throws(() => applyCouponToRooms(availability, { ...coupon, discount_value: percentage }, dates), ValidationError);
  }
  assert.throws(() => applyCouponToRooms(availability, { ...coupon, discount_value: 100 }, dates), /100%/);
  assert.throws(() => applyCouponToRooms({ rooms: { 1: { 1: { price: 0.01 } } } }, { ...coupon, discount_value: 99 }, dates), /sem valor/);
});

test("moeda decimal e operações grandes mantêm centavos seguros", () => {
  const response = (price) => ({ rooms: { 1: { 1: { price } } } });
  assert.equal(applyCouponToRooms(response("1.005"), { ...coupon, discount_value: 50 }, dates).rooms[1][1].price, 0.5);
  for (const price of [-1, "", "1,00", "NaN", Infinity, {}, null, "90071992547409.92"]) {
    assert.throws(() => applyCouponToRooms(response(price), coupon, dates), ValidationError);
  }
  assert.throws(() => applyCouponToRooms(response("45035996273704.96"), coupon, { ...dates, priceMode: "per_night" }), ValidationError);
});

test("datas e respostas de disponibilidade inválidas são recusadas", () => {
  for (const data of [{}, { rooms: null }, { rooms: [1] }, { rooms: { 1: null } }, { rooms: { 1: { 1: null } } }]) {
    assert.throws(() => applyCouponToRooms(data, coupon, dates), ValidationError);
  }
  for (const arrival_date of ["2026-02-30", "ontem", "2026-11-29", "2026-11-30"]) {
    assert.throws(() => applyCouponToRooms(availability, coupon, { ...dates, arrival_date }), ValidationError);
  }
});
