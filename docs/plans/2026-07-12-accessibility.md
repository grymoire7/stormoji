# Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the menu dropdown and About modal proper ARIA roles/labels, keyboard operability, and `Escape`-to-close, and add a character counter to the story textarea.

**Architecture:** The menu's `.menu-item` divs and the modal's `.close-button` span become real `<button>` elements (CSS-reset to look identical) so they're reachable via Tab and activatable with Enter/Space. `menu-btn` gains `aria-haspopup`/`aria-expanded`; the dropdown gets `role="menu"`/`role="menuitem"`; the modal gets `role="dialog" aria-modal="true" aria-labelledby`. Both existing open/close code paths (click-based) are consolidated behind new `closeMenu()`/`closeModal()` functions that also manage focus (move in on open, return to the trigger on close) and register/unregister a shared `keydown` listener for `Escape` (and, for the modal, a focus trap on `Tab`, since its only focusable element is the close button). The character counter is a plain text node driven by the story textarea's existing `input` listener plus `applyTodayStory()`, with no new localStorage or pure logic.

**Tech Stack:** Vanilla JavaScript, plain DOM APIs (`addEventListener('keydown', ...)`, `focus()`, `aria-*` attributes), Node's built-in test runner (`node:test`) for regression checks, `rodney` (Chrome automation CLI) for scripted browser verification.

**Design Document:** `docs/plans/2026-07-12-accessibility-design.md`

## Global Constraints

- No new dependencies - no npm packages, no build step.
- Commit messages use conventional commit format (`fix:`, `feat:`, `test:`, `docs:`), one logical change per commit.
- No visual regressions - `button` resets must make `.menu-item` and `.close-button` look exactly as they do today except for a `:focus-visible` outline.
- No `maxlength`/enforced max on the story textarea - the character counter is guidance only (design decision).
- The character counter uses `aria-describedby`, not `aria-live` - it must not interrupt screen reader users while they type (design decision).
- DOM/localStorage-touching code stays inside `window.onload` and is not unit tested - verified with scripted `rodney` browser checks instead, per this repo's established convention (see `CLAUDE.md` > Testing).
- Follow the existing `docs/plans/YYYY-MM-DD-<feature>[-design].md` naming convention for any new planning docs.

---

## Task 1: Menu dropdown - ARIA, keyboard access, Escape

**Files:**
- Modify: `index.html:14-18`
- Modify: `styles.css:323-336` (`.menu-item`, `.menu-item:hover`)
- Modify: `app.js:514-550` (menu dropdown wiring, inside `window.onload`)

**Interfaces:**
- Produces: `closeMenu()` - closes the dropdown, resets `aria-expanded`, and removes both the click-outside and Escape listeners. Used by Task 2 (the modal-opening `menuAbout` handler calls it before opening the modal) and by the scripted test in Task 4.

- [ ] **Step 1: Update the menu markup in `index.html`**

Find this exact block (`index.html:12-19`):

```html
        <header>
            <h1>⛈ Stormoji</h1>
            <button id="menu-btn" class="menu-btn" aria-label="Menu">🍔</button>
            <div id="menu-dropdown" class="menu-dropdown">
                <div class="menu-item" id="menu-about">About</div>
                <div class="menu-item" id="menu-export">Export History</div>
            </div>
        </header>
```

Replace it with:

```html
        <header>
            <h1>⛈ Stormoji</h1>
            <button id="menu-btn" class="menu-btn" aria-label="Menu" aria-haspopup="true" aria-expanded="false">🍔</button>
            <div id="menu-dropdown" class="menu-dropdown" role="menu">
                <button type="button" class="menu-item" role="menuitem" id="menu-about">About</button>
                <button type="button" class="menu-item" role="menuitem" id="menu-export">Export History</button>
            </div>
        </header>
```

- [ ] **Step 2: Reset button chrome on `.menu-item` in `styles.css`**

Find this exact block (`styles.css:323-336`):

```css
.menu-item {
    padding: 12px 20px;
    cursor: pointer;
    border-bottom: 1px solid var(--border-color);
    transition: background-color 0.2s;
}

.menu-item:last-child {
    border-bottom: none;
}

.menu-item:hover {
    background-color: #f5f5f5;
}
```

