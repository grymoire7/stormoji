# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stormoji is a daily storytelling puzzle game where users are presented with four randomly-selected emojis and write a creative story incorporating all four. Similar to Wordle, all users see the same emojis each day. Stories are saved to browser localStorage with up to six months of history.

## Tech Stack

This is a vanilla JavaScript application with no build system or runtime dependencies. The daily game is a single page; a second, static Gallery page shares its styling and theme:
- **HTML** (`index.html`) - Main game page layout
- **HTML** (`gallery.html`) - Gallery page layout, showing curated example stories
- **CSS** (`styles.css`) - All styling, shared by both pages
- **JavaScript** (`app.js`) - Main game application logic
- **JavaScript** (`gallery.js`) - Gallery page rendering and theme application
- **Data** (`emoji-data.js`) - Emoji categories and metadata
- **Data** (`gallery-data.js`) - Curated Gallery entries (emojis + story) - hand-edited to add new examples

No bundler or framework. Just open `index.html` in a browser to run. A `package.json` exists solely to run the unit test suite (see Testing below) via Node's built-in test runner - it adds no dependencies and no build step.

## Development Workflow

### Running the Application
```bash
# Serve locally (any method works, for example):
python3 -m http.server 8000
# Then open: http://localhost:8000

# Or simply open the file directly:
open index.html
```

### Testing
`app.js` is split into two parts: pure, dependency-free logic at module scope (date/seed math, emoji selection, story list transforms, CSV escaping), and DOM/localStorage wiring inside `window.onload`. The pure functions are exported via `module.exports` (guarded so it's a no-op in the browser) and unit tested with Node's built-in test runner - no dependencies installed. The `window.onload` assignment is itself guarded (`typeof window !== 'undefined'`), so `require('./app.js')` in tests never touches the DOM.

```bash
npm test
# or directly:
node --test
```

Tests live in `app.test.js`. DOM-dependent behavior (rendering, event listeners, localStorage side effects, clipboard) still has no unit-test coverage; the story-textarea flow specifically (share, reload, draft autosave, browser-restore) has scripted `rodney` (Chrome automation) coverage instead - see `docs/manual_tests.md` and `scripts/manual_tests/story_persistence.sh`. Other DOM flows (history render, CSV export, menu) still require manual testing in a browser.

### Releasing

The version lives in two places that must match (`APP_VERSION` in `app.js`
and `"version"` in `package.json`; a unit test enforces it). To cut a
release, follow [Semantic Versioning](https://semver.org/) (new feature =
minor, fix = patch):

1. Bump both version strings.
2. Add a dated `## [x.y.z] - YYYY-MM-DD` entry to `CHANGELOG.md`.
3. Run `npm test`, then commit as `chore: release x.y.z`.
4. Tag that commit: `git tag -a vx.y.z -m "x.y.z"`.
5. Push the commit and the tag: `git push && git push --tags`.

Tags `v1.0.0`-`v1.1.0` were backfilled on the last commit that shipped
under each version (not the bump commit). There is no `v0.9.0`; that's an
informal baseline predating versioning.

## Core Architecture

### Deterministic Daily Emoji Selection

The key architectural feature is ensuring all users see the same emojis on a given day:

1. **Date-based seeding** (`app.js` inside `window.onload`): A hash of the current local date generates a consistent seed
2. **Seeded random selection** (`seededRandom`, `hashCode` - `app.js:5-20`): Uses sine-based PRNG with the date seed
3. **Category-based selection** (`selectDailyEmojis` - `app.js:60-100`): Selects 4 categories, then one emoji from each
4. **Fisher-Yates shuffle** (`shuffleArray` - `app.js:22-38`): Randomizes emoji order deterministically

This ensures the same calendar date always produces the same emojis. The seed, the story `dateKey`, and the displayed date are all anchored to the visitor's **local** timezone, not UTC - the puzzle flips at each user's own midnight, matching how Wordle and the NYT daily games (Connections, Spelling Bee, Mini) do their reset. This was briefly changed to a shared UTC instant (see `docs/decisions.md`, "Daily puzzle is anchored to local time, not UTC") on the theory that different-timezone users seeing different emoji sets "today" was a bug - it was reverted, because a single global reset instant isn't actually the guarantee players expect or notice (it just relocates the reset to a fixed moment that's midnight for nobody outside UTC), whereas "new puzzle at midnight" is very noticeable when it doesn't hold. Users in different timezones being on different calendar-date puzzles at a given real-world moment is inherent to any timezone-aware daily game and is exactly what Wordle et al. accept.

### Data Structure

**`emoji-data.js`** exports a single global object:
```javascript
const emojiCategories = {
    smileys: [{ emoji: "😀", name: "Grinning Face" }, ...],
    people: [...],
    animals: [...],
    food: [...],
    activity: [...],
    objects: [...],
    symbols: [...],
    travel: [...]
}
```

Each category contains an array of emoji objects with `emoji` (the character) and `name` (display name for tooltip).

### Local Storage Schema

