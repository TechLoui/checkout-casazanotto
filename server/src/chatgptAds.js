import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

const SITE_URL = "https://pousadacasazanotto.com/";
const PRIVACY_PATH = "/politica-de-privacidade";
const PRIVACY_URL = new URL(PRIVACY_PATH, SITE_URL).href;
const PRIVACY_META = '<meta name="cz-privacy-policy" content="chatgpt-ads-v1">';
const REQUEST_TIMEOUT_MS = 3_000;
const MAX_RETRY_DELAY_MS = 2_000;
const TRANSIENT_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

export const CHATGPT_ADS_CONVERSIONS_URL = "https://bzr.openai.com/v1/events?pid=PbQTaFYtqo9zGGsZYJDsUf";

const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");

const normalizeEmail = (value) => {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+$/u.test(email) ? email : "";
};

const normalizePhone = (value) => {
  if (typeof value !== "string") return "";
  const phone = value.trim();
  if (!/^\+?[\d\s().-]+$/u.test(phone)) return "";
  let digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (!phone.startsWith("+") && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }
  return /^\d{8,15}$/.test(digits) ? digits : "";
};

export const buildChatGptAdsEvent = (
  { bookingId, amountCents, oppref, email, phone, optOut, timestampMs } = {},
  { suppressedHashes = [], now = Date.now() } = {}
) => {
  const id = Number.isSafeInteger(bookingId) || typeof bookingId === "string" ? String(bookingId) : "";
  const timestamp = timestampMs ?? now;
  if (!/^[1-9]\d{0,127}$/.test(id) || !Number.isSafeInteger(amountCents) || amountCents <= 0) return null;
  if (!Number.isSafeInteger(timestamp) || timestamp < now - SEVEN_DAYS_MS || timestamp > now + TEN_MINUTES_MS) {
    return null;
  }

  const event = {
    id,
    type: "order_created",
    timestamp_ms: timestamp,
    action_source: "web",
    source_url: SITE_URL,
    data: { type: "contents", amount: amountCents, currency: "BRL" }
  };
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  const emailHash = normalizedEmail ? sha256(normalizedEmail) : "";
  const phoneHash = normalizedPhone ? sha256(normalizedPhone) : "";
  if ((emailHash && suppressedHashes.includes(emailHash)) || (phoneHash && suppressedHashes.includes(phoneHash))) {
    return null;
  }
  if (optOut === true) return { ...event, opt_out: true };

  // A referência é opaca. Valores bem formados seguem exatamente como chegaram.
  if (typeof oppref === "string" && oppref.length > 0 && oppref.length <= 2_048 && !/[\s\p{C}@]/u.test(oppref)) {
    event.oppref = oppref;
  }
  if (emailHash || phoneHash) {
    event.user = {};
    if (emailHash) event.user.emails_sha256 = [emailHash];
    if (phoneHash) event.user.phone_numbers_sha256 = [phoneHash];
  }
  return event;
};

const discardBody = (response) => {
  // O corpo pode repetir dados do evento. Só usamos o status HTTP.
  void response.body?.cancel().catch(() => {});
};

const readPublishedHtml = async (fetchImpl, url) => {
  const response = await fetchImpl(url, {
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok || !/^text\/html(?:;|$)/i.test(response.headers.get("content-type") || "")) {
    discardBody(response);
    return "";
  }
  const html = await response.text();
  return html.replace(/<!--[\s\S]*?-->|<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
};

const getRetryDelay = (response, now) => {
  const after = response.headers.get("retry-after");
  if (!after) return 250;
  if (/^\d+$/.test(after)) return Number(after) * 1_000;
  const date = Date.parse(after);
  return Number.isFinite(date) ? Math.max(0, date - now) : 250;
};

export const createChatGptAdsSender = ({ fetchImpl = globalThis.fetch, now = Date.now, warn = console.warn } = {}) => {
  let privacyCheck;
  const isPrivacyNoticePublished = () => {
    privacyCheck ??= Promise.all([readPublishedHtml(fetchImpl, SITE_URL), readPublishedHtml(fetchImpl, PRIVACY_URL)])
      .then(([home, policy]) => {
        if (!policy.includes(PRIVACY_META) || !home.includes(PRIVACY_META)) return false;
        const notice = home.match(/<p\b[^>]*\sdata-cz-privacy-notice(?=\s|>)[^>]*>([\s\S]*?)<\/p\s*>/i)?.[1];
        return /<a\b[^>]*\shref="\/politica-de-privacidade"[^>]*>/i.test(notice || "");
      })
      .catch(() => false)
      .finally(() => { privacyCheck = undefined; });
    return privacyCheck;
  };

  return async (input, { enabled, apiKey, suppressedHashes } = {}) => {
    if (enabled !== true || typeof apiKey !== "string" || !apiKey.trim()) return;

    try {
      const event = buildChatGptAdsEvent(input, { suppressedHashes, now: now() });
      if (!event) return;
      if (!(await isPrivacyNoticePublished())) {
        warn("[chatgpt ads] Aviso de privacidade indisponível. Conversão ignorada.");
        return;
      }

      const body = JSON.stringify({ events: [event] });
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await fetchImpl(CHATGPT_ADS_CONVERSIONS_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey.trim()}`, "Content-Type": "application/json" },
          body,
          redirect: "error",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
        discardBody(response);
        if (response.ok) return;
        if (attempt === 0 && TRANSIENT_STATUS_CODES.has(response.status)) {
          const retryDelay = getRetryDelay(response, now());
          if (retryDelay <= MAX_RETRY_DELAY_MS) {
            await delay(retryDelay);
            continue;
          }
        }
        warn("[chatgpt ads] Conversão recusada. HTTP", response.status);
        return;
      }
    } catch {
      warn("[chatgpt ads] Falha ao enviar conversão.");
    }
  };
};

export const sendChatGptAdsConversion = createChatGptAdsSender();
