# eu-central-2

Dark-only Hugo theme for [eu-central-2.ch](https://eu-central-2.ch/). Lives in
this repository rather than as a submodule.

Requires Hugo **0.158 or newer** (the shipped `config.yaml` uses the `locale`
key, which replaced `languageCode` in 0.158). Builds with **plain Hugo** — no
extended build, no Node, no Bun. Nothing here uses Sass, PostCSS or `js.Build`,
because the deploy workflow installs standard Hugo via `peaceiris/actions-hugo`.

---

## Colour system

The palette is four accents on `#474448`. Their roles are fixed by measured
contrast, not taste — see the header comment in `assets/css/tokens.css`.

| Token | Value | Contrast on bg | Role |
|---|---|---|---|
| `--accent` | `#EC0B43` | **2.0:1** | Fills only. Never text on the background. White on it is 4.6:1, which passes AA. |
| `--accent-link` | `#7AE7C7` | 6.1:1 | Links, interactive text |
| `--accent-soft` | `#D6FFB7` | 8.1:1 | Hover states, secondary decoration |
| `--accent-mark` | `#FFF689` | 8.2:1 | Blockquote rule, search match marks |

House rule: one accent per component, accents on small or interactive
elements only. The single primary CTA (`.btn--primary`) is the one place an
accent is a large filled area.

`#EC0B43` as body text on `#474448` fails WCAG AA badly. If you need red text,
lighten it or put it on a white fill.

---

## Content types

### Posts — `content/posts/<slug>/index.md`

```yaml
---
title: "Post title"
date: '2025-11-15T00:00:00+01:00'
summary: "Shown in list cards, search results and meta description."
tags: ["AWS", "Kubernetes"]
showToc: true        # optional, defaults to params.showToc
cover: "cover.png"   # optional, bundle-relative
share: false         # optional, hides the LinkedIn button
---
```

Cover images are optional. With no `cover` set, a bundle resource named
`cover`, `feature` or `thumbnail` is used; with neither, nothing is rendered.

### Talks — `content/talks/<slug>/index.md`

```yaml
---
title: "Talk title"
date: '2025-06-11T00:00:00+02:00'
summary: "One-line abstract."
event: "Cloud Native Zürich"
location: "Kino Abaton, Heinrichstrasse 269 · 8005 Zürich"
lat: 47.3897        # omit both lat and lon to omit the map
lon: 8.5203
zoom: 16            # optional, default 16
youtube: "https://www.youtube.com/watch?v=..."   # or youtu.be link, or bare ID
tags: ["Kubernetes", "AI"]
---
```

**Finding coordinates:** open [openstreetmap.org](https://www.openstreetmap.org/),
navigate to the venue, and read the URL hash — `#map=17/47.3897/8.5203` is
`zoom/lat/lon`. The three migrated talks currently carry *approximate*
coordinates; each is flagged with a comment in its front matter and should be
verified.

The map and the video block each render only when their fields are present, so
a talk with no recording and no known venue simply shows fewer sections.

### Tools — `content/tools/<slug>/index.md`

```yaml
---
title: "Zed"
date: '2025-04-12T00:00:00+02:00'
summary: "Shown on the tool card."
category: "Coding"   # REQUIRED — tools without one are skipped by the list
link: "https://zed.dev"
logo: "logo.png"     # optional, bundle-relative
tags: ["Editor", "Rust"]
---
```

The outbound link field is `link`, **not** `url`. `url` is a reserved Hugo
front matter key that overrides the page's own permalink, and setting it to an
external address fails the build with `URLs with protocol (http*) not
supported`.

`category` is required: `/tools` groups by it via `GroupByParam`, which drops
pages that lack the field. Group ordering is editorial, set by
`params.toolCategories` in `config.yaml`; unlisted categories are appended.

### New content

```bash
hugo new content posts/my-post/index.md
hugo new content talks/my-talk/index.md
hugo new content tools/my-tool/index.md
```

Archetypes live in `themes/eu-central-2/archetypes/` and are pre-filled with
the fields above.

---

## Shortcodes

| Shortcode | Purpose |
|---|---|
| `{{< youtube "URL-or-ID" >}}` | Privacy-preserving embed (see below) |
| `{{< video src="demo.mp4" poster="p.png" caption="..." >}}` | Self-hosted video |
| `{{< figure src="x.png" alt="..." caption="..." wide="true" >}}` | Captioned image |
| `{{< gallery columns="3" >}}...{{< /gallery >}}` | Image grid, wraps markdown images |
| `{{< notice type="warning" >}}...{{< /notice >}}` | Callout: `note`, `tip`, `warning`, `danger` |
| `{{< collapse summary="..." >}}...{{< /collapse >}}` | Disclosure widget |
| `{{< rawhtml >}}...{{< /rawhtml >}}` | Raw HTML escape hatch |

Plain markdown images are also upgraded automatically by the render hook in
`layouts/_default/_markup/render-image.html`: bundle-relative images get a
WebP `srcset` and lazy loading.

Captions on plain markdown images come from the **title**, not the alt text:

```markdown
![alt text for screen readers](photo.png "A visible caption")
```

Reusing alt text as a caption would make screen readers announce the same
sentence twice. An image with no title renders as a bare `<img>` with no
`<figure>` wrapper, so `![](photo.png)` stays clean.

### YouTube embeds request nothing from Google on page load

The embed renders as a facade — a poster frame plus a play button. The
`youtube-nocookie.com` iframe is injected only after a click.

The poster itself is fetched at **build time** via `resources.GetRemote` and
re-served from this origin, so even the thumbnail does not leak a visitor
request. This means the build makes an outbound request to `i.ytimg.com` per
video. A failed fetch is a warning, never a build failure — the facade falls
back to a play button on a dark surface.

---

## Configuration reference

All under `params:` in `config.yaml`.

| Param | Default | Purpose |
|---|---|---|
| `description` | — | Fallback meta description |
| `dateFormat` | `2 January 2006` | Go time layout |
| `showReadingTime` | `true` | Reading time in meta rows |
| `showBreadcrumbs` | `true` | Breadcrumbs on single pages |
| `showShareButtons` | `true` | LinkedIn share button |
| `showToc` / `tocOpen` | `true` / `false` | Table of contents default and initial state |
| `homePostLimit` | `5` | Recent posts on the homepage |
| `homeTagLimit` | `24` | Tags in the homepage cloud |
| `profile.*` | — | Hero logo, title, subtitle, buttons |
| `socialIcons[]` | — | `name` must exist in `partials/icon.html` |
| `toolCategories[]` | — | Editorial order for `/tools` groups |
| `searchSections[]` | posts, talks, tools | Sections included in the index |
| `searchContentChars` | `1200` | Body text per record in `index.json` |
| `mailerlite.*` | empty | See below |
| `leaflet.cssURL` / `jsURL` | unpkg 1.9.4 | CDN fallback, see below |
| `favicon` | derived from logo | Override favicon path |
| `customHead` | — | Raw HTML injected into `<head>` |

Available icon names: `linkedin`, `github`, `dev`, `mastodon`, `email`, `rss`,
`search`, `calendar`, `clock`, `pin`, `mic`, `tag`, `external`, `arrow-up`,
`chevron-left`, `chevron-right`, `play`.

---

## Newsletter (MailerLite)

Uses MailerLite's documented universal-snippet integration.

```yaml
params:
  mailerlite:
    accountId: "123456"   # from ml('account', '...')
    formId: "aBcDeF"      # from data-form="..."
    signupURL: ""         # optional fallback link while unconfigured
```

With `accountId` empty the theme ships **zero** third-party JavaScript and the
newsletter section renders a quiet placeholder. Once set, MailerLite's script
and cookies load on **every page**, not only the ones showing the form — that
is the tradeoff of the universal snippet. If it becomes a problem, switch to
their plain-HTML form endpoint and drop the snippet from `partials/head.html`.

MailerLite's own docs note their form CSS frequently conflicts with theme CSS.
Dark-palette overrides are scoped under `.newsletter` in
`assets/css/components.css`; expect to extend that block after inspecting the
live form.

---

## Maps (Leaflet + OpenStreetMap)

Leaflet loads lazily via `IntersectionObserver`, so it is fetched only when a
map scrolls into view — pages without coordinates never download it.

**Vendoring is recommended.** Drop these two files in and the theme picks
them up automatically, with no config change:

```
themes/eu-central-2/assets/vendor/leaflet/leaflet.css
themes/eu-central-2/assets/vendor/leaflet/leaflet.js
```

```bash
mkdir -p themes/eu-central-2/assets/vendor/leaflet
curl -fsSL -o themes/eu-central-2/assets/vendor/leaflet/leaflet.js \
  https://unpkg.com/leaflet@1.9.4/dist/leaflet.js
curl -fsSL -o themes/eu-central-2/assets/vendor/leaflet/leaflet.css \
  https://unpkg.com/leaflet@1.9.4/dist/leaflet.css
curl -fsSL -o themes/eu-central-2/assets/vendor/leaflet/LICENSE \
  https://raw.githubusercontent.com/Leaflet/Leaflet/main/LICENSE
```

Leaflet is BSD-2-Clause; keep the LICENSE file alongside it.

Until then it falls back to the pinned unpkg URLs in `params.leaflet`. **The
CDN fallback carries no Subresource Integrity hash** — a hash cannot be
computed without fetching the file. Vendor the files, or add `integrity`
attributes yourself in `assets/js/map.js`.

Tiles come from OpenStreetMap's public tile server, whose usage policy covers
light use only. Attribution is rendered and required. If traffic grows, move
to a keyed provider such as MapTiler.

---

## Search

`/search` runs a self-contained fuzzy matcher in `assets/js/search.js` against
`/index.json`. No search library is bundled.

Ranking, highest first:

1. exact substring at a word boundary
2. exact substring mid-word
3. subsequence — tolerates typos and abbreviations (`kubrnts` → Kubernetes)

Field weights favour titles and tags over body text. Multiple whitespace-
separated terms are ANDed, so adding words narrows results. Matches are
highlighted with `<mark>`, and `?q=` deep links work.

To swap in Fuse.js instead: vendor it to `assets/js/fuse.basic.min.js`, load it
before `search.js` in `layouts/_default/search.html`, and replace
`scoreRecord` — the surrounding UI code is independent of the matcher.

---

## Certifications carousel

Driven by `data/certifications.yaml` at the project root rather than a glob, so
each badge gets real alt text and an optional credential link.

```yaml
- title: "AWS Certified Solutions Architect – Professional"
  issuer: "Amazon Web Services"          # optional, appended to alt text
  image: "/aboutme/aws-...-professional.png"
  url: "https://www.credly.com/..."      # optional, makes the badge clickable
  alt: "..."                             # optional, overrides generated alt
```

Image paths resolve in two tiers:

1. a path under `assets/` → resized to WebP at build time
2. anything else → used verbatim as a URL

The shipped file uses tier 2, pointing at the badges already published by the
`content/aboutme/` bundle, so it works with no file moves. For build-time
optimisation:

```bash
mkdir -p assets/certifications
cp content/aboutme/*.png assets/certifications/
# then change each image to "certifications/<file>.png"
```

The carousel is manual by design: arrows, drag, keyboard, native swipe. No
autoplay, so there is no motion to opt out of and no focus stolen from
readers. Arrows are hidden on touch, where swiping is the native affordance.

---

## Verification

```bash
./scripts/smoke.sh          # build + assert every feature rendered
./scripts/smoke.sh --keep   # keep the output dir for inspection
```

Hugo has no unit test framework, so `scripts/smoke.sh` is the regression net:
it builds the site and greps the generated HTML for markers proving each
feature is wired up. Add an assertion there whenever you add a feature.

---

## Layout map

```
layouts/
  _default/
    baseof.html          frame: skip link, header, main, footer, script blocks
    single.html          posts and generic pages
    list.html            section and taxonomy term lists, paginated
    terms.html           /tags/ — renders the cloud
    search.html          /search/
    index.json           search index (home JSON output)
    _markup/
      render-image.html      responsive WebP srcset from bundle resources
      render-link.html       external links get target=_blank rel=noopener
      render-heading.html    hover anchors on h2-h6
      render-codeblock.html  wraps fences in .code-block for the copy button
  index.html             homepage: hero, posts, carousel, cloud, newsletter
  404.html
  talks/{list,single}.html
  tools/{list,single}.html
  partials/
    head.html header.html footer.html seo.html script.html icon.html
    hero.html social_icons.html share.html post_meta.html breadcrumbs.html
    tags.html tag_cloud.html toc.html entry.html pagination.html
    talk_meta.html map.html video.html certifications.html newsletter.html
assets/
  css/  tokens reset base chroma components media   (concatenated in head.html)
  js/   app carousel map search                     (loaded per page)
```

JavaScript is loaded per page, not globally: `app.js` everywhere (copy
buttons, back-to-top, video facades), `carousel.js` on the homepage,
`map.js` only on talks with coordinates, `search.js` only on `/search`.
