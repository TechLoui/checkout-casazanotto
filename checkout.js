/* ===========================================================================
   Checkout transparente — Pousada Casa Zanotto
   Fluxo: disponibilidade -> escolha do quarto -> dados+cartão -> confirmação.
   O backend (Node) cobra na Rede e cria a reserva no Artax só se aprovado.
   ===========================================================================
   CONFIG: defina a URL do backend. Em produção, aponte para o seu domínio,
   por ex.: window.CZ_CHECKOUT_API = "https://api.pousadacasazanotto.com/api";
=========================================================================== */
const API_BASE = (
  window.CZ_CHECKOUT_API ||
  (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://localhost:8080/api" : "/api")
).replace(/\/$/, "");
const INSTALLMENTS_MAX = 6;
const DEFAULT_SUMMARY_IMAGE = "assets/hidden-bg.webp";
const FALLBACK_ROOM_IMAGES = [
  "assets/gallery/01-Apartamento-35.webp",
  "assets/gallery/02-Apartamento-36.webp",
  "assets/gallery/03-Apartamento-38.webp",
  "assets/suite.webp",
  "assets/gallery/47-IMG_2786-scaled-1.webp",
  "assets/gallery/48-IMG_2787-scaled-1.webp"
];

const brl = (value) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

const encodeRoomData = (room) => encodeURIComponent(JSON.stringify(room));
const decodeRoomData = (value) => JSON.parse(decodeURIComponent(value));

const state = {
  search: null, // { arrival_date, departure_date, adults, kids, ages }
  selection: null // { roomId, rateplanId, room_name, price }
};

const refreshIcons = () => window.lucide && window.lucide.createIcons();

/* ---------- navegação entre etapas ---------- */
const goToStep = (step) => {
  document.body.dataset.step = String(step);
  $$("[data-view]").forEach((v) => v.classList.toggle("is-hidden", Number(v.dataset.view) !== step));
  $$(".steps [data-step]").forEach((chip) => {
    const n = Number(chip.dataset.step);
    chip.classList.toggle("is-active", n === step);
    chip.classList.toggle("is-done", n < step);
    chip.setAttribute("aria-current", n === step ? "step" : "false");
  });
  requestAnimationFrame(() => {
    const active = $(`[data-view="${step}"]`);
    active?.scrollTo?.({ top: 0 });
    active?.querySelector("form, .room-list")?.scrollTo?.({ top: 0 });
  });
  if (document.body.classList.contains("embed")) {
    parent.postMessage({ cz: "step", value: step }, "*");
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

/* Modo embed: checkout dentro de um iframe no próprio site. */
const initEmbed = () => {
  if (!new URLSearchParams(location.search).has("embed")) return;
  document.body.classList.add("embed");
  const post = () => {
    const h = Math.ceil(document.body.scrollHeight);
    parent.postMessage({ cz: "height", value: h }, "*");
  };
  if ("ResizeObserver" in window) new ResizeObserver(post).observe(document.body);
  window.addEventListener("load", post);
  window.addEventListener("resize", post);
  setTimeout(post, 300);
};

const showNotice = (message, type = "error") => {
  const el = $("#notice");
  el.textContent = message;
  el.className = `notice ${type}`;
};
const clearNotice = () => $("#notice").classList.add("is-hidden");

/* ---------- janela de "sem disponibilidade" ---------- */
const showNoAvailability = () => {
  const m = $("[data-noavail]");
  if (!m) return;
  m.hidden = false;
  document.body.classList.add("modal-open");
  refreshIcons();
  m.querySelector("[data-noavail-close]")?.focus();
};
const closeNoAvailability = () => {
  const m = $("[data-noavail]");
  if (!m) return;
  m.hidden = true;
  document.body.classList.remove("modal-open");
};

/* ---------- revisão da reserva (antes do pagamento, mobile) ---------- */
const updateReview = () => {
  const s = state.search;
  if (!s) return;
  const setT = (sel, v) => { const el = $(sel); if (el) el.textContent = v; };
  setT("[data-pr-in]", fmtDate(s.arrival_date));
  setT("[data-pr-out]", fmtDate(s.departure_date));
  setT("[data-pr-nights]", String(nightsBetween(s.arrival_date, s.departure_date)));
  setT("[data-pr-guests]", `${s.adults} adulto(s)${s.kids ? ` · ${s.kids} criança(s)` : ""}`);
  if (state.selection) {
    setT("[data-pr-room]", state.selection.room_name);
    setT("[data-pr-total]", brl(state.selection.price));
  }
};

/* ---------- datas / resumo ---------- */
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
};
const nightsBetween = (a, b) =>
  Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));