Stories are stored in localStorage under the key `'stormoji-stories'` as JSON:
```javascript
[
    {
        dateKey: "2025-03-15",      // YYYY-MM-DD format for matching
        date: "March 15, 2025",     // Human-readable format for display
        emojis: "😀 🐻 🍔 ⚽",      // Space-separated emoji string
        story: "User's story text..."
    },
    // ... more stories, sorted newest first
]
```

Stories older than 6 months are automatically pruned when saving new stories (`pruneStoriesOlderThan` - `app.js:140-144`, called from `saveStoryToHistory`).

`dateKey` is computed once (`formatDateKey(today)`, local-time-based) and passed explicitly into `saveStoryToHistory(story, emojis, date, dateKey)` - it is deliberately **not** re-derived by re-parsing the human-readable `date` string, since that string has no timezone information and re-parsing it is ambiguous. `upsertStory` sorts by `dateKey` (lexicographic `YYYY-MM-DD` = chronological) for the same reason.

A second, separate localStorage key, `stormoji-draft`, holds at most one in-progress draft (not a list - only "today's" draft is ever relevant):
```javascript
{
    dateKey: "2026-07-12",  // YYYY-MM-DD, local time
    story: "User's in-progress text..."
}
```
Debounced 600ms on typing, and deliberately allowed to win over a finalized `stormoji-stories` entry for today if both exist - a user can keep editing after sharing without re-sharing, so the draft may be newer. Cleared on successful share. See `docs/plans/2026-07-12-draft-autosave-design.md` for the full design.

A third localStorage key, `stormoji-theme`, holds the user's manual
theme override as a plain string: `"light"`, `"dark"`, or `"system"`
(absent is equivalent to `"system"`). See "Theming / Dark Mode" above.

### Key Functions

Pure, unit-tested (module scope, exported for tests):
- `selectDailyEmojis(categories, dateSeed)` (`app.js:60`): Core daily emoji selection logic
- `seededRandom(seed)` (`app.js:16`): Deterministic random number generator
- `shuffleArray(array, seed)` (`app.js:22`): Seeded Fisher-Yates shuffle
- `formatDateKey(date)` (`app.js:105`): Formats a `Date` as the local `YYYY-MM-DD` key used to match stories to days
- `findStoryForDate(stories, dateKey)` (`app.js:110`): Looks up the saved story for a given date key
- `getDraftForToday(draft, todayKey)` (`app.js:117`): Returns the draft's story if it belongs to `todayKey`, else `null` - the `null` sentinel distinguishes "no relevant draft" from "an explicitly-empty draft"
- `upsertStory(stories, entry)` (`app.js:122`): Inserts/replaces a story and keeps the list sorted newest first by `dateKey`
- `pruneStoriesOlderThan(stories, referenceDate, months)` (`app.js:140`): Retention-window filtering
- `escapeCSV(field)` (`app.js:147`): CSV field escaping

DOM/localStorage wiring (inside `window.onload`, not unit tested):
- `applyTodayStory()` (`app.js:457`): Sets the story textarea's value on load and on `pageshow` - a draft for today (via `getDraftForToday`) wins over a finalized story for today, which wins over empty. Also the fix point for the browser's own form-control-state restoration race.
- `saveStoryToHistory(story, emojis, date, dateKey)` (`app.js:269`): Persists a story to localStorage via `upsertStory`/`pruneStoriesOlderThan`
- `displayStoryHistory()` (`app.js:289`): Renders saved stories as cards
- `shareStory()` (`app.js:328`): Saves to history, clears the draft (`stormoji-draft`), and copies story + emojis to clipboard (feature-detected; degrades to a notification if the Clipboard API is unavailable)

### CSV Export

Users can export their story history to CSV format via the menu dropdown:

- Menu button (☰) in header opens dropdown with "About", "Export History" and "Import History" options
- Export generates CSV with columns: Date Key, Date, Emojis, Story
- CSV properly escapes special characters (quotes, commas, newlines)
- Downloads as `stormoji-history-YYYY-MM-DD.csv`
- Empty history shows notification without downloading

**Implementation:**
- `exportHistoryToCSV()` (`app.js:379`): Main export logic with Blob API
- `escapeCSV()` (`app.js:147`): Helper for proper CSV field escaping (pure, unit-tested)
- Menu dropdown uses click-outside detection pattern for UX (`app.js:511-533`)

### CSV Import

"Import History" (hamburger menu, after Export History) opens a file
picker for a CSV in the format Export writes, so history can follow a
user to another browser. Rules:

- **All or nothing.** `parseHistoryCSV` validates the whole file first;
  any invalid row or missing column (Date Key, Date, Emojis, Story - found
  by header name, any order, extras ignored) rejects the file and imports
  nothing. Errors name the row (header = row 1) or column.
- **Existing entries win.** `mergeImportedStories` skips an imported row
  whose `dateKey` already exists in `stormoji-stories`: the primary use
  case is browser A -> B, so B's copy is likely newer. Also documented in
  `README.md` and `docs/decisions.md`.
