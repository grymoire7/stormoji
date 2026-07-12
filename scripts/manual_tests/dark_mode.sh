#!/usr/bin/env bash
# Scripted regression test for prefers-color-scheme dark mode support.
# See docs/manual_tests.md for how to read the results.
#
# Headless Chrome on macOS follows the real OS Appearance setting for
# prefers-color-scheme - there's no rodney/CDP flag to emulate it
# directly - so this script actually toggles System Events' appearance
# preference, restoring the original value in a trap on exit (even on
# failure) so it doesn't leave the developer's machine in a different
# appearance than it found it.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

parse_base_url "$@"

if ! command -v rodney >/dev/null 2>&1; then
  echo "ERROR: rodney is not installed or not on PATH." >&2
  echo "See docs/manual_tests.md > Requirements." >&2
  exit 1
fi

if ! curl -fsS -o /dev/null "$BASE_URL/index.html"; then
  echo "ERROR: $BASE_URL is not reachable." >&2
  echo "Start a local server with: python3 -m http.server 8000" >&2
  exit 1
fi

ORIGINAL_DARK=$(osascript -e 'tell application "System Events" to tell appearance preferences to get dark mode')

# Not using lib.sh's start_rodney here: it does `trap 'rodney stop' EXIT`,
# and bash's `trap ... EXIT` *replaces* rather than stacks - calling it
# would silently drop the appearance-restore trap below, leaving the
# developer's Mac stuck in dark mode if a later step fails. One combined
# cleanup function instead; rodney is started/stopped directly.
cleanup() {
  rodney stop >/dev/null 2>&1 || true
  osascript -e "tell application \"System Events\" to tell appearance preferences to set dark mode to $ORIGINAL_DARK" >/dev/null
}
trap cleanup EXIT

SCREENSHOT_DIR=$(mktemp -d)

INDEX_URL="$BASE_URL/index.html"

# --- Scenario 1: light mode renders the expected literal colors ---

osascript -e 'tell application "System Events" to tell appearance preferences to set dark mode to false'
rodney start >/dev/null
rodney open "$INDEX_URL" >/dev/null
rodney waitload >/dev/null

matches_dark=$(rodney js "matchMedia('(prefers-color-scheme: dark)').matches")
bg=$(rodney js "getComputedStyle(document.body).backgroundColor")
share_bg=$(rodney js "getComputedStyle(document.querySelector('.share-btn')).backgroundColor")
textarea_bg=$(rodney js "getComputedStyle(document.getElementById('story-input')).backgroundColor")
textarea_color=$(rodney js "getComputedStyle(document.getElementById('story-input')).color")
if [ "$matches_dark" = "false" ] && [ "$bg" = "rgb(249, 249, 249)" ] && [ "$share_bg" = "rgb(74, 111, 165)" ] && [ "$textarea_bg" = "rgb(255, 255, 255)" ] && [ "$textarea_color" = "rgb(51, 51, 51)" ]; then
  echo "PASS: light mode renders the expected background, button, and textarea colors"
else
  echo "FAIL: expected matches_dark=false bg=rgb(249, 249, 249) share_bg=rgb(74, 111, 165) textarea_bg=rgb(255, 255, 255) textarea_color=rgb(51, 51, 51); got matches_dark=$matches_dark bg=$bg share_bg=$share_bg textarea_bg=$textarea_bg textarea_color=$textarea_color" >&2
  exit 1
fi

rodney screenshot "$SCREENSHOT_DIR/light.png" >/dev/null
echo "  screenshot: $SCREENSHOT_DIR/light.png"

rodney stop >/dev/null

# --- Scenario 2: dark mode renders the expected literal colors ---

osascript -e 'tell application "System Events" to tell appearance preferences to set dark mode to true'
rodney start >/dev/null
rodney open "$INDEX_URL" >/dev/null
rodney waitload >/dev/null

matches_dark=$(rodney js "matchMedia('(prefers-color-scheme: dark)').matches")
bg=$(rodney js "getComputedStyle(document.body).backgroundColor")
link=$(rodney js "getComputedStyle(document.getElementById('history-toggle')).color")
share_bg=$(rodney js "getComputedStyle(document.querySelector('.share-btn')).backgroundColor")
textarea_bg=$(rodney js "getComputedStyle(document.getElementById('story-input')).backgroundColor")
textarea_color=$(rodney js "getComputedStyle(document.getElementById('story-input')).color")
if [ "$matches_dark" = "true" ] && [ "$bg" = "rgb(26, 26, 26)" ] && [ "$link" = "rgb(138, 180, 232)" ] && [ "$share_bg" = "rgb(74, 111, 165)" ] && [ "$textarea_bg" = "rgb(42, 42, 42)" ] && [ "$textarea_color" = "rgb(230, 230, 230)" ]; then
  echo "PASS: dark mode renders the expected background, link, button, and textarea colors"
else
  echo "FAIL: expected matches_dark=true bg=rgb(26, 26, 26) link=rgb(138, 180, 232) share_bg=rgb(74, 111, 165) textarea_bg=rgb(42, 42, 42) textarea_color=rgb(230, 230, 230); got matches_dark=$matches_dark bg=$bg link=$link share_bg=$share_bg textarea_bg=$textarea_bg textarea_color=$textarea_color" >&2
  exit 1
