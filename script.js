const checkoutUrl = "checkout.html";

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
    const params = new URLSearchParams({
      arrival_date: entrada.value,
      departure_date: saida.value,
      adults: hospedes?.value || "2"
    });
    window.location.href = `${checkoutUrl}?${params.toString()}`;
  });
};

const initBookingForm = () => {
  const forms = document.querySelectorAll("[data-booking-form], [data-mobile-booking-form]");
  forms.forEach((form) => setupBookingForm(form));
};

const initMobileFloatingControls = () => {
  const root = document.querySelector(".mobile-float-nav");
  const menuToggle = document.querySelector("[data-mobile-menu-toggle]");
  const bookingToggle = document.querySelector("[data-mobile-booking-toggle]");
  const menu = document.querySelector("[data-mobile-float-menu]");
  const booking = document.querySelector("[data-mobile-booking-form]");

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
    root.classList.toggle("is-revealed", revealed);
    if (!revealed) { closeMenu(); closeBooking(); }
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
    const interactive = event.target.closest("a, button, summary, .mobile-float-button, .promise-card, .suite-card, .ritual-panel, .feature-band, .review-grid blockquote, .faq-list details, .dgc-slide, .gallery-card");
    glow.classList.toggle("is-active", Boolean(interactive));
  });
};

/* Pointer-follow spotlight + subtle tilt on premium cards. */
const initCardInteractions = () => {
  const spotlightCards = document.querySelectorAll(
    ".promise-card, .suite-card, .ritual-panel, .review-grid blockquote, .feature-band, .contact-panel a, .faq-list details"
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
  initHeroSlider();
  initGalleryCarousel();
  initScrollAnimations();
  initCardInteractions();
  initYear();
});
