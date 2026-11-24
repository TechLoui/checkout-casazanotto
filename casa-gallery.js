(() => {
  const photos = [
    { src: "assets/hero.webp", category: "leisure", title: "Piscina e sol em Pirenópolis" },
    { src: "assets/rooms/gold-master/01.webp", category: "rooms", title: "Suíte Gold Master com banheira" },
    { src: "assets/cafe/01.webp", category: "food", title: "O café da manhã da Casa" },
    { src: "assets/gallery/71-Foto-45-scaled.webp", category: "leisure", title: "Uma pausa no deck junto ao rio" },
    { src: "assets/lounge.webp", category: "leisure", title: "Rede na varanda, jardim ao redor" },
    { src: "assets/rooms/standard/01.webp", category: "rooms", title: "O aconchego da Suíte Standard" },
    { src: "assets/brand.webp", category: "leisure", title: "Hidromassagem entre as árvores" },
    { src: "assets/river.webp", category: "food", title: "Frutas, bolos e sabores da manhã" },
    { src: "assets/rooms/gold/01.webp", category: "rooms", title: "Espaço para descansar na Suíte Gold" },
    { src: "assets/hidden-bg.webp", category: "leisure", title: "A fachada no Centro Histórico" },
    { src: "assets/gallery/67-Foto-35-scaled.webp", category: "leisure", title: "Caminhos e cantinhos do jardim" },
    { src: "assets/rooms/bangalo/08.webp", category: "rooms", title: "Quarto do Bangalô Colonial" },
    { src: "assets/cafe/02.webp", category: "food", title: "Detalhes que fazem parte do café" },
    { src: "assets/gallery/61-Foto-20-scaled.webp", category: "leisure", title: "A piscina cercada de verde" },
    { src: "assets/rooms/bangalo/01.webp", category: "rooms", title: "Mesa e varanda do Bangalô Colonial" },
    { src: "assets/gallery/75-Foto-67-scaled.webp", category: "leisure", title: "O verde dentro da pousada" },
    { src: "assets/rooms/bangalo/05.webp", category: "rooms", title: "A cozinha do Bangalô Colonial" },
    { src: "assets/rooms/bangalo/11.webp", category: "rooms", title: "Quarto com beliches no bangalô" }
  ];
  const categories = { all: "Todas", leisure: "Lazer e jardins", rooms: "Acomodações", food: "Café da manhã" };

  const initialize = () => {
    const gallery = document.querySelector("[data-casa-gallery]");
    if (!gallery || gallery.dataset.casaGalleryReady) return;
    gallery.dataset.casaGalleryReady = "true";
    const section = gallery.closest("section") || gallery.parentElement;
    const filters = Array.from(section.querySelectorAll("[data-gallery-filter]"));
    const more = section.querySelector("[data-casa-gallery-more]");
    const status = section.querySelector("[data-casa-gallery-status]");
    const lightbox = document.querySelector("[data-lightbox]");
    const image = lightbox?.querySelector("[data-lightbox-image]");
    const closeButton = lightbox?.querySelector("[data-lightbox-close]");
    const previousButton = lightbox?.querySelector("[data-lightbox-prev]");
    const nextButton = lightbox?.querySelector("[data-lightbox-next]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let activeFilter = "all";
    let visibleCount = 9;
    let filtered = photos;
    let lightboxPhotos = [];
    let lightboxIndex = 0;
    let returnFocus;
    let scrollLock;

    if (status) {
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
    }
    if (lightbox) {
      lightbox.setAttribute("role", "dialog");
      lightbox.setAttribute("aria-modal", "true");
      lightbox.setAttribute("aria-label", "Galeria de fotos da Pousada Casa Zanotto");
      lightbox.tabIndex = -1;
    }

    const render = () => {
      filtered = activeFilter === "all" ? photos : photos.filter((photo) => photo.category === activeFilter);
      const visible = filtered.slice(0, visibleCount);
      const fragment = document.createDocumentFragment();
      visible.forEach((photo, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `casa-gallery-tile${index % 3 === 0 ? " is-wide" : ""}`;
        button.dataset.casaGalleryIndex = String(index);
        button.setAttribute("aria-label", `Ampliar foto: ${photo.title}`);
        const figure = document.createElement("figure");
        const thumbnail = document.createElement("img");
        thumbnail.src = photo.src;
        thumbnail.alt = photo.title;
        thumbnail.loading = "lazy";
        thumbnail.decoding = "async";
        const caption = document.createElement("span");
        caption.className = "casa-gallery-caption";
        const category = document.createElement("small");
        category.textContent = categories[photo.category];
        const title = document.createElement("strong");
        title.textContent = photo.title;
        caption.append(category, title);
        figure.append(thumbnail, caption);
        button.append(figure);
        fragment.append(button);
      });
      gallery.replaceChildren(fragment);
      filters.forEach((button) => {
        const selected = button.dataset.galleryFilter === activeFilter;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      if (more) more.hidden = visible.length >= filtered.length;
      if (status) status.textContent = `${visible.length} de ${filtered.length} fotos`;
    };

    const focusableControls = () => Array.from(lightbox.querySelectorAll("button:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])"))
      .filter((element) => !element.hidden && element.getClientRects().length);

    const showLightboxPhoto = () => {
      const photo = lightboxPhotos[lightboxIndex];
      image.src = photo.src;
      image.alt = `${photo.title} na Pousada Casa Zanotto`;
      lightbox.setAttribute("aria-label", `${photo.title}. Foto ${lightboxIndex + 1} de ${lightboxPhotos.length}`);
      if (previousButton) previousButton.disabled = lightboxPhotos.length < 2;
      if (nextButton) nextButton.disabled = lightboxPhotos.length < 2;
    };

    const openLightbox = (index, trigger) => {
      if (!lightbox || !image) return;
      lightboxPhotos = filtered.slice(0, visibleCount);
      if (!lightboxPhotos[index]) return;
      lightboxIndex = index;
      returnFocus = trigger;
      scrollLock = {
        x: window.scrollX,
        y: window.scrollY,
        styles: Object.fromEntries(["position", "top", "left", "width", "overflow"].map((name) => [name, document.body.style[name]])),
        hadClass: document.body.classList.contains("lightbox-open")
      };
      Object.assign(document.body.style, { position: "fixed", top: `-${scrollLock.y}px`, left: `-${scrollLock.x}px`, width: "100%", overflow: "hidden" });
      document.body.classList.add("lightbox-open");
      showLightboxPhoto();
      lightbox.hidden = false;
      (closeButton || lightbox).focus({ preventScroll: true });
    };

    const closeLightbox = () => {
      if (!lightbox || lightbox.hidden) return;
      lightbox.hidden = true;
      image?.removeAttribute("src");
      if (scrollLock) {
        Object.assign(document.body.style, scrollLock.styles);
        if (!scrollLock.hadClass) document.body.classList.remove("lightbox-open");
        window.scrollTo({ left: scrollLock.x, top: scrollLock.y, behavior: "instant" });
        scrollLock = undefined;
      }
      const target = returnFocus?.isConnected ? returnFocus : gallery.querySelector("button");
      target?.focus({ preventScroll: true });
    };

    const moveLightbox = (direction) => {
      if (!lightboxPhotos.length) return;
      lightboxIndex = (lightboxIndex + direction + lightboxPhotos.length) % lightboxPhotos.length;
      showLightboxPhoto();
    };

    filters.forEach((button) => button.addEventListener("click", () => {
      const category = button.dataset.galleryFilter;
      if (!Object.hasOwn(categories, category)) return;
      activeFilter = category;
      visibleCount = 9;
      render();
    }));
    more?.addEventListener("click", () => {
      const firstNewIndex = visibleCount;
      visibleCount = filtered.length;
      render();
      const firstNew = gallery.querySelector(`[data-casa-gallery-index="${firstNewIndex}"]`);
      firstNew?.focus({ preventScroll: true });
      firstNew?.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "nearest" });
    });
    gallery.addEventListener("click", (event) => {
      const tile = event.target.closest("[data-casa-gallery-index]");
      if (tile && gallery.contains(tile)) openLightbox(Number(tile.dataset.casaGalleryIndex), tile);
    });
    closeButton?.addEventListener("click", closeLightbox);
    previousButton?.addEventListener("click", () => moveLightbox(-1));
    nextButton?.addEventListener("click", () => moveLightbox(1));
    lightbox?.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("focusin", (event) => {
      if (lightbox && !lightbox.hidden && !lightbox.contains(event.target)) {
        (focusableControls()[0] || lightbox).focus({ preventScroll: true });
      }
    });
    document.addEventListener("keydown", (event) => {
      if (!lightbox || lightbox.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        moveLightbox(event.key === "ArrowLeft" ? -1 : 1);
      } else if (event.key === "Tab") {
        event.preventDefault();
        const controls = focusableControls();
        const index = controls.indexOf(document.activeElement);
        const next = event.shiftKey ? (index <= 0 ? controls.length - 1 : index - 1) : (index + 1) % controls.length;
        (controls[next] || lightbox).focus({ preventScroll: true });
      }
    });
    render();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
