# Changelog

All notable changes to Stormoji are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-07-12

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

- The daily puzzle, story `dateKey`, and displayed date are now anchored
  to UTC instead of the visitor's local timezone, so users on either side
  of UTC midnight no longer see mismatched dates/emojis/stories.
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
