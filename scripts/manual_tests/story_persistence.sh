#!/usr/bin/env bash
# Scripted regression test for the story textarea's daily-puzzle surface
# area (app.js, window.onload): UTC-anchored date/emoji selection, the
# browser's own form-control-state restoration race, and draft autosave.
# See docs/manual_tests.md for how to read the results.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

parse_base_url "$@"

if ! command -v rodney >/dev/null 2>&1; then
  echo "ERROR: rodney is not installed or not on PATH." >&2
  echo "See docs/manual_tests.md > Requirements." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 is not installed or not on PATH (used for portable UTC date formatting)." >&2
  exit 1
fi

if ! curl -fsS -o /dev/null "$BASE_URL/index.html"; then
  echo "ERROR: $BASE_URL is not reachable." >&2
  echo "Start a local server with: python3 -m http.server 8000" >&2
  exit 1
fi

start_rodney

INDEX_URL="$BASE_URL/index.html"
SCRATCH_URL="$BASE_URL/emoji-data.js"

# --- Scenario 1: fresh load, no story/draft for today ---

rodney open "$INDEX_URL" >/dev/null
rodney waitload >/dev/null
clear_storage
rodney reload --hard >/dev/null
rodney waitload >/dev/null

story_value=$(rodney js "document.getElementById('story-input').value")
if [ -z "$story_value" ]; then
  echo "PASS: fresh load with no saved story/draft leaves the textarea empty"
else
  echo "FAIL: expected empty textarea on fresh load, got '$story_value'" >&2
  exit 1
fi

# --- Scenario 2: displayed date and emoji count reflect UTC ---

expected_date=$(python3 -c "
import datetime
d = datetime.datetime.now(datetime.timezone.utc)
print(d.strftime('%B') + ' ' + str(d.day) + ', ' + str(d.year))
")
displayed_date=$(rodney text "#current-date")
emoji_count=$(rodney count ".emoji")

if [ "$displayed_date" = "$expected_date" ] && [ "$emoji_count" = "4" ]; then
  echo "PASS: displayed date '$displayed_date' matches UTC, $emoji_count emoji rendered"
else
  echo "FAIL: expected date '$expected_date' and 4 emoji; got date='$displayed_date' emoji_count=$emoji_count" >&2
  exit 1
fi

# --- Scenario 3: unsaved draft survives a reload ---

DRAFT_TEXT_1="Scenario 3 unsaved draft before reload"
type_into_story "$DRAFT_TEXT_1"
rodney sleep 1 >/dev/null
rodney reload --hard >/dev/null
rodney waitload >/dev/null

story_value=$(rodney js "document.getElementById('story-input').value")
if [ "$story_value" = "$DRAFT_TEXT_1" ]; then
  echo "PASS: unsaved draft survives a reload"
else
  echo "FAIL: expected draft '$DRAFT_TEXT_1' after reload, got '$story_value'" >&2
  exit 1
fi

# --- Scenario 4: unsaved draft survives the browser's own form-state restore ---

DRAFT_TEXT_2="Scenario 4 draft surviving browser back forward restore"
type_into_story "$DRAFT_TEXT_2"
rodney sleep 1 >/dev/null
trigger_browser_restore "$SCRATCH_URL"

story_value=$(rodney js "document.getElementById('story-input').value")
if [ "$story_value" = "$DRAFT_TEXT_2" ]; then
  echo "PASS: draft survives the browser's own back/forward form-state restoration"
else
  echo "FAIL: expected draft '$DRAFT_TEXT_2' after back/forward, got '$story_value'" >&2
  exit 1
fi

# --- Scenario 5: sharing clears the draft; reload shows the shared story ---

clear_storage
rodney reload --hard >/dev/null
rodney waitload >/dev/null

SHARED_TEXT="Scenario 5 a shared story"
type_into_story "$SHARED_TEXT"
rodney js "navigator.clipboard.writeText = () => Promise.resolve()" >/dev/null
rodney click "#share-btn" >/dev/null
rodney sleep 0.3 >/dev/null
rodney reload --hard >/dev/null
rodney waitload >/dev/null

story_value=$(rodney js "document.getElementById('story-input').value")
draft_after_share=$(rodney js "localStorage.getItem('stormoji-draft')")
if [ "$story_value" = "$SHARED_TEXT" ] && [ "$draft_after_share" = "null" ]; then
  echo "PASS: shared story reloads correctly and the draft key is cleared"
else
  echo "FAIL: expected story '$SHARED_TEXT' and cleared draft; got story='$story_value' draft='$draft_after_share'" >&2
  exit 1
fi

# --- Scenario 6: typing more after sharing (without re-sharing) wins on reload ---

MORE_TEXT="Scenario 6 a shared story plus more typed after sharing"
type_into_story "$MORE_TEXT"
rodney sleep 1 >/dev/null
rodney reload --hard >/dev/null
rodney waitload >/dev/null

story_value=$(rodney js "document.getElementById('story-input').value")
if [ "$story_value" = "$MORE_TEXT" ]; then
  echo "PASS: post-share edits reload as the newer draft, not the stale shared version"
else
  echo "FAIL: expected '$MORE_TEXT' after reload, got '$story_value'" >&2
  exit 1
fi

# --- Scenario 7: an explicitly-emptied draft stays empty, doesn't fall back ---

type_into_story ""
rodney sleep 1 >/dev/null
rodney reload --hard >/dev/null
rodney waitload >/dev/null

story_value=$(rodney js "document.getElementById('story-input').value")
if [ -z "$story_value" ]; then
  echo "PASS: explicitly-emptied draft stays empty on reload (doesn't fall back to the shared story)"
else
  echo "FAIL: expected empty textarea, got '$story_value'" >&2
  exit 1
fi

# --- Scenario 8: a story/draft dated yesterday doesn't bleed into today ---

clear_storage
yesterday_key=$(python3 -c "
import datetime
d = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
print(d.strftime('%Y-%m-%d'))
")
rodney js "(function(){ localStorage.setItem('stormoji-stories', JSON.stringify([{dateKey: \"$yesterday_key\", date: \"yesterday\", emojis: \"a b c d\", story: \"Yesterday leftover story\"}])); localStorage.setItem('stormoji-draft', JSON.stringify({dateKey: \"$yesterday_key\", story: \"Yesterday leftover draft\"})); return true; })()" >/dev/null
rodney reload --hard >/dev/null
rodney waitload >/dev/null

story_value=$(rodney js "document.getElementById('story-input').value")
if [ -z "$story_value" ]; then
  echo "PASS: a story/draft dated yesterday does not bleed into today's textarea"
else
  echo "FAIL: expected empty textarea, got '$story_value' (leaked from a previous day)" >&2
  exit 1
fi

# --- Cleanup ---

clear_storage
