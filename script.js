const HOME_API_BASE = (
  window.CZ_CHECKOUT_API ||
  (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "http://localhost:8080/api"
    : "https://checkout-casazanotto-production.up.railway.app/api")
).replace(/\/$/, "");
const HOME_INSTALLMENTS_MAX = 4;

/* Valor mínimo por cartão no pagamento dividido. Abaixo disso a Rede recusa com
   o código 108 ("Value not allowed for this type of card") — visto em produção
   com R$ 1,00. O piso real do contrato ainda será confirmado com a operadora;
   até lá vale este, espelhado no servidor (MIN_CARD_AMOUNT). */
const HOME_MIN_CARD_AMOUNT = 5;
const HOME_FALLBACK_ROOM_IMAGES = [
  "assets/rooms/standard/01.webp",
  "assets/rooms/bangalo/01.webp",
  "assets/rooms/gold/01.webp",
  "assets/rooms/gold-master/01.webp",
  "assets/suite.webp",
  "assets/pool.webp"
];

const galleryFiles = [
  "01-Apartamento-35.webp",
  "02-Apartamento-36.webp",
  "03-Apartamento-38.webp",
  "04-Apartamento-40.webp",
  "05-Apartamento-41.webp",
  "06-Apartamento-42.webp",
  "13-Hotel-11.webp",
  "14-IMG_0253-1-scaled-1.webp",
  "15-IMG_0257-1-scaled-1.webp",
  "16-IMG_0260-2-scaled-1.webp",
  "17-IMG_0262-scaled-1.webp",
  "18-IMG_0267-scaled-1.webp",
  "19-IMG_0269-scaled-1.webp",
  "20-IMG_1698-1-scaled-1.webp",
  "21-IMG_1706-scaled-1.webp",
  "22-IMG_2421-1-scaled-1.webp",
  "23-IMG_2425-1-scaled-1.webp",
  "24-IMG_2425-scaled-1.webp",
  "25-IMG_2431-scaled-1.webp",
  "26-IMG_2433-1-scaled-1.webp",
  "27-IMG_2434-scaled-1.webp",
  "28-IMG_2443-scaled-1.webp",
  "29-IMG_2444-2-scaled-1.webp",
  "30-IMG_2452-1-scaled-1.webp",
  "31-IMG_2453-scaled-1.webp",
  "32-IMG_2454-1-scaled-1.webp",
  "33-IMG_2455-scaled-1.webp",
  "34-IMG_2455-scaled-2.webp",
  "35-IMG_2456-2-scaled-1.webp",
  "36-IMG_2457-1-scaled-1.webp",
  "37-IMG_2458-1-scaled-1.webp",
  "38-IMG_2458-2-scaled-1.webp",
  "39-IMG_2460-1-scaled-1.webp",
  "40-IMG_2464-scaled-1.webp",
  "41-IMG_2466-scaled-1.webp",
  "42-IMG_2472-scaled-1.webp",
  "43-IMG_2473-1-scaled-1.webp",
  "44-IMG_2476-1-scaled-1.webp",
  "45-IMG_2477-scaled-1.webp",
  "46-IMG_2482-1-scaled-1.webp",
  "47-IMG_2786-scaled-1.webp",
  "48-IMG_2787-scaled-1.webp",
  "49-IMG_2788-scaled-1.webp",
  "50-IMG_2789-2-scaled-1.webp",
  "51-IMG_2792-scaled-1.webp",
  "52-IMG_2793-scaled-1.webp",
  "53-IMG_2794-scaled-1.webp",
  "54-IMG_2795-scaled-1.webp",
  "55-12-de-mar.-de-2026-21_37_34.webp",
  "56-12-de-mar.-de-2026-21_44_16.webp",
  "57-12-de-mar.-de-2026-21_46_03.webp",
  "58-12-de-mar.-de-2026-21_47_50.webp",
  "60-Foto-18-scaled.webp",
  "61-Foto-20-scaled.webp",
  "62-Foto-21-scaled.webp",
  "63-Foto-22-scaled.webp",
  "64-Foto-23-scaled.webp",
  "65-Foto-30-scaled.webp",
  "66-Foto-31-scaled.webp",
  "67-Foto-35-scaled.webp",
  "68-Foto-36-scaled.webp",
  "69-Foto-37-scaled.webp",
  "70-Foto-38-scaled.webp",
  "71-Foto-45-scaled.webp",
  "72-Foto-46-scaled.webp",
  "73-Foto-49-scaled.webp",
  "74-Foto-61-scaled.webp",
  "75-Foto-67-scaled.webp",
  "76-Foto-68-scaled.webp",
  "77-Foto-69-scaled.webp",
  "78-Foto-76-scaled.webp",
  "79-Foto-78-scaled.webp",
  "80-Foto-79-scaled.webp",
  "81-Foto-81-scaled.webp",
  "82-Foto-82-scaled.webp",
  "83-Foto-85-scaled.webp",
  "84-Foto-90-scaled.webp",
  "85-image-1.webp",
  "86-IMG_1698-2-scaled.webp",
  "87-IMG_1704-1-scaled.webp"
];

const galleryCategoryLabels = {
  rooms: "Acomodações",
  leisure: "Lazer",
  food: "Café",
  facade: "Pousada",
  details: "Detalhes"
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const initIcons = () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
};

const initMenu = () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");

  if (!toggle || !nav) return;

  const closeMenu = () => {
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
  };

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      closeMenu();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
};

const setupBookingForm = (form) => {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const afterTomorrow = addDays(today, 2);
  const entrada = form.elements.entrada;
  const saida = form.elements.saida;
  const hospedes = form.elements.hospedes;

  if (!entrada || !saida) return;

  entrada.min = formatDate(today);
  saida.min = formatDate(tomorrow);
  if (!entrada.value) entrada.value = formatDate(tomorrow);
  if (!saida.value) saida.value = formatDate(afterTomorrow);

  entrada.addEventListener("change", () => {
    const selected = new Date(`${entrada.value}T12:00:00`);
    const minCheckout = formatDate(addDays(selected, 1));
    saida.min = minCheckout;
    if (!saida.value || saida.value <= entrada.value) {
      saida.value = minCheckout;
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.matches("[data-mobile-booking-form]") && window.CZHomeBooking?.prefill) {
      window.CZHomeBooking.prefill({
        arrival: entrada.value,
        departure: saida.value,
        adults: hospedes?.value || "2"
      });
      return;
    }
    document.querySelector("#reservar")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
};

const initBookingForm = () => {
  const forms = document.querySelectorAll("[data-booking-form]:not([data-compact-booking]), [data-mobile-booking-form]");
  forms.forEach((form) => setupBookingForm(form));
};

const parseLocalDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const normalizeDate = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const sameDate = (a, b) =>
  Boolean(a && b) &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const dateLabel = (date) =>
  date
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date).replace(".", "")
    : "Selecionar";

const fullDateLabel = (value) => {
  const date = parseLocalDate(value);
  return date
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date).replace(".", "")
    : "-";
};

const compactNightsBetween = (start, end) => {
  const a = parseLocalDate(start);
  const b = parseLocalDate(end);
  if (!a || !b) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
};

const initCompactBookingFlowLegacy = () => {
  const form = document.querySelector("[data-compact-booking]");
  if (!form) return;

  const today = normalizeDate(new Date());
  const arrivalInput = form.querySelector("[data-home-arrival]");
  const departureInput = form.querySelector("[data-home-departure]");
  const inText = form.querySelector("[data-home-cal-in]");
  const outText = form.querySelector("[data-home-cal-out]");
  const inField = form.querySelector("[data-home-cal-infield]");
  const outField = form.querySelector("[data-home-cal-outfield]");
  const hint = form.querySelector("[data-home-cal-hint]");
  const monthTitle = form.querySelector("[data-home-cal-title]");
  const grid = form.querySelector("[data-home-cal-grid]");
  const adultsInput = form.querySelector("[data-home-adults]");
  const kidsInput = form.querySelector("[data-home-kids]");
  const agesWrap = form.querySelector("[data-home-ages-wrap]");
  const agesBox = form.querySelector("[data-home-ages]");
  const panels = Array.from(form.querySelectorAll("[data-home-panel]"));
  const tabs = Array.from(form.querySelectorAll("[data-home-tab]"));
  let arrival = null;
  let departure = null;
  let selecting = "in";
  let activeStep = "dates";
  let view = new Date(today.getFullYear(), today.getMonth(), 1);

  const stepIndex = { dates: 0, guests: 1, review: 2 };

  const syncCalendar = () => {
    arrivalInput.value = arrival ? formatDate(arrival) : "";
    departureInput.value = departure ? formatDate(departure) : "";
    inText.textContent = dateLabel(arrival);
    outText.textContent = dateLabel(departure);
    inField.classList.toggle("is-active", selecting === "in");
    outField.classList.toggle("is-active", selecting === "out");

    if (!arrival) {
      hint.innerHTML = "Selecione a data de <b>check-in</b>.";
    } else if (!departure) {
      hint.innerHTML = "Agora selecione a data de <b>check-out</b>.";
    } else {
      hint.innerHTML = `Estadia de <b>${compactNightsBetween(arrivalInput.value, departureInput.value)} noite(s)</b>.`;
    }
  };

  const renderCalendar = () => {
    const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(view);
    monthTitle.textContent = monthName;
    const weekdays = ["D", "S", "T", "Q", "Q", "S", "S"];
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const last = new Date(view.getFullYear(), view.getMonth() + 1, 0);
    const cells = weekdays.map((day) => `<span class="home-rc-wd">${day}</span>`);

    for (let i = 0; i < first.getDay(); i += 1) {
      cells.push('<span class="home-rc-empty"></span>');
    }

    for (let day = 1; day <= last.getDate(); day += 1) {
      const date = new Date(view.getFullYear(), view.getMonth(), day);
      const disabled = date < today;
      const cls = ["home-rc-day"];
      if (sameDate(date, today)) cls.push("is-today");
      if (sameDate(date, arrival)) cls.push("is-start");
      if (sameDate(date, departure)) cls.push("is-end");
      if (arrival && departure && date > arrival && date < departure) cls.push("is-range");
      cells.push(`<button class="${cls.join(" ")}" type="button" data-home-day="${formatDate(date)}"${disabled ? " disabled" : ""}>${day}</button>`);
    }

    grid.innerHTML = cells.join("");
    syncCalendar();
  };

  const updateReview = () => {
    const adults = Number(adultsInput.value || 2);
    const kids = Number(kidsInput.value || 0);
    const nights = compactNightsBetween(arrivalInput.value, departureInput.value);
    const guestText = `${adults} adulto(s)${kids ? ` · ${kids} criança(s)` : ""}`;
    form.querySelector("[data-home-review-in]").textContent = fullDateLabel(arrivalInput.value);
    form.querySelector("[data-home-review-out]").textContent = fullDateLabel(departureInput.value);
    form.querySelector("[data-home-review-nights]").textContent = nights ? `${nights} noite(s)` : "-";
    form.querySelector("[data-home-review-guests]").textContent = guestText;
  };

  const goToStep = (step, shouldScroll = true) => {
    if (step !== "dates" && (!arrivalInput.value || !departureInput.value)) {
      activeStep = "dates";
    } else {
      activeStep = step;
    }

    panels.forEach((panel) => { panel.hidden = panel.dataset.homePanel !== activeStep; });
    tabs.forEach((tab) => {
      const tabStep = tab.dataset.homeTab;
      const active = tabStep === activeStep;
      tab.classList.toggle("is-active", active);
      tab.classList.toggle("is-done", stepIndex[tabStep] < stepIndex[activeStep]);
      tab.setAttribute("aria-current", active ? "step" : "false");
    });

    updateReview();
    fitOneLineTitles();
    initIcons();
  };

  const buildAges = () => {
    const kids = Number(kidsInput.value || 0);
    agesBox.innerHTML = "";
    agesWrap.hidden = kids <= 0;
    for (let i = 0; i < kids; i += 1) {
      const field = document.createElement("label");
      field.className = "home-age-field";
      field.innerHTML = `<span>Criança ${i + 1}</span><input type="number" min="0" max="12" value="6" inputmode="numeric" data-home-age>`;
      agesBox.appendChild(field);
    }
    updateReview();
  };

  form.querySelector("[data-home-cal-prev]")?.addEventListener("click", () => {
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    renderCalendar();
  });

  form.querySelector("[data-home-cal-next]")?.addEventListener("click", () => {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    renderCalendar();
  });

  inField?.addEventListener("click", () => { selecting = "in"; syncCalendar(); });
  outField?.addEventListener("click", () => { if (arrival) selecting = "out"; syncCalendar(); });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-home-day]");
    if (!button || button.disabled) return;
    const date = parseLocalDate(button.dataset.homeDay);
    if (!date) return;

    if (selecting === "in" || !arrival || (arrival && departure)) {
      arrival = date;
      if (departure && departure <= arrival) departure = null;
      selecting = "out";
    } else if (date <= arrival) {
      arrival = date;
      departure = null;
      selecting = "out";
    } else {
      departure = date;
      selecting = "out";
    }

    renderCalendar();
    updateReview();
  });

  grid.addEventListener("pointerover", (event) => {
    const button = event.target.closest("[data-home-day]");
    if (!button || selecting !== "out" || !arrival || departure) return;
    const hover = parseLocalDate(button.dataset.homeDay);
    if (!hover || hover <= arrival) return;
    grid.querySelectorAll("[data-home-day]").forEach((dayButton) => {
      const date = parseLocalDate(dayButton.dataset.homeDay);
      dayButton.classList.toggle("is-preview", date > arrival && date <= hover);
    });
  });

  grid.addEventListener("pointerleave", () => {
    grid.querySelectorAll(".is-preview").forEach((button) => button.classList.remove("is-preview"));
  });

  form.querySelectorAll("[data-home-stepper]").forEach((stepper) => {
    const input = stepper.querySelector("input");
    const min = Number(stepper.dataset.min || 0);
    const max = Number(stepper.dataset.max || 99);
    const set = (value) => {
      input.value = String(Math.max(min, Math.min(max, value)));
      if (input === kidsInput) buildAges();
      updateReview();
    };
    stepper.querySelector("[data-home-dec]")?.addEventListener("click", () => set(Number(input.value) - 1));
    stepper.querySelector("[data-home-inc]")?.addEventListener("click", () => set(Number(input.value) + 1));
  });

  form.querySelectorAll("[data-home-next], [data-home-prev], [data-home-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.homeNext || button.dataset.homePrev || button.dataset.homeTab;
      if ((target === "guests" || target === "review") && (!arrivalInput.value || !departureInput.value)) {
        goToStep("dates");
        hint.innerHTML = "Selecione check-in e check-out para continuar.";
        return;
      }
      goToStep(target);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!arrivalInput.value || !departureInput.value) {
      goToStep("dates");
      hint.innerHTML = "Selecione check-in e check-out para continuar.";
      return;
    }

    const kids = Number(kidsInput.value || 0);
    const params = new URLSearchParams({
      arrival_date: arrivalInput.value,
      departure_date: departureInput.value,
      adults: adultsInput.value,
      kids: String(kids)
    });

    form.querySelectorAll("[data-home-age]").forEach((age, index) => {
      params.append(`ages[${index}]`, age.value || "6");
    });

    window.CZHomeBooking?.prefill({
      arrival: arrivalInput.value,
      departure: departureInput.value,
      adults: adultsInput.value
    });
  });

  buildAges();
  renderCalendar();
  goToStep("dates");
};

const homeEscapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

const homeBrl = (value) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const homeOnlyDigits = (value) => String(value || "").replace(/\D/g, "");

/* CPF: 11 dígitos + dígitos verificadores. Evita que um número digitado errado
   só apareça como problema lá na frente, no PMS. */
const homeCpfValid = (raw) => {
  const d = homeOnlyDigits(raw);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const check = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i += 1) sum += Number(d[i]) * (len + 1 - i);
    const mod = (sum * 10) % 11;
    return (mod === 10 ? 0 : mod) === Number(d[len]);
  };
  return check(9) && check(10);
};

/* Evento de compra no formato Enhanced Ecommerce esperado pelo Pixel da
   Asksuite (dataLayer.ecommerce.purchase — ver integrations-docs.asksuite.com/pixel).
   Dedup por reserva (sessionStorage) evita duplicar em recarregamento ou
   botão voltar; nunca deixa o pixel quebrar a confirmação pro hóspede. */
const pushPurchaseEvent = (data, selectedRooms) => {
  try {
    const bookingId = data?.booking_id;
    if (!bookingId) return;
    const dedupeKey = `cz-purchase-${bookingId}`;
    if (sessionStorage.getItem(dedupeKey)) return;
    sessionStorage.setItem(dedupeKey, "1");

    const serverRooms = Array.isArray(data?.rooms) && data.rooms.length ? data.rooms : null;
    const fallbackRooms = (selectedRooms || []).map((r) => ({ id: r.roomId, name: r.room_name, price: r.price }));
    const rooms = serverRooms || fallbackRooms;
    const value = Number(data?.payment?.amount ?? rooms.reduce((sum, r) => sum + Number(r.price || 0), 0));

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null }); // limpa o objeto anterior antes de empurrar o novo
    window.dataLayer.push({
      event: "purchase",
      ecommerce: {
        currencyCode: "BRL",
        purchase: {
          actionField: {
            id: String(bookingId),
            revenue: value.toFixed(2)
          },
          products: rooms.map((r) => ({
            id: String(r.id ?? ""),
            name: r.name || "",
            price: Number(r.price || 0).toFixed(2),
            quantity: 1
          }))
        }
      }
    });

    // Meta Pixel: mesma reserva, mesmo momento e mesma trava de duplicidade do
    // evento acima — sozinho, o snippet só registra PageView e não mede venda.
    // `eventID` é o número da reserva: se um dia ligarmos a Conversions API,
    // a Meta usa esse id para deduplicar o evento do navegador com o do servidor.
    if (typeof window.fbq === "function") {
      // Correspondência avançada manual, pedida pelo Gerenciador de Anúncios.
      // Só dá pra informar aqui: no <head> o hóspede ainda não preencheu nada.
      // Reinicializar o mesmo pixel com os dados atualiza a correspondência
      // antes do evento sair; o próprio Pixel aplica SHA-256 antes de
      // transmitir, então os valores em texto não saem do navegador.
      const match = {};
      const email = (document.querySelector("[data-home-guest-email]")?.value || "")
        .trim().toLowerCase();
      if (email.includes("@")) match.em = email;
      const phone = homeOnlyDigits(document.querySelector("[data-home-guest-phone]")?.value);
      if (phone.length >= 10) match.ph = phone.startsWith("55") ? phone : `55${phone}`;
      if (match.em || match.ph) window.fbq("init", "1883895762271305", match);

      window.fbq("track", "Purchase", {
        value: Number(value.toFixed(2)),
        currency: "BRL",
        content_type: "hotel",
        contents: rooms.map((r) => ({
          id: String(r.id ?? ""),
          quantity: 1,
          item_price: Number(r.price || 0)
        }))
      }, { eventID: String(bookingId) });
    }
  } catch (error) {
    console.error("[pixel] falha ao registrar evento de compra:", error);
  }
};

const homeToImageList = (value) => {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(homeToImageList);
  if (typeof value === "object") {
    const keys = ["url", "src", "href", "path", "image", "main_image", "large", "medium", "thumbnail", "thumb"];
    return keys.flatMap((key) => homeToImageList(value[key]));
  }
  return [];
};

const homeNormalizeImageUrl = (src) => {
  const value = String(src || "").trim();
  if (!value) return "";
  return value.startsWith("//") ? `https:${value}` : value;
};

const homeIsImageUrl = (src) =>
  /^(https?:)?\/\//i.test(src) || /\.(webp|avif|png|jpe?g)(\?.*)?$/i.test(src);

const homeExtractArtaxImages = (option) => {
  const keys = [
    "main_image",
    "image",
    "photo",
    "picture",
    "cover",
    "cover_image",
    "thumbnail",
    "thumb",
    "images",
    "photos",
    "pictures",
    "gallery",
    "media",
    "room_images"
  ];
  return [...new Set(keys.flatMap((key) => homeToImageList(option?.[key])).map(homeNormalizeImageUrl).filter(homeIsImageUrl))];
};

const HOME_ROOM_PHOTOS = { standard: 15, bangalo: 14, gold: 8, "gold-master": 8 };

const homeRoomSlugFromName = (name) => {
  const normalized = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (normalized.includes("master")) return "gold-master";
  if (normalized.includes("gold")) return "gold";
  if (normalized.includes("bangal")) return "bangalo";
  if (normalized.includes("standard")) return "standard";
  return null;
};

const homeLocalRoomPhotos = (slug) => {
  const count = HOME_ROOM_PHOTOS[slug];
  if (!count) return [];
  return Array.from({ length: count }, (_, index) => `assets/rooms/${slug}/${String(index + 1).padStart(2, "0")}.webp`);
};

const homeFallbackRoomImage = (name, index) => {
  const normalized = String(name || "").toLowerCase();
  if (normalized.includes("gold")) return "assets/rooms/gold/01.webp";
  if (normalized.includes("standard")) return "assets/rooms/standard/01.webp";
  if (normalized.includes("bangal")) return "assets/rooms/bangalo/01.webp";
  return HOME_FALLBACK_ROOM_IMAGES[index % HOME_FALLBACK_ROOM_IMAGES.length];
};

const homeFlattenRooms = (rooms) => {
  if (!rooms || Array.isArray(rooms)) return [];
  const list = [];
  for (const [roomId, plans] of Object.entries(rooms)) {
    const publicPlans = Object.entries(plans || {})
      .map(([rateId, opt]) => ({ rateId, opt }))
      .filter(({ opt }) => !/b2b/i.test(opt?.rateplan_name || ""));
    if (!publicPlans.length) continue;
    publicPlans.sort((a, b) => Number(a.opt.price) - Number(b.opt.price));
    const { rateId, opt } = publicPlans[0];
    const fullName = opt.room_name || `Quarto ${roomId}`;
    const roomName = fullName.split("|")[0].trim();
    const artaxImages = homeExtractArtaxImages(opt);
    const localImages = homeLocalRoomPhotos(homeRoomSlugFromName(fullName));
    const images = [...new Set([...artaxImages, ...localImages])];
    const safeImages = images.length ? images : [homeFallbackRoomImage(fullName, list.length)];
    list.push({
      roomId: String(roomId),
      rateplanId: Number(opt.rateplan_id || rateId),
      room_name: roomName,
      variant: (fullName.split("|")[1] || "").trim(),
      price: Number(opt.price || 0),
      pricePerNight: Number(opt.price_per_nights) || null,
      images: safeImages,
      image: safeImages[0]
    });
  }
  return list.sort((a, b) => a.price - b.price);
};

const homeBuildAvailabilityParams = (search) => {
  const params = new URLSearchParams({
    arrival_date: search.arrival_date,
    departure_date: search.departure_date,
    adults: String(search.adults),
    kids: String(search.kids)
  });
  (search.ages || []).forEach((age) => params.append("ages", String(age)));
  return params;
};

const homeReadApiJson = async (res, fallbackMessage) => {
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    data = null;
  }
  if (!res.ok) {
    const err = new Error(data?.error || fallbackMessage);
    // Pagamento dividido com um cartão recusado: o outro segue autorizado e o
    // site precisa desses dados para oferecer a troca em vez de recomeçar.
    if (data?.partial) err.partial = data.partial;
    err.status = res.status;
    throw err;
  }
  return data || {};
};

