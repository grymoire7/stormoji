# History Render & CSV Export Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add scripted `rodney` regression coverage for the two remaining
uncovered DOM flows named in `docs/roadmap.md`'s Tests section - story
history render and CSV export - closing out that roadmap item (menu
open/close is already covered by `scripts/manual_tests/accessibility.sh`).

**Architecture:** One new script, `scripts/manual_tests/history_export.sh`,
following the exact structure of the two existing scripts
(`story_persistence.sh`, `accessibility.sh`): shared `lib.sh` helpers,
numbered scenarios that `echo "PASS: ..."` or `echo "FAIL: ..." >&2; exit
1`, run against a live local server via headless Chrome. CSV content
(otherwise unobservable in headless Chrome, since the app triggers a
`Blob`/object-URL download with no on-page target and no save dialog) is
verified by injecting JS that intercepts `URL.createObjectURL` (to capture
the actual `Blob` before its object URL is revoked) and
`HTMLAnchorElement.prototype.click` (to capture the intended filename).

**Tech Stack:** Bash (`set -euo pipefail`), [`rodney`](https://github.com/simonw/rodney)
(Chrome automation CLI, already used by the two existing scripts), no new
dependencies.

## Global Constraints

- No new tools/dependencies beyond `rodney` and `python3` (per
  `docs/manual_tests.md` > Principles - "Keep it dependency-free").
- Follow the existing scripts' exact structure/style (`set -euo pipefail`,
  `source lib.sh`, `parse_base_url "$@"`, `rodney`/reachability checks,
  `start_rodney`, numbered `# --- Scenario N: ... ---` blocks, `PASS`/`FAIL`
  echo + `exit 1` convention, cleanup at the end).
- Not CI-gated - these are manual/on-demand scripts, matching the existing
  two (per `docs/manual_tests.md`).
- This is test-only work: no changes to `app.js`, `index.html`, or
  `styles.css`.
