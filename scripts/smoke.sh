#!/usr/bin/env bash
#
# smoke.sh — build the site and assert the theme's features actually rendered.
#
# Hugo has no unit test framework, so this is the regression net: it greps the
# generated HTML for markers that prove each feature is wired up. Every task
# that adds a feature should add an assertion here.
#
# Usage:
#   ./scripts/smoke.sh            # build into a temp dir and check
#   ./scripts/smoke.sh --keep     # keep the output dir for inspection
#
set -uo pipefail

cd "$(dirname "$0")/.."

KEEP=0
[[ "${1:-}" == "--keep" ]] && KEEP=1

OUT="$(mktemp -d "${TMPDIR:-/tmp}/ec2-smoke.XXXXXX")"
OUT_MIN="$(mktemp -d "${TMPDIR:-/tmp}/ec2-smoke-min.XXXXXX")"
cleanup() { [[ "$KEEP" -eq 1 ]] || rm -rf "$OUT" "$OUT_MIN"; }
trap cleanup EXIT

FAILED=0
CHECKS=0

pass() { printf '  \033[32mok\033[0m   %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAILED=$((FAILED + 1)); }

# assert_file <description> <path-relative-to-output>
assert_file() {
  CHECKS=$((CHECKS + 1))
  if [[ -f "$OUT/$2" ]]; then pass "$1"; else fail "$1 (missing $2)"; fi
}

# assert_glob <description> <glob-relative-to-output>
assert_glob() {
  CHECKS=$((CHECKS + 1))
  # shellcheck disable=SC2086
  if compgen -G "$OUT/$2" > /dev/null; then pass "$1"; else fail "$1 (no match for $2)"; fi
}

# assert_contains <description> <path> <fixed-string>
assert_contains() {
  CHECKS=$((CHECKS + 1))
  if [[ ! -f "$OUT/$2" ]]; then
    fail "$1 (missing $2)"
    return
  fi
  if grep -qF -- "$3" "$OUT/$2"; then pass "$1"; else fail "$1 ('$3' not found in $2)"; fi
}

# assert_absent <description> <path> <fixed-string>
assert_absent() {
  CHECKS=$((CHECKS + 1))
  if [[ ! -f "$OUT/$2" ]]; then
    fail "$1 (missing $2)"
    return
  fi
  if grep -qF -- "$3" "$OUT/$2"; then fail "$1 ('$3' unexpectedly present in $2)"; else pass "$1"; fi
}

# assert_glob_in <root> <description> <glob-relative-to-root>
assert_glob_in() {
  CHECKS=$((CHECKS + 1))
  if compgen -G "$1/$3" > /dev/null; then pass "$2"; else fail "$2 (no match for $3)"; fi
}

# assert_tree_contains <description> <dir-relative-to-output> <fixed-string>
# Used where the marker must appear *somewhere* in a section rather than in one
# named file, so the check does not depend on the contents of a single post.
assert_tree_contains() {
  CHECKS=$((CHECKS + 1))
  if grep -rqF -- "$3" "$OUT/$2" 2>/dev/null; then pass "$1"; else fail "$1 ('$3' not found under $2)"; fi
}

echo "==> Building into $OUT"
# Deliberately NOT minified. --minify strips quotes from attribute values
# (class="header" becomes class=header), which would make every assertion below
# depend on minifier behaviour rather than on the templates. The minified build
# is exercised separately at the end.
if ! hugo --destination "$OUT" --cleanDestinationDir --logLevel warn; then
  echo "==> Build FAILED"
  exit 1
fi
echo "==> Build succeeded"

echo
echo "==> Core pages"
assert_file  "homepage renders"                 "index.html"
assert_file  "404 renders"                      "404.html"
assert_file  "search page renders"              "search/index.html"
assert_file  "posts list renders"               "posts/index.html"
assert_file  "talks list renders"               "talks/index.html"
assert_file  "tools list renders"               "tools/index.html"
assert_file  "tags terms page renders"          "tags/index.html"
assert_file  "RSS feed renders"                 "index.xml"
assert_file  "sitemap renders"                  "sitemap.xml"
assert_file  "robots.txt renders"               "robots.txt"

echo
echo "==> Assets"
assert_glob  "stylesheet is built"              "css/eu-central-2*.css"
assert_glob  "app.js is built"                  "js/app*.js"

echo
echo "==> Base chrome (task 2)"
assert_contains "header present"                "index.html" 'class="header"'
assert_contains "skip link present"             "index.html" 'class="skip-link"'
assert_contains "footer present"                "index.html" 'class="footer"'
assert_contains "footer links list present"     "index.html" 'class="footer__links"'
# Regression guard: icons ship with no width/height attributes, so an icon
# without the .icon class stretches to fill its container (see the reset's
# svg { max-width: 100% }). This caught a full-width footer RSS icon once.
assert_contains "icons carry sizing class"      "index.html" '<svg class="icon"'
assert_contains "dark theme-color set"          "index.html" '#474448'
assert_absent   "no light-mode toggle"          "index.html" 'theme-toggle'

echo
echo "==> Prose and code highlighting (task 3)"
assert_tree_contains "code blocks are wrapped"  "posts" 'class="code-block"'
assert_tree_contains "chroma classes emitted"   "posts" 'class="chroma"'

echo
echo "==> Post single (task 4)"
assert_contains "post meta rendered"            "posts/who-is-rag/index.html" 'class="meta"'
assert_contains "breadcrumbs rendered"          "posts/who-is-rag/index.html" 'class="breadcrumbs"'
assert_contains "tag pills rendered"            "posts/who-is-rag/index.html" 'class="tag"'
assert_contains "canonical URL set"             "posts/who-is-rag/index.html" 'rel="canonical"'
assert_contains "open graph title set"          "posts/who-is-rag/index.html" 'property="og:title"'

echo
echo "==> LinkedIn share (task 4)"
assert_contains "share link on posts"           "posts/who-is-rag/index.html" 'linkedin.com/sharing/share-offsite/?url='
assert_contains "share link on talks"           "talks/ai-wont-replace-your-platform-team/index.html" 'linkedin.com/sharing/share-offsite/?url='
assert_contains "share link on tools"           "tools/zed/index.html" 'linkedin.com/sharing/share-offsite/?url='

echo
echo "==> Tag cloud (task 6)"
assert_contains "cloud on tags page"            "tags/index.html" 'class="tag-cloud"'
assert_contains "cloud weights emitted"         "tags/index.html" '--w:'
assert_contains "cloud on homepage"             "index.html" 'class="tag-cloud"'

echo
echo "==> Talks (tasks 7 & 8)"
assert_contains "talk metadata block"           "talks/ai-wont-replace-your-platform-team/index.html" 'class="talk-meta"'
assert_contains "event name rendered"           "talks/ai-wont-replace-your-platform-team/index.html" 'Cloud Native Zürich'
assert_contains "video facade, not raw iframe"  "talks/ai-wont-replace-your-platform-team/index.html" 'class="video__facade"'
assert_absent   "no eager youtube iframe"       "talks/ai-wont-replace-your-platform-team/index.html" '<iframe'
assert_contains "map container present"         "talks/ai-wont-replace-your-platform-team/index.html" 'data-map'
assert_contains "map has coordinates"           "talks/ai-wont-replace-your-platform-team/index.html" 'data-lat="47.3897"'
assert_contains "OSM fallback link present"     "talks/ai-wont-replace-your-platform-team/index.html" 'openstreetmap.org'
assert_contains "map script loaded on talk"     "talks/ai-wont-replace-your-platform-team/index.html" 'js/map'
assert_absent   "map script absent elsewhere"   "posts/who-is-rag/index.html" 'js/map'

echo
echo "==> Tools (task 9)"
assert_contains "tool cards rendered"           "tools/index.html" 'class="tool-card"'
assert_contains "category grouping rendered"    "tools/index.html" 'Coding'
assert_contains "outbound link on tool page"    "tools/zed/index.html" 'https://zed.dev'

echo
echo "==> Search (task 10)"
assert_file     "search index built"            "index.json"
assert_contains "search root present"           "search/index.html" 'data-search-root'
assert_contains "search script loaded"          "search/index.html" 'js/search'
assert_contains "index covers posts"            "index.json" '"section":"Blog"'
assert_contains "index covers talks"            "index.json" '"section":"Talks"'
assert_contains "index covers tools"            "index.json" '"section":"Tools"'

echo
echo "==> Homepage composition (task 11)"
assert_contains "hero rendered"                 "index.html" 'class="hero"'
assert_contains "social icons rendered"         "index.html" 'class="socials"'
assert_contains "recent posts rendered"         "index.html" 'class="entry"'
assert_contains "carousel rendered"             "index.html" 'data-carousel-root'
assert_contains "carousel script loaded"        "index.html" 'js/carousel'
assert_contains "newsletter section rendered"   "index.html" 'id="newsletter"'
assert_contains "badges have alt text"          "index.html" 'alt="AWS Certified Solutions Architect'

echo
echo "==> Accessibility invariants (task 13)"
assert_contains "html lang set"                 "index.html" '<html lang='
assert_contains "icons hidden from AT"          "index.html" 'aria-hidden="true"'
assert_contains "carousel track is focusable"   "index.html" 'tabindex="0"'

echo
echo "==> Production build (what CI runs)"
CHECKS=$((CHECKS + 1))
if hugo --destination "$OUT_MIN" --cleanDestinationDir --minify --logLevel warn > /dev/null; then
  pass "minified build succeeds"
else
  fail "minified build succeeds"
fi
assert_glob_in "$OUT_MIN" "minified homepage emitted" "index.html"

echo
printf '==> %d checks, %d failed\n' "$CHECKS" "$FAILED"
[[ "$KEEP" -eq 1 ]] && echo "==> Output kept at $OUT (minified: $OUT_MIN)"

exit $(( FAILED > 0 ? 1 : 0 ))
