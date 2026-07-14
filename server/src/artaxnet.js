import qs from "qs";
import { config } from "./config.js";

const baseHeaders = () => ({
  ClientId: config.artax.clientId,
  ClientSecret: config.artax.clientSecret,
  Accept: "application/json"
});

class ArtaxError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ArtaxError";
    this.status = status;
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

/**
 * Fallback de fotos por tipo de quarto (mesmo mapeamento usado no site,
 * ver script.js → HOME_ROOM_PHOTOS). O Artax nem sempre tem foto cadastrada
 * pra cada quarto/tarifa — isso garante que a API sempre devolve ao menos
 * uma imagem, com URL absoluta (útil pra quem consome a API de fora, como
 * a Asksuite).
 */
const ROOM_PHOTO_COUNTS = { standard: 15, bangalo: 14, gold: 8, "gold-master": 8 };

const roomSlugFromName = (name) => {
  const normalized = String(name || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  if (normalized.includes("master")) return "gold-master";
  if (normalized.includes("gold")) return "gold";
  if (normalized.includes("bangal")) return "bangalo";
  if (normalized.includes("standard")) return "standard";
  return null;
};

const localRoomImages = (roomName) => {
  const slug = roomSlugFromName(roomName);
  const count = slug && ROOM_PHOTO_COUNTS[slug];
  if (!count) return [];
  return Array.from({ length: count }, (_, i) => `${config.siteUrl}/assets/rooms/${slug}/${String(i + 1).padStart(2, "0")}.webp`);
};

/** Anexa `image`/`images` (URLs absolutas) em cada quarto/tarifa da disponibilidade. */
const enrichRoomImages = (data) => {
  if (!data?.rooms || Array.isArray(data.rooms)) return data;
  for (const plans of Object.values(data.rooms)) {
    for (const opt of Object.values(plans)) {
      const images = localRoomImages(opt.room_name);
      if (images.length) {
        opt.images = images;
        opt.image = images[0];
      }
    }
  }
  return data;
};

/**
 * Verifica disponibilidade de quartos.
 * GET /rooms/availability — parâmetros enviados na query string.
 */
export const checkAvailability = async ({ arrival_date, departure_date, adults, kids, ages = [] }) => {
  const query = qs.stringify(
    { arrival_date, departure_date, adults, kids, ages },
    { arrayFormat: "indices", encodeValuesOnly: true }
  );
  const url = `${config.artax.baseUrl}/rooms/availability?${query}`;

  const response = await fetch(url, { method: "GET", headers: baseHeaders() });
  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new ArtaxError(data.error || "Falha ao consultar disponibilidade.", response.status, data);
  }
  return enrichRoomImages(data);
};

/**
 * Cria a reserva.
 * POST /booking/create — corpo em application/x-www-form-urlencoded usando a
 * notação de arrays do PHP (ex.: room_units[301][price]=600,
 * room_units[301][guests][0][first_name]=Maria).
 */
export const createBooking = async (payload) => {
  const body = qs.stringify(payload, { arrayFormat: "indices", encodeValuesOnly: false });
  const url = `${config.artax.baseUrl}/booking/create`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...baseHeaders(),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const data = await parseJsonSafe(response);

  if (!response.ok || !data.booking_id) {
    throw new ArtaxError(data.error || "Falha ao criar a reserva.", response.status, data);
  }
  return data; // { booking_id }
};

/** Lista os centros de custo (para categorizar pagamentos, se necessário). */
export const listCostCenters = async () => {
  const response = await fetch(`${config.artax.baseUrl}/cost-centers`, {
    method: "GET",
    headers: baseHeaders()
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new ArtaxError(data.error || "Falha ao listar centros de custo.", response.status, data);
  }
  return data;
};

/** Lista os métodos de pagamento (para descobrir os IDs de PIX e Cartão). */
export const listPaymentMethods = async () => {
  const response = await fetch(`${config.artax.baseUrl}/payment-methods`, {
    method: "GET",
    headers: baseHeaders()
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new ArtaxError(data.error || "Falha ao listar métodos de pagamento.", response.status, data);
  }
  return data;
};

/**
 * Adiciona pagamento(s) a uma reserva existente.
 * POST /booking/{booking_id}/payments — corpo JSON.
 * Cada pagamento: { payment_method_id, gross_amount, installments, due_date,
 *                   obs?, confirmed?, cost_center_id? }
 */
export const addBookingPayment = async (bookingId, payments) => {
  const response = await fetch(`${config.artax.baseUrl}/booking/${bookingId}/payments`, {
    method: "POST",
    headers: { ...baseHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ payments })
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new ArtaxError(data.error || "Falha ao registrar o pagamento na reserva.", response.status, data);
  }
  return data; // { message, bills: [...] }
};

export { ArtaxError };
