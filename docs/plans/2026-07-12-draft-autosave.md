# Draft Autosave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Autosave in-progress story drafts to a separate localStorage key so an accidental reload or tab close before clicking Share doesn't lose unsaved writing.

**Architecture:** A new `stormoji-draft` localStorage key holds a single `{ dateKey, story }` record, overwritten by a debounced `input` listener on the story textarea. On load (and on the existing `pageshow` re-check), a draft matching today's date key wins over a finalized story for today; the draft is cleared on successful share. A new pure `getDraftForToday` function carries the day-matching logic and is unit tested; everything else is DOM wiring inside `window.onload`, verified with a new scripted `rodney` regression test that also covers two related fixes shipped earlier (browser form-state restoration, UTC date anchoring) so they get re-runnable coverage too.

**Tech Stack:** Vanilla JavaScript, `localStorage`, Node's built-in test runner (`node:test`), `rodney` (Chrome automation CLI) for scripted browser verification, `python3` (already used to serve the app locally) for portable UTC date formatting in test assertions.

**Design Document:** `docs/plans/2026-07-12-draft-autosave-design.md`

## Global Constraints

- No new dependencies - no npm packages, no build step. `package.json`/`node:test` already exist for pure-logic unit tests; nothing new to install there either.
- Commit messages use conventional commit format (`fix:`, `feat:`, `test:`, `docs:`), one logical change per commit.
- Pure, dependency-free logic lives at module scope in `app.js` and is exported via the existing `module.exports` guard (no-op in the browser) for unit testing in `app.test.js`. DOM/localStorage-touching code stays inside `window.onload` and is not unit tested - it's verified with scripted `rodney` browser checks instead, per this repo's established convention (see `CLAUDE.md` > Testing).
- New date/time logic must be UTC-anchored (matching `formatDateKey`/`dateSeed`), never the browser's local timezone.
- Follow the existing `docs/plans/YYYY-MM-DD-<feature>[-design].md` naming convention for any new planning docs.

---

## Task 1: `getDraftForToday` pure function + unit tests

**Files:**
- Modify: `app.js:109-113` (insert after `findStoryForDate`, before `upsertStory`), and the `module.exports` block at the end of `app.js`
- Modify: `app.test.js` (add to the `require` list and add new tests after the existing `findStoryForDate` tests)

**Interfaces:**
- Produces: `getDraftForToday(draft, todayKey)` - pure function, module scope in `app.js`, added to `module.exports`. Takes `draft` (either `null` or an object shaped `{ dateKey: string, story: string }`) and `todayKey` (a `YYYY-MM-DD` string, same format as everywhere else in this codebase). Returns `draft.story` (a string, possibly `''`) if `draft` is non-null and `draft.dateKey === todayKey`; otherwise returns `null`. Task 2 consumes this.

- [ ] **Step 1: Write the failing tests**

In `app.test.js`, add `getDraftForToday` to the `require` destructure (`app.test.js:4-15`):

```javascript
const {
    hashCode,
    seededRandom,
    shuffleArray,
    getDefaultEmojis,
    selectDailyEmojis,
    formatDateKey,
    findStoryForDate,
    getDraftForToday,
    upsertStory,
    pruneStoriesOlderThan,
    escapeCSV
} = require('./app.js');
```

Then insert these four tests immediately after the existing `'findStoryForDate returns undefined when today has no saved story'` test (`app.test.js:42-47`) and before the `'seededRandom is deterministic for the same seed'` test:

```javascript
test('getDraftForToday returns the draft story when its dateKey matches today', () => {
    const draft = { dateKey: '2026-07-11', story: 'in-progress writing' };
    assert.equal(getDraftForToday(draft, '2026-07-11'), 'in-progress writing');
});

test('getDraftForToday returns the empty string when the draft is explicitly empty', () => {
    // An explicitly-saved empty draft (user deleted everything they typed)
    // must be distinguishable from "no draft at all" - both are falsy-ish,
    // but only null means "ignore me."
    const draft = { dateKey: '2026-07-11', story: '' };
    assert.equal(getDraftForToday(draft, '2026-07-11'), '');
});

test('getDraftForToday returns null when the draft is for a different day', () => {
    const draft = { dateKey: '2026-07-10', story: 'yesterday leftovers' };
    assert.equal(getDraftForToday(draft, '2026-07-11'), null);
});

test('getDraftForToday returns null when there is no draft', () => {
    assert.equal(getDraftForToday(null, '2026-07-11'), null);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL - `TypeError: getDraftForToday is not a function` (it isn't exported/defined yet), while the other pre-existing tests still pass.

- [ ] **Step 3: Implement `getDraftForToday`**

In `app.js`, find this exact block (`app.js:109-114`):

```javascript
// Find the saved story matching a given date key, if any
function findStoryForDate(stories, dateKey) {
    return stories.find(item => item.dateKey === dateKey);
}