const initCompactBookingFlow = () => {
  const form = document.querySelector("[data-compact-booking]");
  if (!form) return;

  const today = normalizeDate(new Date());
  const arrivalInput = form.querySelector("[data-home-arrival]");
  const departureInput = form.querySelector("[data-home-departure]");
  const inText = form.querySelector("[data-home-cal-in]");
  const outText = form.querySelector("[data-home-cal-out]");
  const inField = form.querySelector("[data-home-cal-infield]");
  const outField = form.querySelector("[data-home-cal-outfield]");
  const hint = form.querySelector("[data-home-cal-hint]");
  const monthTitle = form.querySelector("[data-home-cal-title]");
  const grid = form.querySelector("[data-home-cal-grid]");
  const adultsInput = form.querySelector("[data-home-adults]");
  const kidsInput = form.querySelector("[data-home-kids]");
  const agesWrap = form.querySelector("[data-home-ages-wrap]");
  const agesBox = form.querySelector("[data-home-ages]");
  const roomList = form.querySelector("[data-home-room-list]");
  const notice = form.querySelector("[data-home-notice]");
  const guestNotice = form.querySelector("[data-home-guest-notice]");
  const payNotice = form.querySelector("[data-home-pay-notice]");
  const selectedRoom = form.querySelector("[data-home-selected-room]");
  const paySubmit = form.querySelector("[data-home-pay-submit]");
  const paySubmitLabel = paySubmit?.querySelector("span");
  const cartSummary = form.querySelector("[data-home-cart-summary]");
  const cartCount = form.querySelector("[data-home-cart-count]");
  const cartTotalEl = form.querySelector("[data-home-cart-total]");
  const roomsContinueBtn = form.querySelector("[data-home-rooms-continue]");
  const panels = Array.from(form.querySelectorAll("[data-home-panel]"));
  const tabs = Array.from(form.querySelectorAll("[data-home-tab]"));
  const stepIndex = { dates: 0, guests: 1, rooms: 2, guest: 3, payment: 4, done: 5 };
  const state = {
    rooms: [],
    selectedRooms: [],
    search: null,
    payMethod: "pix",
    pixPoll: null,
    pixExpiresAt: 0,
    paymentBusy: false
  };
  let arrival = null;
  let departure = null;
  let selecting = "in";
  let activeStep = "dates";
  let view = new Date(today.getFullYear(), today.getMonth(), 1);

  const setText = (selector, text) => {
    form.querySelectorAll(selector).forEach((element) => {
      element.textContent = text;
    });
  };

  const showNotice = (element, message) => {
    if (!element) return;
    element.textContent = message;
    element.hidden = false;
  };

  const clearNotice = (element) => {
    if (!element) return;
    element.textContent = "";
    element.hidden = true;
  };

  const resetAvailability = () => {
    state.rooms = [];
    state.selectedRooms = [];
    state.search = null;
    if (roomList) roomList.innerHTML = "";
    if (selectedRoom) selectedRoom.textContent = "";
    clearNotice(notice);
    clearNotice(guestNotice);
    clearNotice(payNotice);
    updateCartSummary();
  };

  const cartTotal = () => state.selectedRooms.reduce((sum, r) => sum + r.price, 0);

  /** Atualiza o resumo do carrinho e o botão "Continuar" na etapa de quartos. */
  const updateCartSummary = () => {
    const count = state.selectedRooms.length;
    if (cartSummary) cartSummary.hidden = count === 0;
    if (cartCount) cartCount.textContent = count === 1 ? "1 acomodação selecionada" : `${count} acomodações selecionadas`;
    if (cartTotalEl) cartTotalEl.textContent = homeBrl(cartTotal());
    if (roomsContinueBtn) roomsContinueBtn.disabled = count === 0;
  };

  const stopPixPolling = () => {
    if (state.pixPoll) window.clearInterval(state.pixPoll);
    state.pixPoll = null;
    state.pixExpiresAt = 0;
  };

  const setPayBusy = (busy, label) => {
    state.paymentBusy = busy;
    if (paySubmit) paySubmit.disabled = busy;
    if (paySubmitLabel && label) paySubmitLabel.textContent = label;
  };

  const buildSearch = () => {
    const kids = Number(kidsInput.value || 0);
    return {
      arrival_date: arrivalInput.value,
      departure_date: departureInput.value,
      adults: Number(adultsInput.value || 1),
      kids,
      ages: Array.from(form.querySelectorAll("[data-home-age]")).slice(0, kids).map((input) => Number(input.value || 6))
    };
  };

  const updateReview = () => {
    const adults = Number(adultsInput.value || 2);
    const kids = Number(kidsInput.value || 0);
    const nights = compactNightsBetween(arrivalInput.value, departureInput.value);
    const guestText = `${adults} adulto(s)${kids ? ` · ${kids} criança(s)` : ""}`;
    setText("[data-home-review-in]", fullDateLabel(arrivalInput.value));
    setText("[data-home-review-out]", fullDateLabel(departureInput.value));
    setText("[data-home-review-guests]", guestText);
    setText("[data-home-review-nights]", nights ? `${nights} noite(s)` : "-");

    if (state.selectedRooms.length) {
      const roomLabel = (r) => (r.variant ? `${r.room_name} · ${r.variant}` : r.room_name);
      const names = state.selectedRooms.map(roomLabel).join(", ");
      setText("[data-home-pay-room]", names);
      setText("[data-home-pay-total]", homeBrl(cartTotal()));
      if (selectedRoom) {
        selectedRoom.textContent = `${names} selecionado(s) · ${homeBrl(cartTotal())}`;
      }
    } else {
      setText("[data-home-pay-room]", "-");
      setText("[data-home-pay-total]", "-");
    }
    updateCartSummary();
  };

  const syncCalendar = () => {
    arrivalInput.value = arrival ? formatDate(arrival) : "";
    departureInput.value = departure ? formatDate(departure) : "";
    inText.textContent = dateLabel(arrival);
    outText.textContent = dateLabel(departure);
    inField.classList.toggle("is-active", selecting === "in");
    outField.classList.toggle("is-active", selecting === "out");

    if (!arrival) {
      hint.innerHTML = "Selecione a data de <b>check-in</b>.";
    } else if (!departure) {
      hint.innerHTML = "Agora selecione a data de <b>check-out</b>.";
    } else {
      hint.innerHTML = `Estadia de <b>${compactNightsBetween(arrivalInput.value, departureInput.value)} noite(s)</b>.`;
    }
    updateReview();
  };

  const renderCalendar = () => {
    const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(view);
    monthTitle.textContent = monthName;
    const weekdays = ["D", "S", "T", "Q", "Q", "S", "S"];
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const last = new Date(view.getFullYear(), view.getMonth() + 1, 0);
    const cells = weekdays.map((day) => `<span class="home-rc-wd">${day}</span>`);

    for (let i = 0; i < first.getDay(); i += 1) {
      cells.push('<span class="home-rc-empty"></span>');
    }

    for (let day = 1; day <= last.getDate(); day += 1) {
      const date = new Date(view.getFullYear(), view.getMonth(), day);
      const disabled = date < today;
      const cls = ["home-rc-day"];
      if (sameDate(date, today)) cls.push("is-today");
      if (sameDate(date, arrival)) cls.push("is-start");
      if (sameDate(date, departure)) cls.push("is-end");
      if (arrival && departure && date > arrival && date < departure) cls.push("is-range");
      cells.push(`<button class="${cls.join(" ")}" type="button" data-home-day="${formatDate(date)}"${disabled ? " disabled" : ""}>${day}</button>`);
    }

    grid.innerHTML = cells.join("");
    syncCalendar();
  };

  const goToStep = (step, shouldScroll = true) => {
    if (step !== "dates" && (!arrivalInput.value || !departureInput.value)) {
      activeStep = "dates";
    } else if ((step === "guest" || step === "payment") && !state.selectedRooms.length) {
      activeStep = "rooms";
    } else {
      activeStep = step;
    }

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.homePanel !== activeStep;
    });
    tabs.forEach((tab) => {
      const tabStep = tab.dataset.homeTab;
      const active = tabStep === activeStep;
      tab.classList.toggle("is-active", active);
      tab.classList.toggle("is-done", stepIndex[tabStep] < stepIndex[activeStep]);
      tab.setAttribute("aria-current", active ? "step" : "false");
    });

    updateReview();
    fitOneLineTitles();
    initIcons();
    if (shouldScroll && step !== "done") {
      requestAnimationFrame(() => {
        // "nearest" só rola a página se o formulário realmente saiu da tela.
        // Com "center" ele recentralizava a CADA troca de etapa, inclusive
        // ao clicar em "Voltar" — em idas e vindas entre etapas (comum ao
        // corrigir um dado) isso rolava a tela repetidamente sem necessidade.
        form.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  };

  const buildAges = () => {
    const kids = Number(kidsInput.value || 0);
    agesBox.innerHTML = "";
    agesWrap.hidden = kids <= 0;
    for (let i = 0; i < kids; i += 1) {
      const field = document.createElement("label");
      field.className = "home-age-field";
      field.innerHTML = `<span>Criança ${i + 1}</span><input type="number" min="0" max="17" value="6" inputmode="numeric" data-home-age>`;
      agesBox.appendChild(field);
    }
    resetAvailability();
    updateReview();
  };

  /* ---------- pagamento em até dois cartões ---------- */
  const payMethodIsCard = () => state.payMethod === "card";
  let cardCount = 1;
  const cardBlocks = () => Array.from(form.querySelectorAll("[data-home-card-block]"));
  const activeBlocks = () => cardBlocks().slice(0, cardCount);

  // "1.500,00" / "1500.00" / "1500" -> 1500. Em pt-BR a vírgula é o decimal e o
  // ponto é separador de milhar; tratar ao contrário faria R$ 1.500 virar 1,50.
  const parseBRL = (raw) => {
    const s = String(raw || "").replace(/[^\d.,]/g, "");
    if (!s) return NaN;
    const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
    return Number(normalized);
  };
  const toCents = (v) => Math.round(v * 100);

  const amountInput = (n) => form.querySelector(`[data-home-split-amount="${n}"]`);
  const splitParts = () => [1, 2].map((n) => parseBRL(amountInput(n)?.value));

  /* Etapas do modo dois cartões: valores -> cartão 1 -> cartão 2. Um cartão só
     não tem etapas; é a mesma tela única de sempre. */
  const CARD_STEPS = ["amounts", "1", "2"];
  let cardStep = "amounts";

  const goToCardStep = (name) => {
    cardStep = name;
    form.querySelectorAll("[data-home-cardstep]").forEach((el) => {
      el.hidden = el.dataset.homeCardstep !== name;
    });
    const cur = CARD_STEPS.indexOf(name);
    form.querySelectorAll("[data-home-cardstep-dot]").forEach((d) => {
      const i = CARD_STEPS.indexOf(d.dataset.homeCardstepDot);
      d.classList.toggle("is-active", i === cur);
      d.classList.toggle("is-done", i < cur);
    });
    // O resumo da divisão só interessa na etapa de valores.
    const box = form.querySelector("[data-home-split-summary]");
    if (box) box.hidden = name !== "amounts";
    updateSplitSummary();
    if (paySubmitLabel) {
      paySubmitLabel.textContent = name === "2" ? "Pagar e reservar" : "Continuar";
    }
    initIcons();
  };

  /* Base de cálculo das parcelas de cada cartão: o valor daquele cartão quando
     dividido, ou o total da reserva quando é um só. */
  const blockBase = (block) => {
    if (cardCount === 1) return cartTotal();
    const v = parseBRL(amountInput(block.dataset.homeCardBlock)?.value);
    return Number.isFinite(v) && v > 0 ? v : 0;
  };

  const updateSplitSummary = () => {
    const box = form.querySelector("[data-home-split-summary]");
    const paySubmitBtn = paySubmit;
    if (cardCount === 1) {
      if (box) box.hidden = true;
      if (paySubmitBtn && !state.paymentBusy) paySubmitBtn.disabled = false;
      return;
    }
    // Fora da etapa de valores o botão não depende da soma — ela já foi
    // validada para sair dali.
    if (cardStep !== "amounts") {
      if (box) box.hidden = true;
      if (paySubmitBtn && !state.paymentBusy) paySubmitBtn.disabled = false;
      return true;
    }
    if (box) box.hidden = false;
    const total = cartTotal();
    const parts = splitParts();
    const filled = parts.every((v) => Number.isFinite(v) && v > 0);
    const sum = parts.reduce((t, v) => t + (Number.isFinite(v) ? v : 0), 0);

    const setT = (sel, txt) => { const el = form.querySelector(sel); if (el) el.textContent = txt; };
    setT("[data-home-split-sum]", homeBrl(sum));
    setT("[data-home-split-total]", homeBrl(total));

    const msg = form.querySelector("[data-home-split-msg]");
    const diffCents = toCents(sum) - toCents(total);
    // Abaixo do mínimo a operadora recusa com "Value not allowed for this type
    // of card" (código 108). Barrar aqui evita queimar uma autorização — e, no
    // segundo cartão, evita deixar o primeiro preso numa sessão parcial.
    const belowMin = parts.some((v) => Number.isFinite(v) && v > 0 && toCents(v) < toCents(HOME_MIN_CARD_AMOUNT));
    let ok = false;
    if (!filled) {
      if (msg) { msg.textContent = "Informe o valor de cada cartão."; msg.className = ""; }
    } else if (belowMin) {
      if (msg) {
        msg.textContent = `Cada cartão precisa ter pelo menos ${homeBrl(HOME_MIN_CARD_AMOUNT)}. Ajuste a divisão ou pague em um cartão só.`;
        msg.className = "is-error";
      }
    } else if (diffCents === 0) {
      ok = true;
      if (msg) { msg.textContent = "Valores conferem com o total da reserva."; msg.className = "is-ok"; }
    } else if (diffCents > 0) {
      if (msg) { msg.textContent = `A soma passa ${homeBrl(diffCents / 100)} do total. Ajuste os valores.`; msg.className = "is-error"; }
    } else {
      if (msg) { msg.textContent = `Faltam ${homeBrl(Math.abs(diffCents) / 100)} para fechar o total. Ajuste os valores.`; msg.className = "is-error"; }
    }
    // Sem soma exata o pagamento nem é tentado — nada é cobrado.
    if (paySubmitBtn && !state.paymentBusy) paySubmitBtn.disabled = !ok;
    return ok;
  };

  const setCardCount = (n) => {
    cardCount = n === 2 ? 2 : 1;
    form.querySelectorAll("[data-home-cards]").forEach((b) => {
      const on = Number(b.dataset.homeCards) === cardCount;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-checked", String(on));
    });
    cardBlocks().forEach((block) => {
      const title = block.querySelector("[data-home-card-title]");
      if (title) title.hidden = cardCount === 1;
    });
    const steps = form.querySelector("[data-home-cardsteps]");
    if (steps) steps.hidden = cardCount === 1;

    if (cardCount === 2) {
      // Sugere metade em cada um — o hóspede ajusta como quiser.
      const total = cartTotal();
      const inputs = [amountInput(1), amountInput(2)];
      if (inputs.every((i) => i && !i.value)) {
        const half = Math.floor(toCents(total) / 2);
        inputs[0].value = (half / 100).toFixed(2).replace(".", ",");
        inputs[1].value = ((toCents(total) - half) / 100).toFixed(2).replace(".", ",");
      }
      goToCardStep("amounts");
    } else {
      // Um cartão: sem etapas, tudo numa tela.
      form.querySelectorAll("[data-home-cardstep]").forEach((el) => {
        el.hidden = el.dataset.homeCardstep !== "1";
      });
      cardStep = "1";
      if (paySubmitLabel) paySubmitLabel.textContent = "Pagar e reservar";
    }
    buildInstallments(cartTotal());
    updateSplitSummary();
    initIcons();
  };

  const buildInstallments = (price) => {
    cardBlocks().forEach((block) => buildInstallmentsFor(block, price));
  };

  const buildInstallmentsFor = (block, price) => {
    const select = block.querySelector("[data-home-card-installments]");
    if (!select) return;
    const base = cardCount === 1 ? price : blockBase(block);
    // Preserva a parcela já escolhida: essa função roda de novo toda vez que
    // o hóspede reentra na etapa "guest" (ex.: voltou pra corrigir um dado),
    // e reconstruir o <select> sem isso reseta a escolha pra 1x (à vista)
    // silenciosamente — o hóspede podia ter selecionado 4x, voltar uma etapa
    // e a reserva sair cobrada à vista sem ele perceber.
    const previous = Number(select.value) || 1;
    select.innerHTML = "";
    for (let n = 1; n <= HOME_INSTALLMENTS_MAX; n += 1) {
      const option = document.createElement("option");
      option.value = String(n);
      option.textContent = n === 1 ? `À vista - ${homeBrl(base)}` : `${n}x de ${homeBrl(base / n)} sem juros`;
      select.appendChild(option);
    }
    select.value = String(Math.min(Math.max(previous, 1), HOME_INSTALLMENTS_MAX));
  };

  const renderRooms = (rooms) => {
    state.rooms = rooms;
    if (!roomList) return;
    if (!rooms.length) {
      roomList.innerHTML = '<p class="home-form-notice">Não há acomodações disponíveis para estas datas. Tente outro período.</p>';
      return;
    }
    const nights = compactNightsBetween(arrivalInput.value, departureInput.value) || 1;
    roomList.innerHTML = rooms.map((room, index) => {
      const title = room.variant ? `${room.room_name} · ${room.variant}` : room.room_name;
      const selected = state.selectedRooms.some((r) => r.roomId === room.roomId && r.rateplanId === room.rateplanId);
      return `
        <article class="home-room-option${selected ? " is-selected" : ""}" data-home-room-card="${index}">
          <div class="home-room-media">
            <img src="${homeEscapeHTML(room.image)}" alt="${homeEscapeHTML(title)}" loading="${index === 0 ? "eager" : "lazy"}">
            <span class="home-room-check${selected ? " is-checked" : ""}" data-home-room-select="${index}" role="checkbox" aria-checked="${selected}" aria-label="${selected ? "Remover" : "Selecionar"} ${homeEscapeHTML(title)}">
              <i data-lucide="check" aria-hidden="true"></i>
            </span>
          </div>
          <div class="home-room-body">
            <h4>${homeEscapeHTML(room.room_name)}</h4>
            ${room.variant ? `<p>${homeEscapeHTML(room.variant)}</p>` : ""}
            <div class="home-room-price">
              <span>
                ${room.pricePerNight ? `<small>${homeBrl(room.pricePerNight)} / noite</small>` : ""}
                <strong>${homeBrl(room.price)}</strong>
                <small>total · ${nights} noite(s)</small>
              </span>
              <button class="button ${selected ? "button-ghost" : "button-primary"}" type="button" data-home-room-select="${index}">
                ${selected ? "Remover" : "Selecionar"}
              </button>
            </div>
          </div>
        </article>`;
    }).join("");
    initIcons();
  };

  const fetchAvailability = async () => {
    clearNotice(notice);
    resetAvailability();
    const search = buildSearch();
    if (compactNightsBetween(search.arrival_date, search.departure_date) < 1) {
      goToStep("dates");
      hint.innerHTML = "Selecione check-in e check-out para continuar.";
      return false;
    }
    state.search = search;
    goToStep("rooms");
    if (roomList) roomList.innerHTML = '<p class="home-form-notice">Buscando acomodações disponíveis...</p>';
    try {
      const res = await fetch(`${HOME_API_BASE}/availability?${homeBuildAvailabilityParams(search).toString()}`);
      const data = await homeReadApiJson(res, "Não foi possível consultar disponibilidade.");
      const rooms = homeFlattenRooms(data.rooms);
      renderRooms(rooms);
      if (!rooms.length) {
        showNotice(notice, "Não encontramos acomodações disponíveis para esse período.");
        return false;
      }
      return true;
    } catch (error) {
      if (roomList) roomList.innerHTML = "";
      showNotice(notice, error.message || "Não foi possível consultar disponibilidade.");
      return false;
    }
  };

  const toggleRoomSelection = (room) => {
    const idx = state.selectedRooms.findIndex((r) => r.roomId === room.roomId && r.rateplanId === room.rateplanId);
    if (idx >= 0) state.selectedRooms.splice(idx, 1);
    else state.selectedRooms.push(room);
    renderRooms(state.rooms);
    updateReview();
    clearNotice(notice);
  };

  const guestPayload = () => ({
    first_name: form.querySelector("[data-home-guest-first]")?.value.trim() || "",
    last_name: form.querySelector("[data-home-guest-last]")?.value.trim() || undefined,
    phone: form.querySelector("[data-home-guest-phone]")?.value || "",
    email: form.querySelector("[data-home-guest-email]")?.value.trim() || undefined,
    document_type: form.querySelector("[data-home-guest-doctype]")?.value || undefined,
    document: form.querySelector("[data-home-guest-doc]")?.value || undefined,
    type: "guest"
  });

  const validateGuest = (show = true) => {
    const guest = guestPayload();
    const targetNotice = activeStep === "guest" ? guestNotice : payNotice;
    clearNotice(guestNotice);
    clearNotice(payNotice);
    if (!guest.first_name) {
      if (show) showNotice(targetNotice, "Informe o nome do hóspede.");
      return false;
    }
    if (homeOnlyDigits(guest.phone).length < 10) {
      if (show) showNotice(targetNotice, "Informe um telefone válido com DDD.");
      return false;
    }
    if (guest.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guest.email)) {
      if (show) showNotice(targetNotice, "Informe um e-mail válido.");
      return false;
    }
    // Documento passou a ser obrigatório.
    const docValue = (guest.document || "").trim();
    if (!guest.document_type) {
      if (show) showNotice(targetNotice, "Escolha o tipo de documento: CPF ou Passaporte.");
      return false;
    }
    if (!docValue) {
      if (show) showNotice(targetNotice, "Informe o número do documento.");
      return false;
    }
    if (guest.document_type === "cpf" && !homeCpfValid(docValue)) {
      if (show) showNotice(targetNotice, "CPF inválido. Confira os números.");
      return false;
    }
    if (guest.document_type === "passport" && docValue.replace(/[^A-Za-z0-9]/g, "").length < 6) {
      if (show) showNotice(targetNotice, "Passaporte inválido. Informe ao menos 6 caracteres.");
      return false;
    }
    clearNotice(guestNotice);
    clearNotice(payNotice);
    return true;
  };

  const baseReservationPayload = () => {
    const rooms = state.selectedRooms.map((r) => ({ room_id: r.roomId, rateplan_id: r.rateplanId }));
    const primaryRoom = rooms[0];
    return {
      ...state.search,
      rooms,
      // Compatibilidade temporária com versões anteriores do backend no Railway.
      // O backend atual usa `rooms`; o legado espera estes campos na raiz.
      room_id: primaryRoom?.room_id,
      rateplan_id: primaryRoom?.rateplan_id,
      ask_si: getAskSi() || undefined,
      guest: guestPayload()
    };
  };

  const setPayMethod = (method) => {
    state.payMethod = method;
    form.querySelectorAll("[data-home-pay-method]").forEach((button) => {
      const active = button.dataset.homePayMethod === method;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    form.querySelectorAll("[data-home-pay-pane]").forEach((pane) => {
      pane.hidden = pane.dataset.homePayPane !== method;
    });
    if (!state.paymentBusy && paySubmit) paySubmit.disabled = false;
    if (paySubmitLabel) paySubmitLabel.textContent = method === "pix" ? "Gerar PIX" : "Pagar e reservar";
    initIcons();
  };

  /* Status de cada cobrança na confirmação. Com dois cartões o hóspede precisa
     ver as duas — inclusive se uma ficou pendente de captura, caso em que a
     reserva está garantida mas a pousada ainda vai concluir aquele lançamento. */
  const renderCharges = (payment) => {
    const box = form.querySelector("[data-home-success-charges]");
    if (!box) return;
    const charges = Array.isArray(payment?.charges) ? payment.charges : [];
    if (charges.length < 2) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false;
    box.innerHTML = `
      <p class="home-charges-title">Pagamento dividido em ${charges.length} cartões</p>
      ${charges.map((c) => `
        <div class="home-charge${c.status === "captured" ? "" : " is-pending"}">
          <span>Cartão ${c.card} · ${c.installments > 1 ? `${c.installments}x` : "à vista"}</span>
          <strong>${homeBrl(c.amount)}</strong>
          <small>${c.status === "captured" ? "Cobrança confirmada" : "Aguardando confirmação da operadora"}</small>
        </div>`).join("")}`;
    initIcons();
  };

  const renderSuccess = (data) => {
    stopPixPolling();
    setPayBusy(false, state.payMethod === "pix" ? "Gerar PIX" : "Pagar e reservar");
    const successId = form.querySelector("[data-home-success-id]");
    if (successId) {
      successId.textContent = data?.booking_id ? `Reserva nº ${data.booking_id}` : "Reserva confirmada.";
    }
    renderCharges(data?.payment);
    pushPurchaseEvent(data, state.selectedRooms);
    goToStep("done");
  };

  const showPix = (data) => {
    const result = form.querySelector("[data-home-pix-result]");
    const image = form.querySelector("[data-home-pix-img]");
    const code = form.querySelector("[data-home-pix-code]");
    const status = form.querySelector("[data-home-pix-status]");
    if (image) {
      if (data.qrImage) {
        image.src = data.qrImage.startsWith("data:") || /^https?:/.test(data.qrImage)
          ? data.qrImage
          : `data:image/png;base64,${data.qrImage}`;
      } else if (data.qrCode) {
        image.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(data.qrCode)}`;
      }
    }
    if (code) code.value = data.qrCode || "";
    if (result) result.hidden = false;
    if (status) status.textContent = "Aguardando confirmação do pagamento...";
    setPayBusy(true, "Aguardando PIX");

    stopPixPolling();
    const expiresInSec = Number(data.expiresInSec) || 15 * 60;
    state.pixExpiresAt = Date.now() + expiresInSec * 1000;
    const check = async () => {
      if (Date.now() >= state.pixExpiresAt) {
        stopPixPolling();
        setPayBusy(false, "Gerar novo PIX");
        if (status) status.textContent = "PIX expirado. Gere um novo código.";
        return;
      }
      try {
        const res = await fetch(`${HOME_API_BASE}/pix/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tid: data.tid })
        });
        const payload = await homeReadApiJson(res, "Não foi possível confirmar o PIX.");
        if (payload.status === "paid") renderSuccess(payload);
        if (payload.status === "expired" || payload.status === "canceled") {
          stopPixPolling();
          setPayBusy(false, "Gerar novo PIX");
          if (status) status.textContent = "PIX expirado. Gere um novo código.";
        }
      } catch (_) {
        // Keep polling; transient network errors should not break a pending PIX.
      }
    };
    state.pixPoll = window.setInterval(check, 4000);
    check();
  };

  const submitPix = async () => {
    setPayBusy(true, "Gerando PIX...");
    clearNotice(payNotice);
    try {
      const res = await fetch(`${HOME_API_BASE}/pix/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(baseReservationPayload())
      });
      const data = await homeReadApiJson(res, "Não foi possível gerar o PIX.");
      showPix(data);
    } catch (error) {
      setPayBusy(false, "Gerar PIX");
      showNotice(payNotice, error.message || "Não foi possível gerar o PIX.");
    }
  };

  /* Lê um bloco de cartão. Devolve null e avisa qual campo falta — com dois
     cartões na tela, dizer "cartão 2" evita o hóspede procurar o erro no lugar
     errado. */
  const readCardBlock = (block, index) => {
    const where = cardCount > 1 ? ` do cartão ${index + 1}` : "";
    const number = block.querySelector("[data-home-card-number]")?.value || "";
    const holderName = block.querySelector("[data-home-card-name]")?.value.trim() || "";
    const exp = block.querySelector("[data-home-card-exp]")?.value || "";
    const cvv = block.querySelector("[data-home-card-cvv]")?.value || "";
    const [mm, yy] = exp.split("/");
    if (homeOnlyDigits(number).length < 13 || !holderName || !mm || !yy || homeOnlyDigits(cvv).length < 3) {
      showNotice(payNotice, `Preencha os dados${where} para continuar.`);
      return null;
    }
    const card = {
      number: homeOnlyDigits(number),
      holderName,
      expirationMonth: Number(mm),
      expirationYear: Number(yy),
      securityCode: homeOnlyDigits(cvv),
      installments: Number(block.querySelector("[data-home-card-installments]")?.value || 1)
    };
    if (cardCount > 1) {
      const amount = parseBRL(amountInput(index + 1)?.value);
      if (!Number.isFinite(amount) || amount <= 0) {
        showNotice(payNotice, `Informe o valor a cobrar no cartão ${index + 1}.`);
        return null;
      }
      card.amount = amount;
    }
    return card;
  };

  /* ---------- pagamento parcial: um cartão passou, o outro não ---------- */
  let partialSession = null;

  const showPartial = (partial) => {
    partialSession = partial;
    const box = form.querySelector("[data-home-partial]");
    if (!box) return;
    box.hidden = false;
    // Esconde os formulários originais: a partir daqui só falta o valor pendente.
    cardBlocks().forEach((b) => { b.hidden = true; });
    const splitBox = form.querySelector("[data-home-split-summary]");
    if (splitBox) splitBox.hidden = true;
    const choice = form.querySelector(".home-split-choice");
    if (choice) choice.hidden = true;

    const setT = (sel, txt) => { const el = form.querySelector(sel); if (el) el.textContent = txt; };
    setT("[data-home-partial-head]", `O cartão ${partial.failedCard} não foi aprovado`);
    setT("[data-home-partial-reason]", partial.reason || "A operadora não autorizou a transação.");

    const status = form.querySelector("[data-home-partial-status]");
    if (status) {
      status.innerHTML = `
        ${(partial.approved || []).map((a) => `
          <div class="home-charge"><span>Cartão ${a.card} · ${a.installments > 1 ? `${a.installments}x` : "à vista"}</span>
          <strong>${homeBrl(a.amount)}</strong><small>Reservado, aguardando o restante</small></div>`).join("")}
        <div class="home-charge is-pending"><span>Falta pagar</span>
        <strong>${homeBrl(partial.pendingAmount)}</strong><small>Informe outro cartão abaixo</small></div>`;
    }

    // Parcelas recalculadas sobre o valor que ficou pendente.
    const select = form.querySelector("[data-home-retry-installments]");
    if (select) {
      select.innerHTML = "";
      for (let n = 1; n <= HOME_INSTALLMENTS_MAX; n += 1) {
        const o = document.createElement("option");
        o.value = String(n);
        o.textContent = n === 1
          ? `À vista - ${homeBrl(partial.pendingAmount)}`
          : `${n}x de ${homeBrl(partial.pendingAmount / n)} sem juros`;
        select.appendChild(o);
      }
    }

    const support = form.querySelector("[data-home-partial-support]");
    if (support) {
      const msg = `Olá! Tentei uma reserva no site e o cartão ${partial.failedCard} não foi aprovado. `
        + `Ficou um valor de ${homeBrl(partial.approved?.[0]?.amount || 0)} reservado no outro cartão `
        + `e gostaria de ajuda para concluir ou solicitar o estorno.`;
      support.href = `https://wa.me/5564984398408?text=${encodeURIComponent(msg)}`;
    }

    setPayBusy(false, "Pagar e reservar");
    initIcons();
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const hidePartial = () => {
    partialSession = null;
    const box = form.querySelector("[data-home-partial]");
    if (box) box.hidden = true;
    const choice = form.querySelector(".home-split-choice");
    if (choice) choice.hidden = false;
    setCardCount(cardCount);
  };

  const submitRetryCard = async () => {
    if (!partialSession) return;
    const block = form.querySelector("[data-home-retry-card]");
    const number = block.querySelector("[data-home-card-number]")?.value || "";
    const holderName = block.querySelector("[data-home-card-name]")?.value.trim() || "";
    const exp = block.querySelector("[data-home-card-exp]")?.value || "";
    const cvv = block.querySelector("[data-home-card-cvv]")?.value || "";
    const [mm, yy] = exp.split("/");
    if (homeOnlyDigits(number).length < 13 || !holderName || !mm || !yy || homeOnlyDigits(cvv).length < 3) {
      showNotice(payNotice, "Preencha os dados do novo cartão.");
      return;
    }
    setPayBusy(true, "Processando...");
    clearNotice(payNotice);
    try {
      const res = await fetch(`${HOME_API_BASE}/checkout/retry-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: partialSession.sessionId,
          card: {
            number: homeOnlyDigits(number),
            holderName,
            expirationMonth: Number(mm),
            expirationYear: Number(yy),
            securityCode: homeOnlyDigits(cvv),
            installments: Number(form.querySelector("[data-home-retry-installments]")?.value || 1)
          }
        })
      });
      const data = await homeReadApiJson(res, "Não foi possível concluir o pagamento.");
      hidePartial();
      renderSuccess(data);
    } catch (error) {
      setPayBusy(false, "Pagar e reservar");
      // Recusou de novo: a sessão continua viva, então mantém o painel aberto.
      showNotice(payNotice, error.message || "Não foi possível concluir o pagamento.");
      if (error.status === 410) hidePartial(); // sessão expirou — recomeçar
    }
  };

  const cancelPartial = async () => {
    if (!partialSession) return;
    setPayBusy(true, "Liberando...");
    try {
      const res = await fetch(`${HOME_API_BASE}/checkout/cancel-split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: partialSession.sessionId })
      });
      const data = await homeReadApiJson(res, "Não foi possível liberar o valor.");
      showNotice(payNotice, data.released
        ? "Valor liberado. Nenhuma cobrança foi feita — você pode tentar novamente."
        : "Não conseguimos liberar automaticamente. Fale com o suporte pelo WhatsApp para regularizar.");
    } catch (error) {
      showNotice(payNotice, error.message || "Não foi possível liberar o valor. Fale com o suporte.");
    } finally {
      setPayBusy(false, "Pagar e reservar");
      hidePartial();
    }
  };

  const submitCard = async () => {
    // Com dois cartões, o botão avança as etapas e só paga na última.
    if (cardCount === 2 && cardStep !== "2") {
      if (cardStep === "amounts") {
        if (updateSplitSummary() !== true) {
          showNotice(payNotice, "Ajuste os valores para somar exatamente o total da reserva.");
          return;
        }
        clearNotice(payNotice);
        buildInstallments(cartTotal()); // parcelas recalculadas sobre cada valor
        goToCardStep("1");
        return;
      }
      if (cardStep === "1") {
        if (!readCardBlock(cardBlocks()[0], 0)) return;
        clearNotice(payNotice);
        goToCardStep("2");
        return;
      }
    }

    const blocks = activeBlocks();
    const cards = [];
    for (let i = 0; i < blocks.length; i += 1) {
      const card = readCardBlock(blocks[i], i);
      if (!card) return;
      cards.push(card);
    }
    // Trava final da divisão. O servidor confere de novo contra o preço
    // autoritativo do Artax — esta aqui só evita a viagem à toa.
    if (cardCount > 1 && updateSplitSummary() !== true) {
      showNotice(payNotice, "Ajuste os valores dos cartões para somar exatamente o total da reserva.");
      return;
    }
    setPayBusy(true, "Processando...");
    clearNotice(payNotice);
    try {
      const res = await fetch(`${HOME_API_BASE}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...baseReservationPayload(),
          installments: cards[0].installments,
          cards
        })
      });
      const data = await homeReadApiJson(res, "Não foi possível concluir o pagamento.");
      renderSuccess(data);
    } catch (error) {
      setPayBusy(false, "Pagar e reservar");
      // Um cartão passou e o outro não: abre a troca em vez de perder tudo.
      if (error.partial?.sessionId) {
        showNotice(payNotice, error.message || "Um dos cartões não foi aprovado.");
        showPartial(error.partial);
        return;
      }
      showNotice(payNotice, error.message || "Não foi possível concluir o pagamento.");
    }
  };

  const handleNavigation = async (target) => {
    clearNotice(payNotice);
    if (target === "guests" && (!arrivalInput.value || !departureInput.value)) {
      goToStep("dates");
      hint.innerHTML = "Selecione check-in e check-out para continuar.";
      return;
    }
    if (target === "rooms") {
      await fetchAvailability();
      return;
    }
    if (target === "guest" && !state.selectedRooms.length) {
      goToStep("rooms");
      showNotice(notice, "Selecione ao menos uma acomodação para continuar.");
      return;
    }
    if (target === "guest") buildInstallments(cartTotal());
    if (target === "payment") {
      if (!state.selectedRooms.length) {
        goToStep("rooms");
        showNotice(notice, "Selecione ao menos uma acomodação para continuar.");
        return;
      }
      if (!validateGuest(true)) {
        goToStep("guest");
        return;
      }
      goToStep("payment");
      return;
    }
    goToStep(target);
  };

  form.querySelector("[data-home-cal-prev]")?.addEventListener("click", () => {
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    renderCalendar();
  });

  form.querySelector("[data-home-cal-next]")?.addEventListener("click", () => {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    renderCalendar();
  });

  inField?.addEventListener("click", () => { selecting = "in"; syncCalendar(); });
  outField?.addEventListener("click", () => { if (arrival) selecting = "out"; syncCalendar(); });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-home-day]");
    if (!button || button.disabled) return;
    const date = parseLocalDate(button.dataset.homeDay);
    if (!date) return;

    if (selecting === "in" || !arrival || (arrival && departure)) {
      arrival = date;
      if (departure && departure <= arrival) departure = null;
      selecting = "out";
    } else if (date <= arrival) {
      arrival = date;
      departure = null;
      selecting = "out";
    } else {
      departure = date;
      selecting = "out";
    }

    resetAvailability();
    renderCalendar();
  });

  grid.addEventListener("pointerover", (event) => {
    const button = event.target.closest("[data-home-day]");
    if (!button || selecting !== "out" || !arrival || departure) return;
    const hover = parseLocalDate(button.dataset.homeDay);
    if (!hover || hover <= arrival) return;
    grid.querySelectorAll("[data-home-day]").forEach((dayButton) => {
      const date = parseLocalDate(dayButton.dataset.homeDay);
      dayButton.classList.toggle("is-preview", date > arrival && date <= hover);
    });
  });

  grid.addEventListener("pointerleave", () => {
    grid.querySelectorAll(".is-preview").forEach((button) => button.classList.remove("is-preview"));
  });

  form.querySelectorAll("[data-home-stepper]").forEach((stepper) => {
    const input = stepper.querySelector("input");
    const min = Number(stepper.dataset.min || 0);
    const max = Number(stepper.dataset.max || 99);
    const set = (value) => {
      input.value = String(Math.max(min, Math.min(max, value)));
      if (input === kidsInput) buildAges();
      resetAvailability();
      updateReview();
    };
    stepper.querySelector("[data-home-dec]")?.addEventListener("click", () => set(Number(input.value) - 1));
    stepper.querySelector("[data-home-inc]")?.addEventListener("click", () => set(Number(input.value) + 1));
  });

  roomList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-home-room-select]");
    if (!button) return;
    const room = state.rooms[Number(button.dataset.homeRoomSelect)];
    if (room) toggleRoomSelection(room);
  });

  form.querySelectorAll("[data-home-next], [data-home-prev], [data-home-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.homeNext || button.dataset.homePrev || button.dataset.homeTab;
      // Dentro do pagamento dividido, "Voltar" recua uma etapa do cartão antes
      // de sair para a etapa de dados — senão o hóspede perderia o que digitou.
      if (target === "guest" && payMethodIsCard() && cardCount === 2 && cardStep !== "amounts") {
        clearNotice(payNotice);
        goToCardStep(cardStep === "2" ? "1" : "amounts");
        return;
      }
      handleNavigation(target);
    });
  });

  form.querySelectorAll("[data-home-pay-method]").forEach((button) => {
    button.addEventListener("click", () => setPayMethod(button.dataset.homePayMethod));
  });

  // Um ou dois cartões
  form.querySelectorAll("[data-home-cards]").forEach((button) => {
    button.addEventListener("click", () => setCardCount(Number(button.dataset.homeCards)));
  });
  // Digitou o valor de um cartão, o outro completa o restante sozinho. Vale nos
  // dois sentidos: dá na mesma começar pelo cartão 1 ou pelo 2.
  // `syncingAmounts` evita o laço infinito — preencher o outro campo dispara o
  // "input" dele, que tentaria preencher este de volta.
  let syncingAmounts = false;
  form.querySelectorAll("[data-home-split-amount]").forEach((input) => {
    input.addEventListener("input", () => {
      if (!syncingAmounts && cardCount === 2) {
        const other = [amountInput(1), amountInput(2)].find((el) => el && el !== input);
        const typed = parseBRL(input.value);
        if (other && Number.isFinite(typed)) {
          // Passou do total: zera o outro em vez de mostrar valor negativo — o
          // aviso de "a soma passa R$ X" explica o que corrigir.
          const restCents = Math.max(0, toCents(cartTotal()) - toCents(typed));
          syncingAmounts = true;
          other.value = (restCents / 100).toFixed(2).replace(".", ",");
          syncingAmounts = false;
        }
      }
      updateSplitSummary();
      cardBlocks().forEach((b) => buildInstallmentsFor(b, cartTotal()));
    });
  });
  // Pagamento parcial: trocar o cartão recusado ou desistir.
  form.querySelector("[data-home-retry-submit]")?.addEventListener("click", submitRetryCard);
  form.querySelector("[data-home-partial-cancel]")?.addEventListener("click", cancelPartial);

  form.querySelector("[data-home-pix-copy]")?.addEventListener("click", async () => {
    const code = form.querySelector("[data-home-pix-code]")?.value || "";
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      const status = form.querySelector("[data-home-pix-status]");
      if (status) status.textContent = "Código PIX copiado.";
    } catch (_) {
      showNotice(payNotice, "Não foi possível copiar automaticamente.");
    }
  });

  form.querySelector("[data-home-guest-phone]")?.addEventListener("input", (event) => {
    let value = homeOnlyDigits(event.target.value).slice(0, 11);
    if (value.length > 10) value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
    else if (value.length > 6) value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    else if (value.length > 2) value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    else if (value.length > 0) value = value.replace(/^(\d{0,2})/, "($1");
    event.target.value = value;
  });

  // Tipo de documento em cards (CPF / Passaporte). O <input> oculto
  // [data-home-guest-doctype] segue sendo a fonte da verdade — o payload, a
  // máscara e a validação continuam lendo dele.
  const docHidden = form.querySelector("[data-home-guest-doctype]");
  const docInput = form.querySelector("[data-home-guest-doc]");
  // O placeholder repete o tipo escolhido, para o hóspede não perder de vista
  // qual documento está digitando enquanto olha só para o campo. Sem tipo, o
  // campo fica bloqueado — digitar antes de escolher só levaria a apagar tudo
  // depois, já que os formatos são incompatíveis.
  const syncDocMode = () => {
    if (!docInput) return;
    const type = docHidden?.value || "";
    if (!type) {
      docInput.value = "";
      docInput.disabled = true;
      docInput.placeholder = "Selecione o documento acima";
      return;
    }
    const passport = type === "passport";
    docInput.disabled = false;
    docInput.inputMode = passport ? "text" : "numeric";
    docInput.autocapitalize = passport ? "characters" : "off";
    docInput.placeholder = passport ? "Passaporte · AB123456" : "CPF · 000.000.000-00";
  };
  form.querySelectorAll("[data-home-doctype]").forEach((card) => {
    card.addEventListener("click", () => {
      const type = card.dataset.homeDoctype;
      if (!docHidden) return;
      const changed = docHidden.value !== type;
      docHidden.value = type;
      form.querySelectorAll("[data-home-doctype]").forEach((other) => {
        const on = other.dataset.homeDoctype === type;
        other.classList.toggle("is-active", on);
        other.setAttribute("aria-checked", String(on));
      });
      // Formatos incompatíveis: trocar de tipo limpa o que já estava digitado.
      if (changed && docInput) docInput.value = "";
      syncDocMode();
    });
  });
  syncDocMode();

  form.querySelector("[data-home-guest-doc]")?.addEventListener("input", (event) => {
    const type = form.querySelector("[data-home-guest-doctype]")?.value;
    if (type === "passport") {
      event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);
      return;
    }
    if (type === "cpf") {
      event.target.value = homeOnlyDigits(event.target.value)
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      return;
    }
    event.target.value = homeOnlyDigits(event.target.value).slice(0, 14);
  });

  // querySelectorAll: com dois blocos de cartão na tela, o singular deixaria o
  // segundo sem máscara nenhuma.
  form.querySelectorAll("[data-home-card-number]").forEach((el) => el.addEventListener("input", (event) => {
    const value = homeOnlyDigits(event.target.value).slice(0, 19);
    event.target.value = value.replace(/(.{4})/g, "$1 ").trim();
  }));
  form.querySelectorAll("[data-home-card-exp]").forEach((el) => el.addEventListener("input", (event) => {
    let value = homeOnlyDigits(event.target.value).slice(0, 4);
    if (value.length >= 3) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    event.target.value = value;
  }));
  form.querySelectorAll("[data-home-card-cvv]").forEach((el) => el.addEventListener("input", (event) => {
    event.target.value = homeOnlyDigits(event.target.value).slice(0, 4);
  }));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.search) {
      fetchAvailability();
      return;
    }
    if (!state.selectedRooms.length) {
      goToStep("rooms");
      showNotice(notice, "Selecione ao menos uma acomodação para continuar.");
      return;
    }
    if (!validateGuest(true)) {
      goToStep("guest");
      return;
    }
    // O formulário é único para as 5 etapas, então Enter em qualquer input das
    // etapas anteriores dispara a submissão implícita do browser e caía direto
    // aqui: a cobrança PIX era criada silenciosamente (o showPix revela o
    // resultado dentro do painel de pagamento, que ainda estava oculto) e o QR
    // já aparecia pronto quando o hóspede enfim abria a etapa — gastando uma
    // cobrança real, com expiração correndo antes da hora. Pagamento só é
    // disparado a partir da própria etapa de pagamento; nas outras, Enter
    // apenas avança, como o botão "Continuar".
    if (activeStep !== "payment") {
      handleNavigation("payment");
      return;
    }
    if (state.payMethod === "pix") submitPix();
    else submitCard();
  });

  window.CZHomeBooking = {
    // Usado tanto por widgets internos quanto pelo deep-link de parceiros
    // (ex.: Asksuite) — ver initDeepLinkBooking(). Quando check-in e check-out
    // já vêm preenchidos, pula direto pra disponibilidade (etapa "rooms").
    prefill({ arrival: inValue, departure: outValue, adults, kids, ages } = {}) {
      const parsedIn = parseLocalDate(inValue);
      const parsedOut = parseLocalDate(outValue);
      if (parsedIn) arrival = parsedIn;
      if (parsedOut && (!parsedIn || parsedOut > parsedIn)) departure = parsedOut;
      if (adultsInput && adults) adultsInput.value = String(Math.max(1, Math.min(9, Number(adults) || 2)));
      if (kidsInput && kids != null) {
        kidsInput.value = String(Math.max(0, Math.min(6, Number(kids) || 0)));
        buildAges();
        if (Array.isArray(ages)) {
          form.querySelectorAll("[data-home-age]").forEach((input, index) => {
            if (ages[index] != null) input.value = String(Math.max(0, Math.min(17, Number(ages[index]) || 0)));
          });
        }
      }
      selecting = departure ? "out" : "in";
      view = new Date((arrival || today).getFullYear(), (arrival || today).getMonth(), 1);
      renderCalendar();
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      if (arrival && departure) {
        fetchAvailability();
      } else {
        resetAvailability();
        goToStep("dates");
      }
    }
  };

  buildAges();
  renderCalendar();
  setPayMethod("pix");
  goToStep("dates", false);
};

const initMobileFloatingControls = () => {
  const root = document.querySelector(".mobile-float-nav");
  const menuToggle = document.querySelector("[data-mobile-menu-toggle]");
  const bookingToggle = document.querySelector("[data-mobile-booking-toggle]");
  const menu = document.querySelector("[data-mobile-float-menu]");
  const booking = document.querySelector("[data-mobile-booking-form]");
  const reserveSection = document.querySelector("#reservar");

  if (!root || !menuToggle || !bookingToggle || !menu || !booking) return;

  const closeMenu = () => {
    menu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
  };

  const closeBooking = () => {
    booking.hidden = true;
    bookingToggle.setAttribute("aria-expanded", "false");
    bookingToggle.setAttribute("aria-label", "Abrir calendário de reserva");
  };

  menuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = !menu.classList.contains("is-open");
    closeBooking();
    menu.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  });

  bookingToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = booking.hidden;
    closeMenu();
    booking.hidden = !isOpen;
    bookingToggle.setAttribute("aria-expanded", String(isOpen));
    bookingToggle.setAttribute("aria-label", isOpen ? "Fechar calendário de reserva" : "Abrir calendário de reserva");
    if (isOpen) {
      booking.querySelector("input")?.focus({ preventScroll: true });
    }
  });

  menu.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!root.contains(event.target)) {
      closeMenu();
      closeBooking();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      closeBooking();
    }
  });

  // Só revela os botões flutuantes depois de sair do hero.
  const hero = document.querySelector(".hero");
  const updateReveal = () => {
    const threshold = hero ? hero.offsetHeight - 160 : window.innerHeight * 0.7;
    const revealed = window.scrollY > Math.max(120, threshold);
    const reserveVisible = reserveSection
      ? (() => {
          const rect = reserveSection.getBoundingClientRect();
          return rect.top < window.innerHeight * 0.82 && rect.bottom > window.innerHeight * 0.2;
        })()
      : false;

    root.classList.toggle("is-revealed", revealed && !reserveVisible);
    if (!revealed || reserveVisible) { closeMenu(); closeBooking(); }
  };
  updateReveal();
  window.addEventListener("scroll", updateReveal, { passive: true });
  window.addEventListener("resize", updateReveal, { passive: true });
};

const initHeroSlider = () => {
  const slides = Array.from(document.querySelectorAll("[data-hero-slider] .hero-slide"));
  const eyebrow = document.querySelector("[data-hero-eyebrow]");
  const title = document.querySelector("[data-hero-title]");
  const copy = document.querySelector("[data-hero-copy]");
  const progress = document.querySelector("[data-hero-progress]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!slides.length) return;

  if (progress) {
    progress.innerHTML = slides.map((_, index) => `<button type="button" aria-label="Ver slide ${index + 1}" data-hero-go="${index}"></button>`).join("");
  }

  // As fotos além da primeira só têm data-src no HTML (não competem com o
  // conteúdo crítico do primeiro paint). Carrega elas depois que a página
  // termina de carregar, com folga antes de entrarem no rodízio.
  const hydrateSlides = () => {
    slides.forEach((slide) => {
      if (slide.dataset.src && !slide.src) slide.src = slide.dataset.src;
    });
  };
  if (document.readyState === "complete") hydrateSlides();
  else window.addEventListener("load", hydrateSlides, { once: true });

  let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
  if (activeIndex < 0) activeIndex = 0;

  const showSlide = (nextIndex) => {
    const next = slides[nextIndex];
    if (!next) return;
    slides[activeIndex]?.classList.remove("is-active");
    activeIndex = nextIndex;
    next.classList.add("is-active");
    const text = document.querySelector(".hero-text");
    text?.classList.add("is-changing");
    window.setTimeout(() => {
      if (eyebrow) eyebrow.textContent = next.dataset.eyebrow || "Casa Zanotto";
      if (title) title.textContent = next.dataset.title || "Pousada Casa Zanotto";
      if (copy) copy.textContent = next.dataset.copy || "";
      text?.classList.remove("is-changing");
      fitOneLineTitles();
    }, reduceMotion ? 0 : 130);
    progress?.querySelectorAll("button").forEach((button, index) => {
      button.classList.toggle("is-active", index === activeIndex);
      button.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    });
  };

  showSlide(activeIndex);
  progress?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-hero-go]");
    if (button) showSlide(Number(button.dataset.heroGo));
  });

  if (slides.length < 2 || reduceMotion) return;

  const showNext = () => {
    showSlide((activeIndex + 1) % slides.length);
  };

  let timer = window.setInterval(showNext, 5200);

  document.addEventListener("visibilitychange", () => {
    window.clearInterval(timer);
    if (!document.hidden) {
      timer = window.setInterval(showNext, 5200);
    }
  });
};

const getGalleryCategory = (file, index) => {
  const fileNumber = Number(file.slice(0, 2));
  if ([6, 14, 15, 16, 17, 18, 19, 74, 75, 81, 85].includes(fileNumber)) return "food";
  if ([1, 8, 13, 20, 21, 86, 87].includes(fileNumber)) return "facade";
  if ([4, 5, 55, 56, 57, 58, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 76, 77, 78, 79, 80, 82, 83, 84].includes(fileNumber)) {
    return "leisure";
  }
  if (/Apartamento|IMG_24|IMG_278/i.test(file)) return "rooms";
  return index % 2 === 0 ? "details" : "leisure";
};

const getGalleryTitle = (category, index) => {
  const titles = {
    rooms: "Acomodação Casa Zanotto",
    leisure: "Lazer e jardins",
    food: "Café da manhã",
    facade: "Pousada e Centro Histórico",
    details: "Detalhes da estadia"
  };
  return `${titles[category]} ${String(index + 1).padStart(2, "0")}`;
};

const buildGalleryItems = () =>
  galleryFiles.map((file, index) => {
    const category = getGalleryCategory(file, index);
    return {
      src: `assets/gallery/${file}`,
      category,
      title: getGalleryTitle(category, index),
      label: galleryCategoryLabels[category],
      alt: `${getGalleryTitle(category, index)} na Pousada Casa Zanotto`
    };
  });

/* Carrossel diagonal da galeria (filtros por categoria + avançar/voltar). */
const initGalleryCarousel = () => {
  const track = document.querySelector("[data-dgc-track]");
  const nav = document.querySelector("[data-dgc-nav]");
  const prevBtn = document.querySelector("[data-dgc-prev]");
  const nextBtn = document.querySelector("[data-dgc-next]");
  const filters = Array.from(document.querySelectorAll("[data-gallery-filter]"));
  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const closeButton = document.querySelector("[data-lightbox-close]");
  const prevL = document.querySelector("[data-lightbox-prev]");
  const nextL = document.querySelector("[data-lightbox-next]");

  if (!track || !nav || !prevBtn || !nextBtn) return;

  const STEP = 28; // graus por card
  const OFFSET = 48; // % de deslocamento vertical por card
  // Sem filtros: todas as fotos embaralhadas, passando aleatoriamente.
  const items = buildGalleryItems()
    .map((item) => ({ item, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(({ item }) => item);
  let activeFilter = "all";
  let current = [];
  let index = 0;

  const getFiltered = () => items;

  const renderNav = () => {
    if (current.length <= 14) {
      nav.classList.remove("is-counter");
      nav.innerHTML = current
        .map((_, i) => `<button class="dgc-dot" type="button" data-dot="${i}" aria-label="Foto ${i + 1}"></button>`)
        .join("");
    } else {
      nav.classList.add("is-counter");
      nav.innerHTML = `<span data-counter></span>`;
    }
  };

  const update = () => {
    const slides = Array.from(track.children);
    const n = current.length || 1;
    track.style.transform = `translateX(${(-index * 100) / n}%)`;
    slides.forEach((slide, i) => {
      const d = i - index;
      const active = i === index;
      slide.style.transform = `translateY(${d * OFFSET}%) rotate(${d * STEP}deg) scale(${active ? 1 : 0.6})`;
      slide.style.zIndex = String(active ? 50 : Math.max(0, 20 - Math.abs(d)));
      slide.classList.toggle("is-active", active);
    });
    if (nav.classList.contains("is-counter")) {
      const counter = nav.querySelector("[data-counter]");
      if (counter) counter.textContent = `${index + 1} / ${current.length}`;
    } else {
      nav.querySelectorAll(".dgc-dot").forEach((dot, i) => dot.classList.toggle("is-active", i === index));
    }
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= current.length - 1;
  };

  const go = (i) => {
    index = Math.max(0, Math.min(current.length - 1, i));
    update();
  };

  const renderTrack = () => {
    current = getFiltered();
    track.innerHTML = current
      .map(
        (item, i) =>
          `<div class="dgc-slide" data-i="${i}"><img src="${item.src}" alt="${item.alt}" loading="lazy" draggable="false"></div>`
      )
      .join("");
    index = current.length ? Math.min(Math.floor(current.length / 2), current.length - 1) : 0;
    renderNav();
    update();
  };

  // Lightbox (sem legenda).
  const openLightbox = (i) => {
    if (!lightbox || !lightboxImage) return;
    index = i;
    const item = current[index];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    closeButton?.focus();
  };
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    lightboxImage.src = "";
  };
  const moveLightbox = (dir) => {
    go(index + dir);
    openLightbox(index);
  };

  prevBtn.addEventListener("click", () => go(index - 1));
  nextBtn.addEventListener("click", () => go(index + 1));

  nav.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-dot]");
    if (dot) go(Number(dot.dataset.dot));
  });

  track.addEventListener("click", (event) => {
    const slide = event.target.closest(".dgc-slide");
    if (!slide) return;
    const i = Number(slide.dataset.i);
    if (i === index) openLightbox(index);
    else go(i);
  });

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.galleryFilter || "all";
      filters.forEach((filter) => filter.classList.toggle("is-active", filter === button));
      renderTrack();
    });
  });

  // Swipe no toque.
  let startX = 0;
  track.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  closeButton?.addEventListener("click", closeLightbox);
  prevL?.addEventListener("click", () => moveLightbox(-1));
  nextL?.addEventListener("click", () => moveLightbox(1));
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  window.addEventListener("keydown", (event) => {
    if (lightbox && !lightbox.hidden) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") moveLightbox(-1);
      if (event.key === "ArrowRight") moveLightbox(1);
    }
  });

  renderTrack();
};

const initYear = () => {
  const year = document.querySelector("[data-year]");
  if (year) {
    year.textContent = new Date().getFullYear();
  }
};

const fitOneLineTitle = (title) => {
  if (!(title instanceof HTMLElement)) return;

  title.style.fontSize = "";
  const computed = window.getComputedStyle(title);
  const baseSize = parseFloat(computed.fontSize) || 24;
  const minSize = title.matches("h1") ? 24 : title.matches("h2") ? 10 : 12;
  const available = Math.max(1, title.clientWidth || title.parentElement?.clientWidth || window.innerWidth);

  title.style.fontSize = `${baseSize}px`;

  let size = baseSize;
  while (title.scrollWidth > available + 1 && size > minSize) {
    size -= 1;
    title.style.fontSize = `${size}px`;
  }

  if (title.scrollWidth > available + 1) {
    const ratio = available / title.scrollWidth;
    title.style.fontSize = `${Math.max(10, Math.floor(size * ratio))}px`;
  }
};

const fitOneLineTitles = () => {
  requestAnimationFrame(() => {
    document.querySelectorAll("h1, h2, h3").forEach(fitOneLineTitle);
  });
};

const initOneLineTitles = () => {
  fitOneLineTitles();
  if (document.fonts?.ready) {
    document.fonts.ready.then(fitOneLineTitles).catch(() => {});
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(fitOneLineTitles, 120);
  }, { passive: true });
};

/* Pointer-follow spotlight + subtle tilt on premium cards. */
const initCardInteractions = () => {
  const spotlightCards = document.querySelectorAll(
    ".hero-hook, .promise-card, .suite-card, .ritual-panel, .review-grid blockquote, .feature-band, .reserve-shell, .contact-panel a, .faq-list details"
  );

  spotlightCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduceMotion || !finePointer) return;

  const tiltCards = document.querySelectorAll(".suite-card");
  tiltCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--tilt-x", `${(-py * 4).toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${(px * 4).toFixed(2)}deg`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
};

let revealObserver;

const observeRevealItems = (nodes) => {
  const elements = Array.from(nodes).filter((node) => node instanceof HTMLElement);
  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
  }

  elements.forEach((element) => revealObserver.observe(element));
};

const initScrollAnimations = () => {
  const selectors = [
    ".booking-band",
    ".hero-hook",
    ".showcase-section",
    ".section-heading",
    ".promise-row article",
    ".story-media",
    ".story-copy",
    ".ritual-panel",
    ".suite-card",
    ".feature-band",
    ".review-grid blockquote",
    ".faq-list details",
    ".contact-section",
    ".reserve-shell",
    ".map-section"
  ];

  const elements = document.querySelectorAll(selectors.join(","));
  elements.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${(index % 6) * 55}ms`);
  });
  observeRevealItems(elements);
};

