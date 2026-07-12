#!/usr/bin/env bash
# Scripted regression test for the story-history render (open/close
# toggle, seeded card content, live update while open) and CSV export
# (notification, filename, exact file content). Combined into one script
# because both flows read/write the same stormoji-stories localStorage
# key and share the same seeding approach. See docs/manual_tests.md.

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
  echo "ERROR: python3 is not installed or not on PATH (used for portable date formatting)." >&2
  exit 1
fi

if ! curl -fsS -o /dev/null "$BASE_URL/index.html"; then
  echo "ERROR: $BASE_URL is not reachable." >&2
  echo "Start a local server with: python3 -m http.server 8000" >&2
  exit 1
fi

start_rodney

INDEX_URL="$BASE_URL/index.html"

rodney open "$INDEX_URL" >/dev/null
rodney waitload >/dev/null
clear_storage
rodney reload --hard >/dev/null
rodney waitload >/dev/null

# --- Scenario 1: empty history shows the placeholder ---

rodney click "#history-toggle" >/dev/null
rodney sleep 0.2 >/dev/null

placeholder_text=$(rodney text "#story-cards")
toggle_text=$(rodney text "#history-toggle")
container_display=$(rodney js "document.getElementById('history-container').style.display")
if [ "$placeholder_text" = "No stories in your history yet." ] && [ "$toggle_text" = "close history" ] && [ "$container_display" = "block" ]; then
  echo "PASS: empty history shows the placeholder, toggle reads 'close history', container is visible"
else
  echo "FAIL: expected placeholder text, 'close history', display=block; got text='$placeholder_text' toggle='$toggle_text' display='$container_display'" >&2
  exit 1
fi

# --- Scenario 2: seeded stories render in order with correct content ---

# Dates must be within the 6-month retention window (pruneStoriesOlderThan,
# app.js), not just any past date - Scenario 4 below performs a real share,
# which prunes on every save, and would silently delete fixed old-year
# fixture dates (e.g. hardcoded "2020-01-02") before that scenario's
# assertion ever runs. Compute dates 60/90 days back instead, so this
# script keeps working no matter what "today" is when it runs.
IFS='|' read -r story_a_key story_a_date story_b_key story_b_date <<< "$(python3 -c "
import datetime
now = datetime.datetime.now(datetime.timezone.utc)
a = now - datetime.timedelta(days=60)
b = now - datetime.timedelta(days=90)
def key(d): return d.strftime('%Y-%m-%d')
def human(d): return d.strftime('%B') + ' ' + str(d.day) + ', ' + str(d.year)
print(key(a) + '|' + human(a) + '|' + key(b) + '|' + human(b))
")"

rodney js "(function(){ localStorage.setItem('stormoji-stories', JSON.stringify([{dateKey:'$story_a_key', date:'$story_a_date', emojis:'😀 🐻 🍔 ⚽', story:'The bear ate a burger before soccer practice.'},{dateKey:'$story_b_key', date:'$story_b_date', emojis:'🐶 🎉 🚗 🍕', story:'The dog drove to a pizza party.'}])); return true; })()" >/dev/null
rodney reload --hard >/dev/null
rodney waitload >/dev/null
rodney click "#history-toggle" >/dev/null
rodney sleep 0.2 >/dev/null

card_count=$(rodney count ".story-card")
first_date=$(rodney js "document.querySelectorAll('.story-card-date')[0].textContent")
first_emojis=$(rodney js "document.querySelectorAll('.story-card-emojis')[0].textContent")
first_story=$(rodney js "document.querySelectorAll('.story-card-text')[0].textContent")
second_date=$(rodney js "document.querySelectorAll('.story-card-date')[1].textContent")
second_story=$(rodney js "document.querySelectorAll('.story-card-text')[1].textContent")

if [ "$card_count" = "2" ] \
  && [ "$first_date" = "$story_a_date" ] && [ "$first_emojis" = "😀 🐻 🍔 ⚽" ] && [ "$first_story" = "The bear ate a burger before soccer practice." ] \
  && [ "$second_date" = "$story_b_date" ] && [ "$second_story" = "The dog drove to a pizza party." ]; then
  echo "PASS: seeded stories render as cards, in order, with correct date/emojis/story content"
else
  echo "FAIL: expected 2 cards in seeded order; got count=$card_count first=[$first_date|$first_emojis|$first_story] second=[$second_date|$second_story]" >&2
  exit 1
fi

# --- Scenario 3: toggling again closes the history panel ---

rodney click "#history-toggle" >/dev/null
rodney sleep 0.2 >/dev/null

toggle_text=$(rodney text "#history-toggle")
container_display=$(rodney js "document.getElementById('history-container').style.display")
if [ "$toggle_text" = "open history" ] && [ "$container_display" = "none" ]; then
  echo "PASS: toggling again closes the history panel"
else
  echo "FAIL: expected 'open history' and display=none; got toggle='$toggle_text' display='$container_display'" >&2
  exit 1
fi

# --- Scenario 4: sharing while history is open updates the card list live ---

rodney click "#history-toggle" >/dev/null
rodney sleep 0.2 >/dev/null
rodney js "navigator.clipboard.writeText = () => Promise.resolve()" >/dev/null
NEW_STORY_TEXT="A brand new shared story for today"
type_into_story "$NEW_STORY_TEXT"
rodney click "#share-btn" >/dev/null
rodney sleep 0.3 >/dev/null

card_count=$(rodney count ".story-card")
newest_story=$(rodney js "document.querySelectorAll('.story-card-text')[0].textContent")
if [ "$card_count" = "3" ] && [ "$newest_story" = "$NEW_STORY_TEXT" ]; then
  echo "PASS: sharing while history is open adds the new card to the list immediately"
else
  echo "FAIL: expected 3 cards with newest = '$NEW_STORY_TEXT'; got count=$card_count newest='$newest_story'" >&2
  exit 1
fi

# --- Cleanup ---

clear_storage
