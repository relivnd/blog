/*
 * map.js — lazy Leaflet map for talk locations.
 *
 * Leaflet's CSS and JS are only fetched once a map scrolls into view, so
 * talk pages without coordinates and visitors who never scroll pay nothing.
 * Asset URLs arrive as data attributes, which lets the partial prefer a
 * vendored copy under assets/vendor/leaflet/ and fall back to a CDN.
 */
(function () {
  "use strict";

  var loader = null;

  function loadStylesheet(href) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('link[data-leaflet-css="' + href + '"]')) {
        resolve();
        return;
      }
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.leafletCss = href;
      link.onload = resolve;
      link.onerror = function () {
        reject(new Error("Failed to load Leaflet stylesheet"));
      };
      document.head.appendChild(link);
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = function () {
        reject(new Error("Failed to load Leaflet"));
      };
      document.head.appendChild(script);
    });
  }

  /* One shared promise: several maps on a list page must not each fetch
     Leaflet. */
  function loadLeaflet(cssHref, jsSrc) {
    if (window.L) return Promise.resolve();
    if (loader) return loader;
    loader = Promise.all([loadStylesheet(cssHref), loadScript(jsSrc)]);
    return loader;
  }

  function renderMap(el) {
    var lat = parseFloat(el.dataset.lat);
    var lon = parseFloat(el.dataset.lon);
    if (!isFinite(lat) || !isFinite(lon)) return;

    var zoom = parseInt(el.dataset.zoom, 10);
    if (!isFinite(zoom)) zoom = 15;

    el.innerHTML = "";

    var map = window.L.map(el, {
      center: [lat, lon],
      zoom: zoom,
      // A map embedded mid-article must never swallow page scroll.
      scrollWheelZoom: false,
      // Touch drag stays two-finger for the same reason.
      dragging: !window.L.Browser.mobile,
      keyboard: true,
      attributionControl: true
    });

    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      // OSM's tile usage policy requires visible attribution.
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);

    var label = el.dataset.label || "";

    var marker = window.L.marker([lat, lon], {
      icon: window.L.divIcon({
        className: "map-pin-wrap",
        html: '<span class="map-pin"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 18],
        popupAnchor: [0, -18]
      }),
      title: label,
      alt: label || "Event location",
      keyboard: true
    }).addTo(map);

    if (label) {
      marker.bindPopup(label);
    }
  }

  function fail(el) {
    var lat = el.dataset.lat;
    var lon = el.dataset.lon;
    var label = el.dataset.label || "this location";
    el.innerHTML =
      '<p class="map__fallback">Map could not be loaded. ' +
      '<a href="https://www.openstreetmap.org/?mlat=' +
      encodeURIComponent(lat) +
      "&amp;mlon=" +
      encodeURIComponent(lon) +
      '#map=16/' + encodeURIComponent(lat) + "/" + encodeURIComponent(lon) +
      '" rel="noopener">View ' +
      label.replace(/[<>&]/g, "") +
      " on OpenStreetMap</a>.</p>";
  }

  function observe(el) {
    var cssHref = el.dataset.leafletCss;
    var jsSrc = el.dataset.leafletJs;
    if (!cssHref || !jsSrc) return;

    function start() {
      loadLeaflet(cssHref, jsSrc)
        .then(function () {
          renderMap(el);
        })
        .catch(function () {
          fail(el);
        });
    }

    if (!("IntersectionObserver" in window)) {
      start();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          start();
        });
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
  }

  function boot() {
    document.querySelectorAll("[data-map]").forEach(observe);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