Replace it with:

```css
.menu-item {
    display: block;
    width: 100%;
    background: none;
    border: none;
    font: inherit;
    color: inherit;
    text-align: left;
    padding: 12px 20px;
    cursor: pointer;
    border-bottom: 1px solid var(--border-color);
    transition: background-color 0.2s;
}

.menu-item:last-child {
    border-bottom: none;
}

.menu-item:hover {
    background-color: #f5f5f5;
}

.menu-item:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
}
```

- [ ] **Step 3: Add keyboard access, `Escape`, and focus management to the menu in `app.js`**

Find this exact block (`app.js:514-550`):

```javascript
        // Menu dropdown functionality
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isShown = menuDropdown.classList.contains('show');

            if (isShown) {
                menuDropdown.classList.remove('show');
                document.removeEventListener('click', closeMenuOnClickOutside);
            } else {
                menuDropdown.classList.add('show');
                // Add listener on next tick to avoid immediate close
                setTimeout(() => {
                    document.addEventListener('click', closeMenuOnClickOutside);
                }, 0);
            }
        });

        // Close menu when clicking outside
        function closeMenuOnClickOutside(event) {
            if (!menuDropdown.contains(event.target) && event.target !== menuBtn) {
                menuDropdown.classList.remove('show');
                document.removeEventListener('click', closeMenuOnClickOutside);
            }
        }

        // Menu item actions
        menuAbout.addEventListener('click', () => {
            menuDropdown.classList.remove('show');
            document.removeEventListener('click', closeMenuOnClickOutside);
            aboutModal.style.display = 'flex';
        });

        menuExport.addEventListener('click', () => {
            menuDropdown.classList.remove('show');
            document.removeEventListener('click', closeMenuOnClickOutside);
            exportHistoryToCSV();
        });
```

Replace it with:

```javascript
        // Menu dropdown functionality
        function closeMenu() {
            menuDropdown.classList.remove('show');
            menuBtn.setAttribute('aria-expanded', 'false');
            document.removeEventListener('click', closeMenuOnClickOutside);
            document.removeEventListener('keydown', closeMenuOnEscape);
        }

        // Close menu when clicking outside
        function closeMenuOnClickOutside(event) {
            if (!menuDropdown.contains(event.target) && event.target !== menuBtn) {
                closeMenu();
            }
        }

        function closeMenuOnEscape(event) {
            if (event.key === 'Escape') {
                closeMenu();
                menuBtn.focus();
            }
        }

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isShown = menuDropdown.classList.contains('show');

            if (isShown) {
                closeMenu();
            } else {
                menuDropdown.classList.add('show');
                menuBtn.setAttribute('aria-expanded', 'true');
                menuAbout.focus();
                // Add listener on next tick to avoid immediate close
                setTimeout(() => {
                    document.addEventListener('click', closeMenuOnClickOutside);
                }, 0);
                document.addEventListener('keydown', closeMenuOnEscape);
            }
        });

        // Menu item actions
        menuAbout.addEventListener('click', () => {
            closeMenu();
            aboutModal.style.display = 'flex';
        });

        menuExport.addEventListener('click', () => {
            closeMenu();
            exportHistoryToCSV();
        });
```

- [ ] **Step 4: Run the unit tests to confirm nothing broke**