// Insert or replace the story for a given date, keeping stories sorted newest first
function upsertStory(stories, entry) {
```

Replace it with:

```javascript
// Find the saved story matching a given date key, if any
function findStoryForDate(stories, dateKey) {
    return stories.find(item => item.dateKey === dateKey);
}

// Return the draft's story if it belongs to the given date key, else null.
// null (not undefined) distinguishes "no relevant draft" from "the saved
// draft is an explicitly-empty string" - callers rely on this.
function getDraftForToday(draft, todayKey) {
    return draft && draft.dateKey === todayKey ? draft.story : null;
}

// Insert or replace the story for a given date, keeping stories sorted newest first
function upsertStory(stories, entry) {
```

Then find this exact block in the `module.exports` at the end of the file:

```javascript
        findStoryForDate,
        upsertStory,
```

Replace it with:

```javascript
        findStoryForDate,
        getDraftForToday,
        upsertStory,
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS - all tests pass, including the 4 new ones (test count increases from 18 to 22).

- [ ] **Step 5: Commit**

```bash
git add app.js app.test.js
git commit -m "$(cat <<'EOF'
feat: add getDraftForToday for draft/story-for-today matching

Pure, unit-tested lookup: returns a draft's story when its dateKey
matches today, null otherwise (including when there's no draft at
all). The null sentinel (vs. an empty string) is what will let the
draft-autosave load logic in the next commit distinguish "no draft"
from "an explicitly emptied one."
EOF
)"
```

---

## Task 2: Wire debounced autosave, load precedence, and clear-on-share

**Files:**
- Modify: `app.js:434-457` (inside `window.onload` - draft read, `applyTodayStory`, new `input` listener)
- Modify: `app.js:337-339` (inside `shareStory` - clear the draft after a successful share)

**Interfaces:**
- Consumes: `getDraftForToday(draft, todayKey)` from Task 1 (same file, module scope, called directly - no import needed).
- Produces: a `stormoji-draft` localStorage key (`{ dateKey, story }`), written by a debounced `input` listener on `#story-input`; `applyTodayStory()`'s new precedence (draft > shared story > empty); `stormoji-draft` removal in `shareStory()`. Task 3 verifies all of this via a scripted browser test.

- [ ] **Step 1: Add draft read, extend `applyTodayStory`, add the debounced autosave listener**

In `app.js`, find this exact block (`app.js:434-457`):

```javascript
        // Check if there's a story for today
        const storiesJSON = localStorage.getItem('stormoji-stories') || '[]';
        const stories = JSON.parse(storiesJSON);

        const todayKey = formatDateKey(today);
        const todayStory = findStoryForDate(stories, todayKey);

        // Some browsers restore a field's previous value on history navigation
        // (back/forward) asynchronously, after this script has already run -
        // silently overwriting the correct value below. Re-applying on
        // 'pageshow' (which fires after that restoration) wins the race.
        function applyTodayStory() {
            if (todayStory) {
                storyInput.value = todayStory.story;
            } else {
                // Clear the story input if there's no story for today
                storyInput.value = '';
            }
        }
        applyTodayStory();
        window.addEventListener('pageshow', applyTodayStory);

        // Event listeners
        shareBtn.addEventListener('click', shareStory);
```

Replace it with:

```javascript
        // Check if there's a story for today
        const storiesJSON = localStorage.getItem('stormoji-stories') || '[]';
        const stories = JSON.parse(storiesJSON);

        const todayKey = formatDateKey(today);
        const todayStory = findStoryForDate(stories, todayKey);

        const draftJSON = localStorage.getItem('stormoji-draft');
        const draft = draftJSON ? JSON.parse(draftJSON) : null;

        // Some browsers restore a field's previous value on history navigation
        // (back/forward) asynchronously, after this script has already run -
        // silently overwriting the correct value below. Re-applying on
        // 'pageshow' (which fires after that restoration) wins the race.
        function applyTodayStory() {
            const todayDraft = getDraftForToday(draft, todayKey);
            if (todayDraft !== null) {
                // A draft (even an explicitly-empty one) always wins over a
                // shared story, since sharing itself updates the textarea's
                // content the draft was last saved from - the draft can
                // only be newer.
                storyInput.value = todayDraft;
            } else if (todayStory) {
                storyInput.value = todayStory.story;
            } else {
                // Clear the story input if there's no story or draft for today
                storyInput.value = '';
            }
        }
        applyTodayStory();
        window.addEventListener('pageshow', applyTodayStory);

        // Autosave the in-progress draft so an accidental reload/tab-close
        // before clicking Share doesn't lose it. Debounced so typing
        // doesn't hit localStorage on every keystroke.
        let draftSaveTimer;
        storyInput.addEventListener('input', () => {
            clearTimeout(draftSaveTimer);
            draftSaveTimer = setTimeout(() => {
                localStorage.setItem('stormoji-draft', JSON.stringify({ dateKey: todayKey, story: storyInput.value }));
            }, 600);
        });

        // Event listeners
        shareBtn.addEventListener('click', shareStory);
```

- [ ] **Step 2: Clear the draft after a successful share**

In `app.js`, find this exact block (`app.js:337-340`):

```javascript
            // Save to history
            saveStoryToHistory(story, emojis, formattedDate, todayKey);

            // Copy to clipboard (unavailable in non-secure contexts and some browsers)
```

Replace it with:

```javascript
            // Save to history
            saveStoryToHistory(story, emojis, formattedDate, todayKey);

            // The shared content is now in permanent history - clear the
            // separate draft record so a later reload shows the shared
            // story instead of stale draft data. Typing more after this
            // point re-creates the draft via the 'input' listener above.
            localStorage.removeItem('stormoji-draft');

            // Copy to clipboard (unavailable in non-secure contexts and some browsers)
```

- [ ] **Step 3: Run the unit tests to confirm nothing broke**

Run: `npm test`
Expected: PASS - all 22 tests still pass (this change only touches DOM-wiring code inside `window.onload`, which isn't unit tested, so the count doesn't change; this step is a regression check on the pure-logic suite).

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "$(cat <<'EOF'
feat: autosave in-progress story drafts

Debounced (600ms) autosave of the story textarea to a new
stormoji-draft localStorage key, distinct from the finalized
stormoji-stories history. On load (and on the existing pageshow
re-check), a draft for today wins over a finalized story for today,
since the user may keep editing after sharing without re-sharing.
Cleared on successful share.

Closes the "No draft autosave" item in docs/roadmap.md: previously,
reloading or closing the tab before clicking Share lost whatever the
user was writing. See docs/plans/2026-07-12-draft-autosave-design.md
for the full design.

Browser verification (scripted rodney test) follows in the next
commit.
EOF
)"
```

---

## Task 3: Scripted browser regression test (`scripts/manual_tests/`)

**Files:**
- Create: `scripts/manual_tests/lib.sh`
- Create: `scripts/manual_tests/story_persistence.sh`
- Create: `scripts/manual_tests/run_all.sh`
- Create: `docs/manual_tests.md`

**Interfaces:**
- Consumes: the running app as shipped by Tasks 1-2, served locally (`python3 -m http.server 8000`), and the `rodney` CLI (already installed - confirmed available earlier in this project).
- Produces: a re-runnable scripted regression check for the whole story-textarea surface area (UTC date/emoji anchoring, browser form-state restoration, draft autosave), documented in `docs/manual_tests.md`. No later task depends on this programmatically - it's a standalone verification tool.

- [ ] **Step 1: Create `scripts/manual_tests/lib.sh`**

```bash
mkdir -p /Users/tracy/projects/stormoji/scripts/manual_tests
```

Write `scripts/manual_tests/lib.sh`:

```bash
# Shared helpers for scripts/manual_tests/*.sh.
# Source this file; it is not meant to be executed directly.
# See docs/manual_tests.md.

BASE_URL="http://localhost:8000"

# Parses --base-url URL out of "$@", setting BASE_URL. Any other arguments
# are left (in order) in the REMAINING_ARGS array for the caller to process.
parse_base_url() {
  REMAINING_ARGS=()
  while [ $# -gt 0 ]; do
    case "$1" in
      --base-url)
        BASE_URL="$2"
        shift 2
        ;;
      *)
        REMAINING_ARGS+=("$1")
        shift
        ;;
    esac
  done
}