- Commit messages use conventional commit format (this repo's convention).

---

### Task 1: Create `history_export.sh` - history render scenarios

**Files:**
- Create: `scripts/manual_tests/history_export.sh`

**Interfaces:**
- Consumes: `scripts/manual_tests/lib.sh`'s `parse_base_url`, `start_rodney`,
  `clear_storage`, `type_into_story` (all already defined, unchanged).
- Produces: an executable script file that Task 2 will append two more
  scenarios to (before its final `# --- Cleanup ---` section), and Task 3
  will register in `run_all.sh`.
- DOM contract this task depends on (from `app.js`/`index.html`, already
  shipped, not modified here): `#history-toggle` (link, text toggles
  "open history" / "close history"), `#history-container` (its
  `style.display` toggles `''`/`block` vs `'none'`), `#story-cards`
  (container the placeholder or `.story-card` elements render into), each
  card's `.story-card-date` / `.story-card-emojis` / `.story-card-text`,
  `#story-input`, `#share-btn`.

- [ ] **Step 1: Create the script file**

Create `scripts/manual_tests/history_export.sh`:

```bash
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

rodney js "(function(){ localStorage.setItem('stormoji-stories', JSON.stringify([{dateKey:'2020-06-15', date:'June 15, 2020', emojis:'😀 🐻 🍔 ⚽', story:'The bear ate a burger before soccer practice.'},{dateKey:'2020-01-02', date:'January 2, 2020', emojis:'🐶 🎉 🚗 🍕', story:'The dog drove to a pizza party.'}])); return true; })()" >/dev/null
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
  && [ "$first_date" = "June 15, 2020" ] && [ "$first_emojis" = "😀 🐻 🍔 ⚽" ] && [ "$first_story" = "The bear ate a burger before soccer practice." ] \
  && [ "$second_date" = "January 2, 2020" ] && [ "$second_story" = "The dog drove to a pizza party." ]; then
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
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x scripts/manual_tests/history_export.sh`

- [ ] **Step 3: Run it against a live local server**

```bash
(cd /Users/tracy/projects/stormoji && python3 -m http.server 8000 >/tmp/stormoji_http.log 2>&1 &)
sleep 1
scripts/manual_tests/history_export.sh
```

Expected: four `PASS:` lines (one per scenario), script exits 0. If any
`FAIL:` line appears, re-check the DOM selectors/assertions against the
current `app.js`/`index.html` (do not weaken the assertion to force a
pass).

- [ ] **Step 4: Stop the local server**

Run: `pkill -f "http.server 8000"`

- [ ] **Step 5: Commit**

```bash
git add scripts/manual_tests/history_export.sh
git commit -m "test: add scripted rodney coverage for story history render"
```

---

### Task 2: Add CSV export scenarios to `history_export.sh`

**Files:**
- Modify: `scripts/manual_tests/history_export.sh` (insert two new
  scenarios between Task 1's Scenario 4 and the `# --- Cleanup ---`
  section)

**Interfaces:**
- Consumes: the file created in Task 1, specifically the point right
  before its `# --- Cleanup ---` / `clear_storage` lines.
- Produces: the fully-scenario-complete script that Task 3 registers in
  `run_all.sh`.
- DOM contract this task depends on (from `app.js`/`index.html`, already
  shipped, not modified here): `#menu-btn`, `#menu-export`,
  `#notification-text`; and `app.js`'s `exportHistoryToCSV()` internals
  (`URL.createObjectURL`, `HTMLAnchorElement.prototype.click`,
  `link.download`), which is exactly what the interception JS below
  targets.

- [ ] **Step 1: Insert the CSV export scenarios**

Edit `scripts/manual_tests/history_export.sh`: replace the line

```bash
# --- Cleanup ---

clear_storage
```

with:

```bash
# --- Scenario 5: empty history exports nothing, shows the right notification ---

clear_storage
rodney reload --hard >/dev/null
rodney waitload >/dev/null
# Intercept URL.createObjectURL to capture the actual Blob (the app
# revokes its object URL immediately after triggering the download, so a
# later, separate `rodney js` fetch() of the URL would fail - but a
# reference to the Blob itself survives that revocation), and intercept
# HTMLAnchorElement.prototype.click to capture the intended filename
# before calling through to the original (real) click.
rodney js "(function(){ window.__lastBlob = null; window.__lastDownloadName = null; var origCreate = URL.createObjectURL.bind(URL); URL.createObjectURL = function(blob){ window.__lastBlob = blob; return origCreate(blob); }; var origClick = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function(){ window.__lastDownloadName = this.download; return origClick.call(this); }; return true; })()" >/dev/null

rodney click "#menu-btn" >/dev/null
rodney click "#menu-export" >/dev/null
rodney sleep 0.3 >/dev/null

notification_text=$(rodney text "#notification-text")
blob_still_null=$(rodney js "window.__lastBlob === null")
if [ "$notification_text" = "No stories to export" ] && [ "$blob_still_null" = "true" ]; then
  echo "PASS: exporting an empty history shows the right notification and attempts no download"
else
  echo "FAIL: expected notification 'No stories to export' and no blob captured; got notification='$notification_text' blob_still_null=$blob_still_null" >&2
  exit 1
fi

# --- Scenario 6: non-empty history exports the correct filename and CSV content ---

rodney js "(function(){ localStorage.setItem('stormoji-stories', JSON.stringify([{dateKey:'2021-03-04', date:'March 4, 2021', emojis:'a b c d', story:'Line one, a \"quote\", a comma, and a\nnew line'}])); return true; })()" >/dev/null
rodney reload --hard >/dev/null
rodney waitload >/dev/null
rodney js "(function(){ window.__lastBlob = null; window.__lastDownloadName = null; var origCreate = URL.createObjectURL.bind(URL); URL.createObjectURL = function(blob){ window.__lastBlob = blob; return origCreate(blob); }; var origClick = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function(){ window.__lastDownloadName = this.download; return origClick.call(this); }; return true; })()" >/dev/null

rodney click "#menu-btn" >/dev/null
rodney click "#menu-export" >/dev/null
rodney sleep 0.3 >/dev/null

# exportHistoryToCSV's filename uses the browser's *local* date (unlike
# the rest of the app, which is UTC-anchored) - read the expected date
# from the browser itself rather than computing it in the shell, so the
# assertion matches the code's actual (local-time) behavior regardless of
# host timezone.
expected_date_str=$(rodney js "(function(){ var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); })()")
expected_filename="stormoji-history-${expected_date_str}.csv"
actual_filename=$(rodney js "window.__lastDownloadName")

notification_text=$(rodney text "#notification-text")
actual_csv=$(rodney js "window.__lastBlob.text()")
expected_csv=$'"Date Key","Date","Emojis","Story"\n"2021-03-04","March 4, 2021","a b c d","Line one, a ""quote"", a comma, and a\nnew line"'

if [ "$notification_text" = "History exported successfully!" ] && [ "$actual_filename" = "$expected_filename" ] && [ "$actual_csv" = "$expected_csv" ]; then
  echo "PASS: non-empty history exports the correct filename ($actual_filename) and exact CSV content"
else
  echo "FAIL: expected notification 'History exported successfully!', filename='$expected_filename', matching CSV content; got notification='$notification_text' filename='$actual_filename'" >&2
  echo "--- expected CSV ---" >&2
  echo "$expected_csv" >&2
  echo "--- actual CSV ---" >&2
  echo "$actual_csv" >&2
  exit 1
fi

# --- Cleanup ---

clear_storage
```

- [ ] **Step 2: Run the full script against a live local server**

```bash
(cd /Users/tracy/projects/stormoji && python3 -m http.server 8000 >/tmp/stormoji_http.log 2>&1 &)
sleep 1
scripts/manual_tests/history_export.sh
```

Expected: six `PASS:` lines total (four from Task 1's scenarios, two new
ones), script exits 0.

- [ ] **Step 3: Stop the local server**

Run: `pkill -f "http.server 8000"`

- [ ] **Step 4: Commit**

```bash
git add scripts/manual_tests/history_export.sh
git commit -m "test: add scripted rodney coverage for CSV export"
```

---

### Task 3: Wire into `run_all.sh`, document, and update the roadmap

**Files:**
- Modify: `scripts/manual_tests/run_all.sh:44` (register the new script)
- Modify: `docs/manual_tests.md` (new `##` section)
- Modify: `docs/roadmap.md:75-83` (mark the Tests item done)

**Interfaces:**
- Consumes: `scripts/manual_tests/history_export.sh` (from Tasks 1-2),
  invoked the same way `run_all.sh` already invokes the other two scripts.

- [ ] **Step 1: Register the script in `run_all.sh`**

In `scripts/manual_tests/run_all.sh`, find:

```bash
run_script "story_persistence.sh" "$SCRIPT_DIR/story_persistence.sh" --base-url "$BASE_URL"
run_script "accessibility.sh" "$SCRIPT_DIR/accessibility.sh" --base-url "$BASE_URL"
```

Replace with:

```bash
run_script "story_persistence.sh" "$SCRIPT_DIR/story_persistence.sh" --base-url "$BASE_URL"
run_script "accessibility.sh" "$SCRIPT_DIR/accessibility.sh" --base-url "$BASE_URL"
run_script "history_export.sh" "$SCRIPT_DIR/history_export.sh" --base-url "$BASE_URL"
```

- [ ] **Step 2: Add a new section to `docs/manual_tests.md`**

Append after the existing "## Menu, modal & character counter
accessibility" section (i.e., at the end of the file):

```markdown

## Story history render & CSV export

Tests the story-history panel (open/close toggle, seeded card content,
live update while open when sharing) and the CSV export menu action
(empty-history notification, non-empty notification, exact filename, and
exact file content) - see `app.js`'s `displayStoryHistory()` and
`exportHistoryToCSV()`.

Script: `scripts/manual_tests/history_export.sh [--base-url URL]`
(default `http://localhost:8000`)

CSV content is verified by intercepting `URL.createObjectURL` (to capture
the actual `Blob`, since the app revokes its object URL immediately after
triggering the download) and `HTMLAnchorElement.prototype.click` (to
capture the intended filename) via injected JS - not a new dependency,
just `rodney js`.

1. Opening history with no saved stories shows the "No stories in your
   history yet." placeholder, and the toggle/container update correctly.
2. Two seeded stories render as cards, in order, with correct
   date/emojis/story content.
3. Toggling again closes the history panel.
4. Sharing a new story while history is open updates the card list
   immediately, without needing to close/reopen.
5. Exporting an empty history shows the "No stories to export"
   notification and attempts no download.
6. Exporting a non-empty history (including a story requiring CSV
   escaping - comma, quote, and an embedded newline) shows the success
   notification, and the exported filename and file content are exactly
   correct.
```

- [ ] **Step 3: Update `docs/roadmap.md`'s Tests item**

In `docs/roadmap.md`, find:

```markdown
## Tests

- [ ] DOM-driven flows (history render, CSV export, menu open/close)
      still have no automated coverage - only the pure logic extracted
      from `app.js` is unit tested. Playwright was judged too heavy for
      this project's size; the story-textarea flow (share, reload,
      draft autosave, browser-restore) now has scripted `rodney`
      coverage instead (`scripts/manual_tests/story_persistence.sh` -
      see `docs/manual_tests.md`), which is a lighter-weight pattern
      worth extending to the remaining DOM flows if they keep needing
      manual re-verification.
