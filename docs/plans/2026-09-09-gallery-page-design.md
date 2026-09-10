# Gallery Page Design

**Date:** 2026-09-09
**Feature:** A second, manually-curated "Gallery" page showing example stormoji entries, to help new users get the hang of the game, plus a way for players to submit their own examples for consideration.
**Status:** Design Complete - Ready for Implementation

## Overview

Stormoji currently has no examples of finished stories anywhere - a new player sees four emojis and a blank textarea with no sense of what a "good" entry looks like. This adds a `gallery.html` page showing a grid of hand-picked example entries (emojis + story only), reachable from the main page via a new header icon. A plain `mailto:` link lets players submit their own examples; acceptance is manual and offline (there is no submission form or backend), matching the project's no-backend philosophy.

Starter content: the 7 entries in `tmp/gallery.csv` (already in the site's CSV export format), converted into the new gallery data format as part of this work.

## Requirements

### Functional Requirements
- A `gallery.html` page renders a responsive grid of curated example entries, each showing the four emojis and the story text - no date, no attribution (the date is meaningless for a curated example, and the starter data has no author field; see "Explicitly Out of Scope").
- `index.html`'s header gains a `🖼️` icon/link (next to the existing 🍔 menu button) that navigates to `gallery.html`, with `title`/`aria-label` of "Gallery".
- `gallery.html`'s header mirrors this: the `<h1>⛈ Stormoji</h1>` links back to `index.html`, and a `👈` icon/link sits in the hamburger's slot, also navigating back to `index.html` (`aria-label="Back to game"`). No hamburger menu on this page - there's no personal history to export and no reason to duplicate the theme toggle on a second page when `stormoji-theme` already carries over via shared `localStorage`.
- `gallery.html` respects the same light/dark/system theme choice as the main page, applied the same way (a `data-theme` attribute set as early as possible, before first paint).
- The page includes a plain `mailto:tracy@stormoji.com` link inviting submissions, with a short note that inclusion is manually curated (not automatic).

### Non-Functional Requirements
- No new dependencies, no build step, no backend. Gallery content is a static, hand-edited JS file, mirroring how `emoji-data.js` already works.
- Must work identically whether the site is opened via `file://` or served over HTTP - rules out `fetch()`-ing a CSV or JSON file at runtime.

## Architecture

### Data Model

New file `gallery-data.js`, a plain global array (loaded via `<script>` tag, no `module.exports`, same convention as `emoji-data.js`):

```javascript
const galleryStories = [
    { emojis: "🏹 🚘 🎧 👩‍🔧", story: "To start the long weekend Janet drove straight to the beach, blasting Mike & the Mechanics the whole way." },
    { emojis: "🧀 😍 🚕 💌", story: "For Valentine's Day Sally got Harry a ticket for the \"Cheese Taxi\" which stops at every gourmet cheese shop in town. That's when he knew." },
    // ...remaining 5 entries from tmp/gallery.csv, dateKey/date columns dropped
];
```

Adding a new example going forward means hand-appending an object to this array and committing it - no tooling needed.

### Pages and Files

- **`gallery.html`** (new): same document shell as `index.html` - a `.container` div holding `header` and `main` - links `styles.css`, loads `gallery-data.js` then `gallery.js`.
- **`gallery.js`** (new): on load, applies the saved theme (duplicating the ~10-line `resolveThemeAttribute`/`applyTheme` logic from `app.js:172-196` rather than extracting a shared module - it's small enough that a cross-file dependency isn't worth it), then renders one card per `galleryStories` entry into a grid container.
- **`gallery-data.js`** (new): the data described above.
- **`index.html`** (modified): add the `🖼️` header link.
- **`styles.css`** (modified): add grid layout rules for the gallery; card styles reusing/adapting the existing `.story-card`, `.story-card-emojis`, `.story-card-text` rules (`styles.css:316-341`) minus the date line (`.story-card-date` isn't used on this page); and a new `.icon-link` rule for the header's `🖼️`/`👈` links, sized and positioned consistently with the existing `.menu-btn` button they sit next to (or replace).

### Card Rendering

Mirrors the existing `displayStoryHistory()` pattern (`app.js:326-...`) minus the date element:

```javascript
function renderGallery(stories, container) {
    container.innerHTML = '';
    stories.forEach(item => {
        const card = document.createElement('div');
        card.className = 'story-card';

        const emojisElement = document.createElement('div');
        emojisElement.className = 'story-card-emojis';
        emojisElement.textContent = item.emojis;

        const storyElement = document.createElement('div');
        storyElement.className = 'story-card-text';
        storyElement.textContent = item.story;

        card.append(emojisElement, storyElement);
        container.appendChild(card);
    });
}
```

No loading state, no error state - `galleryStories` is a static array baked into the page, always present and always non-empty in practice. If it were ever empty, the grid simply renders no cards (no special-cased empty message needed, unlike `displayStoryHistory()`'s "No stories in your history yet" - an empty gallery isn't a state a real visitor should ever see).

### Header Changes

`index.html`, next to `#menu-btn`:
```html
<a href="gallery.html" class="icon-link" id="gallery-link" title="Gallery" aria-label="Gallery">🖼️</a>
```

`gallery.html` header:
```html
<h1><a href="index.html">⛈ Stormoji</a></h1>
<a href="index.html" class="icon-link" id="back-link" title="Back to game" aria-label="Back to game">👈</a>
```

### Explicitly Out of Scope

- **Author attribution.** The starter CSV has no author field, and adding one means asking submitters for a name/handle and handling the "blank vs. provided" display logic for no clear benefit yet. Can be added later if wanted.
- **Prefilled `mailto:` subject/body template.** A plain address is simplest; revisit if unstructured submissions turn out to be a curation burden.
- **A submission form or backend.** Curation is manual and offline by design - out of scope for this no-backend project.
- **Hamburger menu / theme toggle on the gallery page.** Theme is inherited silently via the shared `stormoji-theme` localStorage key; no toggle needed on a page that isn't the main game.
- **Pagination or search/filtering of gallery entries.** With a handful of hand-picked examples, a single grid is sufficient; revisit if the curated set grows large.

## Testing

### Unit Tests (`app.test.js`)
None needed - `gallery.js` has no meaningfully pure logic worth extracting to module scope (unlike `app.js`'s date/seed math), and `gallery-data.js` is plain data.

### Scripted Manual Test
Following the existing `scripts/manual_tests/*.sh` + `docs/manual_tests.md` pattern:

**New script:** `scripts/manual_tests/gallery.sh`
1. Load `gallery.html` fresh → grid renders exactly `galleryStories.length` cards, each showing emojis + story text (no date, no attribution).
2. Click the `👈` link → navigates to `index.html`.
3. From `index.html`, click the `🖼️` link → navigates to `gallery.html`.
4. From `gallery.html`, click the `⛈ Stormoji` title → navigates to `index.html`.
5. Set `stormoji-theme` to `"dark"` via `localStorage` on the main page, then load `gallery.html` directly → page renders with `data-theme="dark"` (theme carries over).
6. The `mailto:` link's `href` is exactly `mailto:tracy@stormoji.com`.

## Success Criteria

- New players can reach a page of example stories in one click from the main page, and return just as easily.
- The gallery page respects the user's existing theme choice with no flash of the wrong theme.
- Adding a future example is a one-line append to `gallery-data.js` plus a commit - no other code changes needed.
- `scripts/manual_tests/gallery.sh` passes and becomes the regression check for this page going forward.