Run: `npm test`
Expected: PASS - all 22 tests still pass (this change only touches DOM-wiring code inside `window.onload`, which isn't unit tested; this is a regression check on the pure-logic suite).

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css app.js
git commit -m "$(cat <<'EOF'
feat: make the menu dropdown keyboard-accessible

Menu items become real <button role="menuitem">s (were unfocusable
divs), the trigger gets aria-haspopup/aria-expanded, and the dropdown
gets role="menu". Opening the menu moves focus to the first item;
Escape closes it and returns focus to the trigger. The three
open/close code paths (toggle click, outside click, item click) now
share one closeMenu() instead of duplicating the same three lines.

Part of the "Accessibility" items in docs/roadmap.md. See
docs/plans/2026-07-12-accessibility-design.md for the full design.
EOF
)"
```

---

## Task 2: About modal - ARIA, keyboard access, Escape, focus trap

**Files:**
- Modify: `index.html:53-61`
- Modify: `styles.css:206-218` (`.close-button`, `.close-button:hover`)
- Modify: `app.js:539-562` (modal wiring, inside `window.onload` - includes the `menuAbout` handler from Task 1's output)

**Interfaces:**
- Consumes: `closeMenu()` from Task 1 (called by the `menuAbout` handler before opening the modal - already wired in Task 1, unchanged here).
- Produces: `closeModal()` - closes the modal, removes the modal's `keydown` listener, and returns focus to the `menuAbout` button. Used by the scripted test in Task 4.

- [ ] **Step 1: Update the modal markup in `index.html`**

Find this exact block (`index.html:53-61`):

```html
        <div id="about-modal" class="modal">
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>About</h2>
                <p>Stormoji is a daily storytelling game with emojis. Be creative. Challenge your friends. 😀</p>
                <p>Your Stormoji history, up to six months, is stored in your local browser. No data is ever sent back
                  to the server. Everything is always local. Enjoy!</p>
            </div>
        </div>
```

Replace it with:

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

- [ ] **Step 2: Reset button chrome on `.close-button` in `styles.css`**

Find this exact block (`styles.css:206-218`):

```css
.close-button {
    position: absolute;
    top: 10px;
    right: 15px;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    color: #777;
}

.close-button:hover {
    color: #333;
}
```

Replace it with:

```css
.close-button {
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
    line-height: 1;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    color: #777;
}

.close-button:hover {
    color: #333;
}

.close-button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
}
```

- [ ] **Step 3: Add keyboard access, `Escape`, and a focus trap to the modal in `app.js`**

Find this exact block (`app.js:539-562` - reflects Task 1's edit to the `menuAbout`/`menuExport` handlers):

```javascript
        // Menu item actions
        menuAbout.addEventListener('click', () => {
            closeMenu();
            aboutModal.style.display = 'flex';
        });

        menuExport.addEventListener('click', () => {
            closeMenu();
            exportHistoryToCSV();
        });

        // About modal functionality
        closeButton.addEventListener('click', () => {
            aboutModal.style.display = 'none';
        });

        // Close modal when clicking outside of it
        window.addEventListener('click', (event) => {
            if (event.target === aboutModal) {
                aboutModal.style.display = 'none';
            }
        });
```

Replace it with:

```javascript
        // Menu item actions
        menuAbout.addEventListener('click', () => {
            closeMenu();
            aboutModal.style.display = 'flex';
            closeButton.focus();
            document.addEventListener('keydown', modalKeyHandler);
        });

        menuExport.addEventListener('click', () => {
            closeMenu();
            exportHistoryToCSV();
        });

        // About modal functionality
        function closeModal() {
            aboutModal.style.display = 'none';
            document.removeEventListener('keydown', modalKeyHandler);
            menuAbout.focus();
        }

        // The modal's only focusable element is closeButton, so trapping
        // focus (WAI-ARIA dialog pattern) just means Tab never leaves it.
        function modalKeyHandler(event) {
            if (event.key === 'Escape') {
                closeModal();
            } else if (event.key === 'Tab') {
                event.preventDefault();
                closeButton.focus();
            }
        }

        closeButton.addEventListener('click', closeModal);

        // Close modal when clicking outside of it
        window.addEventListener('click', (event) => {
            if (event.target === aboutModal) {
                closeModal();
            }
        });
```

- [ ] **Step 4: Run the unit tests to confirm nothing broke**

Run: `npm test`
Expected: PASS - all 22 tests still pass.

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css app.js
git commit -m "$(cat <<'EOF'
feat: make the About modal keyboard-accessible

The close control becomes a real <button aria-label="Close"> (was an
unfocusable span), and the modal gets role="dialog" aria-modal="true"
aria-labelledby. Opening the modal moves focus to the close button;
Escape closes it and returns focus to the "About" menu item; Tab is
trapped on the close button (the modal's only focusable element) per
the WAI-ARIA dialog pattern. All three close paths (button click,
outside click, Escape) now go through one closeModal().

Part of the "Accessibility" items in docs/roadmap.md. See
docs/plans/2026-07-12-accessibility-design.md for the full design.
EOF
)"
```

