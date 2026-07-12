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

- [ ] Menu dropdown and About modal have no ARIA roles/labels and don't
      close on <kbd>Escape</kbd>.
- [ ] Story textarea has no character counter or length guidance.

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

## Other / lower priority

- [ ] No dark mode - `styles.css` has exactly one `@media` query (mobile
      width); nothing for `prefers-color-scheme`.
- [ ] Emoji curation could be improved (already noted in README).
- [ ] Cross-device history import (already noted in README's Contributing
      section; CSV export exists as a partial solution).
