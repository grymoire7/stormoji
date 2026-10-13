#!/usr/bin/env bash
# Scripted regression test for History Import (the "Import History" menu
# item, #import-file input, and #import-modal result dialog): success merge
# rules, all-or-nothing failure, dismissing the modal, and the dark theme.
# See docs/manual_tests.md.

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

start_rodney

TMP_DIR="$(mktemp -d)"
trap 'rodney stop >/dev/null; rm -rf "$TMP_DIR"' EXIT

# Seed: browser "B" already has one story, for 2026-07-11.
SEED_JS="(function(){ localStorage.setItem('stormoji-stories', JSON.stringify([{dateKey:'2026-07-11', date:'July 11, 2026', emojis:'😀 🐻 🍔 ⚽', story:'browser B version'}])); return true; })()"

open_fresh() {
  rodney open "$BASE_URL/index.html" >/dev/null
  rodney waitload >/dev/null
  clear_storage
  rodney js "$SEED_JS" >/dev/null
  rodney reload --hard >/dev/null
  rodney waitload >/dev/null
}

# import_file PATH - choose a file in the hidden input, wait for the modal
import_file() {
  rodney file "#import-file" "$1" >/dev/null
  for _ in $(seq 1 50); do
    if [ "$(modal_display)" = "flex" ]; then
      return 0
    fi
    sleep 0.1
  done
  echo "FAIL: import modal never appeared" >&2
  exit 1
}

modal_display() { rodney js "getComputedStyle(document.getElementById('import-modal')).display"; }
modal_title() { rodney js "document.getElementById('import-modal-title').textContent"; }
modal_text() { rodney js "document.getElementById('import-modal-body').textContent"; }
stored_keys() { rodney js "JSON.parse(localStorage.getItem('stormoji-stories')).map(function(s){return s.dateKey}).join(',')"; }
stored_story() { rodney js "JSON.parse(localStorage.getItem('stormoji-stories')).filter(function(s){return s.dateKey==='$1'})[0].story"; }

cat > "$TMP_DIR/good.csv" <<'CSV'
"Date Key","Date","Emojis","Story"
"2026-07-11","July 11, 2026","😀 🐻 🍔 ⚽","browser A version"
"2026-07-10","July 10, 2026","🏹 🚘 🎧 🔧","She said, ""go"",
then left."
"2019-01-01","January 1, 2019","🌞 🌚 🌟 🌙","an old one"
CSV

cat > "$TMP_DIR/bad_date.csv" <<'CSV'
"Date Key","Date","Emojis","Story"
"2026-07-10","July 10, 2026","🏹 🚘 🎧 🔧","fine"
"2025-13-40","Nonsense","🏹 🚘 🎧 🔧","bad"
CSV

cat > "$TMP_DIR/missing_column.csv" <<'CSV'
"Date Key","Date","Story"
"2026-07-10","July 10, 2026","no emojis column"
CSV

# --- Scenario 1: the menu item exists and is wired to the file picker ---

open_fresh
rodney click "#menu-btn" >/dev/null
label=$(rodney text "#menu-import")
accept=$(rodney attr "#import-file" accept)
if [ "$label" = "Import History" ] && [[ "$accept" == *.csv* ]]; then
  echo "PASS: the menu has 'Import History' and the hidden file input accepts .csv"
else
  echo "FAIL: expected 'Import History' / .csv accept; got '$label' / '$accept'" >&2
  exit 1
fi

# --- Scenario 2: successful import merges; browser's story wins; old rows kept ---

open_fresh
import_file "$TMP_DIR/good.csv"

title=$(modal_title)
text=$(modal_text)
keys=$(stored_keys)
conflict=$(stored_story "2026-07-11")
multiline=$(rodney js "JSON.parse(localStorage.getItem('stormoji-stories')).filter(function(s){return s.dateKey==='2026-07-10'})[0].story === 'She said, \"go\",\nthen left.'")