fi

rodney screenshot "$SCREENSHOT_DIR/dark.png" >/dev/null
echo "  screenshot: $SCREENSHOT_DIR/dark.png"

# --- Scenario 3: dark-mode text/background contrast clears WCAG AA (4.5:1) ---

contrast_ok=$(rodney js "(function(){
  function toLinear(c){ c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
  function luminance(rgb){
    var m = rgb.match(/\d+/g).map(Number);
    return 0.2126*toLinear(m[0]) + 0.7152*toLinear(m[1]) + 0.0722*toLinear(m[2]);
  }
  function contrast(a, b){
    var la = luminance(a), lb = luminance(b);
    var lighter = Math.max(la, lb), darker = Math.min(la, lb);
    return (lighter + 0.05) / (darker + 0.05);
  }
  var bg = getComputedStyle(document.body).backgroundColor;
  var text = getComputedStyle(document.body).color;
  var link = getComputedStyle(document.getElementById('history-toggle')).color;
  var muted = getComputedStyle(document.querySelector('.footer')).color;
  return contrast(text, bg) >= 4.5 && contrast(link, bg) >= 4.5 && contrast(muted, bg) >= 4.5;
})()")
if [ "$contrast_ok" = "true" ]; then
  echo "PASS: dark-mode text/link/muted colors clear 4.5:1 contrast against the background"
else
  echo "FAIL: expected all three dark-mode text colors to clear 4.5:1 contrast, got $contrast_ok" >&2
  exit 1
fi

# --- Scenario 4: choosing "Light" overrides a dark OS preference ---
# (still on the Scenario 2/3 browser instance - OS is still dark mode.)

rodney js "localStorage.removeItem('stormoji-theme')" >/dev/null
rodney reload --hard >/dev/null
rodney waitload >/dev/null

rodney click "#menu-btn" >/dev/null
rodney click "[data-theme-choice='light']" >/dev/null
rodney sleep 0.2 >/dev/null

data_theme=$(rodney js "document.documentElement.getAttribute('data-theme')")
bg=$(rodney js "getComputedStyle(document.body).backgroundColor")
textarea_bg=$(rodney js "getComputedStyle(document.getElementById('story-input')).backgroundColor")
light_checked=$(rodney js "document.querySelector('[data-theme-choice=\"light\"]').getAttribute('aria-checked')")
dark_checked=$(rodney js "document.querySelector('[data-theme-choice=\"dark\"]').getAttribute('aria-checked')")
system_checked=$(rodney js "document.querySelector('[data-theme-choice=\"system\"]').getAttribute('aria-checked')")
menu_shown=$(rodney js "document.getElementById('menu-dropdown').classList.contains('show')")
stored=$(rodney js "localStorage.getItem('stormoji-theme')")
if [ "$data_theme" = "light" ] && [ "$bg" = "rgb(249, 249, 249)" ] && [ "$textarea_bg" = "rgb(255, 255, 255)" ] && [ "$light_checked" = "true" ] && [ "$dark_checked" = "false" ] && [ "$system_checked" = "false" ] && [ "$menu_shown" = "true" ] && [ "$stored" = "light" ]; then
  echo "PASS: choosing Light forces light colors (including the textarea, which - unlike CSS custom properties - the browser can natively dark-render on its own via color-scheme) even while the OS is in dark mode, updates aria-checked/localStorage, and leaves the menu open"
else
  echo "FAIL: expected data-theme=light bg=rgb(249, 249, 249) textarea_bg=rgb(255, 255, 255) checked(light/dark/system)=true/false/false menu_shown=true stored=light; got data-theme=$data_theme bg=$bg textarea_bg=$textarea_bg checked=$light_checked/$dark_checked/$system_checked menu_shown=$menu_shown stored=$stored" >&2
  exit 1
fi

rodney screenshot "$SCREENSHOT_DIR/light-override-on-dark-os.png" >/dev/null
echo "  screenshot: $SCREENSHOT_DIR/light-override-on-dark-os.png"

# --- Scenario 5: "System" removes the override, and a stored choice persists across reload ---

rodney click "[data-theme-choice='system']" >/dev/null
rodney sleep 0.2 >/dev/null

has_data_theme=$(rodney js "document.documentElement.hasAttribute('data-theme')")
stored=$(rodney js "localStorage.getItem('stormoji-theme')")
if [ "$has_data_theme" = "false" ] && [ "$stored" = "system" ]; then
  echo "PASS: choosing System removes the data-theme override, following the OS preference again"
else
  echo "FAIL: expected data-theme attribute removed and stored=system; got data-theme-present=$has_data_theme stored=$stored" >&2
  exit 1
fi

rodney js "localStorage.setItem('stormoji-theme', 'dark')" >/dev/null
rodney reload --hard >/dev/null
rodney waitload >/dev/null

data_theme=$(rodney js "document.documentElement.getAttribute('data-theme')")
if [ "$data_theme" = "dark" ]; then
  echo "PASS: a stored theme choice persists and re-applies across reload"
else
  echo "FAIL: expected data-theme=dark after reload with stormoji-theme='dark' in localStorage, got $data_theme" >&2
  exit 1
fi

rodney js "localStorage.removeItem('stormoji-theme')" >/dev/null

echo "Screenshots saved to: $SCREENSHOT_DIR"
