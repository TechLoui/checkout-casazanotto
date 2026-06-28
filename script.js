const HOME_API_BASE = (
  window.CZ_CHECKOUT_API ||
  (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "http://localhost:8080/api"
    : "https://checkout-casazanotto-production.up.railway.app/api")
).replace(/\/$/, "");
const HOME_INSTALLMENTS_MAX = 6;
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
      capacity: opt.capacity || null,
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
    throw new Error(data?.error || fallbackMessage);
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
  const panels = Array.from(form.querySelectorAll("[data-home-panel]"));
  const tabs = Array.from(form.querySelectorAll("[data-home-tab]"));
  const stepIndex = { dates: 0, guests: 1, rooms: 2, guest: 3, payment: 4, done: 5 };
  const state = {
    rooms: [],
    search: null,
    room: null,
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
    state.search = null;
    state.room = null;
    if (roomList) roomList.innerHTML = "";
    if (selectedRoom) selectedRoom.textContent = "";
    clearNotice(notice);
    clearNotice(guestNotice);
    clearNotice(payNotice);
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

    if (state.room) {
      setText("[data-home-pay-room]", state.room.variant ? `${state.room.room_name} · ${state.room.variant}` : state.room.room_name);
      setText("[data-home-pay-total]", homeBrl(state.room.price));
      if (selectedRoom) {
        selectedRoom.textContent = `${state.room.room_name}${state.room.variant ? ` · ${state.room.variant}` : ""} selecionado · ${homeBrl(state.room.price)}`;
      }
    } else {
      setText("[data-home-pay-room]", "-");
      setText("[data-home-pay-total]", "-");
    }
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
    } else if ((step === "guest" || step === "payment") && !state.room) {
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
        form.scrollIntoView({ behavior: "smooth", block: "center" });
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

  const buildInstallments = (price) => {
    const select = form.querySelector("[data-home-card-installments]");
    if (!select) return;
    select.innerHTML = "";
    for (let n = 1; n <= HOME_INSTALLMENTS_MAX; n += 1) {
      const option = document.createElement("option");
      option.value = String(n);
      option.textContent = n === 1 ? `À vista - ${homeBrl(price)}` : `${n}x de ${homeBrl(price / n)} sem juros`;
      select.appendChild(option);
    }
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
      const cap = room.capacity
        ? `Até ${room.capacity.adults || "-"} adulto(s)${room.capacity.kids ? ` + ${room.capacity.kids} criança(s)` : ""}`
        : "Disponível para as datas escolhidas";
      const title = room.variant ? `${room.room_name} · ${room.variant}` : room.room_name;
      const selected = state.room?.roomId === room.roomId && state.room?.rateplanId === room.rateplanId;
      return `
        <article class="home-room-option${selected ? " is-selected" : ""}" data-home-room-card="${index}">
          <img src="${homeEscapeHTML(room.image)}" alt="${homeEscapeHTML(title)}" loading="${index === 0 ? "eager" : "lazy"}">
          <div class="home-room-body">
            <h4>${homeEscapeHTML(room.room_name)}</h4>
            ${room.variant ? `<p>${homeEscapeHTML(room.variant)}</p>` : ""}
            <p>${homeEscapeHTML(cap)}</p>
            <div class="home-room-price">
              <span>
                ${room.pricePerNight ? `<small>${homeBrl(room.pricePerNight)} / noite</small>` : ""}
                <strong>${homeBrl(room.price)}</strong>
                <small>total · ${nights} noite(s)</small>
              </span>
              <button class="button button-primary" type="button" data-home-room-select="${index}">
                Selecionar
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

  const selectRoom = (room) => {
    state.room = room;
    buildInstallments(room.price);
    renderRooms(state.rooms);
    updateReview();
    clearNotice(notice);
    goToStep("guest");
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
    clearNotice(guestNotice);
    clearNotice(payNotice);
    return true;
  };

  const baseReservationPayload = () => ({
    ...state.search,
    room_id: state.room.roomId,
    rateplan_id: state.room.rateplanId,
    guest: guestPayload()
  });

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

  const renderSuccess = (data) => {
    stopPixPolling();
    setPayBusy(false, state.payMethod === "pix" ? "Gerar PIX" : "Pagar e reservar");
    const successId = form.querySelector("[data-home-success-id]");
    if (successId) {
      successId.textContent = data?.booking_id ? `Reserva nº ${data.booking_id}` : "Reserva confirmada.";
    }
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

  const submitCard = async () => {
    const number = form.querySelector("[data-home-card-number]")?.value || "";
    const holderName = form.querySelector("[data-home-card-name]")?.value.trim() || "";
    const exp = form.querySelector("[data-home-card-exp]")?.value || "";
    const cvv = form.querySelector("[data-home-card-cvv]")?.value || "";
    const [mm, yy] = exp.split("/");
    if (homeOnlyDigits(number).length < 13 || !holderName || !mm || !yy || homeOnlyDigits(cvv).length < 3) {
      showNotice(payNotice, "Preencha os dados do cartão para continuar.");
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
          installments: Number(form.querySelector("[data-home-card-installments]")?.value || 1),
          card: {
            number: homeOnlyDigits(number),
            holderName,
            expirationMonth: Number(mm),
            expirationYear: Number(yy),
            securityCode: homeOnlyDigits(cvv)
          }
        })
      });
      const data = await homeReadApiJson(res, "Não foi possível concluir o pagamento.");
      renderSuccess(data);
    } catch (error) {
      setPayBusy(false, "Pagar e reservar");
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
    if (target === "guest" && !state.room) {
      goToStep("rooms");
      showNotice(notice, "Selecione uma acomodação para continuar.");
      return;
    }
    if (target === "payment") {
      if (!state.room) {
        goToStep("rooms");
        showNotice(notice, "Selecione uma acomodação para continuar.");
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
    if (room) selectRoom(room);
  });

  form.querySelectorAll("[data-home-next], [data-home-prev], [data-home-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.homeNext || button.dataset.homePrev || button.dataset.homeTab;
      handleNavigation(target);
    });
  });

  form.querySelectorAll("[data-home-pay-method]").forEach((button) => {
    button.addEventListener("click", () => setPayMethod(button.dataset.homePayMethod));
  });

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

  form.querySelector("[data-home-card-number]")?.addEventListener("input", (event) => {
    const value = homeOnlyDigits(event.target.value).slice(0, 19);
    event.target.value = value.replace(/(.{4})/g, "$1 ").trim();
  });
  form.querySelector("[data-home-card-exp]")?.addEventListener("input", (event) => {
    let value = homeOnlyDigits(event.target.value).slice(0, 4);
    if (value.length >= 3) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    event.target.value = value;
  });
  form.querySelector("[data-home-card-cvv]")?.addEventListener("input", (event) => {
    event.target.value = homeOnlyDigits(event.target.value).slice(0, 4);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.search) {
      fetchAvailability();
      return;
    }
    if (!state.room) {
      goToStep("rooms");
      showNotice(notice, "Selecione uma acomodação para continuar.");
      return;
    }
    if (!validateGuest(true)) {
      goToStep("guest");
      return;
    }
    if (state.payMethod === "pix") submitPix();
    else submitCard();
  });

  window.CZHomeBooking = {
    prefill({ arrival: inValue, departure: outValue, adults }) {
      const parsedIn = parseLocalDate(inValue);
      const parsedOut = parseLocalDate(outValue);
      if (parsedIn) arrival = parsedIn;
      if (parsedOut && (!parsedIn || parsedOut > parsedIn)) departure = parsedOut;
      if (adultsInput && adults) adultsInput.value = String(Math.max(1, Math.min(9, Number(adults) || 2)));
      selecting = departure ? "out" : "in";
      view = new Date((arrival || today).getFullYear(), (arrival || today).getMonth(), 1);
      resetAvailability();
      renderCalendar();
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      goToStep(arrival && departure ? "guests" : "dates");
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
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (slides.length < 2 || reduceMotion) return;

  let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
  if (activeIndex < 0) activeIndex = 0;

  const showNext = () => {
    slides[activeIndex].classList.remove("is-active");
    activeIndex = (activeIndex + 1) % slides.length;
    slides[activeIndex].classList.add("is-active");
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

/* Intro em vídeo (desktop). Mudo + autoplay; some ao terminar/pular/Esc.
   No mobile/reduced-motion o overlay fica display:none (CSS) e nem baixamos o vídeo. */
const initIntro = () => {
  const overlay = document.querySelector("[data-intro]");
  if (!overlay) return;
  // CSS esconde no mobile e em prefers-reduced-motion → não carrega o vídeo.
  if (window.getComputedStyle(overlay).display === "none") {
    overlay.classList.add("is-done");
    return;
  }

  const video = overlay.querySelector("[data-intro-video]");
  const skip = overlay.querySelector("[data-intro-skip]");
  let done = false;

  const end = () => {
    if (done) return;
    done = true;
    overlay.classList.add("is-hiding");
    document.body.classList.remove("intro-active");
    window.setTimeout(() => overlay.classList.add("is-done"), 780);
    try { video.pause(); } catch (_) {}
  };

  document.body.classList.add("intro-active");
  const isMobile = window.matchMedia("(max-width: 1023px)").matches;
  video.src = isMobile ? "assets/Intro%20Mobile.mp4" : "assets/Intro%20Desktop.mp4";
  video.muted = true;
  video.addEventListener("ended", end);
  video.addEventListener("error", end);
  skip?.addEventListener("click", end);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") end();
  });

  const played = video.play?.();
  if (played && typeof played.catch === "function") {
    played.catch(() => end()); // se o autoplay for bloqueado, libera o site
  }
};

/* ----------------------------------------------------------------------------
   Aura background — fluid neon shader adapted to white canvas + orange lines.
   Based on the "Fluid Neon" WebGL effect, re-tuned so the lines read as warm
   orange ink flowing across a soft warm-white field.
---------------------------------------------------------------------------- */
const initAura = () => {
  const mount = document.querySelector("[data-aura]");
  if (!mount || !window.THREE) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 760px)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (error) {
    return; // WebGL unavailable — the warm-white page background remains.
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.4 : 1.8);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  mount.appendChild(renderer.domElement);

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uBgColor;
    uniform float uSpeed;
    uniform float uComplexity;
    uniform float uDensity;
    uniform float uIntensity;
    uniform vec2 uMouse;
    uniform float uHoverEffect;
    varying vec2 vUv;

    mat2 rot(float a) {
      float s = sin(a), c = cos(a);
      return mat2(c, -s, s, c);
    }

    void main() {
      vec2 p = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
      vec2 original_p = p;
      float time = uTime * uSpeed * 0.5;
      p *= rot(0.2);

      if (uHoverEffect > 0.0) {
        vec2 m = uMouse;
        m.x *= uResolution.x / min(uResolution.x, uResolution.y);
        m.y *= uResolution.y / min(uResolution.x, uResolution.y);
        m *= rot(0.2);
        float mouseDist = length(p - m);
        float force = smoothstep(1.5, 0.0, mouseDist) * uHoverEffect;
        p += (p - m) * force * 0.18;
        p *= rot(force * 0.14);
      }

      float iterations = floor(uComplexity);
      float glow = 0.0;
      vec3 colAccum = vec3(0.0);

      for (float i = 1.0; i <= 20.0; i++) {
        if (i > iterations) break;
        p *= rot(sin(time * 0.05) * 0.1 + 0.08);
        vec2 q = p;
        float dist = length(p);
        q *= rot(dist * uDensity * 0.25 - time * 0.3);
        float freq = uDensity * 0.8;
        q.x += sin(q.y * freq + time * 0.5 + i * 0.15) * 0.5;
        q.y += cos(q.x * freq - time * 0.5 - i * 0.15) * 0.5;
        vec2 r = q;
        r.x += sin(q.y * freq * 2.0 - time * 0.8) * 0.25;
        r.y += cos(q.x * freq * 2.0 + time * 0.8) * 0.25;
        float wave = sin(r.x * freq * 1.5 + time) * 0.6 + cos(r.y * freq * 0.5 - time * 0.7) * 0.4;
        float d = abs(r.y - wave);
        float core = 0.004 / max(d, 0.0025);
        float soft1 = exp(-d * 8.0) * 0.6;
        float soft2 = exp(-d * 2.0) * 0.2;
        float mixFactor = sin(r.x * 3.0 + r.y * 2.0 + time + i * 1.6) * 0.5 + 0.5;
        vec3 layerColor = mix(uColor1, uColor2, mixFactor);
        float attenuation = 1.0 / (i * 0.6 + 1.0);
        float inten = (core + soft1 + soft2) * uIntensity * attenuation * 30.0;
        glow += inten;
        colAccum += layerColor * inten;
        p = r * 1.05;
      }

      vec3 lineColor = colAccum / max(glow, 0.0001);
      float mask = 1.0 - exp(-glow * 2.4);

      // Fade the ink toward the edges so the centre stays the visual focus.
      float vignette = 1.0 - smoothstep(0.35, 2.3, length(original_p));
      mask *= mix(0.5, 1.0, vignette);

      vec3 finalColor = mix(uBgColor, lineColor, clamp(mask, 0.0, 1.0));
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  const uniforms = {
    uTime: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio) },
    uColor1: { value: new THREE.Color("#ff8a3d") },
    uColor2: { value: new THREE.Color("#ff5a00") },
    uBgColor: { value: new THREE.Color("#fffaf5") },
    uSpeed: { value: 0.26 },
    uComplexity: { value: isMobile ? 5.0 : 7.0 },
    uDensity: { value: 2.15 },
    uIntensity: { value: 0.03 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uHoverEffect: { value: reduceMotion ? 0.0 : 1.0 }
  };

  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthWrite: false, depthTest: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  const targetMouse = new THREE.Vector2(0, 0);
  const updateMouse = (x, y) => {
    targetMouse.x = (x / window.innerWidth) * 2 - 1;
    targetMouse.y = -(y / window.innerHeight) * 2 + 1;
  };
  window.addEventListener("mousemove", (e) => updateMouse(e.clientX, e.clientY), { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (e.touches.length) updateMouse(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  const clock = new THREE.Clock();
  let running = true;

  const renderFrame = () => {
    uniforms.uMouse.value.x += (targetMouse.x - uniforms.uMouse.value.x) * 0.05;
    uniforms.uMouse.value.y += (targetMouse.y - uniforms.uMouse.value.y) * 0.05;
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
  };

  const animate = () => {
    if (!running) return;
    renderFrame();
    requestAnimationFrame(animate);
  };

  let resizeTimer;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
      if (reduceMotion) renderFrame();
    }, 150);
  });

  // Pause the loop when the tab is hidden to save battery/GPU.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
    } else if (!reduceMotion && !running) {
      running = true;
      animate();
    }
  });

  if (reduceMotion) {
    renderFrame(); // single elegant static frame
  } else {
    animate();
  }
};

/* Soft orange glow that trails the cursor (fine-pointer devices only). */
const initCursorGlow = () => {
  const glow = document.querySelector("[data-cursor]");
  if (!glow) return;

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!finePointer) return;

  document.body.classList.add("has-cursor-glow");

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let visible = false;
  let raf = 0;

  const loop = () => {
    currentX += (targetX - currentX) * 0.16;
    currentY += (targetY - currentY) * 0.16;
    glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    raf = requestAnimationFrame(loop);
  };

  window.addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    if (!visible) {
      visible = true;
      glow.classList.add("is-visible");
    }
    if (!raf) raf = requestAnimationFrame(loop);
  });

  document.addEventListener("mouseleave", () => {
    visible = false;
    glow.classList.remove("is-visible");
  });

  // Grow the glow over interactive elements.
  document.addEventListener("pointerover", (event) => {
    const interactive = event.target.closest("a, button, summary, .mobile-float-button, .hero-hook, .promise-card, .suite-card, .ritual-panel, .feature-band, .reserve-shell, .field-control, .review-grid blockquote, .faq-list details, .dgc-slide, .gallery-card");
    glow.classList.toggle("is-active", Boolean(interactive));
  });
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
    slug: "standard", name: "Suíte Standard", count: 15, tag: "Casal · Triplo",
    desc: "Conforto essencial com ar-condicionado, TV Smart, frigobar e enxoval premium."
  },
  {
    slug: "bangalo", name: "Bangalô Colonial", count: 14, tag: "Charme colonial",
    desc: "Privacidade e charme colonial em meio ao jardim — perfeito para casais."
  },
  {
    slug: "gold", name: "Suíte Gold", count: 8, tag: "Varanda · Vista verde",
    desc: "Mais espaço e varanda privativa. Ideal para casal, triplo ou quádruplo."
  },
  {
    slug: "gold-master", name: "Suíte Gold Master", count: 8, tag: "Premium",
    desc: "A acomodação mais especial para comemorar, com o máximo de requinte."
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
        return `<img src="${src}" alt="${room.name} — foto ${i + 1}" loading="lazy" draggable="false">`;
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
        `<img src="assets/${a.slug}/${String(i + 1).padStart(2, "0")}.webp" alt="${a.name} — foto ${i + 1}" loading="lazy" draggable="false">`
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

window.addEventListener("DOMContentLoaded", () => {
  initIcons();
  initIntro();
  initRooms();
  initAmenities();
  initReserveEmbed();
  initAura();
  initCursorGlow();
  initHeaderState();
  initMenu();
  initMobileFloatingControls();
  initBookingForm();
  initCompactBookingFlow();
  initHeroSlider();
  initGalleryCarousel();
  initScrollAnimations();
  initCardInteractions();
  initOneLineTitles();
  initYear();
});
