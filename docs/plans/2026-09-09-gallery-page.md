# Gallery Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second, static `gallery.html` page showing curated example stormoji entries (to help new players get the hang of the game) plus a `mailto:` link for submitting new examples.

**Architecture:** `gallery-data.js` is a plain global array of `{ emojis, story }` objects (no date, no attribution), hand-edited to curate new entries - the same convention as `emoji-data.js`. `gallery.js` renders one card per entry into a grid on `gallery.html`, reusing the existing `.story-card`/`.story-card-emojis`/`.story-card-text` styles, and duplicates the small theme-application snippet from `app.js` so the page respects whatever theme was chosen on the main page. `index.html`'s header gains a `🖼️` link to the gallery; `gallery.html`'s header has a `👈` link and a linked title, both back to `index.html`. No backend, no build step, no new dependencies.

**Tech Stack:** Vanilla JavaScript, HTML5, CSS3, `rodney` (Chrome automation CLI) for scripted browser verification.

**Spec:** `docs/plans/2026-09-09-gallery-page-design.md`

## Global Constraints

- No new dependencies - no npm packages, no build step, no backend/server-side submission handling.
- Commit messages use conventional commit format (`feat:`, `test:`, `docs:`), one logical change per commit.
- The gallery page must work identically opened via `file://` or served over HTTP - no `fetch()` of local data files.
- Gallery cards show emojis + story only - no date, no author/attribution (see spec's "Explicitly Out of Scope").
- DOM-driven behavior in this codebase is verified with scripted `rodney` checks (`scripts/manual_tests/*.sh` + `docs/manual_tests.md`), not unit tests - there is no Node-testable pure logic in this feature.
- End every commit message with:
  ```
  Claude-Session: https://claude.ai/code/session_01RpKpN3pqyqtWmszLTJMJHv
  ```

---

## Task 1: Gallery data, page, and rendering

**Files:**
- Create: `gallery-data.js`
- Create: `gallery.html`
- Create: `gallery.js`
- Modify: `styles.css` (append new rules after `.story-card-text`, `styles.css:341-344`)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `galleryStories` - global array in `gallery-data.js`, `{ emojis: string, story: string }[]`. `renderGallery(stories, container)` - function in `gallery.js`, clears `container` and appends one `.story-card` div (containing a `.story-card-emojis` and a `.story-card-text` div) per entry in `stories`. `gallery.html` element ids: `#gallery-grid` (the render target), `#home-link` (title, links to `index.html`), `#back-link` (👈, links to `index.html`), `#gallery-mailto-link` (the submission `mailto:` link). CSS classes `.icon-link`, `.home-link`, `.gallery-intro`, `.gallery-grid`, `.gallery-submit`. Task 2 consumes `.icon-link` for `index.html`'s new header link; Task 3 consumes every id/global listed above for the scripted test.

- [ ] **Step 1: Create `gallery-data.js`**

```javascript
const galleryStories = [
    { emojis: "🏹 🚘 🎧 👩‍🔧", story: "To start the long weekend Janet drove straight to the beach, blasting Mike & the Mechanics the whole way." },
    { emojis: "🧀 😍 🚕 💌", story: "For Valentine's Day Sally got Harry a ticket for the \"Cheese Taxi\" which stops at every gourmet cheese shop in town. That's when he knew." },
    { emojis: "🏅 🧑‍🦳 ⌨️ 🚂", story: "Grandma Dagny won gold at the eGames in the Railroad Tycoon event." },
    { emojis: "🖨️ 🚋 😛 👨‍🎤", story: "Sheldon thought his 3D printed train set was \"so punk rock.\"  It... was not." },
    { emojis: "👩‍🎓 🍯 🚇 ❤️", story: "Maria bumped into her honey on the train when she was in college." },
    { emojis: "❇️ ⛱️ 👨‍🏭 🦋", story: "Life was a beach at the sparkly butterfly factory." },
    { emojis: "💫 🐪 🔗 🎾", story: "Andre's concussion was linked to taking some serious lumps on the tennis court." }
];
```

These 7 entries are `tmp/gallery.csv`'s starter examples with the `Date Key`/`Date` columns dropped (gallery cards show no date - see the design doc's "Explicitly Out of Scope").

