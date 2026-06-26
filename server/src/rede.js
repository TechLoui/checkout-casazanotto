import { config } from "./config.js";

/**
 * Cliente e.Rede (Rede/Itaú).
 *
 * SEGURANÇA / PCI:
 *  - Os dados do cartão só transitam em memória e seguem direto para a Rede
 *    via HTTPS. Eles NUNCA são gravados em disco, log ou banco.
 *  - Em produção o servidor DEVE rodar atrás de HTTPS.
 *  - Considere habilitar 3DS (autenticação) para reduzir chargebacks.
 */

const authHeader = () =>
  "Basic " + Buffer.from(`${config.rede.pv}:${config.rede.token}`).toString("base64");

class RedeError extends Error {
  constructor(message, returnCode, payload) {
    super(message);
    this.name = "RedeError";
    this.returnCode = returnCode;
    this.payload = payload;
  }
}

const parseJsonSafe = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
};

/** Remove campos sensíveis antes de qualquer log. */
const safeForLog = (data) => {
  if (!data || typeof data !== "object") return data;
  const clone = { ...data };
  delete clone.cardNumber;
  delete clone.securityCode;
  delete clone.cardholderName;
  return clone;
};

/**
 * Autoriza e captura um pagamento de crédito em uma única chamada.
 *
 * @param {object} params
 * @param {number} params.amountCents  Valor em centavos (inteiro).
 * @param {string} params.reference    Identificador do pedido (idempotência/conciliação).
 * @param {number} params.installments Número de parcelas (>= 1).
 * @param {object} params.card         { number, holderName, expirationMonth, expirationYear, securityCode }
 * @returns {Promise<object>} dados da transação aprovada (tid, nsu, authorizationCode...)
 */
export const authorizeAndCapture = async ({ amountCents, reference, installments = 1, card }) => {
  const requestBody = {
    capture: true,
    kind: "credit",
    reference,
    amount: amountCents,
    installments,
    softDescriptor: config.rede.softDescriptor,
    cardholderName: card.holderName,
    cardNumber: card.number,
    expirationMonth: card.expirationMonth,
    expirationYear: card.expirationYear,
    securityCode: card.securityCode
  };

  const response = await fetch(`${config.rede.baseUrl}/transactions`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  const data = await parseJsonSafe(response);

  // "00" é o returnCode de sucesso na e.Rede.
  const approved = response.ok && data.returnCode === "00";
  if (!approved) {
    console.warn("[rede] Pagamento não aprovado:", safeForLog({ status: response.status, returnCode: data.returnCode, returnMessage: data.returnMessage }));
    throw new RedeError(
      data.returnMessage || "Pagamento não autorizado pela operadora.",
      data.returnCode,
      data
    );
  }

  return {
    tid: data.tid,
    nsu: data.nsu,
    authorizationCode: data.authorizationCode,
    reference: data.reference,
    returnCode: data.returnCode,
    returnMessage: data.returnMessage,
    installments,
    amountCents
  };
};

/**
 * Estorna (refund) uma transação — usado como compensação se a reserva no
 * Artax falhar DEPOIS do pagamento ter sido capturado.
 */
export const refund = async (tid, amountCents) => {
  const response = await fetch(`${config.rede.baseUrl}/transactions/${tid}/refunds`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ amount: amountCents })
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    console.error("[rede] Falha ao estornar transação", tid, safeForLog(data));
    throw new RedeError(data.returnMessage || "Falha ao estornar pagamento.", data.returnCode, data);
  }
  return data;
};

/**
 * Cria uma cobrança PIX e retorna o QR Code (copia-e-cola + imagem).
 *
 * ⚠️ CONFIRMAR com a documentação PIX da SUA conta Rede:
 *  - o campo de validade do QR ("expirationQrCode") e
 *  - os nomes dos campos de retorno do QR ("qrCodeData"/"qrCodeImage").
 * Deixei a leitura tolerante a variações comuns.
 */
export const createPix = async ({ amountCents, reference, expiresIn = 3600 }) => {
  const requestBody = {
    kind: "pix",
    reference,
    amount: amountCents,
    softDescriptor: config.rede.softDescriptor,
    expirationQrCode: expiresIn // segundos de validade do QR
  };

  const response = await fetch(`${config.rede.baseUrl}/transactions`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  const data = await parseJsonSafe(response);
  const ok = response.ok && (data.returnCode === "00" || data.returnCode === "200");
  if (!ok) {
    console.warn("[rede] Falha ao gerar PIX:", safeForLog({ status: response.status, returnCode: data.returnCode, returnMessage: data.returnMessage }));
    throw new RedeError(data.returnMessage || "Não foi possível gerar o PIX.", data.returnCode, data);
  }

  const qrCode = data.qrCodeData || data.qrCode || data.pix?.qrCodeData || data.qrcode || "";
  const qrImage = data.qrCodeImage || data.pix?.qrCodeImage || data.qrCodeBase64 || "";
  return { tid: data.tid, reference: data.reference, returnCode: data.returnCode, qrCode, qrImage, amountCents };
};

/** Consulta o status de uma transação (usado para confirmar o pagamento PIX). */
export const getTransaction = async (tid) => {
  const response = await fetch(`${config.rede.baseUrl}/transactions/${tid}`, {
    method: "GET",
    headers: { Authorization: authHeader(), Accept: "application/json" }
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new RedeError(data.returnMessage || "Falha ao consultar a transação.", data.returnCode, data);
  }
  return data;
};

/**
 * Interpreta se um PIX foi pago, a partir do retorno de getTransaction.
 * ⚠️ Ajuste conforme o campo de status que a SUA conta Rede retorna no PIX.
 */
export const isPixPaid = (tx) => {
  if (!tx) return false;
  const status = String(tx.status || tx.transactionStatus || tx.pixStatus || tx.returnMessage || "").toLowerCase();
  return (
    tx.capture === true ||
    tx.captured === true ||
    status.includes("conclu") ||
    status.includes("aprov") ||
    status.includes("paid") ||
    status.includes("approved")
  );
};

export { RedeError };