const initHeaderState = () => {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  const update = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
};

/* ----------------------------------------------------------------------------
   Acomodações — cards com carrossel de fotos por tipo (fotos em assets/rooms).
---------------------------------------------------------------------------- */
const accommodations = [
  {
    slug: "gold-master", name: "Suíte Gold Master", count: 8, tag: "Premium",
    desc: "A acomodação mais especial para comemorar, com o máximo de requinte."
  },
  {
    slug: "gold", name: "Suíte Gold", count: 8, tag: "Varanda · Vista verde",
    desc: "Mais espaço e varanda privativa. Ideal para casal, triplo ou quádruplo."
  },
  {
    slug: "standard", name: "Suíte Standard", count: 15, tag: "Casal · Triplo",
    desc: "Conforto essencial com ar-condicionado, TV Smart, frigobar e enxoval premium."
  },
  {
    slug: "bangalo", name: "Bangalô Colonial", count: 14, tag: "Charme colonial",
    desc: "Privacidade e charme colonial em meio ao jardim, perfeito para casais."
  }
];

const setupCardCarousel = (card) => {
  const track = card.querySelector("[data-rc-track]");
  if (!track) return;
  const slides = Array.from(track.children);
  const dots = Array.from(card.querySelectorAll("[data-dot]"));
  let idx = 0;

  const setActive = (i) => {
    idx = Math.max(0, Math.min(slides.length - 1, i));
    dots.forEach((d, di) => d.classList.toggle("is-active", di === idx));
  };
  const go = (i) => {
    setActive(i);
    track.scrollTo({ left: slides[idx].offsetLeft, behavior: "smooth" });
  };

  card.querySelector("[data-rc-prev]")?.addEventListener("click", () => go(idx - 1));
  card.querySelector("[data-rc-next]")?.addEventListener("click", () => go(idx + 1));
  dots.forEach((d, i) => d.addEventListener("click", () => go(i)));

  let raf;
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      slides.forEach((s, i) => {
        const c = s.offsetLeft + s.offsetWidth / 2;
        const d = Math.abs(c - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setActive(best);
    });
  }, { passive: true });
};

