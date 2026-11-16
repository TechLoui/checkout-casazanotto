import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { buildChatGptAdsEvent, CHATGPT_ADS_CONVERSIONS_URL, createChatGptAdsSender } from "../src/chatgptAds.js";

const site = "https://pousadacasazanotto.com/";
const policy = `${site}politica-de-privacidade`;
const meta = '<meta name="cz-privacy-policy" content="chatgpt-ads-v1">';
const notice = '<p class="home-form-notice" data-cz-privacy-notice>Veja a <a href="/politica-de-privacidade">Política de Privacidade</a>.</p>';
const now = 1_795_000_000_000;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const payload = {
  bookingId: 9142,
  amountCents: 123_450,
  timestampMs: now - 50,
  oppref: "test_Ab+12/==",
  email: "  TESTE@EXAMPLE.COM ",
  phone: "(62) 99876-5432",
  name: "Teste",
  cpf: "00000000000",
  ip: "192.0.2.32"
};
const emailHash = hash("teste@example.com");
const phoneHash = hash("5562998765432");
const expected = {
  id: "9142",
  type: "order_created",
  timestamp_ms: now - 50,
  action_source: "web",
  source_url: site,
  data: { type: "contents", amount: 123_450, currency: "BRL" }
};

test("envia só os dados aprovados da reserva e identificadores normalizados em hash", () => {
  assert.deepEqual(buildChatGptAdsEvent(payload, { now }), {
    ...expected,
    oppref: payload.oppref,
    user: { emails_sha256: [emailHash], phone_numbers_sha256: [phoneHash] }
  });
  assert.deepEqual(buildChatGptAdsEvent({ ...payload, oppref: undefined, email: "", phone: "+1 (415) 555-2671" }, { now }), {
    ...expected,
    user: { phone_numbers_sha256: [hash("14155552671")] }
  });
  assert.deepEqual(buildChatGptAdsEvent({ ...payload, oppref: "nao@enviar.example", email: "", phone: "" }, { now }), expected);
});

test("recusa números de reserva, valores e datas inválidos", () => {
  for (const invalid of [
    { bookingId: "nome@example.com" }, { amountCents: "123450" }, { amountCents: 12.34 }, { amountCents: 0 },
    { timestampMs: now - 8 * 86_400_000 }, { timestampMs: now + 11 * 60_000 }
  ]) {
    assert.equal(buildChatGptAdsEvent({ ...payload, ...invalid }, { now }), null);
  }
});

test("exclui todos os identificadores quando o hóspede opta por não compartilhar", () => {
  assert.deepEqual(buildChatGptAdsEvent({ ...payload, optOut: true }, { now }), { ...expected, opt_out: true });
});

test("ignora a conversão inteira quando email ou telefone coincide com uma solicitação de exclusão", () => {
  assert.equal(buildChatGptAdsEvent(payload, { now, suppressedHashes: [emailHash] }), null);
  assert.equal(buildChatGptAdsEvent(payload, { now, suppressedHashes: [phoneHash] }), null);
  assert.equal(buildChatGptAdsEvent({ ...payload, optOut: true }, { now, suppressedHashes: [emailHash] }), null);
});

test("não faz nenhuma requisição sem habilitação explícita ou sem a chave", async () => {
  const requests = [];
  const send = createChatGptAdsSender({ now: () => now, fetchImpl: async (...args) => requests.push(args), warn: () => {} });
  await send(payload, { apiKey: "synthetic-key" });
  await send(payload, { enabled: true });
  await send(payload, { enabled: "true", apiKey: "synthetic-key" });
  assert.deepEqual(requests, []);
});

const html = (body) => new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });

test("aguarda aviso e política publicados e não envia credenciais ao site", async () => {
  const requests = [];
  const send = createChatGptAdsSender({
    now: () => now,
    warn: () => {},
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (url === site) return html(`${meta}<!-- ${notice} -->`);
      if (url === policy) return html(meta);
      throw new Error("unexpected conversion request");
    }
  });
  await send(payload, { enabled: true, apiKey: "synthetic-key" });
  assert.deepEqual(requests.map(({ url }) => url).sort(), [site, policy].sort());
  for (const { init } of requests) {
    assert.equal(init.headers, undefined);
    assert.equal(init.body, undefined);
    assert.equal(init.redirect, "error");
    assert.ok(init.signal instanceof AbortSignal);
  }
});

test("repete uma falha transitória com o mesmo ID e timestamp, sem ler o corpo da resposta", async () => {
  const requests = [];
  const warnings = [];
  let posts = 0;
  const send = createChatGptAdsSender({
    now: () => now,
    warn: (...args) => warnings.push(args),
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (url === site) return html(meta + notice);
      if (url === policy) return html(meta);
      assert.equal(url, CHATGPT_ADS_CONVERSIONS_URL);
      posts++;
      return posts === 1 ? new Response("dados da resposta", { status: 503, headers: { "Retry-After": "0" } }) : new Response(null, { status: 200 });
    }
  });
  await send(payload, { enabled: true, apiKey: "synthetic-key" });
  const sent = requests.filter(({ url }) => url === CHATGPT_ADS_CONVERSIONS_URL);
  assert.equal(sent.length, 2);
  assert.equal(sent[0].init.body, sent[1].init.body);
  assert.equal(sent[0].init.headers.Authorization, "Bearer synthetic-key");
  assert.equal(sent[0].init.redirect, "error");
  assert.ok(sent[0].init.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(sent[0].init.body), {
    events: [{ ...expected, oppref: payload.oppref, user: { emails_sha256: [emailHash], phone_numbers_sha256: [phoneHash] } }]
  });
  assert.deepEqual(warnings, []);
});

test("não repete um erro permanente nem registra o corpo da resposta", async () => {
  const warnings = [];
  let posts = 0;
  const send = createChatGptAdsSender({
    now: () => now,
    warn: (...args) => warnings.push(args),
    fetchImpl: async (url) => {
      if (url === site) return html(meta + notice);
      if (url === policy) return html(meta);
      posts++;
      return new Response("synthetic-key TESTE@EXAMPLE.COM 5562998765432", { status: 400 });
    }
  });
  await send(payload, { enabled: true, apiKey: "synthetic-key" });
  assert.equal(posts, 1);
  assert.deepEqual(warnings, [["[chatgpt ads] Conversão recusada. HTTP", 400]]);
});