const updateSummary = () => {
  const s = state.search;
  const summaryImage = $("#sum-image");
  if (!s) {
    if (summaryImage) summaryImage.src = DEFAULT_SUMMARY_IMAGE;
    return;
  }
  $("#sum-in").textContent = fmtDate(s.arrival_date);
  $("#sum-out").textContent = fmtDate(s.departure_date);
  $("#sum-nights").textContent = nightsBetween(s.arrival_date, s.departure_date);
  $("#sum-guests").textContent =
    `${s.adults} adulto(s)${s.kids ? ` · ${s.kids} criança(s)` : ""}`;
  if (state.selection) {
    $("#sum-room").textContent = state.selection.room_name;
    $("#sum-total").textContent = brl(state.selection.price);
    if (summaryImage) {
      summaryImage.src = state.selection.images?.[0] || state.selection.image || DEFAULT_SUMMARY_IMAGE;
      summaryImage.alt = state.selection.room_name || "Acomodação selecionada";
    }
  } else {
    $("#sum-room").textContent = "Sua reserva";
    $("#sum-total").textContent = "—";
    if (summaryImage) {
      summaryImage.src = DEFAULT_SUMMARY_IMAGE;
      summaryImage.alt = "Pousada Casa Zanotto";
    }
  }
};

/* ---------- prefill via query string (vindo do site) ---------- */
const prefillFromQuery = () => {
  const p = new URLSearchParams(location.search);
  const arrival = p.get("arrival_date") || p.get("entrada");
  const departure = p.get("departure_date") || p.get("saida");
  const adults = p.get("adults") || p.get("hospedes");
  if (arrival) $("#arrival").value = arrival;
  if (departure) $("#departure").value = departure;
  if (adults && Number(adults) >= 1) $("#adults").value = String(Math.min(Number(adults), 9));

  // defaults se vazio: amanhã / depois de amanhã
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  if (!$("#arrival").value) {
    const t = new Date(today); t.setDate(t.getDate() + 1); $("#arrival").value = iso(t);
  }
  if (!$("#departure").value) {
    const t = new Date(today); t.setDate(t.getDate() + 2); $("#departure").value = iso(t);
  }
  $("#arrival").min = iso(today);
};

const buildAgesInputs = () => {
  const kids = Number($("#kids").value);
  const wrap = $("#ages-wrap");
  const container = $("#ages-inputs");
  container.innerHTML = "";
  if (!kids) { wrap.classList.add("is-hidden"); return; }
  wrap.classList.remove("is-hidden");
  for (let i = 0; i < kids; i += 1) {
    const field = document.createElement("div");
    field.className = "field";
    field.innerHTML = `<label>Idade da criança ${i + 1}</label>
      <input type="number" min="0" max="12" value="6" data-age inputmode="numeric" required>`;
    container.appendChild(field);
  }
};