const initRooms = () => {
  const container = document.querySelector("[data-rooms]");
  if (!container) return;

  container.innerHTML = accommodations
    .map((room) => {
      const slides = Array.from({ length: room.count }, (_, i) => {
        const src = `assets/rooms/${room.slug}/${String(i + 1).padStart(2, "0")}.webp`;
        return `<img src="${src}" alt="${room.name}, foto ${i + 1}" loading="lazy" draggable="false">`;
      }).join("");
      const dots = Array.from({ length: room.count }, (_, i) =>
        `<button type="button" class="rc-dot${i === 0 ? " is-active" : ""}" data-dot="${i}" aria-label="Foto ${i + 1}"></button>`
      ).join("");
      return `
      <article class="room-card" data-room-card>
        <div class="room-card-media">
          <div class="rc-track" data-rc-track>${slides}</div>
          <span class="room-card-tag">${room.tag}</span>
          <button class="rc-arrow rc-prev" type="button" data-rc-prev aria-label="Foto anterior"><i data-lucide="chevron-left" aria-hidden="true"></i></button>
          <button class="rc-arrow rc-next" type="button" data-rc-next aria-label="Próxima foto"><i data-lucide="chevron-right" aria-hidden="true"></i></button>
          <div class="rc-dots">${dots}</div>
        </div>
        <div class="room-card-body">
          <h3>${room.name}</h3>
          <p>${room.desc}</p>
          <div class="room-card-foot">
            <span class="room-card-count"><i data-lucide="images" aria-hidden="true"></i> ${room.count} fotos</span>
            <a class="button button-primary" href="#reservar">
              <i data-lucide="calendar-check" aria-hidden="true"></i> Reservar
            </a>
          </div>
        </div>
      </article>`;
    })
    .join("");

  container.querySelectorAll("[data-room-card]").forEach(setupCardCarousel);
  initIcons();
};