- [ ] **Step 2: Create `gallery.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stormoji Gallery</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌧</text></svg>">
</head>
<body>
    <div class="container">
        <header>
            <h1><a href="index.html" id="home-link" class="home-link">⛈ Stormoji</a></h1>
            <a href="index.html" class="icon-link" id="back-link" title="Back to game" aria-label="Back to game">👈</a>
        </header>

        <main>
            <div class="gallery-intro">
                <h2>Gallery</h2>
                <p>A few favorite stormoji stories to help you get the hang of it.</p>
            </div>

            <div class="gallery-grid" id="gallery-grid">
                <!-- Gallery cards will be inserted here by JavaScript -->
            </div>

            <p class="gallery-submit">
                Got a stormoji story you're proud of? <a href="mailto:tracy@stormoji.com" id="gallery-mailto-link">Send it in</a> - submissions are reviewed and curated by hand, so not every story makes the cut.
            </p>
        </main>

        <footer class="footer">
            <p>Copyright © 2025-2026 <a href="https://tracyatteberry.com">Tracy Atteberry</a></p>
        </footer>
    </div>

    <script src="gallery-data.js"></script>
    <script src="gallery.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `gallery.js`**

```javascript
// Duplicated from app.js's resolveThemeAttribute/applyTheme rather than
// shared - it's ~10 lines and this page has no other dependency on
// app.js, so a cross-file import isn't worth it for this much code.
function resolveThemeAttribute(storedValue) {
    return (storedValue === 'light' || storedValue === 'dark') ? storedValue : null;
}

// Applied immediately (not inside window.onload) so the correct theme is
// set as early as possible, minimizing the flash of the wrong theme.
(function applyTheme() {
    const attr = resolveThemeAttribute(localStorage.getItem('stormoji-theme'));
    if (attr) {
        document.documentElement.setAttribute('data-theme', attr);
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
})();

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

window.onload = function() {
    renderGallery(galleryStories, document.getElementById('gallery-grid'));
};
```

- [ ] **Step 4: Add gallery styles to `styles.css`**

Find this exact block (`styles.css:341-345`):

```css
.story-card-text {
    white-space: pre-wrap;
    line-height: 1.4;
}

.footer {
```

Replace it with:

```css
.story-card-text {
    white-space: pre-wrap;
    line-height: 1.4;
}

.icon-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    line-height: 1;
    text-decoration: none;
    padding: 10px;
    border-radius: 5px;
    transition: background-color 0.3s;
}

.icon-link:hover {
    background-color: var(--button-hover);
}

.home-link {
    color: inherit;
    text-decoration: none;
}

.gallery-intro {
    text-align: center;
    margin-bottom: 10px;
}

.gallery-intro h2 {
    color: var(--link-color);
    margin-bottom: 8px;
}

.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 15px;
}

.gallery-submit {
    text-align: center;
    color: var(--muted-text-color);
    font-size: 0.9rem;
    margin-top: 10px;
}

.gallery-submit a {
    color: var(--link-color);
}

.footer {
```

- [ ] **Step 5: Verify in a real browser via `rodney`**

```bash
(cd /Users/tracy/projects/stormoji && python3 -m http.server 8000 >/tmp/stormoji_gallery_verify_server.log 2>&1 &)
sleep 1
rodney start >/dev/null
rodney open http://localhost:8000/gallery.html >/dev/null
rodney waitload >/dev/null
echo "cards: $(rodney count '.gallery-grid .story-card')"
echo "date elements: $(rodney count '.gallery-grid .story-card-date')"
echo "first card emojis: $(rodney js "document.querySelector('.gallery-grid .story-card-emojis').textContent")"
rodney stop >/dev/null
pkill -f "http.server 8000"
```

Expected: `cards: 7`, `date elements: 0`, and `first card emojis: 🏹 🚘 🎧 👩‍🔧` (matching `galleryStories[0].emojis`). If any value is wrong, fix `gallery.js`/`gallery.html` before continuing - do not commit a page that doesn't actually render.

- [ ] **Step 6: Commit**

```bash
git add gallery-data.js gallery.html gallery.js styles.css
git commit -m "$(cat <<'EOF'
feat: add curated Gallery page

New gallery.html shows a grid of hand-picked example stormoji entries
(emojis + story, no date/attribution) to help new players see what a
finished story looks like, plus a mailto: link for submitting new
examples for manual curation. Starter content in gallery-data.js is
the 7 entries from tmp/gallery.csv with the date columns dropped.

Respects whatever light/dark/system theme choice was already saved
from the main page (stormoji-theme localStorage key, shared across
both pages).

Not yet linked from index.html - that's the next commit.

See docs/plans/2026-09-09-gallery-page-design.md for the full design.

Claude-Session: https://claude.ai/code/session_01RpKpN3pqyqtWmszLTJMJHv
EOF
)"
```

---

## Task 2: Link the main page to the Gallery

**Files:**
- Modify: `index.html:12-25`
- Modify: `styles.css` (append `.header-actions` after `.icon-link:hover`, added in Task 1)

**Interfaces:**
- Consumes: `.icon-link` CSS class and `gallery.html` from Task 1.
- Produces: `#gallery-link` id in `index.html`'s header; `.header-actions` CSS class. Task 3 consumes `#gallery-link` for the scripted test.

