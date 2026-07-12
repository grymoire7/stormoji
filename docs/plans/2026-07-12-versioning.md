# Versioning and 1.0 Release Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Stormoji a version number (`1.0.0`), surface it in the About dialog and README, add a test that catches `app.js`/`package.json` version drift, and add `CHANGELOG.md` documenting the `1.0.0` and `0.9.0` releases.

**Architecture:** `APP_VERSION = '1.0.0'` becomes a module-scope constant in `app.js`, exported through the existing test-only `module.exports` guard. `package.json` gets a matching `"version"` field. A new `node:test` case asserts they're equal. The About modal (`index.html`) gets a version line populated from `APP_VERSION` at `window.onload`. `README.md` gets a version badge. `CHANGELOG.md` is a new root-level file.

**Tech Stack:** Vanilla JS, Node's built-in `node:test` runner (see `package.json`, `app.test.js`). No build step, no new dependencies.

## Global Constraints

- Version string format is full semver: `1.0.0` (current release), `0.9.0` (pre-2026-06-11 baseline). Source: `docs/plans/2026-07-12-versioning-design.md`.
- No runtime `fetch`/`require` of `package.json` from the browser — `app.js` must keep working when `index.html` is opened via `file://`. Source: design doc, "Version storage".
- `CHANGELOG.md` follows Keep a Changelog format: `## [1.0.0] - 2026-07-12` grouped into `### Added` / `### Changed` / `### Fixed`; `## [0.9.0] - 2025-03-12` as one short baseline paragraph, not itemized. Source: design doc, "CHANGELOG.md".

---

### Task 1: `APP_VERSION` constant, `package.json` version, and the drift test

**Files:**
- Modify: `app.js:1-4` (add constant), `app.js:658-674` (add to `module.exports`)
- Modify: `package.json`
- Test: `app.test.js`

**Interfaces:**
- Produces: `APP_VERSION` (string constant, value `'1.0.0'`), exported from `app.js` alongside the other pure helpers. Task 2 reads this same constant inside `window.onload` (no import needed there — same file, module scope).

- [ ] **Step 1: Write the failing test**

Add to `app.test.js`, after the existing `require('./app.js')` block (following the same destructuring-import pattern already used there):

```js
const { version: packageVersion } = require('./package.json');
```

Add this as a new top-level import alongside the existing `const { hashCode, ... } = require('./app.js');` block — i.e. add `APP_VERSION` to that existing destructure:

```js
const {
    hashCode,
    seededRandom,
    shuffleArray,
    getDefaultEmojis,
    selectDailyEmojis,
    formatDateKey,
    findStoryForDate,
    getDraftForToday,
    upsertStory,
    pruneStoriesOlderThan,
    escapeCSV,
    resolveThemeAttribute,
    APP_VERSION
} = require('./app.js');
const { version: packageVersion } = require('./package.json');
```

Then add the test itself (anywhere among the other top-level `test(...)` calls in the file):

```js
test('APP_VERSION matches package.json version', () => {
    assert.equal(APP_VERSION, packageVersion);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test`
Expected: FAIL — `APP_VERSION` is `undefined` (not yet exported from `app.js`), so `assert.equal(undefined, packageVersion)` fails. `package.json` also has no `version` field yet, so `packageVersion` is `undefined` too — either way the test must fail before Step 3.

- [ ] **Step 3: Add `"version"` to `package.json`**

Current `package.json`:

```json
{
  "name": "stormoji",
  "private": true,
  "scripts": {
    "test": "node --test"
  }
}
```

Change to:

```json
{
  "name": "stormoji",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 4: Add `APP_VERSION` constant to `app.js`**

Current `app.js:1-5`:

```js
// ---------------------------------------------------------------------------
// Pure helpers (no DOM/browser APIs) - exported below for unit testing.
// ---------------------------------------------------------------------------