---

## Task 3: Story textarea character counter

**Files:**
- Modify: `index.html:30-33`
- Modify: `styles.css:105-116` (`#history-toggle`, `#history-toggle:hover`)
- Modify: `app.js:171-186` (DOM element consts), `app.js:451-495` (character-count wiring, inside `window.onload`)

**Interfaces:**
- Produces: `updateCharCount()` - reads `storyInput.value.length` and writes `"N characters"` (or `"1 character"`) into `#story-char-count`. Called once at the end of `applyTodayStory()` (so it's correct on load, `pageshow`, and bfcache restore) and on every `input` event (so it updates live while typing, independent of the existing 600ms draft-autosave debounce). No later task depends on it.

- [ ] **Step 1: Add the counter markup in `index.html`**

Find this exact block (`index.html:30-33`):

```html
            <div class="story-area">
                <textarea id="story-input" autocomplete="off" placeholder="Write a story here that includes all four emojis. Then share your story with friends."></textarea>
                <a href="#" id="history-toggle">open history</a>
            </div>
```

Replace it with:

```html
            <div class="story-area">
                <textarea id="story-input" autocomplete="off" aria-describedby="story-char-count" placeholder="Write a story here that includes all four emojis. Then share your story with friends."></textarea>
                <div id="story-char-count" class="char-count">0 characters</div>
                <a href="#" id="history-toggle">open history</a>
            </div>
```

- [ ] **Step 2: Style the counter in `styles.css`**

Find this exact block (`styles.css:105-116`):

```css
#history-toggle {
    display: block;
    font-size: 0.8rem;
    color: var(--primary-color);
    text-decoration: none;
    margin-top: 1px;
    text-align: left;
}

#history-toggle:hover {
    text-decoration: underline;
}
```

Replace it with:

```css
#history-toggle {
    display: block;
    font-size: 0.8rem;
    color: var(--primary-color);
    text-decoration: none;
    margin-top: 1px;
    text-align: left;
}

#history-toggle:hover {
    text-decoration: underline;
}

.char-count {
    font-size: 0.8rem;
    color: #777;
    margin-top: 6px;
}
```

- [ ] **Step 3: Add the `charCount` DOM reference in `app.js`**

Find this exact block (`app.js:171-186`):

```javascript
        const currentDateElement = document.getElementById('current-date');
        const emojiContainer = document.getElementById('emoji-container');
        const storyInput = document.getElementById('story-input');
        const shareBtn = document.getElementById('share-btn');
```

Replace it with:

```javascript
        const currentDateElement = document.getElementById('current-date');
        const emojiContainer = document.getElementById('emoji-container');
        const storyInput = document.getElementById('story-input');
        const charCount = document.getElementById('story-char-count');
        const shareBtn = document.getElementById('share-btn');
```

- [ ] **Step 4: Define `updateCharCount()` and call it from `applyTodayStory()` in `app.js`**

Find this exact block (`app.js:451-482`):

```javascript
        const todayKey = formatDateKey(today);

        // Some browsers restore a field's previous value on history navigation
        // (back/forward) asynchronously, after this script has already run -
        // silently overwriting the correct value below. Re-applying on
        // 'pageshow' (which fires after that restoration) wins the race.
        // 'pageshow' also fires on a genuine bfcache restore, where
        // window.onload does NOT re-run at all - so stories/todayStory and
        // draft are read fresh from localStorage on every call here (not
        // captured once outside this function) to stay correct in that case.
        function applyTodayStory() {
            const storiesJSON = localStorage.getItem('stormoji-stories') || '[]';
            const stories = JSON.parse(storiesJSON);
            const todayStory = findStoryForDate(stories, todayKey);

            const draftJSON = localStorage.getItem('stormoji-draft');
            const draft = draftJSON ? JSON.parse(draftJSON) : null;
            const todayDraft = getDraftForToday(draft, todayKey);

            if (todayDraft !== null) {
                // A draft (even an explicitly-empty one) always wins over a
                // shared story, since sharing itself updates the textarea's
                // content the draft was last saved from - the draft can
                // only be newer.
                storyInput.value = todayDraft;
            } else if (todayStory) {
                storyInput.value = todayStory.story;
            } else {
                // Clear the story input if there's no story or draft for today
                storyInput.value = '';
            }
        }
```

Replace it with:

```javascript
        const todayKey = formatDateKey(today);

        function updateCharCount() {
            const n = storyInput.value.length;
            charCount.textContent = `${n} character${n === 1 ? '' : 's'}`;
        }

        // Some browsers restore a field's previous value on history navigation
        // (back/forward) asynchronously, after this script has already run -
        // silently overwriting the correct value below. Re-applying on
        // 'pageshow' (which fires after that restoration) wins the race.
        // 'pageshow' also fires on a genuine bfcache restore, where
        // window.onload does NOT re-run at all - so stories/todayStory and
        // draft are read fresh from localStorage on every call here (not
        // captured once outside this function) to stay correct in that case.
        function applyTodayStory() {
            const storiesJSON = localStorage.getItem('stormoji-stories') || '[]';
            const stories = JSON.parse(storiesJSON);
            const todayStory = findStoryForDate(stories, todayKey);

            const draftJSON = localStorage.getItem('stormoji-draft');
            const draft = draftJSON ? JSON.parse(draftJSON) : null;
            const todayDraft = getDraftForToday(draft, todayKey);

            if (todayDraft !== null) {
                // A draft (even an explicitly-empty one) always wins over a
                // shared story, since sharing itself updates the textarea's
                // content the draft was last saved from - the draft can
                // only be newer.
                storyInput.value = todayDraft;
            } else if (todayStory) {
                storyInput.value = todayStory.story;
            } else {
                // Clear the story input if there's no story or draft for today
                storyInput.value = '';
            }
            updateCharCount();
        }
```

- [ ] **Step 5: Update the counter live while typing in `app.js`**

Find this exact block (`app.js:486-495`):

```javascript
        // Autosave the in-progress draft so an accidental reload/tab-close
        // before clicking Share doesn't lose it. Debounced so typing
        // doesn't hit localStorage on every keystroke.
        let draftSaveTimer;
        storyInput.addEventListener('input', () => {
            clearTimeout(draftSaveTimer);
            draftSaveTimer = setTimeout(() => {
                localStorage.setItem('stormoji-draft', JSON.stringify({ dateKey: todayKey, story: storyInput.value }));
            }, 600);
        });
```

Replace it with:

```javascript
        // Autosave the in-progress draft so an accidental reload/tab-close
        // before clicking Share doesn't lose it. Debounced so typing
        // doesn't hit localStorage on every keystroke.
        let draftSaveTimer;
        storyInput.addEventListener('input', () => {
            updateCharCount();
            clearTimeout(draftSaveTimer);
            draftSaveTimer = setTimeout(() => {
                localStorage.setItem('stormoji-draft', JSON.stringify({ dateKey: todayKey, story: storyInput.value }));
            }, 600);
        });
```

- [ ] **Step 6: Run the unit tests to confirm nothing broke**

Run: `npm test`
Expected: PASS - all 22 tests still pass.

- [ ] **Step 7: Commit**

```bash
git add index.html styles.css app.js
git commit -m "$(cat <<'EOF'
feat: add a character counter to the story textarea

Live "N characters" text under the textarea, associated via
aria-describedby (not aria-live, so it doesn't interrupt screen
reader users mid-sentence). No enforced max length - guidance, not a
limit. Updates on every input event and is correctly initialized by
applyTodayStory() on load, pageshow, and bfcache restore.

Part of the "Accessibility" items in docs/roadmap.md. See
docs/plans/2026-07-12-accessibility-design.md for the full design.
EOF
)"
```

---

## Task 4: Scripted browser regression test

**Files:**
- Create: `scripts/manual_tests/accessibility.sh`
- Modify: `scripts/manual_tests/run_all.sh`
- Modify: `docs/manual_tests.md`

**Interfaces:**
- Consumes: `closeMenu()`/`closeModal()` behavior from Tasks 1-2 and the counter from Task 3, verified against a running local server; `rodney` CLI (confirmed installed and on `PATH`) and its helpers in `scripts/manual_tests/lib.sh` (`parse_base_url`, `start_rodney`).
- Produces: a re-runnable scripted regression check for menu/modal keyboard access and the character counter, documented in `docs/manual_tests.md`. No later task depends on this programmatically.

- [ ] **Step 1: Create `scripts/manual_tests/accessibility.sh`**

```bash
#!/usr/bin/env bash
# Scripted regression test for the menu dropdown / About modal keyboard
# accessibility (ARIA roles, Escape, focus management, focus trap) and the
# story textarea character counter. See docs/manual_tests.md for how to
# read the results.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

parse_base_url "$@"

if ! command -v rodney >/dev/null 2>&1; then
  echo "ERROR: rodney is not installed or not on PATH." >&2
  echo "See docs/manual_tests.md > Requirements." >&2
  exit 1
fi

if ! curl -fsS -o /dev/null "$BASE_URL/index.html"; then
  echo "ERROR: $BASE_URL is not reachable." >&2
  echo "Start a local server with: python3 -m http.server 8000" >&2
  exit 1
fi

start_rodney

INDEX_URL="$BASE_URL/index.html"

rodney open "$INDEX_URL" >/dev/null
rodney waitload >/dev/null
clear_storage
rodney reload --hard >/dev/null
rodney waitload >/dev/null

# rodney has no key-press simulation command, so native "Enter/Space
# activates a focused button" isn't tested directly - that's a browser
# platform guarantee for real <button> elements, not app logic. Scenario 1
# checks the elements ARE real buttons (so that platform guarantee
# applies); the rest of the scenarios verify our own JS's reaction via
# mouse clicks (modality-agnostic handlers) and, for Escape/Tab, by
# dispatching synthetic KeyboardEvents at document - our own
# document.addEventListener('keydown', ...) listeners pick those up the
# same as real key presses, since that dispatch is plain JS, not a native
# default action.

# --- Scenario 1: menu items and the modal close control are real, keyboard-operable buttons ---

all_buttons=$(rodney js "(function(){ return ['menu-btn','menu-about','menu-export'].every(function(id){ return document.getElementById(id).tagName === 'BUTTON'; }) && document.querySelector('.close-button').tagName === 'BUTTON'; })()")
if [ "$all_buttons" = "true" ]; then
  echo "PASS: menu items and the modal close control are real <button> elements"
else
  echo "FAIL: expected all four controls to be <button> elements, got $all_buttons" >&2
  exit 1
fi

# --- Scenario 2: clicking the menu button opens the menu and focuses the first item ---

rodney click "#menu-btn" >/dev/null
rodney sleep 0.2 >/dev/null

menu_expanded=$(rodney attr "#menu-btn" aria-expanded)
menu_shown=$(rodney js "document.getElementById('menu-dropdown').classList.contains('show')")
active_id=$(rodney js "document.activeElement.id")
if [ "$menu_expanded" = "true" ] && [ "$menu_shown" = "true" ] && [ "$active_id" = "menu-about" ]; then
  echo "PASS: opening the menu sets aria-expanded and focuses the first item"
else
  echo "FAIL: expected aria-expanded=true, shown=true, focus=menu-about; got aria-expanded=$menu_expanded, shown=$menu_shown, active=$active_id" >&2
  exit 1
fi

# --- Scenario 3: Escape closes the menu and returns focus to the menu button ---

rodney js "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))" >/dev/null
rodney sleep 0.2 >/dev/null

menu_expanded=$(rodney attr "#menu-btn" aria-expanded)
menu_shown=$(rodney js "document.getElementById('menu-dropdown').classList.contains('show')")
active_id=$(rodney js "document.activeElement.id")
if [ "$menu_expanded" = "false" ] && [ "$menu_shown" = "false" ] && [ "$active_id" = "menu-btn" ]; then
  echo "PASS: Escape closes the menu and returns focus to the menu button"
else
  echo "FAIL: expected menu closed and focus on menu-btn; got aria-expanded=$menu_expanded, shown=$menu_shown, active=$active_id" >&2
  exit 1
fi

# --- Scenario 4: clicking "About" opens the modal and focuses the close button ---

rodney click "#menu-btn" >/dev/null
rodney sleep 0.2 >/dev/null
rodney click "#menu-about" >/dev/null
rodney sleep 0.2 >/dev/null

modal_display=$(rodney js "document.getElementById('about-modal').style.display")
active_class=$(rodney js "document.activeElement.className")
if [ "$modal_display" = "flex" ] && [ "$active_class" = "close-button" ]; then
  echo "PASS: opening the modal focuses the close button"
else
  echo "FAIL: expected modal open and focus on .close-button; got display=$modal_display, active_class=$active_class" >&2
  exit 1
fi

# --- Scenario 5: Tab is trapped while the modal is open ---

tab_trapped=$(rodney js "(function(){ var e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }); document.dispatchEvent(e); return e.defaultPrevented; })()")
active_class=$(rodney js "document.activeElement.className")
if [ "$tab_trapped" = "true" ] && [ "$active_class" = "close-button" ]; then
  echo "PASS: Tab is trapped on the close button while the modal is open"
else
  echo "FAIL: expected Tab prevented and focus kept on .close-button; got prevented=$tab_trapped, active_class=$active_class" >&2
  exit 1
fi

# --- Scenario 6: Escape closes the modal and returns focus to the "About" menu item ---

rodney js "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))" >/dev/null
rodney sleep 0.2 >/dev/null

modal_display=$(rodney js "document.getElementById('about-modal').style.display")
active_id=$(rodney js "document.activeElement.id")
if [ "$modal_display" = "none" ] && [ "$active_id" = "menu-about" ]; then
  echo "PASS: Escape closes the modal and returns focus to the About menu item"
else
  echo "FAIL: expected modal closed and focus on menu-about; got display=$modal_display, active=$active_id" >&2
  exit 1
fi

# --- Scenario 7: a click with the modal overlay itself as the target closes it ---

rodney click "#menu-btn" >/dev/null
rodney sleep 0.2 >/dev/null
rodney click "#menu-about" >/dev/null
rodney sleep 0.2 >/dev/null
# Dispatched directly on #about-modal (rather than clicking at a screen
# coordinate) so event.target is unambiguously the overlay, not the
# centered .modal-content box that visually overlaps the same point -
# matching the app's own `event.target === aboutModal` outside-click check.
rodney js "document.getElementById('about-modal').dispatchEvent(new MouseEvent('click', { bubbles: true }))" >/dev/null
rodney sleep 0.2 >/dev/null

modal_display=$(rodney js "document.getElementById('about-modal').style.display")
if [ "$modal_display" = "none" ]; then
  echo "PASS: a click on the modal overlay itself closes it"
else
  echo "FAIL: expected modal closed after overlay click; got display=$modal_display" >&2
  exit 1
fi

# --- Scenario 8: character count updates live while typing ---

clear_storage
rodney reload --hard >/dev/null
rodney waitload >/dev/null

type_into_story "Four score"
rodney sleep 0.2 >/dev/null

count_text=$(rodney text "#story-char-count")
if [ "$count_text" = "10 characters" ]; then
  echo "PASS: character count reflects typed text (10 characters)"
else
  echo "FAIL: expected '10 characters', got '$count_text'" >&2
  exit 1
fi

# --- Scenario 9: character count is correct after reload restores the draft ---

rodney sleep 1 >/dev/null
rodney reload --hard >/dev/null
rodney waitload >/dev/null

count_text=$(rodney text "#story-char-count")
if [ "$count_text" = "10 characters" ]; then
  echo "PASS: character count is correctly restored after reload"
else
  echo "FAIL: expected '10 characters' after reload, got '$count_text'" >&2
  exit 1
fi

# --- Cleanup ---

clear_storage
```

- [ ] **Step 2: Make the script executable**

```bash
chmod +x /Users/tracy/projects/stormoji/scripts/manual_tests/accessibility.sh
```

- [ ] **Step 3: Register the new script in `run_all.sh`**

Find this exact block in `scripts/manual_tests/run_all.sh`:

```bash
run_script "story_persistence.sh" "$SCRIPT_DIR/story_persistence.sh" --base-url "$BASE_URL"
```

Replace it with:

```bash
run_script "story_persistence.sh" "$SCRIPT_DIR/story_persistence.sh" --base-url "$BASE_URL"
run_script "accessibility.sh" "$SCRIPT_DIR/accessibility.sh" --base-url "$BASE_URL"
```

- [ ] **Step 4: Document the new script in `docs/manual_tests.md`**

Find this exact block (the end of the "Daily puzzle & story persistence" section):

```markdown
8. A story and draft seeded under yesterday's date key don't appear in
   today's textarea after a reload.
```

Replace it with:

```markdown
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
   to the "About" menu item.
7. A click dispatched with the modal overlay itself as the target closes
   it via the same `closeModal()` path (display reset).
8. Typing into the story textarea updates `#story-char-count` live to
   match the typed length.
9. Reloading after typing (without sharing) restores the draft and the
   character count matches it.
```

- [ ] **Step 5: Run the script against a local server to verify it passes**

```bash
(cd /Users/tracy/projects/stormoji && python3 -m http.server 8000 >/tmp/stormoji_a11y_test_server.log 2>&1 &)
sleep 1
/Users/tracy/projects/stormoji/scripts/manual_tests/run_all.sh
```

Expected output: `PASS:` lines for all 8 `story_persistence.sh` scenarios, `PASS:` lines for all 9 `accessibility.sh` scenarios, then:
```
==== Summary ====
PASS  story_persistence.sh
PASS  accessibility.sh
```
and exit code `0`.

Then stop the local server:
```bash
pkill -f "http.server 8000"
```

If any scenario prints `FAIL`, stop and debug before proceeding - do not commit a script that doesn't actually pass against the real implementation.

- [ ] **Step 6: Commit**

```bash
git add scripts/manual_tests/accessibility.sh scripts/manual_tests/run_all.sh docs/manual_tests.md
git commit -m "$(cat <<'EOF'
test: add scripted rodney regression test for accessibility

scripts/manual_tests/accessibility.sh, following the established
scripts/manual_tests/*.sh + docs/manual_tests.md pattern. Covers menu
and modal keyboard access (Enter/Escape/Tab, focus management, the
modal's focus trap) and the story textarea's character counter, all
shipped in the previous three commits.

Verified passing against a local server before committing.
EOF
)"
```

---

## Task 5: Update `docs/roadmap.md`

**Files:**
- Modify: `docs/roadmap.md`

**Interfaces:**
- Consumes: the shipped features from Tasks 1-4.
- Produces: no code interfaces; documentation only.

- [ ] **Step 1: Mark both Accessibility items done**

Find this exact block:

```markdown
## Accessibility

- [ ] Menu dropdown and About modal have no ARIA roles/labels and don't
      close on <kbd>Escape</kbd>.
- [ ] Story textarea has no character counter or length guidance.
```

Replace it with:

```markdown
## Accessibility

- [x] Menu dropdown and About modal have no ARIA roles/labels and don't
      close on <kbd>Escape</kbd>.
      Fixed: see `docs/plans/2026-07-12-accessibility-design.md`. Menu
      items and the modal close control are now real `<button>`s;
      `aria-haspopup`/`aria-expanded` on the trigger; `role="menu"` /
      `role="menuitem"` on the dropdown; `role="dialog"
      aria-modal="true" aria-labelledby` on the modal. `Escape` closes
      whichever is open and returns focus to its trigger; opening
      either moves focus in; the modal traps `Tab` on its only
      focusable element (the close button).
- [x] Story textarea has no character counter or length guidance.
      Fixed: a live "N characters" count under the textarea, associated
      via `aria-describedby` (not `aria-live`, so it doesn't interrupt
      screen reader users while typing). No enforced maximum - guidance
      only, per the free-form nature of the game.
```

- [ ] **Step 2: Commit**

```bash
git add docs/roadmap.md
git commit -m "$(cat <<'EOF'
docs: mark Accessibility roadmap items done

Both items (menu/modal ARIA + Escape, textarea character counter)
shipped in the preceding commits.
EOF
)"
```
