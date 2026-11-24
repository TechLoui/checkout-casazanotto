/* One navigation path for shared links, menu clicks, history and scroll spy. */
(() => {
  const aliases = { conheca: "experiencia", duvidas: "faq", contatos: "contato" };
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let ready = false;
  let records = [];
  let pending;
  let deferredHistory;
  let current;
  let run;
  let spyFrame = 0;
  let spyShouldWrite = false;
  let historyFrame = 0;
  let interacted = false;
  let landing;
  let starting = true;
  let previousScrollRestoration;

  const readId = (hash) => {
    try { return decodeURIComponent(String(hash || "").replace(/^#/, "")); }
    catch { return ""; }
  };
  const resolve = (hash) => {
    const id = readId(hash);
    return records.find((record) => record.id === (aliases[id] || id));
  };
  const headerHeight = () => Math.ceil(document.querySelector("[data-header]")?.getBoundingClientRect().height || 0);
  const blocked = () => document.body.classList.contains("lightbox-open")
    || document.body.classList.contains("menu-open") || document.body.style.position === "fixed";
  const changeHash = (id, mode = "replace") => {
    const next = new URL(location.href);
    next.hash = id;
    if (next.href === location.href) return;
    try { history[mode === "push" ? "pushState" : "replaceState"](history.state, "", next); }
    catch { /* Navigation remains available when history access is restricted. */ }
  };
  const setCurrent = (record) => {
    if (!record) return;
    current = record;
    document.body.dataset.currentSection = record.id;
    document.querySelectorAll(".main-nav a[href], .header-actions a[href], [data-mobile-float-menu] a[href], .casa-footer-grid a[href]").forEach((link) => {
      let route;
      try {
        const url = new URL(link.href, location.href);
        if (url.origin === location.origin && url.pathname === location.pathname) route = resolve(url.hash);
      } catch { /* An unrelated link is not a section navigation item. */ }
      const active = Boolean(route && route.id === record.navId);
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };
  const targetFor = (record) => record.id === "reservar"
    ? document.querySelector("[data-compact-booking]") || record.element
    : record.element;
  const destination = (target) => {
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight() - 18;
    const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.max(0, Math.min(Math.round(top), maximum));
  };
  const focusTarget = (record) => {
    const element = record.id === "reservar" ? targetFor(record)
      : record.element.querySelector("h1, h2") || record.element;
    const temporary = !element.hasAttribute("tabindex");
    if (temporary) element.setAttribute("tabindex", "-1");
    element.focus({ preventScroll: true });
    if (temporary) element.addEventListener("blur", () => element.removeAttribute("tabindex"), { once: true });
  };
  const closeMenus = () => {
    document.querySelector(".main-nav")?.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    for (const selector of [".nav-toggle", "[data-mobile-menu-toggle]"]) {
      const toggle = document.querySelector(selector);
      toggle?.setAttribute("aria-expanded", "false");
      toggle?.setAttribute("aria-label", "Abrir menu");
    }
    document.querySelector("[data-mobile-float-menu]")?.classList.remove("is-open");
    const popover = document.querySelector("[data-mobile-booking-form]");
    if (popover) popover.hidden = true;
    document.querySelector("[data-mobile-booking-toggle]")?.setAttribute("aria-expanded", "false");
  };
  const reveal = (record) => window.CasaMotion?.revealSection(record.element);
  const alignLanding = () => {
    if (!landing || interacted || performance.now() > landing.until || run || blocked()) return;
    const record = landing.record;
    reveal(record);
    const top = destination(targetFor(record));
    if (Math.abs(window.scrollY - top) > 2) {
      starting = true;
      window.scrollTo({ top, behavior: "instant" });
      requestAnimationFrame(() => { starting = false; if (!interacted) setCurrent(record); });
    }
  };
  const move = (record, options = {}) => {
    if (!record || blocked()) return false;
    deferredHistory = undefined;
    if (run) cancelAnimationFrame(run.frame);
    reveal(record);
    if (options.history !== "none") changeHash(record.id, options.history || "push");
    setCurrent(record);
    const target = targetFor(record);
    const instant = options.instant || motion.matches;
    const navigation = { record, target, frame: 0, started: performance.now(), stable: 0, previousY: window.scrollY };
    run = navigation;
    window.scrollTo({ top: destination(target), behavior: instant ? "instant" : "smooth" });
    const tick = (now) => {
      if (run !== navigation) return;
      const top = destination(target);
      const distance = Math.abs(window.scrollY - top);
      const stable = Math.abs(window.scrollY - navigation.previousY) < .5;
      navigation.stable = stable ? navigation.stable + 1 : 0;
      navigation.previousY = window.scrollY;
      if ((instant && navigation.stable >= 2) || (!instant && now - navigation.started > 120 && navigation.stable >= 4) || now - navigation.started > 1800) {
        // The fixed header changes size after leaving the hero. Use its final size.
        if (distance > 2) window.scrollTo({ top, behavior: "instant" });
        run = undefined;
        starting = false;
        setCurrent(record);
        if (options.focus !== false && !interacted) focusTarget(record);
        else if (options.focus !== false && options.reason === "click") focusTarget(record);
        return;
      }
      navigation.frame = requestAnimationFrame(tick);
    };
    navigation.frame = requestAnimationFrame(tick);
    return true;
  };
  const go = (hash, options = {}) => {
    if (!ready) { pending = { hash, options }; return true; }
    const record = resolve(hash);
    return record ? move(record, options) : false;
  };
  window.CasaNavigation = { go, get current() { return current?.id; } };

  const updateSpy = (writeHash = false) => {
    if (run || starting || blocked() || !records.length) return;
    const marker = headerHeight() + Math.min(180, window.innerHeight * .2);
    let active = records[0];
    for (const record of records) {
      if (record.element.getBoundingClientRect().top <= marker) active = record;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3) active = records.at(-1);
    if (active !== current) setCurrent(active);
    if (writeHash) changeHash(active.id);
  };
  const scheduleSpy = (writeHash = false) => {
    spyShouldWrite ||= writeHash;
    if (spyFrame) return;
    spyFrame = requestAnimationFrame(() => {
      spyFrame = 0;
      const write = spyShouldWrite;
      spyShouldWrite = false;
      updateSpy(write);
    });
  };
  const cancelAutomaticScroll = (event) => {
    if (event.type === "keydown" && ["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
    interacted = true;
    landing = undefined;
    starting = false;
    if (run) {
      cancelAnimationFrame(run.frame);
      run = undefined;
      window.scrollTo({ top: window.scrollY, behavior: "instant" });
    }
  };

  const initialize = () => {
    if (ready || !document.body.classList.contains("casa-editorial")) return;
    records = Array.from(document.querySelectorAll("main > section[id], footer.site-footer[id]")).map((element) => ({
      id: element.id,
      element,
      navId: element.dataset.sectionNav || element.id
    }));
    ready = true;
    previousScrollRestoration = history.scrollRestoration;
    try { history.scrollRestoration = "manual"; } catch {}
    const explicit = resolve(location.hash);
    const params = new URLSearchParams(location.search);
    const hasStay = (params.has("arrival_date") || params.has("entrada")) && (params.has("departure_date") || params.has("saida"));
    const initial = explicit || (!location.hash && (hasStay || params.has("coupon")) ? resolve("reservar") : undefined);

    document.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      let url;
      try { url = new URL(link.href, location.href); } catch { return; }
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
      const record = resolve(url.hash);
      if (!record) return; // Native skip links and unrelated fragments retain their own behavior.
      event.preventDefault();
      interacted = true;
      landing = undefined;
      closeMenus();
      move(record, { reason: "click" });
    });

    window.addEventListener("scroll", () => scheduleSpy(!starting), { passive: true });
    for (const event of ["wheel", "touchstart"]) window.addEventListener(event, cancelAutomaticScroll, { passive: true });
    window.addEventListener("keydown", cancelAutomaticScroll);
    window.addEventListener("pointerdown", cancelAutomaticScroll, { passive: true });
    const handleHistory = () => {
      if (historyFrame) return;
      historyFrame = requestAnimationFrame(() => {
        historyFrame = 0;
        landing = undefined;
        starting = false;
        if (run) {
          cancelAnimationFrame(run.frame);
          run = undefined;
          window.scrollTo({ top: window.scrollY, behavior: "instant" });
        }
        const record = resolve(location.hash) || (!location.hash ? records[0] : undefined);
        deferredHistory = record;
        if (record && !blocked()) move(record, { history: "none", instant: true, focus: false });
      });
    };
    window.addEventListener("hashchange", handleHistory);
    window.addEventListener("popstate", handleHistory);
    if ("MutationObserver" in window) {
      new MutationObserver(() => {
        if (deferredHistory && !blocked()) move(deferredHistory, { history: "none", instant: true, focus: false });
      }).observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
    }
    window.addEventListener("resize", () => { alignLanding(); scheduleSpy(false); }, { passive: true });
    window.addEventListener("pagehide", () => {
      if (run) cancelAnimationFrame(run.frame);
      run = undefined;
      landing = undefined;
      deferredHistory = undefined;
      starting = false;
      cancelAnimationFrame(spyFrame);
      cancelAnimationFrame(historyFrame);
      spyFrame = historyFrame = 0;
      spyShouldWrite = false;
      try { history.scrollRestoration = previousScrollRestoration; } catch {}
    });
    window.addEventListener("pageshow", (event) => {
      if (!event.persisted) return;
      try { history.scrollRestoration = "manual"; } catch {}
      landing = undefined;
      starting = false;
      scheduleSpy(false); // BFCache already restores the form and viewport.
    });
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(() => { alignLanding(); scheduleSpy(false); });
      for (const element of [document.querySelector("main"), document.querySelector("[data-header]")]) if (element) observer.observe(element);
    }

    if (pending) {
      const queued = pending;
      pending = undefined;
      go(queued.hash, queued.options);
    } else if (initial) {
      landing = { record: initial, until: performance.now() + 4000 };
      requestAnimationFrame(() => {
        if (!interacted) move(initial, { history: "replace", instant: true, reason: "initial" });
        else { starting = false; updateSpy(false); }
      });
      document.fonts?.ready.then(alignLanding).catch(() => {});
      if (document.readyState === "complete") alignLanding();
      else window.addEventListener("load", alignLanding, { once: true });
    } else {
      starting = false;
      updateSpy(false);
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
