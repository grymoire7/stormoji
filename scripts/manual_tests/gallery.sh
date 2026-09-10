#!/usr/bin/env bash
# Scripted regression test for the Gallery page (gallery.html, gallery.js,
# gallery-data.js): grid rendering, per-emoji name tooltips, header
# navigation links, shared theme, and the submission mailto link. See
# docs/manual_tests.md.

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

# --- Scenario 5: hovering an emoji shows its name in the tooltip ---

expected_name=$(rodney js "(function(){ var emojiChar = document.querySelectorAll('.gallery-grid .story-card')[0].querySelectorAll('.emoji')[0].textContent; var name = null; for (var cat in emojiCategories) { emojiCategories[cat].forEach(function(o){ if (o.emoji === emojiChar) name = o.name; }); } return name; })()")

rodney js "(function(){ document.querySelectorAll('.gallery-grid .story-card')[0].querySelectorAll('.emoji')[0].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })); return true; })()" >/dev/null
tooltip_text=$(rodney js "document.getElementById('tooltip').textContent")
tooltip_opacity_shown=$(rodney js "document.getElementById('tooltip').style.opacity")

if [ "$tooltip_text" = "$expected_name" ] && [ "$tooltip_opacity_shown" = "1" ]; then
  echo "PASS: hovering the first card's first emoji shows its name ('$expected_name') in the tooltip"
else
  echo "FAIL: expected tooltip text '$expected_name' with opacity 1; got text '$tooltip_text' opacity '$tooltip_opacity_shown'" >&2
  exit 1
fi

rodney js "(function(){ document.querySelectorAll('.gallery-grid .story-card')[0].querySelectorAll('.emoji')[0].dispatchEvent(new MouseEvent('mouseleave', { bubbles: true })); return true; })()" >/dev/null
tooltip_opacity_hidden=$(rodney js "document.getElementById('tooltip').style.opacity")

if [ "$tooltip_opacity_hidden" = "0" ]; then
  echo "PASS: the mouse leaving the emoji hides the tooltip"
else
  echo "FAIL: expected tooltip opacity 0 after mouseleave, got '$tooltip_opacity_hidden'" >&2
  exit 1
fi

# --- Scenario 6: hovering an emoji after the page has scrolled still positions
# the tooltip against the emoji's actual (scrolled) position, not where it
# would sit if the page were still at the top ---

rodney js "(function(){ window.scrollTo(0, 200); return true; })()" >/dev/null

tooltip_position=$(rodney js "(function(){ var el = document.querySelectorAll('.gallery-grid .story-card')[0].querySelectorAll('.emoji')[0]; el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })); var rect = el.getBoundingClientRect(); var tt = document.getElementById('tooltip'); var actualTop = parseFloat(tt.style.top); var expectedTop = rect.top + window.scrollY - tt.offsetHeight - 10; return JSON.stringify({ actualTop: actualTop, expectedTop: expectedTop }); })()")
rodney js "(function(){ document.querySelectorAll('.gallery-grid .story-card')[0].querySelectorAll('.emoji')[0].dispatchEvent(new MouseEvent('mouseleave', { bubbles: true })); return true; })()" >/dev/null
rodney js "(function(){ window.scrollTo(0, 0); return true; })()" >/dev/null

actual_top=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['actualTop'])" "$tooltip_position")
expected_top=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['expectedTop'])" "$tooltip_position")
position_matches=$(python3 -c "print(abs($actual_top - $expected_top) < 0.5)")

if [ "$position_matches" = "True" ]; then
  echo "PASS: after scrolling, the tooltip is positioned against the emoji's actual on-page location (top=$actual_top)"
else
  echo "FAIL: expected tooltip top ~$expected_top after scrolling, got '$actual_top' (tooltip ignored scroll offset)" >&2
  exit 1
fi