start_rodney() {
  rodney start >/dev/null
  trap 'rodney stop >/dev/null' EXIT
}

# clear_storage
#
# Clears both stormoji-stories and stormoji-draft from localStorage on the
# currently-open page.
clear_storage() {
  rodney js "(function(){ localStorage.removeItem('stormoji-stories'); localStorage.removeItem('stormoji-draft'); return true; })()" >/dev/null
}

# type_into_story TEXT
#
# Sets #story-input's value directly and dispatches a real 'input' event,
# so the app's debounced-autosave listener fires exactly as it would from
# native typing, with fully deterministic final content (no reliance on
# whether a given automation tool's "type" command appends to or replaces
# existing text). TEXT must not contain ", \, or a newline - it's embedded
# in a JS double-quoted string literal.
type_into_story() {
  local text="$1"
  rodney js "(function(){ var el = document.getElementById('story-input'); el.value = \"$text\"; el.dispatchEvent(new Event('input', { bubbles: true })); return el.value; })()" >/dev/null
}

# trigger_browser_restore SCRATCH_URL
#
# Navigates away to SCRATCH_URL and back via browser history. This
# triggers the browser's own form-control-state restoration on the page
# navigated back to - the same mechanism responsible for the story
# textarea browser-restore bug fixed in this repo (see
# docs/plans/2026-07-12-draft-autosave-design.md). Must be called while
# already on the page you want to test the restore against.
#
# about:blank doesn't work as SCRATCH_URL (CDP refuses direct navigation
# to it) - pass a real same-origin URL instead, e.g. "$BASE_URL/emoji-data.js".
trigger_browser_restore() {
  local scratch_url="$1"
  rodney open "$scratch_url" >/dev/null
  rodney waitload >/dev/null
  rodney back >/dev/null
  rodney waitload >/dev/null
}
```

- [ ] **Step 2: Create `scripts/manual_tests/story_persistence.sh`**

```bash
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

