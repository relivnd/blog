/*
 * carousel.js — certifications carousel.
 *
 * Deliberately manual: arrows, drag, keyboard, native swipe. No autoplay,
 * so there is no motion to opt out of and no focus stolen from readers.
 * Built on CSS scroll-snap, so it degrades to a plain horizontal scroller
 * if this script never runs.
 */
(function () {
  "use strict";

  function initCarousel(root) {
    var viewport = root.querySelector(".carousel__viewport");
    var prev = root.querySelector('[data-carousel="prev"]');
    var next = root.querySelector('[data-carousel="next"]');
    if (!viewport) return;

    function step() {
      var item = viewport.querySelector(".carousel__item");
      if (!item) return viewport.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(viewport).columnGap || "16") || 16;
      // Advance by whole cards, at least one, at most a viewport-full.
      var card = item.getBoundingClientRect().width + gap;
      var fit = Math.max(1, Math.floor(viewport.clientWidth / card));
      return card * fit;
    }

    function syncButtons() {
      if (!prev || !next) return;
      var max = viewport.scrollWidth - viewport.clientWidth;
      // 2px tolerance: sub-pixel layout means scrollLeft rarely hits max exactly.
      prev.disabled = viewport.scrollLeft <= 2;
      next.disabled = viewport.scrollLeft >= max - 2;
    }

    function scrollBy(direction) {
      viewport.scrollBy({
        left: direction * step(),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth"
      });
    }

    if (prev) prev.addEventListener("click", function () { scrollBy(-1); });
    if (next) next.addEventListener("click", function () { scrollBy(1); });

    viewport.addEventListener("scroll", function () {
      window.requestAnimationFrame(syncButtons);
    }, { passive: true });

    window.addEventListener("resize", syncButtons);

    /* Keyboard: the viewport is focusable so arrow keys work predictably. */
    viewport.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollBy(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollBy(-1);
      }
    });

    /* Pointer drag. Only for mouse — touch already scrolls natively, and
       hijacking it would break momentum scrolling. */
    var dragging = false;
    var startX = 0;
    var startScroll = 0;
    var moved = 0;

    viewport.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      dragging = true;
      moved = 0;
      startX = event.clientX;
      startScroll = viewport.scrollLeft;
      viewport.dataset.dragging = "true";
    });

    viewport.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      var delta = event.clientX - startX;
      moved = Math.abs(delta);
      viewport.scrollLeft = startScroll - delta;
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      delete viewport.dataset.dragging;
      syncButtons();
    }

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("pointerleave", endDrag);

    /* Suppress the click that follows a real drag, so dragging across a
       badge does not navigate to its credential URL. */
    viewport.addEventListener("click", function (event) {
      if (moved > 6) {
        event.preventDefault();
        event.stopPropagation();
        moved = 0;
      }
    }, true);

    syncButtons();
  }

  function boot() {
    document.querySelectorAll("[data-carousel-root]").forEach(initCarousel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
