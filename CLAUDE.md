# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stormoji is a daily storytelling puzzle game where users are presented with four randomly-selected emojis and write a creative story incorporating all four. Similar to Wordle, all users see the same emojis each day. Stories are saved to browser localStorage with up to six months of history.

## Tech Stack

This is a vanilla JavaScript single-page application with no build system or runtime dependencies:
- **HTML** (`index.html`) - Single page layout
- **CSS** (`styles.css`) - All styling
- **JavaScript** (`app.js`) - Main application logic
- **Data** (`emoji-data.js`) - Emoji categories and metadata

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

## Core Architecture

### Deterministic Daily Emoji Selection

The key architectural feature is ensuring all users see the same emojis on a given day:

1. **Date-based seeding** (`app.js` inside `window.onload`): A hash of the current UTC date generates a consistent seed
2. **Seeded random selection** (`seededRandom`, `hashCode` - `app.js:5-20`): Uses sine-based PRNG with the date seed
3. **Category-based selection** (`selectDailyEmojis` - `app.js:60-100`): Selects 4 categories, then one emoji from each
4. **Fisher-Yates shuffle** (`shuffleArray` - `app.js:22-38`): Randomizes emoji order deterministically

This ensures the same date produces the same emojis across all users and sessions. The seed, the story `dateKey`, and the displayed date are all anchored to **UTC**, not the visitor's local timezone - otherwise users on either side of UTC midnight would see mismatched dates/emojis/stories (this was a real bug, fixed after being flagged in `docs/roadmap.md`).

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

Pure, unit-tested (module scope, exported for tests):
- `selectDailyEmojis(categories, dateSeed)` (`app.js:60`): Core daily emoji selection logic
- `seededRandom(seed)` (`app.js:16`): Deterministic random number generator
- `shuffleArray(array, seed)` (`app.js:22`): Seeded Fisher-Yates shuffle
- `formatDateKey(date)` (`app.js:105`): Formats a `Date` as the UTC `YYYY-MM-DD` key used to match stories to days
- `findStoryForDate(stories, dateKey)` (`app.js:110`): Looks up the saved story for a given date key
- `getDraftForToday(draft, todayKey)` (`app.js:117`): Returns the draft's story if it belongs to `todayKey`, else `null` - the `null` sentinel distinguishes "no relevant draft" from "an explicitly-empty draft"
- `upsertStory(stories, entry)` (`app.js:122`): Inserts/replaces a story and keeps the list sorted newest first by `dateKey`
- `pruneStoriesOlderThan(stories, referenceDate, months)` (`app.js:133`): Retention-window filtering
- `escapeCSV(field)` (`app.js:140`): CSV field escaping

DOM/localStorage wiring (inside `window.onload`, not unit tested):
- `applyTodayStory()` (`app.js:457`): Sets the story textarea's value on load and on `pageshow` - a draft for today (via `getDraftForToday`) wins over a finalized story for today, which wins over empty. Also the fix point for the browser's own form-control-state restoration race.
- `saveStoryToHistory(story, emojis, date, dateKey)` (`app.js:269`): Persists a story to localStorage via `upsertStory`/`pruneStoriesOlderThan`
- `displayStoryHistory()` (`app.js:289`): Renders saved stories as cards
- `shareStory()` (`app.js:328`): Saves to history, clears the draft (`stormoji-draft`), and copies story + emojis to clipboard (feature-detected; degrades to a notification if the Clipboard API is unavailable)

### CSV Export

Users can export their story history to CSV format via the menu dropdown:

- Menu button (☰) in header opens dropdown with "About" and "Export History" options
- Export generates CSV with columns: Date Key, Date, Emojis, Story
- CSV properly escapes special characters (quotes, commas, newlines)
- Downloads as `stormoji-history-YYYY-MM-DD.csv`
- Empty history shows notification without downloading

**Implementation:**
- `exportHistoryToCSV()` (`app.js:379`): Main export logic with Blob API
- `escapeCSV()` (`app.js:147`): Helper for proper CSV field escaping (pure, unit-tested)
- Menu dropdown uses click-outside detection pattern for UX (`app.js:511-533`)

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
