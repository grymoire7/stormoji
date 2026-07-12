# Design: scripted rodney coverage for history render + CSV export

Captured 2026-07-12, closing out the remaining item under Tests in
`docs/roadmap.md`.

## Background

`docs/roadmap.md`'s Tests section calls out three DOM-driven flows with no
automated coverage: history render, CSV export, and menu open/close. Menu
open/close (and the story-textarea character counter) already got scripted
`rodney` coverage in `scripts/manual_tests/accessibility.sh`. This design
covers the two remaining gaps - history render and CSV export - using the
same `rodney` pattern established by `story_persistence.sh` and
`accessibility.sh` (see `docs/manual_tests.md` for the general approach and
requirements).

## Scope

One new script, `scripts/manual_tests/history_export.sh`, covering both
flows. They're combined into one file (rather than split like the docs'
one-section-per-script convention might suggest) because both read/write
the same `stormoji-stories` localStorage key and share the same seeding
approach - a combined script avoids duplicating that setup.

Out of scope: re-reviewing menu open/close, already covered.

## Structure

Follows the existing scripts' shape exactly:
- Shebang, `set -euo pipefail`, source `lib.sh`, `parse_base_url "$@"`.
- Check `rodney` is on `PATH` and `$BASE_URL/index.html` is reachable,
  matching `story_persistence.sh`/`accessibility.sh`'s error messages.
- `start_rodney`, open `index.html`, run numbered scenarios each echoing
  `PASS: ...` or `FAIL: ...` (exit 1) to stderr, matching the existing
  scripts' style.
- Cleanup (`clear_storage`) at the end.
- Registered in `run_all.sh` alongside the other two scripts.
- Documented in `docs/manual_tests.md` as a new `##` section, same format
  as the existing two (one-line description, script invocation, numbered
  list of what it checks).

## History render scenarios

Uses `rodney click`, `rodney text`, `rodney js`, `rodney count` - no new
helpers needed beyond what `lib.sh` already provides (`clear_storage`,
`type_into_story`).

1. **Empty history renders the placeholder.** Clear storage, reload,
   click `#history-toggle`. Assert: `#story-cards` contains the
   "No stories in your history yet." placeholder, `#history-toggle`'s
   text is "close history", and `#history-container`'s `display` is
   `block`.
2. **Seeded stories render correctly, in order.** Seed two known stories
   directly into `stormoji-stories` (already in newest-first order, as
   the real save path via `upsertStory` always produces - `displayStoryHistory`
   itself does not sort, it just renders array order, so seeding
   pre-sorted matches real usage). Reload, open history. Assert: card
   count is 2, and each `.story-card-date` / `.story-card-emojis` /
   `.story-card-text` matches the seeded data, in the seeded order.
3. **Toggle closes.** Click `#history-toggle` again. Assert: text reverts
   to "open history", `display` is `none`.
4. **Sharing while history is open updates the list live.** With history
   left open (from scenario 2/3's seeded data reopened, or freshly
   opened), type a new story and click `#share-btn`. Assert the card
   count increments and the newest card's text matches the just-typed
   story - exercising the `if (historyContainer.style.display === 'block')
   displayStoryHistory();` branch inside `saveStoryToHistory` (`app.js`),
   which is otherwise only reachable if history happens to already be
   open at share time.

## CSV export scenarios

The export flow builds a `Blob`, wraps it in an object URL via
`URL.createObjectURL`, and clicks a detached, never-appended `<a
download>` to trigger the save - then immediately calls
`URL.revokeObjectURL` on the same URL. There's no on-page element for
`rodney download` to target, and fetching the object URL *after* the
click (in a separate `rodney js` call) fails once revoked. Prototyping
during design confirmed the fix: capture the actual `Blob` object at
`URL.createObjectURL` time (a reference to the Blob itself survives URL
revocation - only the URL-to-blob mapping is invalidated), and capture
the intended filename by wrapping `HTMLAnchorElement.prototype.click`
before calling through to the original. Both overrides are installed via
a single `rodney js` call right after each `open`/`waitload`, before
triggering export:

```js
window.__lastBlob = null;
window.__lastDownloadName = null;
var origCreate = URL.createObjectURL.bind(URL);
URL.createObjectURL = function(blob) { window.__lastBlob = blob; return origCreate(blob); };
var origClick = HTMLAnchorElement.prototype.click;
HTMLAnchorElement.prototype.click = function() { window.__lastDownloadName = this.download; return origClick.call(this); };
```

Confirmed working in a live prototype: `window.__lastBlob.text()` (a
promise) resolves correctly via `rodney js` (which awaits returned
promises), yielding the exact CSV text including correct quote/comma/
newline escaping; letting the real `click()` proceed through to Chrome
in headless mode did not hang or error.

5. **Empty history shows the right notification and attempts no export.**
   Clear storage, install the interceptors, click `#menu-btn` then
   `#menu-export`. Assert: `#notification-text` reads "No stories to
   export", and `window.__lastBlob` is still `null` (confirming
   `exportHistoryToCSV` returned early and never touched
   `URL.createObjectURL`).
6. **Non-empty history exports correct content and filename.** Seed one
   story whose fields require CSV escaping (a comma, a `"` quote, and an
   embedded newline in the story text), install the interceptors, click
   `#menu-btn` then `#menu-export`. Assert:
   - `#notification-text` reads "History exported successfully!"
   - `window.__lastDownloadName` matches
     `stormoji-history-YYYY-MM-DD.csv`, where the date is read from the
     browser's own `new Date()` local-time fields (via `rodney js`), not
     computed in the test's shell/Python - `exportHistoryToCSV`'s
     filename deliberately(?) uses **local** date
     (`now.getFullYear()`/`getMonth()`/`getDate()`), unlike the rest of
     the app which is UTC-anchored. This is a pre-existing quirk, not
     something this test round is fixing - the test just needs to match
     the code's actual behavior, sourced from the browser to avoid any
     host/browser tz mismatch.
   - `window.__lastBlob.text()` equals the exact expected CSV content
     (header row + one data row), including correct quoting of the
     special-character field, byte-for-byte.

This complements, rather than duplicates, the existing `escapeCSV` unit
tests in `app.test.js`: those test the pure escaping function in
isolation; these test that the real browser wiring in
`exportHistoryToCSV` assembles and serves the correct end-to-end file
content from real `localStorage` data.

## Docs updates

- `docs/manual_tests.md`: new `##` section for `history_export.sh`,
  matching the format of the two existing sections.
- `docs/roadmap.md`: mark the Tests item done, noting menu open/close was
  already covered and this closes history render + CSV export.

## Non-goals

- No changes to `app.js` itself - this is test-only work.
- Not fixing the local-vs-UTC filename-date inconsistency in
  `exportHistoryToCSV` - out of scope for this test-coverage pass; the
  design note above just flags it so a future reader isn't surprised.
