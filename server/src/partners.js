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
