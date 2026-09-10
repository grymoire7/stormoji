#!/usr/bin/env bash
# Scripted regression test for the Gallery page (gallery.html, gallery.js,
# gallery-data.js): grid rendering, header navigation links, shared theme,
# and the submission mailto link. See docs/manual_tests.md.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

parse_base_url "$@"

if ! command -v rodney >/dev/null 2>&1; then
  echo "ERROR: rodney is not installed or not on PATH." >&2
  echo "See docs/manual_tests.md > Requirements." >&2
  exit 1
fi

if ! curl -fsS -o /dev/null "$BASE_URL/gallery.html"; then
  echo "ERROR: $BASE_URL is not reachable." >&2
  echo "Start a local server with: python3 -m http.server 8000" >&2
  exit 1
fi

start_rodney

GALLERY_URL="$BASE_URL/gallery.html"

# --- Scenario 1: grid renders one card per entry, emojis + story, no date ---

rodney open "$GALLERY_URL" >/dev/null
rodney waitload >/dev/null

expected_count=$(rodney js "galleryStories.length")
rendered_count=$(rodney count ".gallery-grid .story-card")
date_count=$(rodney count ".gallery-grid .story-card-date")

if [ "$rendered_count" = "$expected_count" ] && [ "$date_count" = "0" ]; then
  echo "PASS: gallery grid renders $rendered_count cards (matching galleryStories.length), with no date shown"
else
  echo "FAIL: expected $expected_count cards and 0 date elements; got $rendered_count cards and $date_count date elements" >&2
  exit 1
fi

first_emojis=$(rodney js "galleryStories[0].emojis")
rendered_first_emojis=$(rodney js "document.querySelector('.gallery-grid .story-card .story-card-emojis').textContent")

if [ "$rendered_first_emojis" = "$first_emojis" ]; then
  echo "PASS: first card's emojis match galleryStories[0]"
else
  echo "FAIL: expected emojis '$first_emojis', got '$rendered_first_emojis'" >&2
  exit 1
fi

# --- Scenario 2: header navigation - gallery -> game and back ---

rodney click "#back-link" >/dev/null
rodney waitload >/dev/null
current_path=$(rodney js "window.location.pathname")

if [[ "$current_path" == */index.html ]]; then
  echo "PASS: the back link (👈) navigates from the gallery to index.html"
else
  echo "FAIL: expected to land on index.html, got path '$current_path'" >&2
  exit 1
fi

rodney click "#gallery-link" >/dev/null
rodney waitload >/dev/null
current_path=$(rodney js "window.location.pathname")

if [[ "$current_path" == */gallery.html ]]; then
  echo "PASS: the header 🖼️ link navigates from index.html to the gallery"
else
  echo "FAIL: expected to land on gallery.html, got path '$current_path'" >&2
  exit 1
fi

rodney click "#home-link" >/dev/null
rodney waitload >/dev/null
current_path=$(rodney js "window.location.pathname")

if [[ "$current_path" == */index.html ]]; then
  echo "PASS: the ⛈ Stormoji title on the gallery page navigates back to index.html"
else
  echo "FAIL: expected to land on index.html, got path '$current_path'" >&2
  exit 1
fi

# --- Scenario 3: the gallery page respects a theme choice set on the main page ---

rodney js "(function(){ localStorage.setItem('stormoji-theme', 'dark'); return true; })()" >/dev/null
rodney open "$GALLERY_URL" >/dev/null
rodney waitload >/dev/null

theme_attr=$(rodney js "document.documentElement.getAttribute('data-theme')")
if [ "$theme_attr" = "dark" ]; then
  echo "PASS: the gallery page picks up the 'dark' theme saved from the main page"
else
  echo "FAIL: expected data-theme='dark' on the gallery page, got '$theme_attr'" >&2
  exit 1
fi

rodney js "(function(){ localStorage.removeItem('stormoji-theme'); return true; })()" >/dev/null

# --- Scenario 4: the submission mailto link ---

mailto_href=$(rodney attr "#gallery-mailto-link" href)
if [ "$mailto_href" = "mailto:tracy@stormoji.com" ]; then
  echo "PASS: the submission link points to mailto:tracy@stormoji.com"
else
  echo "FAIL: expected mailto:tracy@stormoji.com, got '$mailto_href'" >&2
  exit 1
fi
