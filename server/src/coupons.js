import { ValidationError } from "./validation.js";

const couponCode = (value) => {
  if (typeof value !== "string") throw new ValidationError("Código de cupom inválido.");
  const code = value.trim();
  if (code.length > 100 || /\p{C}/u.test(code)) throw new ValidationError("Código de cupom inválido.");
  return code;
};

const restrictionIds = (value) => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new ValidationError("As restrições deste cupom não puderam ser verificadas.");
  return value.map((entry) => {
    const id = entry && typeof entry === "object" && !Array.isArray(entry) ? entry.id : entry;
    if (!["number", "string"].includes(typeof id) || !/^[1-9]\d*$/.test(String(id)) || !Number.isSafeInteger(Number(id))) {
      throw new ValidationError("As restrições deste cupom não puderam ser verificadas.");
    }
    return String(Number(id));
  });
};

const readCoupon = (coupon) => {
  if (!coupon || typeof coupon !== "object" || Array.isArray(coupon) || !couponCode(coupon.code)) {
    throw new ValidationError("Não foi possível validar este cupom.");
  }
  if (coupon.discount_type !== "percentage") {
    throw new ValidationError("Este tipo de cupom ainda não é aceito no pagamento pelo site.");
  }
  const percentage = Number(coupon.discount_value);
  if (!["number", "string"].includes(typeof coupon.discount_value) || !/^\d+$/.test(String(coupon.discount_value))
    || !Number.isInteger(percentage) || percentage <= 0 || percentage > 100) {
    throw new ValidationError("O percentual deste cupom é inválido.");
  }
  if (percentage === 100) {
    throw new ValidationError("Cupons de 100% precisam ser usados pela Central de Reservas.");
  }
  return {
    code: couponCode(coupon.code),
    percentage,
    roomIds: restrictionIds(coupon.room_types),
    rateplanIds: restrictionIds(coupon.rateplans)
  };
};

/** Consulta a lista privada já filtrada pelo Artax, sem expor outros cupons. */
export const findAvailableCoupon = (data, code) => {
  if (code === undefined || code === null || code === "") return null;
  const requested = couponCode(code);
  if (!requested) return null;
  if (!data || !Array.isArray(data.coupons)) {
    throw new ValidationError("Não foi possível consultar os cupons. Tente novamente.");
  }
  const matches = data.coupons.filter((coupon) => {
    if (!coupon || typeof coupon !== "object" || Array.isArray(coupon) || !couponCode(coupon.code)) {
      throw new ValidationError("Não foi possível validar os cupons disponíveis.");
    }
    return couponCode(coupon.code) === requested;
  });
  if (!matches.length) throw new ValidationError("Cupom inválido ou indisponível para estas datas.");
  if (matches.length > 1) throw new ValidationError("Não foi possível identificar este cupom. Fale com a Central de Reservas.");
  readCoupon(matches[0]);
  return { ...matches[0], code: requested };
};

const nightsBetween = (arrival, departure) => {
  const dates = [arrival, departure].map((date) => {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ValidationError("Datas inválidas para aplicar o cupom.");
    }
    const parsed = new Date(`${date}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      throw new ValidationError("Datas inválidas para aplicar o cupom.");
    }
    return parsed.getTime();
  });
  const nights = (dates[1] - dates[0]) / 86_400_000;
  if (!Number.isSafeInteger(nights) || nights <= 0) throw new ValidationError("Datas inválidas para aplicar o cupom.");
  return nights;
};

// Converte a representação decimal sem multiplicação de ponto flutuante.
const priceInCents = (price) => {
  if ((typeof price !== "number" && typeof price !== "string") || !/^\d+(?:\.\d+)?$/.test(String(price))) {
    throw new ValidationError("Não foi possível validar o valor da acomodação.");
  }
  const [whole, fraction = ""] = String(price).split(".");
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0").slice(0, 2))
    + (Number(fraction[2] || 0) >= 5 ? 1n : 0n);
  if (cents <= 0n || cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new ValidationError("Não foi possível validar o valor da acomodação.");
  }
  return cents;
};

/** Retorna preços totais líquidos, preservando as opções públicas recebidas. */
export const applyCouponToRooms = (data, coupon, { priceMode = "total", arrival_date, departure_date } = {}) => {
  const validated = readCoupon(coupon);
  const nights = nightsBetween(arrival_date, departure_date);
  if (!["total", "per_night"].includes(priceMode)) throw new ValidationError("Não foi possível verificar a tarifa do cupom.");
  if (!data?.rooms || typeof data.rooms !== "object" || (Array.isArray(data.rooms) && data.rooms.length)) {
    throw new ValidationError("Não foi possível verificar as acomodações deste cupom.");
  }

  let eligibleCount = 0;
  const roomEntries = Object.entries(data.rooms).map(([roomId, plans]) => {
    if (!plans || typeof plans !== "object" || Array.isArray(plans)) {
      throw new ValidationError("Não foi possível verificar as acomodações deste cupom.");
    }
    const planEntries = Object.entries(plans).map(([planId, option]) => {
      if (!option || typeof option !== "object" || Array.isArray(option)) {
        throw new ValidationError("Não foi possível verificar a tarifa deste cupom.");
      }
      const total = priceInCents(option.price) * BigInt(priceMode === "per_night" ? nights : 1);
      if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new ValidationError("O valor da acomodação é inválido.");
      const eligible = !/b2b/i.test(option.rateplan_name || "")
        && (!validated.roomIds.length || validated.roomIds.includes(String(Number(roomId))))
        && (!validated.rateplanIds.length || validated.rateplanIds.includes(String(Number(option.rateplan_id ?? planId))));
      // Arredonda o desconto por acomodação ao centavo, com metade para cima.
      const discount = eligible ? (total * BigInt(validated.percentage) + 50n) / 100n : 0n;
      const net = total - discount;
      if (eligible && net <= 0n) throw new ValidationError("Este cupom deixa a reserva sem valor a pagar. Fale com a Central de Reservas.");
      if (eligible) eligibleCount += 1;
      const result = {
        ...option,
        price: Number(net) / 100,
        price_per_nights: Number((net + BigInt(nights) / 2n) / BigInt(nights)) / 100,
        coupon_applied: eligible
      };
      if (eligible) result.original_price = Number(total) / 100;
      return [planId, result];
    });
    return [roomId, Object.fromEntries(planEntries)];
  });
  const availableCount = roomEntries.reduce((count, [, plans]) => count + Object.keys(plans).length, 0);
  if (availableCount && !eligibleCount) throw new ValidationError("Este cupom não se aplica às acomodações disponíveis.");
  return {
    ...data,
    rooms: availableCount ? Object.fromEntries(roomEntries) : [],
    coupon: { code: validated.code, discount_type: "percentage", discount_value: validated.percentage }
  };
};