function hashCode(str) {
```

Change to:

```js
// ---------------------------------------------------------------------------
// Pure helpers (no DOM/browser APIs) - exported below for unit testing.
// ---------------------------------------------------------------------------

const APP_VERSION = '1.0.0';

function hashCode(str) {
```

- [ ] **Step 5: Add `APP_VERSION` to `module.exports`**

Current `app.js:658-674`:

```js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        hashCode,
        seededRandom,
        shuffleArray,
        getDefaultEmojis,
        getDefaultCategories,
        selectDailyEmojis,
        formatDateKey,
        findStoryForDate,
        getDraftForToday,
        upsertStory,
        pruneStoriesOlderThan,
        escapeCSV,
        resolveThemeAttribute
    };
}
```

Change to:

```js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        hashCode,
        seededRandom,
        shuffleArray,
        getDefaultEmojis,
        getDefaultCategories,
        selectDailyEmojis,
        formatDateKey,
        findStoryForDate,
        getDraftForToday,
        upsertStory,
        pruneStoriesOlderThan,
        escapeCSV,
        resolveThemeAttribute,
        APP_VERSION
    };
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `node --test`
Expected: PASS, including the new `APP_VERSION matches package.json version` test.

- [ ] **Step 7: Commit**

```bash
git add app.js package.json app.test.js
git commit -m "feat: add APP_VERSION and test it matches package.json"
```

---

### Task 2: Show the version in the About dialog

**Files:**
- Modify: `index.html:62-70` (`#about-modal` markup)
- Modify: `app.js:193-225` (`window.onload` DOM wiring)
- Modify: `styles.css` (add `.app-version` rule near `.modal-content`, `styles.css:253-261`)

**Interfaces:**
- Consumes: `APP_VERSION` from Task 1 (module-scope constant in `app.js`, already in scope inside `window.onload` — no import needed).

- [ ] **Step 1: Add the version line to the About modal markup**

Current `index.html:62-70`:

```html
        <div id="about-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
            <div class="modal-content">
                <button type="button" class="close-button" aria-label="Close">&times;</button>
                <h2 id="about-modal-title">About</h2>
                <p>Stormoji is a daily storytelling game with emojis. Be creative. Challenge your friends. 😀</p>
                <p>Your Stormoji history, up to six months, is stored in your local browser. No data is ever sent back
                  to the server. Everything is always local. Enjoy!</p>
            </div>
        </div>
```

Change to:

```html
        <div id="about-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
            <div class="modal-content">
                <button type="button" class="close-button" aria-label="Close">&times;</button>
                <h2 id="about-modal-title">About</h2>
                <p>Stormoji is a daily storytelling game with emojis. Be creative. Challenge your friends. 😀</p>
                <p>Your Stormoji history, up to six months, is stored in your local browser. No data is ever sent back
                  to the server. Everything is always local. Enjoy!</p>
                <p class="app-version">v<span id="app-version"></span></p>
            </div>
        </div>
```

- [ ] **Step 2: Set the version text in `window.onload`**

Current `app.js:207-225`:

```js
        const aboutModal = document.getElementById('about-modal');
        const closeButton = document.querySelector('.close-button');
        const tooltip = document.getElementById('tooltip');
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');

        // Get today's date in a readable format. Formatted in UTC (not the
        // visitor's local timezone) so the displayed date always matches the
        // UTC-anchored puzzle day used by dateSeed/todayKey below - otherwise
        // users on either side of UTC midnight would see a date that doesn't
        // match the emojis/story actually being shown.
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        const formattedDate = today.toLocaleDateString('en-US', options);
        if (currentDateElement) {
            currentDateElement.textContent = formattedDate;
        } else {
            console.error("Date element not found!");
        }
```

Change to (adds `appVersionElement` to the DOM-elements list and sets its text right after the date block, following the same `if (element) { ... }` pattern used for `currentDateElement`):

```js
        const aboutModal = document.getElementById('about-modal');
        const closeButton = document.querySelector('.close-button');
        const tooltip = document.getElementById('tooltip');
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        const appVersionElement = document.getElementById('app-version');

        // Get today's date in a readable format. Formatted in UTC (not the
        // visitor's local timezone) so the displayed date always matches the
        // UTC-anchored puzzle day used by dateSeed/todayKey below - otherwise
        // users on either side of UTC midnight would see a date that doesn't
        // match the emojis/story actually being shown.
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        const formattedDate = today.toLocaleDateString('en-US', options);
        if (currentDateElement) {
            currentDateElement.textContent = formattedDate;
        } else {
            console.error("Date element not found!");
        }

        if (appVersionElement) {
            appVersionElement.textContent = APP_VERSION;
        }
```

