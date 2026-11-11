import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import express from "express";

const siteOrigin = "https://pousadacasazanotto.com";
const partnerKey = "availability-test-key";
const standard = {
  room_type_id: 4700,
  rateplan_id: 3165,
  rateplan_name: "Padrão",
  room_name: "Suíte Standard | Casal | Pousada Casa Zanotto",
  price: 1250
};
const b2b = { ...standard, rateplan_id: 3863, rateplan_name: "Tarifa NET - B2B" };
const b2bGold = {
  ...b2b,
  room_type_id: 4703,
  rateplan_id: 3864,
  rateplan_name: "Tarifa Comissionada - B2B",
  room_name: "Suíte Gold | Triplo | Pousada Casa Zanotto"
};

const artaxResponses = {
  "2026-11-28": { rooms: { 4700: { 3863: b2b }, 4703: { 3864: b2bGold } } },
  "2026-11-27": { rooms: { 4700: { 3165: standard, 3863: b2b }, 4703: { 3864: b2bGold } } },
  "2026-11-26": { rooms: [] }
};

const close = (server) => new Promise((resolve) => {
  server.close(resolve);
  server.closeAllConnections?.();
});

test("a cotação do site e da AskSuite retorna apenas tarifas públicas do ARTAX", async (t) => {
  const artax = createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const fixture = artaxResponses[url.searchParams.get("arrival_date")];
    if (req.method !== "GET" || url.pathname !== "/rooms/availability" || !fixture) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(fixture));
  }).listen(0, "127.0.0.1");
  t.after(() => close(artax));
  await once(artax, "listening");

  Object.assign(process.env, {
    ARTAX_BASE_URL: `http://127.0.0.1:${artax.address().port}`,
    ARTAX_CLIENT_ID: "test-client-id",
    ARTAX_CLIENT_SECRET: "test-client-secret",
    ARTAX_PRICE_MODE: "total",
    SITE_URL: siteOrigin,
    ASKSUITE_API_KEY: partnerKey,
    PIX_RECONCILE_MS: "2147483647"
  });

  const listen = express.application.listen;
  let api;
  express.application.listen = function () {
    api = listen.call(this, 0, "127.0.0.1");
    t.after(() => close(api));
    return api;
  };
  try {
    await import("../src/server.js");
  } finally {
    express.application.listen = listen;
  }
  if (!api.listening) await once(api, "listening");

  for (const [caller, headers] of Object.entries({
    site: { Origin: siteOrigin },
    AskSuite: { "X-Api-Key": partnerKey }
  })) {
    await t.test(caller, async () => {
      const quote = async (arrivalDate) => {
        const response = await fetch(
          `http://127.0.0.1:${api.address().port}/api/availability?arrival_date=${arrivalDate}&departure_date=2026-11-29&adults=2&kids=0`,
          { headers }
        );
        assert.equal(response.status, 200);
        return response.json();
      };

      assert.deepEqual((await quote("2026-11-28")).rooms, []);
      const { rooms } = await quote("2026-11-27");
      assert.deepEqual(Object.keys(rooms), ["4700"]);
      assert.deepEqual(Object.keys(rooms[4700]), ["3165"]);
      assert.equal(rooms[4700][3165].price, 1250);
      assert.equal(rooms[4700][3165].image, `${siteOrigin}/assets/rooms/standard/01.webp`);
      assert.deepEqual((await quote("2026-11-26")).rooms, []);
    });
  }
});
