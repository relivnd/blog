/*
 * app.js — loaded on every page.
 * Three small, independent behaviours: code copy buttons, back-to-top,
 * and click-to-load video facades. Each guards its own absence.
 */
(function () {
  "use strict";

  /* ---- Copy code ---------------------------------------------------- */

  function initCopyCode() {
    var blocks = document.querySelectorAll(".code-block");
    if (!blocks.length || !navigator.clipboard) return;

    blocks.forEach(function (block) {
      var pre = block.querySelector("pre");
      if (!pre) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-code";
      btn.textContent = block.dataset.copyLabel || "Copy";
      btn.setAttribute("aria-label", "Copy code to clipboard");

      btn.addEventListener("click", function () {
        // Prefer the code element so line numbers are never copied.
        var source = pre.querySelector("code") || pre;
        var text = source.innerText.replace(/\n$/, "");

        navigator.clipboard.writeText(text).then(
          function () {
            btn.textContent = "Copied";
            btn.dataset.copied = "true";
            window.setTimeout(function () {
              btn.textContent = "Copy";
              delete btn.dataset.copied;
            }, 1600);
          },
          function () {
            btn.textContent = "Failed";
            window.setTimeout(function () {
              btn.textContent = "Copy";
            }, 1600);
          }
        );
      });

      block.appendChild(btn);
    });
  }

  /* ---- Back to top -------------------------------------------------- */

  function initToTop() {
    var btn = document.querySelector(".to-top");
    if (!btn) return;

    var threshold = 600;
    var ticking = false;

    function update() {
      btn.dataset.visible = window.scrollY > threshold ? "true" : "false";
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    btn.addEventListener("click", function (event) {
      event.preventDefault();
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });

    update();
  }

  /* ---- Video facades ------------------------------------------------ */
  /*
   * Nothing from YouTube loads until the visitor asks for it. The facade
   * button is replaced by a nocookie iframe with autoplay on first click,
   * so the click that dismisses the poster also starts playback.
   */

  function initVideoFacades() {
    var facades = document.querySelectorAll(".video__facade[data-embed]");
    if (!facades.length) return;

    facades.forEach(function (facade) {
      facade.addEventListener("click", function () {
        var frame = facade.closest(".video__frame");
        if (!frame) return;

        var iframe = document.createElement("iframe");
        iframe.src = facade.dataset.embed;
        iframe.title = facade.dataset.videoTitle || "Embedded video";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("loading", "lazy");
        iframe.referrerPolicy = "strict-origin-when-cross-origin";

        frame.innerHTML = "";
        frame.appendChild(iframe);
      });
    });
  }

  /* ---- Boot --------------------------------------------------------- */

  function boot() {
    initCopyCode();
    initToTop();
    initVideoFacades();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