- [ ] **Step 1: Wrap the header's right-hand controls and add the Gallery link**

Find this exact block (`index.html:12-25`):

```html
        <header>
            <h1>⛈ Stormoji</h1>
            <button id="menu-btn" class="menu-btn" aria-label="Menu" aria-expanded="false">🍔</button>
            <div id="menu-dropdown" class="menu-dropdown">
                <button type="button" class="menu-item" id="menu-about">About</button>
                <button type="button" class="menu-item" id="menu-export">Export History</button>
                <div class="menu-section-label" id="theme-group-label">Theme</div>
                <div class="theme-group" role="radiogroup" aria-labelledby="theme-group-label">
                    <button type="button" class="menu-item theme-option" data-theme-choice="light" role="radio" aria-checked="false">🌞 Light</button>
                    <button type="button" class="menu-item theme-option" data-theme-choice="dark" role="radio" aria-checked="false">🌚 Dark</button>
                    <button type="button" class="menu-item theme-option" data-theme-choice="system" role="radio" aria-checked="true">🖥️ System</button>
                </div>
            </div>
        </header>
```

Replace it with:

```html
        <header>
            <h1>⛈ Stormoji</h1>
            <div class="header-actions">
                <a href="gallery.html" class="icon-link" id="gallery-link" title="Gallery" aria-label="Gallery">🖼️</a>
                <button id="menu-btn" class="menu-btn" aria-label="Menu" aria-expanded="false">🍔</button>
                <div id="menu-dropdown" class="menu-dropdown">
                    <button type="button" class="menu-item" id="menu-about">About</button>
                    <button type="button" class="menu-item" id="menu-export">Export History</button>
                    <div class="menu-section-label" id="theme-group-label">Theme</div>
                    <div class="theme-group" role="radiogroup" aria-labelledby="theme-group-label">
                        <button type="button" class="menu-item theme-option" data-theme-choice="light" role="radio" aria-checked="false">🌞 Light</button>
                        <button type="button" class="menu-item theme-option" data-theme-choice="dark" role="radio" aria-checked="false">🌚 Dark</button>
                        <button type="button" class="menu-item theme-option" data-theme-choice="system" role="radio" aria-checked="true">🖥️ System</button>
                    </div>
                </div>
            </div>
        </header>
```

The new wrapper is `position: static`, so `#menu-dropdown`'s existing `position: absolute` (`styles.css:390-401`) still resolves against `header` (`position: relative`) exactly as before - the dropdown's placement doesn't change.

- [ ] **Step 2: Add `.header-actions` to `styles.css`**

Find this exact block (added in Task 1, now at the end of the Task 1 insertion):

```css
.icon-link:hover {
    background-color: var(--button-hover);
}
```

Replace it with:

```css
.icon-link:hover {
    background-color: var(--button-hover);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}
```

- [ ] **Step 3: Verify in a real browser via `rodney`**

```bash
(cd /Users/tracy/projects/stormoji && python3 -m http.server 8000 >/tmp/stormoji_gallery_verify_server.log 2>&1 &)
sleep 1
rodney start >/dev/null
rodney open http://localhost:8000/index.html >/dev/null
rodney waitload >/dev/null
rodney click "#gallery-link" >/dev/null
rodney waitload >/dev/null
echo "path after clicking gallery link: $(rodney js "window.location.pathname")"
rodney stop >/dev/null
pkill -f "http.server 8000"
```

Expected: `path after clicking gallery link: /gallery.html`. If it doesn't navigate there, check the `href` on `#gallery-link` and that `.header-actions` didn't break the header's `justify-content: space-between` layout (open `index.html` visually and confirm the 🖼️/🍔 icons sit at the header's right edge, not centered).

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "$(cat <<'EOF'
feat: link the main page header to the Gallery

Adds a 🖼️ icon next to the existing 🍔 menu button, wrapped together
in a new .header-actions flex container so the header keeps exactly
two direct children (title, actions) for its existing
justify-content: space-between layout.