```

Replace with:

```markdown
## Tests

- [x] DOM-driven flows (history render, CSV export, menu open/close)
      still have no automated coverage - only the pure logic extracted
      from `app.js` is unit tested. Playwright was judged too heavy for
      this project's size; the story-textarea flow (share, reload,
      draft autosave, browser-restore) now has scripted `rodney`
      coverage instead (`scripts/manual_tests/story_persistence.sh` -
      see `docs/manual_tests.md`), which is a lighter-weight pattern
      worth extending to the remaining DOM flows if they keep needing
      manual re-verification.
      Fixed: menu open/close and the character counter got scripted
      `rodney` coverage in `scripts/manual_tests/accessibility.sh`.
      History render and CSV export are now covered too, in
      `scripts/manual_tests/history_export.sh` - see
      `docs/specs/2026-07-12-history-export-tests-design.md`
      for the design (notably, CSV content is verified by intercepting
      `URL.createObjectURL`/`HTMLAnchorElement.prototype.click`, since
      headless Chrome has no on-page element or save dialog to target
      directly).
```

- [ ] **Step 4: Run the full suite end-to-end**

```bash
(cd /Users/tracy/projects/stormoji && python3 -m http.server 8000 >/tmp/stormoji_http.log 2>&1 &)
sleep 1
scripts/manual_tests/run_all.sh
```

Expected: `==== Summary ====` block lists all three scripts as `PASS`,
overall exit code 0.

- [ ] **Step 5: Stop the local server**

Run: `pkill -f "http.server 8000"`

- [ ] **Step 6: Also run the Node unit test suite as a sanity check**

Run: `npm test`
Expected: all existing tests still pass (this task touched no
`app.js`/pure-logic code, so this should be unaffected - confirms nothing
was accidentally broken).

- [ ] **Step 7: Commit**

```bash
git add scripts/manual_tests/run_all.sh docs/manual_tests.md docs/roadmap.md
git commit -m "docs: wire up history/export test script and close roadmap item"
```
