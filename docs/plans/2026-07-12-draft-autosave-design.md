# Draft Autosave Design

**Date:** 2026-07-12
**Feature:** Autosave in-progress story drafts so accidental reload/tab-close doesn't lose unsaved writing
**Status:** Design Complete - Ready for Implementation

## Overview

Track item from `docs/roadmap.md` ("No draft autosave"): now that page load correctly clears the story textarea when there's no saved story for today (fixed in commit `f120b5b`), an accidental refresh or tab close *before* clicking Share loses whatever the user was writing. This adds a small, silent, debounced autosave of the in-progress draft to a separate localStorage key, so a reload restores the user's latest text instead of wiping it.

## Requirements

### Functional Requirements
- While the user types in the story textarea, their text is periodically saved to localStorage without any explicit action.
- On page load (and on the existing `pageshow` re-check), the most recently typed text for *today* wins over a previously shared story for today, if both exist. ("Always show the latest draft" - approved during design discussion: since a user can keep editing after sharing, the draft may be newer than the finalized history entry.)
- Once a story is successfully shared, the draft record is cleared - its content now lives safely in permanent history. Any further typing after that point re-creates a new draft via the same autosave mechanism.
- A draft from a previous day (the user typed something, never returned) must never bleed into a new day's puzzle - same class of bug as the one just fixed for shared stories, applied to this new storage path.
- No user-visible indicator. This is a safety net, not a feature the user needs to think about.

### Non-Functional Requirements
- No new dependencies. Plain `localStorage`, a debounced `input` listener, matching the rest of the codebase.
- The new logic that can be pure (day-matching) is extracted to module scope and unit tested, consistent with the rest of `app.js`.

## Architecture

### Data Model

New localStorage key: `stormoji-draft`. Unlike `stormoji-stories` (a list, one entry per day, retained for 6 months), this holds a **single record**, overwritten on every save - only "the last thing the user typed, and what day it was for" is ever relevant:

```javascript
{
    dateKey: "2026-07-12",  // YYYY-MM-DD, UTC - same format/anchor as stormoji-stories
    story: "User's in-progress text..."
}
```

`story` may be `''` - an explicitly-saved empty draft (user deleted everything they'd written) is meaningfully different from *no draft existing*, and that distinction drives load precedence below.

### Save Trigger

An `input` event listener on `storyInput`, added alongside the existing listeners in `window.onload`. Debounced 600ms after the last keystroke (clear/reset a `setTimeout` on every `input` event) before writing:

```javascript
storyInput.addEventListener('input', () => {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(() => {
        localStorage.setItem('stormoji-draft', JSON.stringify({ dateKey: todayKey, story: storyInput.value }));
    }, 600);
});
```

`todayKey` is already computed earlier in `onload` (used for `findStoryForDate`), so this reuses it rather than recomputing.

### Load Precedence

Extends the existing `applyTodayStory()` (already called on initial load and on `pageshow`, so this inherits the same browser-history-restore protection built for the earlier fix at no extra cost):

```javascript
const draftJSON = localStorage.getItem('stormoji-draft');
const draft = draftJSON ? JSON.parse(draftJSON) : null;

function applyTodayStory() {
    const todayDraft = getDraftForToday(draft, todayKey);
    if (todayDraft !== null) {
        storyInput.value = todayDraft;
    } else if (todayStory) {
        storyInput.value = todayStory.story;
    } else {
        storyInput.value = '';
    }
}
```

`getDraftForToday` (new, pure, module-scope):

```javascript
function getDraftForToday(draft, todayKey) {
    return draft && draft.dateKey === todayKey ? draft.story : null;
}
```

Returns the draft's `story` (including `''`) when it matches today's key, otherwise `null` - the `null` sentinel is what lets `applyTodayStory` distinguish "no relevant draft, fall back to the shared story" from "there's a saved draft and it's the empty string."

### Clearing on Share

In `shareStory()`, immediately after `saveStoryToHistory(...)` succeeds:

```javascript
localStorage.removeItem('stormoji-draft');
```

The shared content is now in permanent history; `applyTodayStory()` will fall through to `todayStory` on the next load/pageshow until the user types again, at which point the `input` listener re-creates the draft.

### Explicitly Out of Scope

- **Proactive cleanup of a stale (wrong-day) draft on load.** It's one small string that gets overwritten the next time the user types on a new day. Not worth the extra code.
- **Any user-visible "draft saved" indicator.** Confirmed silent during design discussion.
- **`beforeunload`/`pagehide` flush.** The 600ms debounce window is an accepted, small residual risk (approved during design discussion in favor of simplicity); not addressed here.

## Testing

### Unit Tests (`app.test.js`)
- `getDraftForToday` returns the story when `dateKey` matches today, including when `story` is `''`.
- `getDraftForToday` returns `null` when `dateKey` doesn't match (stale/previous-day draft).
- `getDraftForToday` returns `null` when `draft` is `null` (nothing saved yet).

### Scripted Manual Test

Ad hoc `rodney` sessions verified the earlier fixes (browser-restore race, UTC anchoring), but those steps weren't saved anywhere - each new fix in this area meant re-deriving the same reload/back-forward tricks from scratch. This is the first feature in the repo to script that, following the `scripts/manual_tests/*.sh` + `docs/manual_tests.md` pattern used in `speechwave-live` (adapted down - Stormoji has no backend/auth/email to work around, just a static page and `localStorage`).

**New, reusable for this repo (introduced by this feature, not autosave-specific):**
- `scripts/manual_tests/lib.sh` - shared helpers: `parse_base_url`, `start_rodney`, plus Stormoji-specific ones for seeding/clearing `localStorage` state (`stormoji-stories`, `stormoji-draft`) and for the back/forward-navigation trick that exercises the browser's own form-state restoration.
- `docs/manual_tests.md` - living index of scripted checks, one `##` section per script.
- `scripts/manual_tests/run_all.sh` - runs every script, prints a PASS/FAIL summary.

**This feature's script:** `scripts/manual_tests/story_persistence.sh`. Scoped to cover the whole "what shows up in the story textarea and why" surface area in one script, since it's all the same reload/back-forward flow on the same page - not just autosave:

1. Fresh load, no story/draft for today → textarea empty.
2. Displayed date and rendered emojis reflect UTC, not local time (regression check for the earlier timezone fix).
3. Type without sharing, reload → draft text persists (new).
4. Type without sharing, navigate away and back (the browser-restore trick) → draft persists, not a stale browser-restored value (regression check for the earlier `pageshow` fix, now exercised together with the draft).
5. Click Share, reload → shows the shared story, and the draft key is gone from `localStorage` (new).
6. Click Share, type more without re-sharing, reload → shows the newer draft, not the stale shared version (new).
7. Type something, delete it all, reload → textarea stays empty, doesn't fall back to a previously shared story for today (new).
8. Seed a story/draft under yesterday's `dateKey` directly in `localStorage`, reload → neither appears today (regression check + new).

## Success Criteria

- Reloading or closing/reopening the tab before sharing no longer loses in-progress writing.
- Sharing still behaves exactly as before; no behavior change to the finalized story history, CSV export, or the existing `pageshow` browser-restore fix.
- No visible UI change.
- `scripts/manual_tests/story_persistence.sh` passes, and going forward is the re-runnable regression check for this whole area (browser-restore race, UTC anchoring, draft autosave) instead of re-deriving manual steps each time.