Claude-Session: https://claude.ai/code/session_01RpKpN3pqyqtWmszLTJMJHv
EOF
)"
```

---

## Task 3: Scripted browser regression test

**Files:**
- Create: `scripts/manual_tests/gallery.sh`
- Modify: `scripts/manual_tests/run_all.sh`
- Modify: `docs/manual_tests.md`

**Interfaces:**
- Consumes: `#gallery-grid`, `galleryStories`, `#home-link`, `#back-link`, `#gallery-mailto-link` from Task 1; `#gallery-link` from Task 2; `parse_base_url`/`start_rodney` from `scripts/manual_tests/lib.sh` (already exists).
- Produces: `scripts/manual_tests/gallery.sh`, a `## Gallery` section in `docs/manual_tests.md`, a new line in `run_all.sh`. No later task depends on this programmatically - it's a standalone verification tool, following the same pattern as `story_persistence.sh`/`accessibility.sh`/`history_export.sh`/`dark_mode.sh`.

- [ ] **Step 1: Create `scripts/manual_tests/gallery.sh`**

```bash
#!/usr/bin/env bash
# Scripted regression test for the Gallery page (gallery.html, gallery.js,
# gallery-data.js): grid rendering, header navigation links, shared theme,
# and the submission mailto link. See docs/manual_tests.md.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

parse_base_url "$@"

if ! command -v rodney >/dev/null 2>&1; then
  echo "ERROR: rodney is not installed or not on PATH." >&2
  echo "See docs/manual_tests.md > Requirements." >&2
  exit 1
fi

if ! curl -fsS -o /dev/null "$BASE_URL/gallery.html"; then
  echo "ERROR: $BASE_URL is not reachable." >&2
  echo "Start a local server with: python3 -m http.server 8000" >&2
  exit 1
fi

start_rodney

INDEX_URL="$BASE_URL/index.html"
GALLERY_URL="$BASE_URL/gallery.html"

# --- Scenario 1: grid renders one card per entry, emojis + story, no date ---

rodney open "$GALLERY_URL" >/dev/null
rodney waitload >/dev/null

expected_count=$(rodney js "galleryStories.length")
rendered_count=$(rodney count ".gallery-grid .story-card")
date_count=$(rodney count ".gallery-grid .story-card-date")

if [ "$rendered_count" = "$expected_count" ] && [ "$date_count" = "0" ]; then
  echo "PASS: gallery grid renders $rendered_count cards (matching galleryStories.length), with no date shown"
else
  echo "FAIL: expected $expected_count cards and 0 date elements; got $rendered_count cards and $date_count date elements" >&2
  exit 1
fi

first_emojis=$(rodney js "galleryStories[0].emojis")
rendered_first_emojis=$(rodney js "document.querySelector('.gallery-grid .story-card .story-card-emojis').textContent")

if [ "$rendered_first_emojis" = "$first_emojis" ]; then
  echo "PASS: first card's emojis match galleryStories[0]"
else
  echo "FAIL: expected emojis '$first_emojis', got '$rendered_first_emojis'" >&2
  exit 1
fi

# --- Scenario 2: header navigation - gallery -> game and back ---

rodney click "#back-link" >/dev/null
rodney waitload >/dev/null
current_path=$(rodney js "window.location.pathname")

if [[ "$current_path" == */index.html ]]; then
  echo "PASS: the back link (👈) navigates from the gallery to index.html"
else
  echo "FAIL: expected to land on index.html, got path '$current_path'" >&2
  exit 1
fi

rodney click "#gallery-link" >/dev/null
rodney waitload >/dev/null
current_path=$(rodney js "window.location.pathname")

if [[ "$current_path" == */gallery.html ]]; then
  echo "PASS: the header 🖼️ link navigates from index.html to the gallery"
else
  echo "FAIL: expected to land on gallery.html, got path '$current_path'" >&2
  exit 1
fi

rodney click "#home-link" >/dev/null
rodney waitload >/dev/null
current_path=$(rodney js "window.location.pathname")

if [[ "$current_path" == */index.html ]]; then
  echo "PASS: the ⛈ Stormoji title on the gallery page navigates back to index.html"
else
  echo "FAIL: expected to land on index.html, got path '$current_path'" >&2
  exit 1
fi

# --- Scenario 3: the gallery page respects a theme choice set on the main page ---

rodney js "(function(){ localStorage.setItem('stormoji-theme', 'dark'); return true; })()" >/dev/null
rodney open "$GALLERY_URL" >/dev/null
rodney waitload >/dev/null

theme_attr=$(rodney js "document.documentElement.getAttribute('data-theme')")
if [ "$theme_attr" = "dark" ]; then
  echo "PASS: the gallery page picks up the 'dark' theme saved from the main page"
else
  echo "FAIL: expected data-theme='dark' on the gallery page, got '$theme_attr'" >&2
  exit 1
fi

rodney js "(function(){ localStorage.removeItem('stormoji-theme'); return true; })()" >/dev/null

# --- Scenario 4: the submission mailto link ---

mailto_href=$(rodney attr "#gallery-mailto-link" href)
if [ "$mailto_href" = "mailto:tracy@stormoji.com" ]; then
  echo "PASS: the submission link points to mailto:tracy@stormoji.com"
else
  echo "FAIL: expected mailto:tracy@stormoji.com, got '$mailto_href'" >&2
  exit 1
fi
```

