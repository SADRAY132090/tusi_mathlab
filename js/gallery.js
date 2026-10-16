/* Gallery lightbox */
(() => {
  "use strict";
  const images = document.querySelectorAll(".gallery-item-image img, .gallery-hero-image img");
  if (!images.length) return;
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;
  const img = lightbox.querySelector("img");
  const cap = lightbox.querySelector(".lightbox-caption");
  let lastFocused = null;

  function open(src, alt, caption) {
    lastFocused = document.activeElement;
    img.src = src;
    img.alt = alt || "";
    cap.textContent = caption || alt || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    const closeBtn = lightbox.querySelector(".lightbox-close");
    if (closeBtn) closeBtn.focus();
  }
  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }
  images.forEach(im => {
    im.addEventListener("click", () => {
      const fig = im.closest("figure, .gallery-hero-image");
      const caption =
        fig?.querySelector("figcaption p")?.textContent ||
        fig?.querySelector(".gallery-hero-overlay p")?.textContent ||
        im.alt;
      open(im.src, im.alt, caption);
    });
  });
  lightbox.querySelectorAll("[data-close-lightbox]").forEach(el => {
    el.addEventListener("click", close);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !lightbox.hidden) close();
  });
})();