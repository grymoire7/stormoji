# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stormoji is a daily storytelling puzzle game where users are presented with four randomly-selected emojis and write a creative story incorporating all four. Similar to Wordle, all users see the same emojis each day. Stories are saved to browser localStorage with up to six months of history.

## Tech Stack

This is a vanilla JavaScript single-page application with no build system or dependencies:
- **HTML** (`index.html`) - Single page layout
- **CSS** (`styles.css`) - All styling
- **JavaScript** (`app.js`) - Main application logic
- **Data** (`emoji-data.js`) - Emoji categories and metadata

No package manager, bundler, or framework. Just open `index.html` in a browser to run.

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
No automated tests exist. Manual testing in browser is required.

## Core Architecture

### Deterministic Daily Emoji Selection

The key architectural feature is ensuring all users see the same emojis on a given day:

1. **Date-based seeding** (`app.js:29-44`): A hash of the current date generates a consistent seed
2. **Seeded random selection** (`app.js:32-35`): Uses sine-based PRNG with the date seed
3. **Category-based selection** (`app.js:67-110`): Selects 4 categories, then one emoji from each
4. **Fisher-Yates shuffle** (`app.js:48-64`): Randomizes emoji order deterministically

This ensures the same date produces the same emojis across all users and sessions.

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

Stories older than 6 months are automatically pruned when saving new stories (`app.js:207-210`).

### Key Functions

- `selectDailyEmojis()` (`app.js:67`): Core daily emoji selection logic
- `seededRandom(seed)` (`app.js:32`): Deterministic random number generator
- `shuffleArray(array, seed)` (`app.js:48`): Seeded Fisher-Yates shuffle
- `saveStoryToHistory()` (`app.js:183`): Saves/updates story in localStorage with 6-month retention
- `displayStoryHistory()` (`app.js:221`): Renders saved stories as cards
- `shareStory()` (`app.js:260`): Copies story + emojis to clipboard and saves to history

### CSV Export

Users can export their story history to CSV format via the menu dropdown:

- Menu button (☰) in header opens dropdown with "About" and "Export History" options
- Export generates CSV with columns: Date Key, Date, Emojis, Story
- CSV properly escapes special characters (quotes, commas, newlines)
- Downloads as `stormoji-history-YYYY-MM-DD.csv`
- Empty history shows notification without downloading

**Implementation:**
- `exportHistoryToCSV()` (`app.js:303`): Main export logic with Blob API
- `escapeCSV()` (`app.js:355`): Helper for proper CSV field escaping
- Menu dropdown uses click-outside detection pattern for UX (`app.js:429-451`)

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