MORE_TEXT="Scenario 5 a shared story plus more typed after sharing"
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
```

- [ ] **Step 3: Create `scripts/manual_tests/run_all.sh`**

```bash
#!/usr/bin/env bash
# Runs all scripts in scripts/manual_tests/ against a local (or remote)
# Stormoji instance. See docs/manual_tests.md.

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

RESULTS=()

run_script() {
  local label="$1"
  shift
  echo
  echo "==== $label ===="
  set +e
  "$@"
  local status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    RESULTS+=("PASS  $label")
  else
    RESULTS+=("FAIL  $label (exit $status)")
  fi
}

run_script "story_persistence.sh" "$SCRIPT_DIR/story_persistence.sh" --base-url "$BASE_URL"

echo
echo "==== Summary ===="
overall_status=0
for result in "${RESULTS[@]}"; do
  echo "$result"
  case "$result" in
    FAIL*) overall_status=1 ;;
  esac
done

exit "$overall_status"
```

- [ ] **Step 4: Make the scripts executable**

```bash
chmod +x /Users/tracy/projects/stormoji/scripts/manual_tests/story_persistence.sh
chmod +x /Users/tracy/projects/stormoji/scripts/manual_tests/run_all.sh
```

- [ ] **Step 5: Create `docs/manual_tests.md`**

```markdown
# Manual & Scripted Browser Tests

`npm test` exercises the pure logic in `app.js` in Node - no DOM, no
`localStorage`, no real browser history. It can't catch things that only
show up in an actual browser: the browser's own form-control-state
restoration on back/forward navigation, real `localStorage` persistence
across reloads, or how the daily puzzle actually renders.

