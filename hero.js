/* ===========================================================================
   Seção "A casa em imagens" — leque de fotos com GSAP
   Adaptado do conceito GSAP carousel/gallery: entrada animada ao rolar até a
   seção, flutuação contínua, parallax no mouse e tilt 3D no hover.
   Respeita prefers-reduced-motion.
=========================================================================== */
(() => {
  const section = document.querySelector(".showcase-section");
  const wrap = document.querySelector("#heroCards");
  if (!section || !wrap || !window.gsap) return;

  const gsap = window.gsap;
  const cards = gsap.utils.toArray("#heroCards .hero-card");
  if (!cards.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  cards.forEach((card) => { card.dataset.restRot = parseFloat(card.dataset.rot) || 0; });

  // Acessibilidade: estados finais sem animação.
  if (reduceMotion) {
    cards.forEach((card) => gsap.set(card, { y: 0, opacity: 1, scale: 1, rotation: card.dataset.restRot }));
    return;
  }

  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  // Estado inicial: cards acima, girados e reduzidos.
  cards.forEach((card) => {
    gsap.set(card, { y: -420, rotation: card.dataset.restRot + 22, opacity: 0, scale: 0.7 });
  });

  let entered = false;
  const playIntro = () => {
    if (entered) return;
    entered = true;
    gsap.to(cards, {
      y: 0,
      opacity: 1,
      scale: 1,
      rotation: (i, el) => parseFloat(el.dataset.restRot) || 0,
      duration: 1.1,
      stagger: { each: 0.08, from: "center" },
      ease: "back.out(1.4)",
      onComplete: startFloat
    });
  };

  // Flutuação contínua e sutil (após a entrada).
  function startFloat() {
    cards.forEach((card, i) => {
      const rot = Number(card.dataset.restRot);
      gsap.to(card, {
        y: `+=${3 + (i % 3) * 1.5}`,
        rotation: rot + (i % 2 === 0 ? 0.6 : -0.6),
        duration: 3.4 + (i % 4) * 0.5,
        delay: i * 0.1,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
    });
  }

  if (window.ScrollTrigger) {
    window.ScrollTrigger.create({ trigger: section, start: "top 78%", once: true, onEnter: playIntro });
  } else {
    playIntro();
  }

  // Parallax no mouse (relativo à seção).
  let mx = 0, my = 0, tx = 0, ty = 0;
  section.addEventListener("mousemove", (e) => {
    const r = section.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    my = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  section.addEventListener("mouseleave", () => { mx = 0; my = 0; });

  const parallax = () => {
    tx += (mx - tx) * 0.05;
    ty += (my - ty) * 0.05;
    cards.forEach((card) => {
      // profundidade limitada para um movimento leve e uniforme
      const d = Math.min(parseFloat(card.dataset.depth) || 8, 11);
      card.style.translate = `${(tx * d * 0.42).toFixed(2)}px ${(ty * d * 0.24).toFixed(2)}px`;
    });
    requestAnimationFrame(parallax);
  };
  parallax();

  // Tilt 3D no hover.
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, {
        rotateX: -py * 14,
        rotateY: px * 14,
        scale: 1.1,
        zIndex: 20,
        duration: 0.4,
        ease: "power2.out",
        transformPerspective: 700,
        overwrite: "auto"
      });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        zIndex: card.style.zIndex || "",
        duration: 0.8,
        ease: "elastic.out(1, 0.6)",
        overwrite: "auto"
      });
    });
  });
})();