- [ ] **Step 2: Make the script executable**

```bash
chmod +x /Users/tracy/projects/stormoji/scripts/manual_tests/gallery.sh
```

- [ ] **Step 3: Add `gallery.sh` to `run_all.sh`**

Find this exact block in `scripts/manual_tests/run_all.sh`:

```bash
run_script "story_persistence.sh" "$SCRIPT_DIR/story_persistence.sh" --base-url "$BASE_URL"
run_script "accessibility.sh" "$SCRIPT_DIR/accessibility.sh" --base-url "$BASE_URL"
run_script "history_export.sh" "$SCRIPT_DIR/history_export.sh" --base-url "$BASE_URL"
run_script "dark_mode.sh" "$SCRIPT_DIR/dark_mode.sh" --base-url "$BASE_URL"
```

Replace it with:

```bash
run_script "story_persistence.sh" "$SCRIPT_DIR/story_persistence.sh" --base-url "$BASE_URL"
run_script "accessibility.sh" "$SCRIPT_DIR/accessibility.sh" --base-url "$BASE_URL"
run_script "history_export.sh" "$SCRIPT_DIR/history_export.sh" --base-url "$BASE_URL"
run_script "dark_mode.sh" "$SCRIPT_DIR/dark_mode.sh" --base-url "$BASE_URL"
run_script "gallery.sh" "$SCRIPT_DIR/gallery.sh" --base-url "$BASE_URL"
```

- [ ] **Step 4: Add a `## Gallery` section to `docs/manual_tests.md`**

Append this to the end of the file:

```markdown

## Gallery

Tests the Gallery page (`gallery.html`, `gallery.js`, `gallery-data.js`):
grid rendering (card count and content matching `galleryStories`, no
date shown), header navigation both directions (`index.html` <->
`gallery.html`), the shared `stormoji-theme` carrying over from the main
page, and the submission `mailto:` link. See
`docs/plans/2026-09-09-gallery-page-design.md` for the full design.

Script: `scripts/manual_tests/gallery.sh [--base-url URL]`
(default `http://localhost:8000`)

1. The grid renders one card per `galleryStories` entry, with no date
   elements, and the first card's emojis match `galleryStories[0]`.
2. Clicking the gallery's 👈 link lands on `index.html`; clicking the
   main page's 🖼️ link lands on `gallery.html`; clicking the gallery's
   `⛈ Stormoji` title lands back on `index.html`.
3. Setting `stormoji-theme` to `"dark"` and then loading the gallery
   fresh applies `data-theme="dark"` to `<html>`, same as on the main
   page.
4. The submission link's `href` is exactly `mailto:tracy@stormoji.com`.
```

- [ ] **Step 5: Run the script against a local server to verify it passes**

```bash
(cd /Users/tracy/projects/stormoji && python3 -m http.server 8000 >/tmp/stormoji_manual_test_server.log 2>&1 &)
sleep 1
/Users/tracy/projects/stormoji/scripts/manual_tests/gallery.sh
```

Expected output: 5 `PASS:` lines, no `FAIL:` lines, exit code `0`.

Then stop the local server:
```bash
pkill -f "http.server 8000"
```

If any scenario prints `FAIL`, stop and debug before proceeding - do not commit a script that doesn't actually pass against the real implementation.

- [ ] **Step 6: Commit**

```bash
git add scripts/manual_tests/gallery.sh scripts/manual_tests/run_all.sh docs/manual_tests.md
git commit -m "$(cat <<'EOF'
test: add scripted rodney regression test for the Gallery page

