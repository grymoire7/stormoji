# Changelog

All notable changes to Stormoji are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-07-12

> **⚠️ If you have Stormoji open in a browser tab from before this
> release, refresh the page.** This release moves the daily puzzle's
> rollover instant from a shared UTC midnight back to each visitor's local
> midnight (see Fixed below). The emoji-selection algorithm itself hasn't
> changed - for a given calendar date, everyone still gets the same four
> emojis. What changes is which calendar date counts as "today" at a given
> real-world moment. A tab left open from before this release still uses
> the old UTC-midnight rollover, so near the boundary it can be showing a
> different calendar date's puzzle than a freshly-loaded tab using the new
> local-midnight rollover - even for two people in the same timezone, if
> only one of them has refreshed.

### Fixed

- The instant at which the daily puzzle rolls over to the next day is
  anchored back to the visitor's local midnight instead of a shared UTC
  midnight. The 1.0.0 change to UTC was a misdiagnosis: it aimed to give
  every user the same puzzle at the same real-world instant, but that
  instant isn't midnight for anyone outside UTC, so most players got a new
  puzzle at some arbitrary local time (6pm, 3am, etc.) instead of at
  midnight. Wordle and the NYT daily games (Connections, Spelling Bee,
  Mini) all roll over at each player's local midnight and accept that
  users in different timezones can be on different calendar-date puzzles
  at a given moment - that's inherent to any timezone-aware daily game
  either way, so anchoring to UTC didn't remove it, it just moved the
  rollover to an instant nobody's clock reads as midnight. See
  `docs/roadmap.md` for the full writeup.

## [1.0.0] - 2026-07-12

> **⚠️ If you have Stormoji open in a browser tab from before this
> release, refresh the page.** This release moves the daily puzzle's
> rollover instant from your local midnight to a shared UTC midnight (see
> Fixed below). The emoji-selection algorithm itself hasn't changed - for
> a given calendar date, everyone still gets the same four emojis. What
> changes is which calendar date counts as "today" at a given real-world
> moment. A tab left open from before this release still uses the old
> local-midnight rollover, so near the boundary it can be showing a
> different calendar date's puzzle than a freshly-loaded tab using the new
> UTC-midnight rollover - even for two people in the same timezone, if
> only one of them has refreshed.

### Added

- Draft autosave: in-progress stories are saved to `localStorage` as you
  type (debounced) and restored on reload, without needing to share first.
- Dark mode: a `prefers-color-scheme: dark` palette, plus a manual
  Light/Dark/System toggle in the menu that overrides the OS preference.
- Keyboard and screen-reader accessibility pass: the hamburger menu and
  About modal are fully keyboard-navigable with correct ARIA roles, and
  focus returns to the menu button (not a hidden item) when the modal
  closes.
- A live character counter on the story textarea.
- A `node:test` unit test suite covering the app's pure logic (emoji
  selection, date/story matching, CSV escaping), plus scripted `rodney`
  (Chrome automation) coverage for story persistence, accessibility,
  history render, CSV export, and dark mode - see `docs/manual_tests.md`.

### Changed

- Hardcoded CSS colors were promoted to custom properties, enabling the
  dark mode palette to be a single override block instead of scattered
  changes.

### Fixed

- The instant at which the daily puzzle rolls over to the next day is now
  anchored to a shared UTC midnight instead of each visitor's local
  midnight, so users on either side of UTC midnight are no longer on
  different calendar-date puzzles at the same real-world moment.
- Stale story text no longer reappears after browser back/forward
  navigation (a race with the browser's own form-control-state restore).
- A pending debounced draft autosave no longer overwrites a story just
  shared.

## [0.9.0] - 2025-03-12

Initial release. Daily deterministic emoji puzzle (four emojis from four
categories, same for all users each day), story writing with clipboard
share, local story history with automatic six-month retention, CSV
export, and the hamburger menu (About / Export History). This is the
pre-changelog baseline - everything before the 1.0.0 work above.