if [ "$title" = "Import complete" ] && [[ "$text" == *"Imported 2 stories."* ]] && [[ "$text" == *"View history to see the imported entries."* ]]; then
  echo "PASS: success modal reports the count and points to history"
else
  echo "FAIL: unexpected success modal: title='$title' text='$text'" >&2
  exit 1
fi

if [ "$keys" = "2026-07-11,2026-07-10,2019-01-01" ] && [ "$conflict" = "browser B version" ] && [ "$multiline" = "true" ]; then
  echo "PASS: merged newest-first, the browser's own story won the date conflict, quotes/newlines survived, the 2019 row was kept"
else
  echo "FAIL: stored keys='$keys' conflict story='$conflict' multiline ok='$multiline'" >&2
  exit 1
fi

# --- Scenario 3: the modal can be dismissed three ways ---

rodney click "#import-ok" >/dev/null
after_ok=$(modal_display)
import_file "$TMP_DIR/good.csv"
rodney click "#import-close" >/dev/null
after_x=$(modal_display)
import_file "$TMP_DIR/good.csv"
rodney js "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))" >/dev/null
after_esc=$(modal_display)

if [ "$after_ok" = "none" ] && [ "$after_x" = "none" ] && [ "$after_esc" = "none" ]; then
  echo "PASS: OK, the close button, and Escape each dismiss the modal (and re-importing the same file works)"
else
  echo "FAIL: display after OK='$after_ok', ×='$after_x', Escape='$after_esc'" >&2
  exit 1
fi

# --- Scenario 4: a bad row fails the whole file and names the row ---

open_fresh
import_file "$TMP_DIR/bad_date.csv"
title=$(modal_title)
text=$(modal_text)
keys=$(stored_keys)

if [ "$title" = "Import failed" ] && [[ "$text" == *"Row 3"* ]] && [[ "$text" == *"2025-13-40"* ]] && [ "$keys" = "2026-07-11" ]; then
  echo "PASS: one bad row fails the import, names Row 3, and imports nothing (including the good row)"
else
  echo "FAIL: title='$title' text='$text' stored keys='$keys'" >&2
  exit 1
fi

# --- Scenario 5: a missing column is named ---

open_fresh
import_file "$TMP_DIR/missing_column.csv"
title=$(modal_title)
text=$(modal_text)

if [ "$title" = "Import failed" ] && [[ "$text" == *"Emojis"* ]]; then
  echo "PASS: a file missing the Emojis column fails and names it"
else
  echo "FAIL: title='$title' text='$text'" >&2
  exit 1
fi

# --- Scenario 6: the open history list updates after import ---

open_fresh
rodney click "#history-toggle" >/dev/null
before=$(rodney count "#story-cards .story-card")
import_file "$TMP_DIR/good.csv"
after=$(rodney count "#story-cards .story-card")

if [ "$before" = "1" ] && [ "$after" = "3" ]; then
  echo "PASS: an already-open history list refreshes to show the imported entries"
else
  echo "FAIL: expected 1 then 3 history cards; got $before then $after" >&2
  exit 1
fi

# --- Scenario 7: the modal follows the theme ---

open_fresh
rodney js "(function(){ localStorage.setItem('stormoji-theme', 'dark'); return true; })()" >/dev/null
rodney reload --hard >/dev/null
rodney waitload >/dev/null
import_file "$TMP_DIR/good.csv"
dark_bg=$(rodney js "getComputedStyle(document.querySelector('#import-modal .modal-content')).backgroundColor")
dark_fg=$(rodney js "getComputedStyle(document.getElementById('import-modal-title')).color")
rodney js "(function(){ localStorage.removeItem('stormoji-theme'); return true; })()" >/dev/null

if [ "$dark_bg" = "rgb(42, 42, 42)" ] && [ "$dark_bg" != "$dark_fg" ]; then
  echo "PASS: in dark mode the modal uses the dark surface ($dark_bg) with readable text ($dark_fg)"
else
  echo "FAIL: dark mode modal background='$dark_bg' title color='$dark_fg'" >&2
  exit 1
fi