/* Estrutura & Lazer — cards de Café da manhã e Hidromassagem (mesmo carrossel). */
const amenities = [
  {
    slug: "cafe", name: "Café da manhã", count: 4, tag: "Incluso",
    desc: "Pães, bolos, frutas, itens artesanais e sabores de casa para começar bem o dia."
  },
  {
    slug: "hidro", name: "Hidromassagem", count: 3, tag: "Aquecida",
    desc: "Água aquecida para relaxar a qualquer hora, em meio ao verde e ao silêncio."
  }
];

const initAmenities = () => {
  const container = document.querySelector("[data-amenities]");
  if (!container) return;

  container.innerHTML = amenities
    .map((a) => {
      const slides = Array.from({ length: a.count }, (_, i) =>
        `<img src="assets/${a.slug}/${String(i + 1).padStart(2, "0")}.webp" alt="${a.name}, foto ${i + 1}" loading="lazy" draggable="false">`
      ).join("");
      const dots = Array.from({ length: a.count }, (_, i) =>
        `<button type="button" class="rc-dot${i === 0 ? " is-active" : ""}" data-dot="${i}" aria-label="Foto ${i + 1}"></button>`
      ).join("");
      return `
      <article class="room-card" data-room-card>
        <div class="room-card-media">
          <div class="rc-track" data-rc-track>${slides}</div>
          <span class="room-card-tag">${a.tag}</span>
          <button class="rc-arrow rc-prev" type="button" data-rc-prev aria-label="Foto anterior"><i data-lucide="chevron-left" aria-hidden="true"></i></button>
          <button class="rc-arrow rc-next" type="button" data-rc-next aria-label="Próxima foto"><i data-lucide="chevron-right" aria-hidden="true"></i></button>
          <div class="rc-dots">${dots}</div>
        </div>
        <div class="room-card-body">
          <h3>${a.name}</h3>
          <p>${a.desc}</p>
          <div class="room-card-foot">
            <span class="room-card-count"><i data-lucide="images" aria-hidden="true"></i> ${a.count} fotos</span>
            <a class="button button-primary" href="#reservar">
              <i data-lucide="calendar-check" aria-hidden="true"></i> Reservar
            </a>
          </div>
        </div>
      </article>`;
    })
    .join("");

  container.querySelectorAll("[data-room-card]").forEach(setupCardCarousel);
  initIcons();
};

