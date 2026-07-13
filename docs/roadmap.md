# Roadmap

A running backlog of known issues and possible improvements, captured
2026-07-11 during a review after fixing the "yesterday's story shows up
today" bug (see git history: `fix: stop stale story text from reappearing
after browser navigation`).

For longer-term/speculative feature ideas (multi-language support, social
sharing integrations, etc.) see the Contributing section of `README.md`;
this file tracks more concrete, actionable items.

## Correctness bugs

- [x] **Timezone-dependent daily puzzle.** `dateSeed` and the story
      `dateKey` are derived from the browser's *local* date
      (`today.getFullYear()`/`getMonth()`/`getDate()`), not a shared UTC
      day. Users in different timezones can see different emoji sets for
      "today," and the puzzle flips at each user's local midnight instead
      of one shared instant - undermining the Wordle-style promise that
      everyone gets the same daily puzzle. Fix: anchor the seed, story
      date key, and displayed date to UTC.
      Fixed: `dateSeed`, `formatDateKey`, and the displayed date now all
      derive from UTC fields. `saveStoryToHistory` also now takes
      `dateKey` as an explicit argument instead of re-deriving it by
      re-parsing the human-readable date string (which was ambiguous
      without timezone info), and `upsertStory` sorts by `dateKey`
      instead of re-parsing that string too.
- [x] **UTC-anchored puzzle reverted back to local time (2026-07-12).**
      The UTC fix above was a misdiagnosis: it optimized for "everyone
      shares one global reset instant," which isn't actually the promise
      players notice or expect, at the cost of "new puzzle at midnight,"
      which they very much do notice. Wordle and the NYT daily games
      (Connections, Spelling Bee, Mini) all reset at each player's local
      midnight, accepting that users in different timezones can be on
      different calendar-date puzzles at a given real-world moment -
      that's inherent to any timezone-aware daily game regardless of
      whether the seed is UTC- or local-anchored, so UTC-anchoring didn't
      actually eliminate it, it just relocated the reset to an instant
      that's midnight for nobody outside UTC.
      Fixed: `dateSeed`, `formatDateKey`, and the displayed date are back
      to deriving from local `Date` fields (`getFullYear()`/`getMonth()`/
      `getDate()`), matching the pre-1.0.0 behavior. See `CHANGELOG.md`
      1.0.1 for the release note and refresh warning.
- [x] **Unguarded clipboard call.** `shareStory()` calls
      `navigator.clipboard.writeText(...)` without checking that
      `navigator.clipboard` exists. In a non-secure context or an
      older/in-app browser it's `undefined`, so the call throws
      synchronously instead of being caught by `.catch()` - the user gets
      a silent JS error instead of the "Failed to copy to clipboard"
      notification.
      Fixed: feature-detect `navigator.clipboard`/`writeText` before
      calling; show the "Failed to copy" notification directly when
      unavailable.

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

## Accessibility

- [x] Menu dropdown and About modal have no ARIA roles/labels and don't
      close on <kbd>Escape</kbd>.
      Fixed: see `docs/plans/2026-07-12-accessibility-design.md`. Menu
      items and the modal close control are now real `<button>`s;
      `aria-haspopup`/`aria-expanded` on the trigger; `role="menu"` /
      `role="menuitem"` on the dropdown; `role="dialog"
      aria-modal="true" aria-labelledby` on the modal. `Escape` closes
      whichever is open and returns focus to its trigger; opening
      either moves focus in; the modal traps `Tab` on its only
      focusable element (the close button).
- [x] Story textarea has no character counter or length guidance.
      Fixed: a live "N characters" count under the textarea, associated
      via `aria-describedby` (not `aria-live`, so it doesn't interrupt
      screen reader users while typing). No enforced maximum - guidance
      only, per the free-form nature of the game.

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

## Other / lower priority

- [x] No dark mode - `styles.css` had exactly one `@media` query (mobile
      width); nothing for `prefers-color-scheme`.
      Fixed: see `docs/plans/2026-07-12-dark-mode-design.md`. Hardcoded
      colors promoted to CSS custom properties, then overridden inside
      `@media (prefers-color-scheme: dark)`; `--primary-color`/
      `--button-hover` stay constant across themes (only ever used as
      button backgrounds, so contrast doesn't depend on page theme). Also
      added a Light/Dark/System toggle - three radio items in the
      hamburger menu, backed by a new `stormoji-theme` localStorage key
      and a `data-theme` attribute on `<html>` that outranks the media
      query via CSS specificity. Scripted `rodney` coverage in
      `scripts/manual_tests/dark_mode.sh`.
- [ ] Emoji curation could be improved (already noted in README).
- [ ] Cross-device history import (already noted in README's Contributing
      section; CSV export exists as a partial solution).