- **Old rows are kept at import time**, even beyond six months (useful for
  testing), but the next `saveStoryToHistory` prunes them as usual.
- `stormoji-draft` is never touched; `applyTodayStory()` re-runs after
  import so an imported story for today appears if there is no draft.
- Result is a dismissable modal (`#import-modal`, reusing `.modal` styles
  and theme tokens) - "Import complete" or "Import failed". Text is set via
  `textContent`, never `innerHTML`, since it can echo file contents.
- Pure and unit-tested: `parseCSV` (inverse of `escapeCSV`),
  `parseHistoryCSV`, `mergeImportedStories`, `describeImportSuccess`. DOM
  flow is covered by `scripts/manual_tests/history_import.sh`.

### Theming / Dark Mode

`styles.css` supports `prefers-color-scheme: dark` via CSS custom
properties on `:root`, overridden inside a single
`@media (prefers-color-scheme: dark)` block. `--primary-color` and
`--button-hover` are intentionally the *same* value in both themes -
they're only ever used as solid-fill button backgrounds paired with white
text, so their contrast doesn't depend on the page theme; every other
color-bearing property (backgrounds, borders, link/heading text, muted
text) has a light and dark value.

A Light/Dark/System toggle in the hamburger menu (three `role="radio"`
items after a divider below "Export History") lets the user override the
OS preference. The choice is stored in the `stormoji-theme` localStorage
key and applied as a `data-theme="light"`/`data-theme="dark"` attribute
on `<html>` (`resolveThemeAttribute` in `app.js` decides which, if any);
`:root[data-theme="dark"]`/`:root[data-theme="light"]` attribute-selector
rules in `styles.css` outrank the `@media` block via CSS specificity, so
an explicit choice wins regardless of the actual OS setting. "System" (or
no stored value) removes the attribute entirely, deferring back to the
`@media` query - including picking up live OS theme changes, for free.
Selecting a theme deliberately does not close the menu (unlike
About/Export), so the user can compare options with an immediate live
preview.

See `docs/plans/2026-07-12-dark-mode-design.md` for the full palette,
contrast-ratio reasoning, and toggle UX rationale. Verified via
`scripts/manual_tests/dark_mode.sh` (see `docs/manual_tests.md`), since
there's no CSS unit-test harness in this project and DOM-driven `app.js`
behavior isn't Node-testable.

### Gallery Page

`gallery.html` is a second, static page showing hand-picked example
stormoji entries, so new players can see what a finished story looks
like before writing their own. `index.html`'s header links to it via a
🖼️ icon; `gallery.html`'s header links back via a 👈 icon and its linked
⛈ Stormoji title.

- `gallery-data.js` holds the curated entries as a plain global array,
  the same convention as `emoji-data.js`:
  ```javascript
  const galleryStories = [
      { emojis: "🏹 🚘 🎧 👩‍🔧", story: "..." },
      // ...
  ]
  ```
  Adding a new example is a hand-edit (append an object) and a commit -
  no tooling involved. Entries show only `emojis` and `story` - no date,
  no author/attribution (see
  `docs/plans/2026-09-09-gallery-page-design.md`).
- `gallery.js`'s `renderGallery(stories, container)` renders one
  `.story-card` per entry, reusing `.story-card`/`.story-card-emojis`/
  `.story-card-text` from `styles.css` (minus the `.story-card-date` line
  used on the main page's history cards). Each emoji in `.story-card-emojis`
  is its own `.emoji` span (reusing that class and its hover/tooltip
  affordance from the main page's daily emoji display), wired to the same
  `#tooltip` element via a duplicated `showTooltip`/`hideTooltip`. The
  emoji's display name comes from an `emoji -> name` lookup built once from
  `emoji-data.js`'s categories (loaded on `gallery.html` for this purpose)
  rather than being stored per gallery entry, so the curated entries don't
  need to duplicate name data that already lives in `emoji-data.js`.
- The page respects whatever theme was chosen on the main page: it reads
  the shared `stormoji-theme` localStorage key and applies
  `data-theme` the same way `app.js` does, via a small duplicated
  `resolveThemeAttribute`/`applyTheme` (not shared as a module - it's
  ~10 lines).
- A `mailto:tracy@stormoji.com` link invites submissions; there is no
  in-app submission form - accepted examples are added to
  `gallery-data.js` by hand after manual review.

Verified via `scripts/manual_tests/gallery.sh` (see
`docs/manual_tests.md`).

## Modifying Emoji Data

To add/remove/edit emojis, modify `emoji-data.js`. Each emoji object requires:
- `emoji`: The actual emoji character
- `name`: A descriptive name shown in tooltips on hover

The application selects one emoji from each of four randomly-chosen categories, so ensure each category has sufficient variety.

## Known Limitations

- No backend - everything is client-side
- No sharing functionality beyond clipboard copy
- Emoji curation could be improved (noted in README)
- No accessibility features beyond basic HTML semantics
- Gallery submissions are reviewed by email and added by hand - there's
  no in-app submission form or automatic publishing