/* Checkout embutido: ajusta a altura do iframe e acompanha a troca de etapas. */
const initReserveEmbed = () => {
  const frame = document.querySelector("[data-reserve-frame]");
  if (!frame) return;
  let lastStep = 1;
  window.addEventListener("message", (event) => {
    const d = event.data || {};
    if (d.cz === "height" && typeof d.value === "number") {
      frame.style.height = `${Math.max(560, d.value)}px`;
    }
    if (d.cz === "step" && typeof d.value === "number") {
      if (d.value > 1 && d.value !== lastStep) {
        const top = frame.getBoundingClientRect().top + window.scrollY - 84;
        window.scrollTo({ top, behavior: "smooth" });
      }
      lastStep = d.value;
    }
  });
};

/* Identificador de sessão da Asksuite (_askSI) — presente no link direto que
   a IA deles gera. Guardado em sessionStorage pra sobreviver às etapas do
   motor de reservas e ser enviado no /api/checkout e /api/pix/create,
   permitindo à Asksuite vincular a compra ao atendimento (pedido do
   Felippe, 17/08/2026). */
const CZ_ASK_SI_KEY = "cz_ask_si";
const captureAskSi = () => {
  try {
    const p = new URLSearchParams(location.search);
    const askSi = p.get("_askSI") || p.get("_askSi") || p.get("askSI");
    if (askSi) sessionStorage.setItem(CZ_ASK_SI_KEY, askSi);
  } catch (_) {
    /* sessionStorage indisponível (modo privado etc.) — segue sem rastreio */
  }
};
const getAskSi = () => {
  try {
    return sessionStorage.getItem(CZ_ASK_SI_KEY) || "";
  } catch (_) {
    return "";
  }
};