This is a living index of scripted browser checks for those cases, using
[`rodney`](https://github.com/simonw/rodney) (a Chrome-automation CLI) to
drive a real headless Chrome instance and assert on what's actually
rendered. Not CI-gated - run these when touching the story-persistence/
daily-puzzle code path, or before a deploy.

## Principles

1. **Prefer full automation with UI-based assertions.** Everything in this
   app shows its result in the DOM (the textarea's value, the rendered
   emoji, `localStorage` contents readable via `rodney js`) - script the
   whole thing and assert on it. This should be the default for any new
   section added below.
2. **Keep it dependency-free.** No new tools beyond `rodney` (already
   required) and `python3` (already used to serve the app locally) - this
   repo has no package manager beyond what `npm test` needs.

## Environments

|              | Dev                            | Production                |
| ------------ | ------------------------------- | -------------------------- |
| Base URL     | `http://localhost:8000`         | `https://stormoji.com`     |
| Start server | `python3 -m http.server 8000`   | already running            |

There's no backend and no accounts, so - unlike a typical app - running
these scripts against production is low-risk: `rodney` drives an isolated
Chrome profile, so it never touches a real visitor's browser or
`localStorage`, and there's no server-side state to accidentally mutate.

## Requirements

- [`rodney`](https://github.com/simonw/rodney) (Chrome automation CLI)
  installed and on `PATH`. Run `rodney --help` to confirm it's available.
- `python3`, for portable UTC date formatting in assertions (BSD `date` on
  macOS doesn't support the `%-d` no-leading-zero format used elsewhere).

## Quick start

```sh
scripts/manual_tests/run_all.sh [--base-url URL]
```

(default `http://localhost:8000`). Runs every script below back-to-back,
printing each script's output as it goes, then a PASS/FAIL summary line
per script. Exits non-zero if any failed. Checks `rodney` is on `PATH` and
the base URL is reachable first, with actionable error messages if not.

## Conventions for new sections

Each feature gets its own `##` section: a one-line description of what it
tests, the script invocation, then a numbered list of what it checks.

`scripts/manual_tests/lib.sh` provides shared helpers - source it from new
scripts:

- `parse_base_url "$@"` - parses `--base-url URL`, setting `BASE_URL`
  (default `http://localhost:8000`) and leaving any other arguments in the
  `REMAINING_ARGS` array.
- `start_rodney` - starts `rodney` and registers an `EXIT` trap to stop it.
- `clear_storage` - clears both `stormoji-stories` and `stormoji-draft`
  from `localStorage` on the currently-open page.
- `type_into_story TEXT` - sets `#story-input`'s value directly and
  dispatches a real `input` event, so the app's debounced-autosave
  listener fires exactly as it would from native typing, with fully
  deterministic final content. `TEXT` must not contain `"`, `\`, or a
  newline (it's embedded in a JS double-quoted string literal).
- `trigger_browser_restore SCRATCH_URL` - navigates away to `SCRATCH_URL`
  and back via browser history, triggering the browser's own
  form-control-state restoration on the page navigated back to.
  `about:blank` doesn't work as `SCRATCH_URL` (CDP refuses direct
  navigation to it) - pass a real same-origin URL instead.

## Daily puzzle & story persistence

Tests the story textarea's whole "what shows up and why" surface area
(`app.js`, `window.onload`): UTC-anchored date/emoji selection, the
browser form-control-state restoration race, and draft autosave. See
`docs/plans/2026-07-12-draft-autosave-design.md` for the autosave design;
the restoration-race and UTC-anchoring fixes shipped in earlier commits.

Script: `scripts/manual_tests/story_persistence.sh [--base-url URL]`
(default `http://localhost:8000`)

1. Fresh load with no saved story/draft for today leaves the textarea
   empty.
2. The displayed date matches the current UTC date (not local time), and
   4 emoji are rendered.
3. Typing without sharing, then reloading, restores the unsaved draft.
4. Typing without sharing, then navigating away and back (triggering the
   browser's own form-state restoration), still shows the draft - not a
   stale browser-restored value.
5. Sharing a story, then reloading, shows the shared story, and the draft
   key is removed from `localStorage`.
6. Typing more after sharing (without re-sharing), then reloading, shows
   the newer draft rather than the stale shared version.
7. Typing something and then deleting it all, then reloading, leaves the
   textarea empty - it doesn't fall back to a previously shared story for
   today.
8. A story and draft seeded under yesterday's date key don't appear in
   today's textarea after a reload.
```

- [ ] **Step 6: Run the script against a local server to verify it passes**

```bash
(cd /Users/tracy/projects/stormoji && python3 -m http.server 8000 >/tmp/stormoji_manual_test_server.log 2>&1 &)
sleep 1
/Users/tracy/projects/stormoji/scripts/manual_tests/run_all.sh
```

Expected output: 8 `PASS:` lines from `story_persistence.sh`, then:
```
==== Summary ====
PASS  story_persistence.sh
```
and exit code `0`.

Then stop the local server:
```bash
pkill -f "http.server 8000"
```

If any scenario prints `FAIL`, stop and debug before proceeding - do not commit a script that doesn't actually pass against the real implementation.

- [ ] **Step 7: Commit**

```bash
git add scripts/manual_tests/lib.sh scripts/manual_tests/story_persistence.sh scripts/manual_tests/run_all.sh docs/manual_tests.md
git commit -m "$(cat <<'EOF'
test: add scripted rodney regression test for story persistence

scripts/manual_tests/story_persistence.sh, following the
scripts/manual_tests/*.sh + docs/manual_tests.md pattern from
speechwave-live (trimmed - no backend/auth/email here). Covers the
whole story-textarea surface area in one script rather than one
per-fix: UTC-anchored date/emoji selection and the browser
form-control-state restoration race (both fixed in earlier commits,
previously verified only ad hoc and now with re-runnable coverage),
plus the draft autosave shipped in the previous two commits.

Verified passing against a local server before committing.
EOF
)"
```

---

## Task 4: Update `docs/roadmap.md` and `CLAUDE.md`

**Files:**
- Modify: `docs/roadmap.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: the shipped feature and test script from Tasks 1-3 (needs the real final line numbers from those tasks' actual edits - see Step 1).
- Produces: no code interfaces; documentation only.

- [ ] **Step 1: Get the current line numbers for functions referenced in `CLAUDE.md`**

```bash
grep -n "^function \|window.onload = function\|function saveStoryToHistory\|function displayStoryHistory\|function shareStory\|function exportHistoryToCSV\|function applyTodayStory" /Users/tracy/projects/stormoji/app.js
```

This prints one `<line>:<declaration>` pair per function. In every step below that writes `app.js:<L>`, replace `<L>` with the line number this command reports for that exact function's `function` declaration line (e.g. if the output contains `114:function getDraftForToday(draft, todayKey) {`, then every `app.js:<L>` for `getDraftForToday` becomes `app.js:114`).

Two of the citations below are line *ranges* (`<L>-<L>`), not single lines:
- `pruneStoriesOlderThan` is a fixed 5-line function (declaration, 3 body lines, closing `}`) - if grep reports its declaration at line N, cite it as `app.js:N-(N+4)` (e.g. declaration at 140 → `app.js:140-144`).
- The menu click-outside range spans from the `menuBtn.addEventListener('click', ...)` line through `closeMenuOnClickOutside`'s closing `}`. Run `grep -n "menuBtn.addEventListener\|function closeMenuOnClickOutside" /Users/tracy/projects/stormoji/app.js` to get the start line (the `menuBtn.addEventListener` match) and use `sed -n '<that-line>,+30p' /Users/tracy/projects/stormoji/app.js` to find the exact line of `closeMenuOnClickOutside`'s closing `}` (the first lone `}` at 8-space indent after its `function` line) for the end of the range.

- [ ] **Step 2: Update `docs/roadmap.md` - mark "No draft autosave" done**

Find this exact block:

```markdown
## UX tweaks

- [ ] **No draft autosave.** Now that reload correctly clears the
      textarea when there's no saved story for today (the bug we just
      fixed), an accidental refresh *before* clicking Share loses
      whatever the user was writing. A small debounced autosave of the
      in-progress draft to a separate localStorage key (distinct from the
      finalized story history) would close that gap. Needs a short design
      pass before implementing (when to save, how it interacts with the
      existing "load today's story" logic).
```

Replace it with:

```markdown
## UX tweaks

- [x] **No draft autosave.** Now that reload correctly clears the
      textarea when there's no saved story for today (the bug we just
      fixed), an accidental refresh *before* clicking Share loses
      whatever the user was writing. A small debounced autosave of the
      in-progress draft to a separate localStorage key (distinct from the
      finalized story history) would close that gap. Needs a short design
      pass before implementing (when to save, how it interacts with the
      existing "load today's story" logic).
      Fixed: see `docs/plans/2026-07-12-draft-autosave-design.md`. New
      `stormoji-draft` localStorage key, debounced 600ms on typing,
      cleared on successful share; a draft always wins over a finalized
      story for today if both exist, since the user may keep editing
      after sharing without re-sharing.
```

- [ ] **Step 3: Update `docs/roadmap.md` - note the new scripted-test pattern**

Find this exact block:

```markdown
## Tests

- [ ] DOM-driven flows (share, history render, CSV export, menu
      open/close) have no automated coverage - only the pure logic
      extracted from `app.js` is unit tested. Intentionally out of scope
      for now (Playwright was judged too heavy for this project's size);
      revisit if the DOM logic grows more complex.
```

Replace it with:

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

- [ ] **Step 4: Update `CLAUDE.md` - document the `stormoji-draft` schema and refresh the `pruneStoriesOlderThan` citation**

Find this exact block:

```markdown
Stories older than 6 months are automatically pruned when saving new stories (`pruneStoriesOlderThan` - `app.js:133-137`, called from `saveStoryToHistory`).

`dateKey` is computed once (`formatDateKey(today)`, UTC-based) and passed explicitly into `saveStoryToHistory(story, emojis, date, dateKey)` - it is deliberately **not** re-derived by re-parsing the human-readable `date` string, since that string has no timezone information and re-parsing it is ambiguous. `upsertStory` sorts by `dateKey` (lexicographic `YYYY-MM-DD` = chronological) for the same reason.

### Key Functions
```

Replace it with (using the real line numbers from Step 1 in place of `<L>-<L>`):

```markdown
Stories older than 6 months are automatically pruned when saving new stories (`pruneStoriesOlderThan` - `app.js:<L>-<L>`, called from `saveStoryToHistory`).

`dateKey` is computed once (`formatDateKey(today)`, UTC-based) and passed explicitly into `saveStoryToHistory(story, emojis, date, dateKey)` - it is deliberately **not** re-derived by re-parsing the human-readable `date` string, since that string has no timezone information and re-parsing it is ambiguous. `upsertStory` sorts by `dateKey` (lexicographic `YYYY-MM-DD` = chronological) for the same reason.

A second, separate localStorage key, `stormoji-draft`, holds at most one in-progress draft (not a list - only "today's" draft is ever relevant):
```javascript
{
    dateKey: "2026-07-12",  // YYYY-MM-DD, UTC
    story: "User's in-progress text..."
}
```
Debounced 600ms on typing, and deliberately allowed to win over a finalized `stormoji-stories` entry for today if both exist - a user can keep editing after sharing without re-sharing, so the draft may be newer. Cleared on successful share. See `docs/plans/2026-07-12-draft-autosave-design.md` for the full design.

### Key Functions
```

- [ ] **Step 5: Update `CLAUDE.md` - add `getDraftForToday` to the pure-functions list**

Find this exact block:

```markdown
- `formatDateKey(date)` (`app.js:105`): Formats a `Date` as the UTC `YYYY-MM-DD` key used to match stories to days
- `findStoryForDate(stories, dateKey)` (`app.js:110`): Looks up the saved story for a given date key
- `upsertStory(stories, entry)` (`app.js:115`): Inserts/replaces a story and keeps the list sorted newest first by `dateKey`
```

Replace it with (using the real line numbers from Step 1 in place of every `<L>`):

```markdown
- `formatDateKey(date)` (`app.js:<L>`): Formats a `Date` as the UTC `YYYY-MM-DD` key used to match stories to days
- `findStoryForDate(stories, dateKey)` (`app.js:<L>`): Looks up the saved story for a given date key
- `getDraftForToday(draft, todayKey)` (`app.js:<L>`): Returns the draft's story if it belongs to `todayKey`, else `null` - the `null` sentinel distinguishes "no relevant draft" from "an explicitly-empty draft"
- `upsertStory(stories, entry)` (`app.js:<L>`): Inserts/replaces a story and keeps the list sorted newest first by `dateKey`
```

- [ ] **Step 6: Update `CLAUDE.md` - add `applyTodayStory` and update `shareStory`'s description**

Find this exact block:

```markdown
DOM/localStorage wiring (inside `window.onload`, not unit tested):
- `saveStoryToHistory(story, emojis, date, dateKey)` (`app.js:262`): Persists a story to localStorage via `upsertStory`/`pruneStoriesOlderThan`
- `displayStoryHistory()` (`app.js:282`): Renders saved stories as cards
- `shareStory()` (`app.js:321`): Saves to history and copies story + emojis to clipboard (feature-detected; degrades to a notification if the Clipboard API is unavailable)
```

Replace it with (using the real line numbers from Step 1 in place of every `<L>`):

```markdown
DOM/localStorage wiring (inside `window.onload`, not unit tested):
- `applyTodayStory()` (`app.js:<L>`): Sets the story textarea's value on load and on `pageshow` - a draft for today (via `getDraftForToday`) wins over a finalized story for today, which wins over empty. Also the fix point for the browser's own form-control-state restoration race.
- `saveStoryToHistory(story, emojis, date, dateKey)` (`app.js:<L>`): Persists a story to localStorage via `upsertStory`/`pruneStoriesOlderThan`
- `displayStoryHistory()` (`app.js:<L>`): Renders saved stories as cards
- `shareStory()` (`app.js:<L>`): Saves to history, clears the draft (`stormoji-draft`), and copies story + emojis to clipboard (feature-detected; degrades to a notification if the Clipboard API is unavailable)
```

- [ ] **Step 7: Update `CLAUDE.md` - refresh the CSV Export section's line numbers**

Find this exact block:

```markdown
**Implementation:**
- `exportHistoryToCSV()` (`app.js:366`): Main export logic with Blob API
- `escapeCSV()` (`app.js:140`): Helper for proper CSV field escaping (pure, unit-tested)
- Menu dropdown uses click-outside detection pattern for UX (`app.js:474-496`)
```

Replace it with (using the real line numbers from Step 1/a fresh `grep -n "function exportHistoryToCSV\|function escapeCSV\|function closeMenuOnClickOutside"` in place of every `<L>`; for the click-outside range, use the `menuBtn.addEventListener` line through the `closeMenuOnClickOutside` function's closing `}`):

```markdown
**Implementation:**
- `exportHistoryToCSV()` (`app.js:<L>`): Main export logic with Blob API
- `escapeCSV()` (`app.js:<L>`): Helper for proper CSV field escaping (pure, unit-tested)
- Menu dropdown uses click-outside detection pattern for UX (`app.js:<L>-<L>`)
```

- [ ] **Step 8: Update `CLAUDE.md` - mention the scripted browser test in the Testing section**

Find this exact block:

```markdown
Tests live in `app.test.js`. DOM-dependent behavior (rendering, event listeners, localStorage side effects, clipboard) still has no automated coverage and requires manual testing in a browser.
```

Replace it with:

```markdown
Tests live in `app.test.js`. DOM-dependent behavior (rendering, event listeners, localStorage side effects, clipboard) still has no unit-test coverage; the story-textarea flow specifically (share, reload, draft autosave, browser-restore) has scripted `rodney` (Chrome automation) coverage instead - see `docs/manual_tests.md` and `scripts/manual_tests/story_persistence.sh`. Other DOM flows (history render, CSV export, menu) still require manual testing in a browser.
```

- [ ] **Step 9: Verify the docs render sensibly and nothing else references stale content**

```bash
grep -n "app.js:" /Users/tracy/projects/stormoji/CLAUDE.md
```

Read through the output and confirm every cited line number actually points at the declaration it claims to (spot-check a few with `sed -n '<L>p' /Users/tracy/projects/stormoji/app.js`).

- [ ] **Step 10: Commit**

```bash
git add docs/roadmap.md CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: mark draft autosave done, document stormoji-draft and the new test script

Update docs/roadmap.md (autosave item done, Tests item notes the new
scripted rodney pattern) and CLAUDE.md (stormoji-draft schema,
getDraftForToday, applyTodayStory, updated shareStory description,
refreshed app.js line references, and the new
scripts/manual_tests/story_persistence.sh in the Testing section).
EOF
)"
```