/* ---------- etapa 1: disponibilidade ---------- */
const fetchAvailability = async (event) => {
  event.preventDefault();
  clearNotice();
  const btn = $("#search-btn");
  const ages = $$("#ages-inputs [data-age]").map((i) => Number(i.value));
  const search = {
    arrival_date: $("#arrival").value,
    departure_date: $("#departure").value,
    adults: Number($("#adults").value),
    kids: Number($("#kids").value),
    ages
  };

  if (nightsBetween(search.arrival_date, search.departure_date) < 1) {
    return showNotice("O check-out deve ser pelo menos um dia após o check-in.");
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Buscando...';
  try {
    const params = new URLSearchParams({
      arrival_date: search.arrival_date,
      departure_date: search.departure_date,
      adults: String(search.adults),
      kids: String(search.kids)
    });
    ages.forEach((age, i) => params.append(`ages[${i}]`, String(age)));

    const res = await fetch(`${API_BASE}/availability?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Falha ao consultar disponibilidade.");

    state.search = search;
    state.selection = null;
    updateSummary();
    if (!flattenRooms(data.rooms).length) {
      showNoAvailability();
      return;
    }
    renderRooms(data.rooms);
    goToStep(2);
  } catch (err) {
    showNotice(err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="search"></i> Buscar quartos';
    refreshIcons();
  }
};

const toImageList = (value) => {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(toImageList);
  if (typeof value === "object") {
    const keys = ["url", "src", "href", "path", "image", "main_image", "large", "medium", "thumbnail", "thumb"];
    return keys.flatMap((key) => toImageList(value[key]));
  }
  return [];
};

const normalizeImageUrl = (src) => {
  const value = String(src || "").trim();
  if (!value) return "";
  if (value.startsWith("//")) return `https:${value}`;
  return value;
};

const isImageUrl = (src) =>
  /^(https?:)?\/\//i.test(src) || /\.(webp|avif|png|jpe?g)(\?.*)?$/i.test(src);

const extractArtaxImages = (option) => {
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
  return [...new Set(keys.flatMap((key) => toImageList(option?.[key])).map(normalizeImageUrl).filter(isImageUrl))];
};

const fallbackRoomImage = (name, index) => {
  const normalized = String(name || "").toLowerCase();
  if (normalized.includes("gold")) return "assets/gallery/47-IMG_2786-scaled-1.webp";
  if (normalized.includes("standard")) return "assets/gallery/01-Apartamento-35.webp";
  return FALLBACK_ROOM_IMAGES[index % FALLBACK_ROOM_IMAGES.length];
};

/* Fotos reais de cada acomodação (os zips do Artax já otimizados em assets/rooms).
   O Artax só devolve 1 foto na disponibilidade, então puxamos a galeria completa daqui. */
const ROOM_PHOTOS = { standard: 15, bangalo: 14, gold: 8, "gold-master": 8 };
const roomSlugFromName = (name) => {
  const n = String(name || "").toLowerCase();
  if (n.includes("master")) return "gold-master";
  if (n.includes("gold")) return "gold";
  if (n.includes("bangal")) return "bangalo";
  if (n.includes("standard")) return "standard";
  return null;
};
const localRoomPhotos = (slug) => {
  const count = ROOM_PHOTOS[slug];
  if (!count) return [];
  return Array.from({ length: count }, (_, i) => `assets/rooms/${slug}/${String(i + 1).padStart(2, "0")}.webp`);
};

const flattenRooms = (rooms) => {
  if (!rooms || Array.isArray(rooms)) return [];
  const list = [];
  for (const [roomId, plans] of Object.entries(rooms)) {
    // Mantém só tarifas públicas (descarta B2B/agência) e pega a mais barata.
    const publicPlans = Object.entries(plans)
      .map(([rid, opt]) => ({ rid, opt }))
      .filter(({ opt }) => !/b2b/i.test(opt.rateplan_name || ""));
    if (!publicPlans.length) continue;
    publicPlans.sort((a, b) => Number(a.opt.price) - Number(b.opt.price));
    const { rid, opt } = publicPlans[0];
    const fullName = opt.room_name || `Quarto ${roomId}`;
    const artaxImages = extractArtaxImages(opt);
    const localPhotos = localRoomPhotos(roomSlugFromName(fullName));
    const images = localPhotos.length
      ? localPhotos
      : (artaxImages.length ? artaxImages : [fallbackRoomImage(fullName, list.length)]);
    list.push({
      roomId,
      rateplanId: Number(opt.rateplan_id || rid),
      room_name: fullName.split("|")[0].trim(), // "Suíte Standard | Casal | ..." -> "Suíte Standard"
      variant: (fullName.split("|")[1] || "").trim(), // "Casal", "Triplo"...
      price: Number(opt.price),
      pricePerNight: Number(opt.price_per_nights) || null,
      image: images[0],
      images,
      imageSource: artaxImages.length ? "artax" : "fallback",
      capacity: opt.capacity || null,
      allots: opt.allots
    });
  }
  return list.sort((a, b) => a.price - b.price);
};

const renderRooms = (rooms) => {
  const list = flattenRooms(rooms);
  const container = $("#room-list");
  const nights = state.search ? nightsBetween(state.search.arrival_date, state.search.departure_date) : 1;
  if (!list.length) {
    container.innerHTML =
      '<p class="notice info empty-state">Não há acomodações disponíveis para estas datas. Tente outras datas.</p>';
    refreshIcons();
    return;
  }
  container.innerHTML = list
    .map((opt, i) => {
      const cap = opt.capacity
        ? `Até ${opt.capacity.adults} adulto(s)${opt.capacity.kids ? ` + ${opt.capacity.kids} criança(s)` : ""}`
        : "";
      const images = opt.images?.length ? opt.images : [opt.image].filter(Boolean);
      const variant = opt.variant ? `<span class="room-variant">${escapeHTML(opt.variant)}</span>` : "";
      const capacity = cap
        ? `<span><i data-lucide="users" aria-hidden="true"></i>${escapeHTML(cap)}</span>`
        : "";
      const galleryStack = images.length
        ? images
            .map((src, gi) => `<img src="${escapeHTML(src)}" alt="${escapeHTML(opt.room_name)} — foto ${gi + 1}" class="${gi === 0 ? "is-active" : ""}" loading="${gi === 0 ? "eager" : "lazy"}" draggable="false">`)
            .join("")
        : `<span class="room-thumb--ph"><i data-lucide="bed-double"></i></span>`;
      const galleryControls = images.length > 1
        ? `<button class="rgal-arrow rgal-prev" type="button" data-rgal-prev aria-label="Foto anterior"><i data-lucide="chevron-left" aria-hidden="true"></i></button>
           <button class="rgal-arrow rgal-next" type="button" data-rgal-next aria-label="Próxima foto"><i data-lucide="chevron-right" aria-hidden="true"></i></button>
           <span class="rgal-count"><span data-rgal-cur>1</span>/${images.length}</span>`
        : "";
      return `
      <article class="room-option" data-room="${encodeRoomData(opt)}" data-i="${i}">
        <div class="room-gallery" data-rgal>
          <div class="rgal-stack">${galleryStack}</div>
          ${galleryControls}
        </div>
        <div class="room-body">
          <h3>${escapeHTML(opt.room_name)}${variant}</h3>
          <div class="room-meta">
            ${capacity}
            <span><i data-lucide="calendar-check" aria-hidden="true"></i> Disponível</span>
          </div>
        </div>
        <div class="room-side">
          <div class="price">
            ${opt.pricePerNight ? `<span class="price-night">${brl(opt.pricePerNight)} <small>/ noite</small></span>` : ""}
            <strong>${brl(opt.price)}</strong>
            <small>total · ${nights} noite(s)</small>
          </div>
          <button class="btn btn-primary room-select" type="button">
            Selecionar
          </button>
        </div>
      </article>`;
    })
    .join("");
  refreshIcons();
  setupRoomCarousel();
  setupRoomGalleries();
};

/* Galeria de fotos dentro de cada card de quarto (setas + contador, sem swipe
   pra não conflitar com o carrossel horizontal de quartos no mobile). */
const setupRoomGalleries = () => {
  $$("[data-rgal]").forEach((gal) => {
    const imgs = $$(".rgal-stack img", gal);
    if (imgs.length <= 1) return;
    const cur = $("[data-rgal-cur]", gal);
    let i = 0;
    const show = (n) => {
      i = (n + imgs.length) % imgs.length;
      imgs.forEach((im, k) => im.classList.toggle("is-active", k === i));
      if (cur) cur.textContent = String(i + 1);
    };
    $("[data-rgal-prev]", gal)?.addEventListener("click", (e) => { e.stopPropagation(); show(i - 1); });
    $("[data-rgal-next]", gal)?.addEventListener("click", (e) => { e.stopPropagation(); show(i + 1); });
  });
};

/* Carrossel horizontal dos quartos (tablet/mobile) — não rola a página. */
const setupRoomCarousel = () => {
  const list = $("#room-list");
  const nav = $("[data-room-nav]");
  if (!list || !nav) return;
  const cards = $$(".room-option", list);
  const dotsWrap = $("[data-rn-dots]", nav);
  const prev = $("[data-rn-prev]", nav);
  const next = $("[data-rn-next]", nav);

  nav.classList.toggle("is-hidden", cards.length <= 1);
  dotsWrap.innerHTML = cards
    .map((_, i) => `<button type="button" class="rcn-dot${i === 0 ? " is-active" : ""}" data-rn-dot="${i}" aria-label="Quarto ${i + 1}"></button>`)
    .join("");
  const dots = $$("[data-rn-dot]", nav);
  let idx = 0;

  const setActive = (i) => {
    idx = Math.max(0, Math.min(cards.length - 1, i));
    dots.forEach((d, di) => d.classList.toggle("is-active", di === idx));
    prev.disabled = idx <= 0;
    next.disabled = idx >= cards.length - 1;
  };
  const go = (i) => {
    setActive(i);
    const c = cards[idx];
    if (c) list.scrollTo({ left: c.offsetLeft - (list.clientWidth - c.offsetWidth) / 2, behavior: "smooth" });
  };

  prev.onclick = () => go(idx - 1);
  next.onclick = () => go(idx + 1);
  dots.forEach((d, i) => (d.onclick = () => go(i)));

  let raf;
  list.onscroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const center = list.scrollLeft + list.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      cards.forEach((c, i) => {
        const cc = c.offsetLeft + c.offsetWidth / 2;
        const d = Math.abs(cc - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setActive(best);
    });
  };

  setActive(0);
};

const selectRoom = (opt) => {
  state.selection = opt;
  updateSummary();
  updateReview();
  // parcelas
  const sel = $("#c-inst");
  sel.innerHTML = "";
  for (let n = 1; n <= INSTALLMENTS_MAX; n += 1) {
    const each = opt.price / n;
    const o = document.createElement("option");
    o.value = String(n);
    o.textContent = n === 1 ? `À vista — ${brl(opt.price)}` : `${n}x de ${brl(each)} sem juros`;
    sel.appendChild(o);
  }
  goToStep(3);
};

/* ---------- máscaras de cartão ---------- */
const maskCardNumber = (el) => {
  let v = el.value.replace(/\D/g, "").slice(0, 19);
  el.value = v.replace(/(.{4})/g, "$1 ").trim();
};
const maskExpiry = (el) => {
  let v = el.value.replace(/\D/g, "").slice(0, 4);
  if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
  el.value = v;
};
const onlyDigits = (el) => { el.value = el.value.replace(/\D/g, ""); };

/* ---------- etapa 3: pagamento (PIX ou cartão) ---------- */
let payMethod = "pix";
let pixPoll = null;
let pixTimeout = null;

const setPayMethod = (method) => {
  payMethod = method;
  $$(".pay-tab").forEach((t) => {
    const active = t.dataset.payMethod === method;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
  });
  $$("[data-pane]").forEach((p) => p.classList.toggle("is-hidden", p.dataset.pane !== method));
  // Desabilita os campos do cartão quando não for cartão (evita validação em campo oculto).
  ["#c-number", "#c-name", "#c-exp", "#c-cvv", "#c-inst"].forEach((sel) => {
    const el = $(sel);
    if (el) el.disabled = method !== "card";
  });
  const label = $("#pay-btn .label");
  if (label) label.textContent = method === "pix" ? "Gerar PIX" : "Pagar e reservar";
};

const baseReservationPayload = () => ({
  arrival_date: state.search.arrival_date,
  departure_date: state.search.departure_date,
  adults: state.search.adults,
  kids: state.search.kids,
  ages: state.search.ages,
  room_id: state.selection.roomId,
  rateplan_id: state.selection.rateplanId,
  guest: {
    first_name: $("#g-first").value.trim(),
    last_name: $("#g-last").value.trim(),
    phone: $("#g-phone").value,
    email: $("#g-email").value.trim(),
    document: $("#g-doc").value,
    document_type: $("#g-doctype").value || undefined,
    type: "guest"
  }
});

const guestValid = () => {
  if (!$("#g-first").value.trim()) { showNotice("Informe o nome do hóspede."); return false; }
  if ($("#g-phone").value.replace(/\D/g, "").length < 10) { showNotice("Informe um telefone válido com DDD."); return false; }
  return true;
};

const submitCheckout = (event) => {
  event.preventDefault();
  clearNotice();
  if (!state.selection || !state.search) return goToStep(1);
  if (!guestValid()) return;
  if (payMethod === "pix") submitPix();
  else submitCard();
};

const submitCard = async () => {
  const [mm, yy] = $("#c-exp").value.split("/");
  const payload = {
    ...baseReservationPayload(),
    installments: Number($("#c-inst").value) || 1,
    card: {
      number: $("#c-number").value.replace(/\s/g, ""),
      holderName: $("#c-name").value.trim(),
      expirationMonth: Number(mm),
      expirationYear: Number(yy),
      securityCode: $("#c-cvv").value
    }
  };
  const btn = $("#pay-btn");
  btn.disabled = true;
  btn.querySelector(".label").innerHTML = '<span class="spinner"></span> Processando...';
  try {
    const res = await fetch(`${API_BASE}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Não foi possível concluir o pagamento.");
    renderSuccess(data);
  } catch (err) {
    showNotice(err.message);
    btn.disabled = false;
    btn.querySelector(".label").textContent = "Pagar e reservar";
  }
};

const submitPix = async () => {
  const btn = $("#pay-btn");
  btn.disabled = true;
  btn.querySelector(".label").innerHTML = '<span class="spinner"></span> Gerando PIX...';
  try {
    const res = await fetch(`${API_BASE}/pix/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(baseReservationPayload())
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Não foi possível gerar o PIX.");
    showPix(data);
  } catch (err) {
    showNotice(err.message);
    btn.disabled = false;
    btn.querySelector(".label").textContent = "Gerar PIX";
  }
};

const showPix = (data) => {
  const result = $("[data-pix-result]");
  const img = $("[data-pix-img]");
  const code = $("[data-pix-code]");
  if (data.qrImage) {
    img.src = data.qrImage.startsWith("data:") || /^https?:/.test(data.qrImage)
      ? data.qrImage
      : `data:image/png;base64,${data.qrImage}`;
  } else if (data.qrCode) {
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(data.qrCode)}`;
  }
  if (code) code.value = data.qrCode || "";
  result.classList.remove("is-hidden");
  const btn = $("#pay-btn");
  btn.querySelector(".label").innerHTML = '<span class="spinner"></span> Aguardando pagamento…';
  startPixPolling(data.tid);
};

const stopPixPolling = () => {
  if (pixPoll) clearInterval(pixPoll);
  if (pixTimeout) clearTimeout(pixTimeout);
  pixPoll = pixTimeout = null;
};

const startPixPolling = (tid) => {
  stopPixPolling();
  const check = async () => {
    try {
      const res = await fetch(`${API_BASE}/pix/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tid })
      });
      const data = await res.json();
      if (data.status === "paid") { stopPixPolling(); renderSuccess(data); }
      else if (data.status === "expired") { stopPixPolling(); pixExpired(); }
    } catch (_) { /* mantém tentando */ }
  };
  pixPoll = setInterval(check, 4000);
  pixTimeout = setTimeout(() => { stopPixPolling(); pixExpired(); }, 12 * 60 * 1000);
};

const pixExpired = () => {
  const st = $("[data-pix-status]");
  if (st) st.innerHTML = '<i data-lucide="alert-circle"></i> PIX expirado. Gere um novo código.';
  const btn = $("#pay-btn");
  btn.disabled = false;
  btn.querySelector(".label").textContent = "Gerar novo PIX";
  refreshIcons();
};

const renderSuccess = (data) => {
  stopPixPolling();
  $("#booking-id").textContent = `Reserva nº ${data.booking_id}`;
  const p = data.payment || {};
  const methodLabel = p.method === "pix" ? "PIX" : `Cartão${p.installments ? ` · ${p.installments}x` : ""}`;
  $("#success-details").innerHTML = `
    <div class="summary-row"><span>Quarto</span><span>${data.room?.name || "—"}</span></div>
    <div class="summary-row"><span>Check-in</span><span>${fmtDate(state.search.arrival_date)}</span></div>
    <div class="summary-row"><span>Check-out</span><span>${fmtDate(state.search.departure_date)}</span></div>
    <div class="summary-row"><span>Pagamento</span><span>${methodLabel}</span></div>
    <div class="summary-total"><span>Pago</span><strong>${brl(p.amount || state.selection.price)}</strong></div>`;
  goToStep(4);
};

/* ---------- steppers (+/-) estilo motor de reservas Artax ---------- */
const initSteppers = () => {
  $$(".stepper").forEach((stepper) => {
    const input = stepper.querySelector("input");
    const min = Number(stepper.dataset.min || 0);
    const max = Number(stepper.dataset.max || 99);
    const set = (val) => {
      const next = Math.min(max, Math.max(min, val));
      input.value = String(next);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    stepper.querySelector("[data-dec]").addEventListener("click", () => set(Number(input.value) - 1));
    stepper.querySelector("[data-inc]").addEventListener("click", () => set(Number(input.value) + 1));
  });
};

/* ---------- calendário de intervalo (check-in -> check-out) ---------- */
const initCalendar = () => {
  const root = $("[data-cal]");
  if (!root) return;
  const grid = $("[data-cal-grid]", root);
  const title = $("[data-cal-title]", root);
  const hint = $("[data-cal-hint]", root);
  const inEl = $("[data-cal-in]", root);
  const outEl = $("[data-cal-out]", root);
  const arrivalInput = $("#arrival");
  const departureInput = $("#departure");

  const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const WD = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, da] = s.split("-").map(Number); return new Date(y, m - 1, da); };
  const fmt = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  const todayD = new Date();
  todayD.setHours(0, 0, 0, 0);
  let arrival = arrivalInput.value ? parse(arrivalInput.value) : null;
  let departure = departureInput.value ? parse(departureInput.value) : null;
  let view = new Date((arrival || todayD).getFullYear(), (arrival || todayD).getMonth(), 1);

  const same = (a, b) => a && b && a.getTime() === b.getTime();

  const sync = () => {
    arrivalInput.value = arrival ? iso(arrival) : "";
    departureInput.value = departure ? iso(departure) : "";
    inEl.textContent = arrival ? fmt(arrival) : "Selecionar";
    outEl.textContent = departure ? fmt(departure) : "Selecionar";
    root.classList.toggle("rc-has-in", Boolean(arrival));
    root.classList.toggle("rc-has-out", Boolean(departure));
    if (!arrival) hint.innerHTML = "Selecione a data de <b>check-in</b>.";
    else if (!departure) hint.innerHTML = "Agora selecione a data de <b>check-out</b>.";
    else hint.innerHTML = `Estadia de <b>${nightsBetween(iso(arrival), iso(departure))} noite(s)</b> selecionada.`;
  };

  const render = () => {
    title.textContent = `${MONTHS[view.getMonth()]} de ${view.getFullYear()}`;
    const startWd = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    let html = WD.map((w) => `<span class="rc-wd">${w}</span>`).join("");
    for (let i = 0; i < startWd; i += 1) html += `<span class="rc-empty"></span>`;
    for (let day = 1; day <= days; day += 1) {
      const d = new Date(view.getFullYear(), view.getMonth(), day);
      const past = d < todayD;
      const cls = ["rc-day"];
      if (past) cls.push("is-past");
      if (same(d, arrival)) cls.push("is-start");
      if (same(d, departure)) cls.push("is-end");
      if (arrival && departure && d > arrival && d < departure) cls.push("is-range");
      if (same(d, todayD)) cls.push("is-today");
      html += `<button type="button" class="${cls.join(" ")}" ${past ? "disabled" : ""} data-day="${iso(d)}">${day}</button>`;
    }
    grid.innerHTML = html;
    refreshIcons();
  };

  const pick = (d) => {
    if (!arrival || departure || d <= arrival) {
      arrival = d;
      departure = null;
    } else {
      departure = d;
    }
    sync();
    render();
  };

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-day]");
    if (btn && !btn.disabled) pick(parse(btn.dataset.day));
  });

  grid.addEventListener("mouseover", (e) => {
    if (!arrival || departure) return;
    const btn = e.target.closest("[data-day]");
    if (!btn) return;
    const hov = parse(btn.dataset.day);
    grid.querySelectorAll("[data-day]").forEach((b) => {
      const bd = parse(b.dataset.day);
      b.classList.toggle("is-preview", bd > arrival && bd <= hov);
    });
  });
  grid.addEventListener("mouseleave", () => {
    grid.querySelectorAll(".is-preview").forEach((b) => b.classList.remove("is-preview"));
  });

  $("[data-cal-prev]", root).addEventListener("click", () => {
    const min = new Date(todayD.getFullYear(), todayD.getMonth(), 1);
    const prev = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    view = prev < min ? min : prev;
    render();
  });
  $("[data-cal-next]", root).addEventListener("click", () => {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    render();
  });

  sync();
  render();
};

/* ---------- bind ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initEmbed();
  refreshIcons();
  prefillFromQuery();
  initCalendar();
  initSteppers();
  updateSummary();

  $("#kids").addEventListener("change", buildAgesInputs);
  $("#search-form").addEventListener("submit", fetchAvailability);

  $("#room-list").addEventListener("click", (e) => {
    const card = e.target.closest("[data-room]");
    if (!card) return;
    $$(".room-option").forEach((c) => c.classList.remove("is-selected"));
    card.classList.add("is-selected");
    selectRoom(decodeRoomData(card.dataset.room));
  });

  $("#back-to-search").addEventListener("click", () => goToStep(1));
  $("#back-to-rooms").addEventListener("click", () => goToStep(2));

  $("#c-number").addEventListener("input", (e) => maskCardNumber(e.target));
  $("#c-exp").addEventListener("input", (e) => maskExpiry(e.target));
  $("#c-cvv").addEventListener("input", (e) => onlyDigits(e.target));

  $("#checkout-form").addEventListener("submit", submitCheckout);

  // Abas de pagamento (PIX / Cartão)
  $$(".pay-tab").forEach((t) => t.addEventListener("click", () => setPayMethod(t.dataset.payMethod)));
  setPayMethod("pix");

  // Copiar o código PIX (copia e cola)
  $("[data-pix-copy]")?.addEventListener("click", async () => {
    const code = $("[data-pix-code]")?.value;
    if (!code) return;
    try { await navigator.clipboard.writeText(code); } catch (_) {}
    const b = $("[data-pix-copy]");
    const old = b.innerHTML;
    b.innerHTML = '<i data-lucide="check" aria-hidden="true"></i> Copiado';
    refreshIcons();
    setTimeout(() => { b.innerHTML = old; refreshIcons(); }, 1800);
  });

  $$("[data-noavail-close]").forEach((b) => b.addEventListener("click", closeNoAvailability));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNoAvailability();
  });
});