- [ ] **Step 3: Style the version line**

Current `styles.css:253-261`:

```css
.modal-content {
    background-color: var(--surface-color);
    padding: 20px;
    border-radius: 5px;
    max-width: 500px;
    width: 80%;
    position: relative;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
```

Add immediately after (new rule, doesn't modify the existing one):

```css
.modal-content {
    background-color: var(--surface-color);
    padding: 20px;
    border-radius: 5px;
    max-width: 500px;
    width: 80%;
    position: relative;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.app-version {
    color: var(--muted-text-color);
    font-size: 0.85em;
}
```

- [ ] **Step 4: Manually verify in a browser**

Run: `python3 -m http.server 8000` (from the repo root), then open `http://localhost:8000`.
Expected: click the hamburger menu → About. The modal shows the two existing paragraphs plus a new line reading `v1.0.0` in muted/smaller text below them.

- [ ] **Step 5: Run the existing test suite to confirm no regressions**

Run: `node --test`
Expected: PASS (this task touches no pure/tested logic, but confirms nothing broke).

- [ ] **Step 6: Commit**

```bash
git add index.html app.js styles.css
git commit -m "feat: show app version in the About dialog"
```

---

### Task 3: README badge and CHANGELOG.md

**Files:**
- Modify: `README.md:6-10` (badge row)
- Create: `CHANGELOG.md`

**Interfaces:**
- None (docs-only task, no code interfaces produced or consumed).

- [ ] **Step 1: Add the version badge to `README.md`**

Current `README.md:6-10`:

```markdown
<a href="https://stormoji.com" target="_blank" ><img src="https://img.shields.io/badge/Live%20Site-stormoji.com-blue?logo=firefox" alt="Live Site: stormoji.com" /></a>
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript" />
<img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5" />
<img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3" />
<img src="https://img.shields.io/badge/License-GPL%20v3.0-green" alt="License GPL" />
```

Change to (new badge inserted right after the Live Site badge):

```markdown
<a href="https://stormoji.com" target="_blank" ><img src="https://img.shields.io/badge/Live%20Site-stormoji.com-blue?logo=firefox" alt="Live Site: stormoji.com" /></a>
<img src="https://img.shields.io/badge/Version-1.0.0-informational" alt="Version 1.0.0" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript" />
<img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5" />
<img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3" />
<img src="https://img.shields.io/badge/License-GPL%20v3.0-green" alt="License GPL" />
```

- [ ] **Step 2: Create `CHANGELOG.md`**

Create `CHANGELOG.md` at the repo root:

```markdown
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
```

- [ ] **Step 3: Manually verify**

Run: `open README.md` or view it in your editor's Markdown preview.
Expected: the new Version badge renders in the badge row alongside the others (shields.io badges require network access to render as images; the `<img>` tag itself is what matters for this check, not necessarily that it loads offline).

Run: `cat CHANGELOG.md` (or open in `$EDITOR`)
Expected: file exists at repo root, has `[1.0.0]` and `[0.9.0]` sections as written above.

- [ ] **Step 4: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: add CHANGELOG.md and version badge for 1.0.0"
```

---

## Self-Review Notes

- **Spec coverage:** Version storage (Task 1), About dialog (Task 2), README badge (Task 3), CHANGELOG.md (Task 3), version-consistency test (Task 1) - all four design-doc sections plus the follow-up test request are covered. `git tag` was explicitly out of scope in the design and is not included here.
- **Placeholder scan:** none - every step shows literal before/after code or exact file content.
- **Type/name consistency:** `APP_VERSION` (Task 1) is the exact identifier read in Task 2's `window.onload` code and exported/imported in Task 1's test; `app-version` (kebab-case) is the exact DOM id used in `index.html` (Task 2, Step 1), `app.js` (Task 2, Step 2), and not referenced elsewhere.
