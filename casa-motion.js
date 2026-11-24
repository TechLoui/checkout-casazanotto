(() => {
  if (window.CasaMotion) return;

  const presets = [
    [".casa-intro-copy", "left"],
    [".casa-collage", "right"],
    [".casa-signature-photos", "left"],
    [".casa-signature-copy > .eyebrow, .casa-signature-copy > h2, .casa-signature-copy > p", "right", 45],
    [".casa-feature-list > article", "right", 65],
    [".suites-section > .section-heading", "up"],
    ["[data-rooms] > .room-card", "up", 40],
    [".casa-breakfast-copy", "left"],
    [".casa-breakfast-photo", "scale"],
    [".casa-immersion > .casa-container", "up"],
    [".gallery-section > .section-heading", "up"],
    [".casa-gallery-filters", "up"],
    ["[data-casa-gallery] > .casa-gallery-tile", "up", 55],
    [".reviews-section > .section-heading", "up"],
    [".review-grid > blockquote", "up", 65],
    [".casa-reserve-heading", "up"],
    [".casa-reserve-benefits > span", "up", 55],
    [".reserve-section > .reserve-shell", "frame"],
    [".faq-section > .section-heading", "left"],
    [".faq-list > details", "up", 45],
    [".casa-location-map", "scale"],
    [".casa-location-copy", "right"],
    [".casa-footer-grid > div", "up", 55],
    [".casa-footer-bottom", "up"]
  ];
  const elements = new Set();
  const seen = new WeakSet();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let observer;
  let galleryObserver;
  let galleryFrame;

  const settle = (element) => {
    observer?.unobserve(element);
    seen.add(element);
    element.dataset.casaMotionSeen = "true";
    element.classList.remove("is-casa-motion-entering");
  };

  const reveal = (element) => {
    if (seen.has(element)) return;
    observer?.unobserve(element);
    seen.add(element);
    element.dataset.casaMotionSeen = "true";
    if (!reducedMotion.matches && !element.contains(document.activeElement)) {
      element.classList.add("is-casa-motion-entering");
    }
  };

  const refresh = (root = document) => {
    if (!(root instanceof Element || root instanceof Document)) return;
    for (const [selector, direction, stagger = 0] of presets) {
      const matches = Array.from(root.querySelectorAll(selector));
      if (root instanceof Element && root.matches(selector)) matches.unshift(root);
      matches.forEach((element) => {
        if (elements.has(element)) return;
        elements.add(element);
        element.dataset.casaMotion = direction;
        const siblings = Array.from(element.parentElement?.children || [])
          .filter((sibling) => sibling.matches(selector));
        const delay = Math.min(Math.max(siblings.indexOf(element), 0), 3) * stagger;
        element.style.setProperty("--casa-motion-delay", `${delay}ms`);
        if (observer && !reducedMotion.matches) observer.observe(element);
        else settle(element);
      });
    }
  };

  const revealSection = (target) => {
    let section = target;
    if (typeof target === "string") {
      try { section = document.querySelector(target); } catch (_) { return; }
    }
    if (!(section instanceof Element)) return;
    refresh(section);
    for (const element of elements) {
      if (section.contains(element) || element.contains(section)) settle(element);
    }
  };

  const settleFocused = (event) => {
    for (const element of elements) {
      if (element.contains(event.target)) settle(element);
    }
  };

  const showAll = () => elements.forEach(settle);

  const initialize = () => {
    if (!document.body.classList.contains("casa-editorial")) return;
    try {
      if (typeof window.IntersectionObserver === "function") {
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) reveal(entry.target);
          });
        }, { rootMargin: "0px 0px 6% 0px", threshold: 0.08 });
      }
      refresh();
      const gallery = document.querySelector("[data-casa-gallery]");
      if (gallery && typeof window.MutationObserver === "function") {
        galleryObserver = new MutationObserver(() => {
          if (galleryFrame) return;
          galleryFrame = window.requestAnimationFrame(() => {
            galleryFrame = undefined;
            for (const element of elements) {
              if (!element.isConnected) {
                observer?.unobserve(element);
                elements.delete(element);
              }
            }
            refresh(gallery);
          });
        });
        galleryObserver.observe(gallery, { childList: true });
      }
      document.addEventListener("focusin", settleFocused);
      document.addEventListener("pointerdown", settleFocused, { passive: true });
      document.addEventListener("animationend", (event) => {
        if (event.animationName.startsWith("casa-motion-")) {
          event.target.classList.remove("is-casa-motion-entering");
        }
      });
      reducedMotion.addEventListener?.("change", () => {
        if (reducedMotion.matches) showAll();
      });
      window.addEventListener("pageshow", (event) => {
        if (event.persisted) showAll();
      });
      if (location.hash) {
        try { revealSection(document.getElementById(decodeURIComponent(location.hash.slice(1)))); } catch (_) {}
      }
    } catch (_) {
      observer?.disconnect();
      galleryObserver?.disconnect();
      observer = undefined;
      showAll();
    }
  };

  window.CasaMotion = { refresh, revealSection };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
