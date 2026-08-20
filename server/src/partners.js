import { config } from "./config.js";

const WEBHOOK_TIMEOUT_MS = 5000;

/**
 * Notifica a Asksuite quando uma reserva é confirmada (fire-and-forget;
 * nunca derruba o fluxo de reserva). No-op se ASKSUITE_WEBHOOK_URL não
 * estiver configurada — mesmo padrão seguro-por-padrão do e-mail (email.js).
 */
export const notifyAsksuiteBooking = async (payload) => {
  const url = config.asksuite.webhookUrl;
  if (!url) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.asksuite.webhookSecret ? { Authorization: `Bearer ${config.asksuite.webhookSecret}` } : {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!res.ok) {
      console.error("[asksuite] webhook respondeu erro:", res.status, (await res.text().catch(() => "")).slice(0, 300));
      return;
    }
    console.log("[asksuite] webhook enviado", { booking_id: payload.booking_id });
  } catch (err) {
    console.error("[asksuite] falha ao notificar webhook:", err.message);
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Notifica a Asksuite da compra vinculada a uma sessão de atendimento
 * (_askSI) — pedido do Felippe (Asksuite), endpoint confirmado em 18/08/2026:
 * POST https://cookies.asksuite.com/reservation/events, header x-api-key.
 * Fire-and-forget; nunca derruba a reserva. No-op se ASKSUITE_PURCHASE_API_KEY
 * não estiver configurada (nunca chamamos a API deles sem autenticação).
 */
export const notifyAsksuitePurchase = async (payload) => {
  const { purchaseApiUrl: url, purchaseApiKey: key } = config.asksuite;
  if (!url || !key) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!res.ok) {
      console.error("[asksuite] purchase API respondeu erro:", res.status, (await res.text().catch(() => "")).slice(0, 300));
      return;
    }
    console.log("[asksuite] purchase API notificada", { ask_si: payload?.session?._askSI });
  } catch (err) {
    console.error("[asksuite] falha ao notificar purchase API:", err.message);
  } finally {
    clearTimeout(timeout);
  }
};