/* Deep-link (ex.: parceiros como a Asksuite): se a URL trouxer check-in/
   check-out, prefila o motor de reservas da home e já busca a disponibilidade.
   Mesmos nomes de parâmetro aceitos pelo site (arrival_date/entrada, etc.). */
const initDeepLinkBooking = () => {
  captureAskSi();
  const p = new URLSearchParams(location.search);
  const arrival = p.get("arrival_date") || p.get("entrada");
  const departure = p.get("departure_date") || p.get("saida");
  if (!arrival || !departure) return;
  const adults = p.get("adults") || p.get("hospedes");
  const kids = p.get("kids") || p.get("children");
  const ages = [...p.entries()]
    .filter(([key]) => /^ages\[\d+\]$/.test(key) || key === "ages[]")
    .map(([key, value], index) => ({
      index: key === "ages[]" ? index : Number(key.match(/\d+/)?.[0] || index),
      value
    }))
    .sort((a, b) => a.index - b.index)
    .map((item) => item.value);
  window.CZHomeBooking?.prefill({ arrival, departure, adults, kids, ages });
};

/* Links "Reservar" do cabeçalho/CTAs (href="#reservar") usam salto nativo do
   navegador, que sempre alinha pelo topo — sem isso, ficava inconsistente
   com o resto do fluxo, que centraliza o formulário na tela. */
const initReserveLinks = () => {
  const links = document.querySelectorAll('a[href="#reservar"]');
  if (!links.length) return;
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector("[data-compact-booking]") || document.querySelector("#reservar");
      if (!target) return;
      event.preventDefault();
      if (history.pushState) history.pushState(null, "", "#reservar");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
};

window.addEventListener("DOMContentLoaded", () => {
  initIcons();
  initRooms();
  initAmenities();
  initReserveEmbed();
  initHeaderState();
  initMenu();
  initMobileFloatingControls();
  initBookingForm();
  initCompactBookingFlow();
  initDeepLinkBooking();
  initReserveLinks();
  initHeroSlider();
  initGalleryCarousel();
  initScrollAnimations();
  initCardInteractions();
  initOneLineTitles();
  initYear();
});
