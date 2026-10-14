# Decisions

A log of non-obvious decisions and the reasoning behind them, so they
don't get re-litigated. Newest first. This file records *why*; for open
work see `docs/roadmap.md`, and for how things currently work see
`CLAUDE.md`. Longer designs live in `docs/plans/` and `docs/specs/`.

## 2026-10-14: Cache-busting via `?v=<version>` on asset URLs

The host serves `app.js`, `styles.css` and the other assets with a 30-day
`max-age`, but `index.html` with only 10 minutes. After 1.2.0 shipped, a
returning visitor in Brave and Vivaldi on Android got the new page (with
the Import menu item) but their cached 1.1.0 `app.js`, so tapping Import
did nothing. Chrome, with no cached copy, worked. Waiting a month, or
clearing site data (which would also wipe the user's localStorage
history), isn't a reasonable ask.

Every local `<script src>` and `<link href>` in `index.html` and
`gallery.html` now ends in `?v=<package.json version>`, so each release
changes the URLs and forces a fresh fetch. A unit test enforces that the
query string matches `package.json`; the release steps in `CLAUDE.md`
include updating them. Alternatives considered: stamping the version in
at deploy time (more machinery for a three-places-to-edit problem), and
shortening the server's `max-age` (a host config outside the repo, and it
trades away caching for every visitor).

## 2026-10-13: History import

"Import History" reads a CSV produced by Export so history can follow a
user to a different browser. Implementation notes are in `CLAUDE.md`
("CSV Import"); the decisions:

- **The browser's existing story wins on a date conflict.** The primary
  use case is switching browsers (A to B); whatever B already has is
  likely newer, so the imported row for that date is skipped (and counted
  in the result message).
- **All or nothing.** Any invalid row (bad `YYYY-MM-DD` Date Key, empty
  Date/Emojis/Story, too few fields) or a missing column rejects the whole
  file, and the error names the row or column. A partial import would
  leave the user unsure what made it in.
- **Rows older than six months are kept at import time.** Unlikely in real
  use but handy for testing. They are still pruned by the usual six-month
  rule the next time a story is saved (`saveStoryToHistory`).
- The result is a dismissable modal that follows the Light/Dark/System
  theme, with no spinner (a local file capped at six months is fast). The
  draft (`stormoji-draft`) is never touched.

## 2026-07-12: Daily puzzle is anchored to local time, not UTC

`dateSeed`, `formatDateKey`, and the displayed date use the visitor's
*local* date. They were briefly changed to UTC on the theory that users in
different timezones seeing different emoji sets "today" was a bug.
That was a misdiagnosis: a single global reset instant isn't the promise
players notice or expect, whereas "new puzzle at midnight" is very
noticeable when it doesn't hold. Wordle and the NYT daily games
(Connections, Spelling Bee, Mini) all reset at each player's local
midnight, accepting that users in different timezones can be on different
calendar-date puzzles at a given real-world moment. That is inherent to any
timezone-aware daily game whether the seed is UTC- or local-anchored; UTC
just relocated the reset to an instant that's midnight for nobody outside
UTC. See `CHANGELOG.md` 1.0.1 for the release note.

Kept from the UTC episode: `saveStoryToHistory` takes `dateKey` as an
explicit argument instead of re-parsing the human-readable date string
(ambiguous without timezone info), and `upsertStory` sorts by `dateKey`.

## 2026-07-12: Draft autosave

A debounced (600ms) autosave of the in-progress story goes to its own
`stormoji-draft` localStorage key, cleared on successful share. A draft
always wins over a finalized story for today if both exist, because the
user may keep editing after sharing without re-sharing. Design:
`docs/plans/2026-07-12-draft-autosave-design.md`.

## 2026-07-12: Dark mode

Hardcoded colors became CSS custom properties, overridden inside
`@media (prefers-color-scheme: dark)`. `--primary-color` and
`--button-hover` stay constant across themes because they are only ever
button backgrounds paired with white text, so their contrast doesn't depend
on the page theme. A Light/Dark/System toggle in the menu stores its choice
in `stormoji-theme` and applies a `data-theme` attribute on `<html>`, which
outranks the media query via CSS specificity. Design:
`docs/plans/2026-07-12-dark-mode-design.md`.

## 2026-07-12: Accessibility

- Menu items and the modal close control are real `<button>`s, with the
  usual ARIA roles; `Escape` closes whichever is open and returns focus to
  its trigger, and the About modal traps `Tab` on its only focusable
  element. Design: `docs/plans/2026-07-12-accessibility-design.md`.
- The character counter is tied to the textarea with `aria-describedby`,
  deliberately not `aria-live`, so it doesn't interrupt screen reader users
  while typing. There is no enforced maximum: guidance only, given the
  free-form nature of the game.

## 2026-07-12: Browser-flow testing uses `rodney`, not Playwright

Playwright was judged too heavy for a project this size. DOM-driven flows
get scripted `rodney` (Chrome automation) coverage in
`scripts/manual_tests/` instead, indexed in `docs/manual_tests.md`. In
the CSV export test, content is verified by intercepting
`URL.createObjectURL` and `HTMLAnchorElement.prototype.click`, since
headless Chrome has no on-page element or save dialog to target. Design:
`docs/specs/2026-07-12-history-export-tests-design.md`.

## 2026-07-12: Clipboard access is feature-detected

`shareStory()` checks that `navigator.clipboard.writeText` exists before
calling it. In a non-secure context or an older/in-app browser it is
`undefined`, and calling it would throw synchronously past the `.catch()`
instead of showing the "Failed to copy to clipboard" notification.
