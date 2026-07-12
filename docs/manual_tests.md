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

## Menu, modal & character counter accessibility

Tests the menu dropdown and About modal's keyboard accessibility (ARIA
roles/state, `Escape`-to-close, focus management, the modal's focus trap)
and the story textarea's character counter. See
`docs/plans/2026-07-12-accessibility-design.md` for the full design.

Script: `scripts/manual_tests/accessibility.sh [--base-url URL]`
(default `http://localhost:8000`)

`rodney` has no keypress-simulation command, so native "Enter/Space
activates a focused button" isn't exercised directly - that's a browser
platform guarantee for real `<button>` elements, not app logic. Scenario 1
checks the elements really are buttons; `Escape`/`Tab` handling (our own
code) is exercised by dispatching synthetic `KeyboardEvent`s at
`document`, which our `document.addEventListener('keydown', ...)`
listeners pick up the same as real key presses.

1. The menu items and the modal's close control are real `<button>`
   elements (not the previous unfocusable `div`/`span`).
2. Clicking the menu button opens the menu, sets `aria-expanded="true"`,
   and moves focus to the "About" item.
3. Dispatching `Escape` with the menu open closes it, resets
   `aria-expanded`, and returns focus to the menu button.
4. Clicking "About" opens the modal and moves focus to its close button.
5. Dispatching `Tab` while the modal is open is prevented (the trap
   engages) and focus stays on the close button.
6. Dispatching `Escape` with the modal open closes it and returns focus
   to the menu button (not the "About" item, which is inside the
   already-hidden dropdown by this point and can't receive focus).
7. A click dispatched with the modal overlay itself as the target closes
   it via the same `closeModal()` path (display reset).
8. Typing into the story textarea updates `#story-char-count` live to
   match the typed length.
9. Reloading after typing (without sharing) restores the draft and the
   character count matches it.

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

## Dark mode

Verifies `prefers-color-scheme: dark` support and the Light/Dark/System
menu toggle: light-mode colors are unchanged, dark-mode colors apply and
clear WCAG AA contrast, the media query is actually detected by the
browser, and an explicit theme choice correctly overrides the OS
preference. See `docs/plans/2026-07-12-dark-mode-design.md` for the
palette and toggle design.

```sh
scripts/manual_tests/dark_mode.sh [--base-url URL]
```

This script temporarily toggles the real macOS Appearance setting
(headless Chrome follows the OS preference; there's no rodney/CDP flag to
emulate `prefers-color-scheme` directly) and restores it on exit, even on
failure.

1. Light mode: `body` background, `history-toggle` link color, and
   `.share-btn` background match their literal light-mode RGB values.
2. Dark mode: same three elements match their literal dark-mode RGB
   values, and `matchMedia('(prefers-color-scheme: dark)').matches` is
   `true`.
3. Dark-mode body text, link, and muted-text colors all clear 4.5:1
   contrast against the dark background (WCAG AA for normal text).
4. Choosing "Light" from the menu while the OS is in dark mode forces
   light colors, updates `aria-checked` on all three theme radios and
   `localStorage['stormoji-theme']`, and leaves the menu open.
5. Choosing "System" removes the override (`<html>` loses `data-theme`,
   following the OS preference again), and a stored `"dark"`/`"light"`
   choice re-applies correctly after a reload.
