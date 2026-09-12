/*
 * search.js — client-side fuzzy search over /index.json.
 *
 * Self-contained matcher rather than a bundled library: the index is small
 * (one site's worth of posts, talks and tools) so the win from a heavier
 * scorer is negligible, and owning the code means match positions are
 * available for highlighting.
 *
 * Ranking, highest first:
 *   1. exact substring, at a word boundary
 *   2. exact substring, mid-word
 *   3. subsequence (typo/abbreviation tolerant, e.g. "kubrnts" -> Kubernetes)
 * Field weights favour titles and tags over body text. Every whitespace-
 * separated term must match somewhere in the record (AND), so adding words
 * narrows results the way people expect.
 */
(function () {
  "use strict";

  var FIELDS = [
    { key: "title", weight: 4.0 },
    { key: "tags", weight: 3.0 },
    { key: "section", weight: 1.5 },
    { key: "summary", weight: 2.0 },
    { key: "content", weight: 1.0 }
  ];

  var MAX_RESULTS = 40;

  /* ---- Matcher ------------------------------------------------------ */

  function isBoundary(str, index) {
    if (index === 0) return true;
    return /[^a-z0-9]/.test(str.charAt(index - 1));
  }

  /*
   * Returns { score, start, end } for a contiguous hit, or
   * { score, positions } for a scattered subsequence hit, or null.
   */
  function matchField(needle, haystack) {
    if (!needle || !haystack) return null;

    var hay = haystack.toLowerCase();
    var idx = hay.indexOf(needle);

    if (idx !== -1) {
      // Contiguous. Word-boundary hits outrank mid-word ones, and earlier
      // hits outrank later ones. Longer needles are inherently stronger
      // signals, so length feeds the score directly.
      var score = 100 + needle.length * 2;
      if (isBoundary(hay, idx)) score += 30;
      if (idx === 0) score += 15;
      score -= Math.min(idx, 40) * 0.25;
      return { score: score, start: idx, end: idx + needle.length };
    }

    // Scattered subsequence. Every needle character must appear in order.
    var positions = [];
    var h = 0;
    var consecutive = 0;
    var subScore = 0;

    for (var n = 0; n < needle.length; n++) {
      var ch = needle.charAt(n);
      var found = -1;

      while (h < hay.length) {
        if (hay.charAt(h) === ch) {
          found = h;
          break;
        }
        h++;
      }

      if (found === -1) return null;

      subScore += 6;
      if (isBoundary(hay, found)) subScore += 8;
      if (positions.length && found === positions[positions.length - 1] + 1) {
        consecutive++;
        subScore += 4 + consecutive * 2;
      } else {
        consecutive = 0;
      }

      positions.push(found);
      h++;
    }

    // A subsequence spread across the whole string is weak evidence.
    var span = positions[positions.length - 1] - positions[0] + 1;
    subScore -= Math.min((span - needle.length) * 0.6, 30);

    if (subScore <= 0) return null;
    return { score: subScore, positions: positions };
  }

  function fieldText(record, key) {
    var value = record[key];
    if (!value) return "";
    if (Array.isArray(value)) return value.join(" ");
    return String(value);
  }

  function scoreRecord(terms, record) {
    var total = 0;
    var hits = {};

    for (var t = 0; t < terms.length; t++) {
      var term = terms[t];
      var best = 0;

      for (var f = 0; f < FIELDS.length; f++) {
        var field = FIELDS[f];
        var text = fieldText(record, field.key);
        var m = matchField(term, text);
        if (!m) continue;

        var weighted = m.score * field.weight;
        if (weighted > best) best = weighted;

        // Keep the best hit per field for highlighting.
        if (!hits[field.key] || m.score > hits[field.key].score) {
          hits[field.key] = m;
        }
      }

      // AND semantics: one unmatched term disqualifies the record.
      if (best === 0) return null;
      total += best;
    }

    return { score: total, hits: hits };
  }

  /* ---- Highlighting -------------------------------------------------- */

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function highlight(text, hit) {
    if (!text) return "";
    if (!hit) return escapeHtml(text);

    var marked = new Set();
    if (typeof hit.start === "number") {
      for (var i = hit.start; i < hit.end; i++) marked.add(i);
    } else if (hit.positions) {
      hit.positions.forEach(function (p) { marked.add(p); });
    }

    var out = "";
    var open = false;

    for (var c = 0; c < text.length; c++) {
      var on = marked.has(c);
      if (on && !open) {
        out += "<mark>";
        open = true;
      } else if (!on && open) {
        out += "</mark>";
        open = false;
      }
      out += escapeHtml(text.charAt(c));
    }

    if (open) out += "</mark>";
    return out;
  }

  /* Show the region of a long summary that actually matched. */
  function excerpt(text, hit, length) {
    if (!text) return { text: "", hit: hit };
    if (text.length <= length) return { text: text, hit: hit };

    var anchor = 0;
    if (hit) {
      anchor = typeof hit.start === "number" ? hit.start : hit.positions[0];
    }

    var start = Math.max(0, anchor - Math.floor(length / 3));
    if (start > 0) {
      // Do not slice mid-word.
      var space = text.indexOf(" ", start);
      if (space !== -1 && space - start < 20) start = space + 1;
    }

    var sliced = text.slice(start, start + length);
    var shifted = null;

    if (hit) {
      if (typeof hit.start === "number") {
        shifted = { start: hit.start - start, end: hit.end - start };
      } else {
        shifted = {
          positions: hit.positions
            .map(function (p) { return p - start; })
            .filter(function (p) { return p >= 0 && p < sliced.length; })
        };
      }
    }

    return {
      text: (start > 0 ? "\u2026" : "") + sliced + "\u2026",
      hit: shifted,
      offset: start > 0 ? 1 : 0
    };
  }

  /* ---- UI ------------------------------------------------------------ */

  function init(root) {
    var input = root.querySelector("[data-search-input]");
    var list = root.querySelector("[data-search-results]");
    var status = root.querySelector("[data-search-status]");
    var endpoint = root.dataset.searchIndex;
    if (!input || !list || !endpoint) return;

    var records = null;
    var loading = false;
    var selected = -1;
    var pending = null;

    function setStatus(message) {
      if (status) status.textContent = message;
    }

    function load() {
      if (records || loading) return Promise.resolve();
      loading = true;
      setStatus("Loading search index\u2026");

      return fetch(endpoint, { credentials: "same-origin" })
        .then(function (response) {
          if (!response.ok) throw new Error("HTTP " + response.status);
          return response.json();
        })
        .then(function (data) {
          records = Array.isArray(data) ? data : [];
          loading = false;
          setStatus("");
        })
        .catch(function () {
          loading = false;
          setStatus("Search is unavailable right now.");
        });
    }

    function render(results, terms) {
      list.innerHTML = "";
      selected = -1;

      results.forEach(function (result, index) {
        var record = result.record;
        var li = document.createElement("li");
        li.className = "search__result";
        li.setAttribute("role", "option");
        li.id = "search-result-" + index;

        var link = document.createElement("a");
        link.href = record.permalink;

        var title = document.createElement("p");
        title.className = "search__result-title";

        if (record.section) {
          var badge = document.createElement("span");
          badge.className = "search__badge";
          badge.textContent = record.section;
          title.appendChild(badge);
        }

        var titleText = document.createElement("span");
        titleText.innerHTML = highlight(record.title, result.hits.title);
        title.appendChild(titleText);
        link.appendChild(title);

        var summarySource = record.summary || record.content || "";
        if (summarySource) {
          var cut = excerpt(summarySource, result.hits.summary, 180);
          var summary = document.createElement("p");
          summary.className = "search__result-summary";
          summary.innerHTML = highlight(cut.text, cut.hit);
          link.appendChild(summary);
        }

        li.appendChild(link);
        list.appendChild(li);
      });

      if (!results.length) {
        setStatus("No matches. Try fewer or shorter words.");
      } else {
        setStatus(
          results.length +
            (results.length === 1 ? " match" : " matches") +
            ' for "' + terms.join(" ") + '"'
        );
      }
    }

    function run() {
      var query = input.value.trim().toLowerCase();

      if (!query) {
        list.innerHTML = "";
        setStatus("");
        syncUrl("");
        return;
      }

      syncUrl(input.value.trim());

      load().then(function () {
        if (!records) return;

        var terms = query.split(/\s+/).filter(Boolean);
        var results = [];

        for (var i = 0; i < records.length; i++) {
          var scored = scoreRecord(terms, records[i]);
          if (!scored) continue;
          results.push({
            record: records[i],
            score: scored.score,
            hits: scored.hits
          });
        }

        results.sort(function (a, b) { return b.score - a.score; });
        render(results.slice(0, MAX_RESULTS), terms);
      });
    }

    function syncUrl(value) {
      if (!window.history || !window.history.replaceState) return;
      var url = new URL(window.location.href);
      if (value) {
        url.searchParams.set("q", value);
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState(null, "", url.toString());
    }

    function select(next) {
      var items = list.querySelectorAll(".search__result");
      if (!items.length) return;

      if (selected >= 0 && items[selected]) {
        items[selected].removeAttribute("aria-selected");
      }

      selected = (next + items.length) % items.length;
      var current = items[selected];
      current.setAttribute("aria-selected", "true");
      current.scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", current.id);
    }

    input.addEventListener("input", function () {
      // Debounce so a fast typist does not re-rank on every keystroke.
      window.clearTimeout(pending);
      pending = window.setTimeout(run, 120);
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        select(selected + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        select(selected - 1);
      } else if (event.key === "Enter") {
        var items = list.querySelectorAll(".search__result a");
        if (selected >= 0 && items[selected]) {
          event.preventDefault();
          items[selected].click();
        }
      } else if (event.key === "Escape") {
        input.value = "";
        run();
      }
    });

    // Warm the index on first focus so the first keystroke feels instant.
    input.addEventListener("focus", load, { once: true });

    // Deep links: /search?q=kubernetes
    var initial = new URL(window.location.href).searchParams.get("q");
    if (initial) {
      input.value = initial;
      run();
    }

    input.focus();
  }

  function boot() {
    document.querySelectorAll("[data-search-root]").forEach(init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