scripts/manual_tests/gallery.sh, following the existing
scripts/manual_tests/*.sh + docs/manual_tests.md pattern. Covers grid
rendering, header navigation in both directions, the shared
stormoji-theme carrying over from the main page, and the submission
mailto: link.

Verified passing against a local server before committing.

Claude-Session: https://claude.ai/code/session_01RpKpN3pqyqtWmszLTJMJHv
EOF
)"
```

---

## Task 4: Update documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: the shipped feature from Tasks 1-3 (file names/paths only - no code interfaces).
- Produces: documentation only.

- [ ] **Step 1: Update `CLAUDE.md`'s Tech Stack section**

Find this exact block (`CLAUDE.md:9-15`):

```markdown
## Tech Stack

This is a vanilla JavaScript single-page application with no build system or runtime dependencies:
- **HTML** (`index.html`) - Single page layout
- **CSS** (`styles.css`) - All styling
- **JavaScript** (`app.js`) - Main application logic
- **Data** (`emoji-data.js`) - Emoji categories and metadata
```

Replace it with:

```markdown
## Tech Stack

This is a vanilla JavaScript application with no build system or runtime dependencies. The daily game is a single page; a second, static Gallery page shares its styling and theme:
- **HTML** (`index.html`) - Main game page layout
- **HTML** (`gallery.html`) - Gallery page layout, showing curated example stories
- **CSS** (`styles.css`) - All styling, shared by both pages
- **JavaScript** (`app.js`) - Main game application logic
- **JavaScript** (`gallery.js`) - Gallery page rendering and theme application
- **Data** (`emoji-data.js`) - Emoji categories and metadata
- **Data** (`gallery-data.js`) - Curated Gallery entries (emojis + story) - hand-edited to add new examples
```

- [ ] **Step 2: Add a "Gallery Page" subsection to `CLAUDE.md`**

Find this exact block (`CLAUDE.md:164-170`):

```markdown
See `docs/plans/2026-07-12-dark-mode-design.md` for the full palette,
contrast-ratio reasoning, and toggle UX rationale. Verified via
`scripts/manual_tests/dark_mode.sh` (see `docs/manual_tests.md`), since
there's no CSS unit-test harness in this project and DOM-driven `app.js`
behavior isn't Node-testable.

## Modifying Emoji Data
```

Replace it with:

```markdown
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
`⛈ Stormoji` title.

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
  used on the main page's history cards).
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
```

- [ ] **Step 3: Add a Known Limitations note about manual curation**

Find this exact block (`CLAUDE.md:178-183`):

```markdown
## Known Limitations

- No backend - everything is client-side
- No sharing functionality beyond clipboard copy
- Emoji curation could be improved (noted in README)
- No accessibility features beyond basic HTML semantics
```

Replace it with:

```markdown
## Known Limitations

- No backend - everything is client-side
- No sharing functionality beyond clipboard copy
- Emoji curation could be improved (noted in README)
- No accessibility features beyond basic HTML semantics
- Gallery submissions are reviewed by email and added by hand - there's
  no in-app submission form or automatic publishing
```

- [ ] **Step 4: Update `README.md`'s Overview**

Find this exact block (`README.md:12-14`):

```markdown
## Overview

Stormoji is a single page web app that hands you a new creative writing prompt every day. Like Wordle's daily puzzle, every visitor sees the same four emojis and writes their own story weaving them together. Play today's puzzle at [stormoji.com](https://stormoji.com).
```

Replace it with:

```markdown
## Overview

Stormoji hands you a new creative writing prompt every day. Like Wordle's daily puzzle, every visitor sees the same four emojis and writes their own story weaving them together. Play today's puzzle at [stormoji.com](https://stormoji.com). A [Gallery](https://stormoji.com/gallery.html) of hand-picked example stories - submittable by email, curated by hand - helps new players see what a finished story looks like.
```

- [ ] **Step 5: Verify no other stale references remain**

```bash
grep -n "single page\|single-page" /Users/tracy/projects/stormoji/CLAUDE.md /Users/tracy/projects/stormoji/README.md
```

Expected: no remaining matches describing the *site* as single-page (a match describing `index.html` itself, e.g. "Main game page layout", is fine and expected).

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "$(cat <<'EOF'
docs: document the Gallery page

Updates CLAUDE.md (Tech Stack file list, a new "Gallery Page"
subsection, and a Known Limitations note about manual curation) and
README.md's Overview, since the site is no longer strictly single-page.

Claude-Session: https://claude.ai/code/session_01RpKpN3pqyqtWmszLTJMJHv
EOF
)"
```
