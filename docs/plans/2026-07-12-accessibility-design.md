# Accessibility Design

**Date:** 2026-07-12
**Feature:** ARIA roles/labels + keyboard access for the menu dropdown and About modal, plus a character counter on the story textarea
**Status:** Design Complete - Ready for Implementation

## Overview

Covers both items under "Accessibility" in `docs/roadmap.md`:

- Menu dropdown and About modal have no ARIA roles/labels and don't close on `Escape`.
- Story textarea has no character counter or length guidance.

While reviewing the menu/modal markup, the `.menu-item` divs and the `.close-button` span turned out to be unfocusable and unactivatable by keyboard - clicking is the only way to use them today. Fixing that is folded into this design rather than treated as a separate item, since ARIA roles without keyboard operability wouldn't actually make these controls usable by keyboard/screen-reader users (approved during design discussion).

## Requirements

### Functional Requirements

**Menu & modal:**
- `menu-btn` exposes its expanded/collapsed state via `aria-expanded`, and `aria-haspopup="true"` to signal it opens a menu.
- Menu items (`About`, `Export History`) and the modal close control are real `<button>` elements - reachable via Tab, activatable with Enter/Space.
- The dropdown (`role="menu"`, items `role="menuitem"`) and modal (`role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at its heading) are identified correctly to assistive tech.
- `Escape` closes whichever is open (menu or modal) and returns focus to the control that opened it.
- Opening the menu moves focus to its first item; opening the modal moves focus to its close button.
- While the modal is open, Tab/Shift+Tab cycle only within it (focus trap) - the WAI-ARIA dialog pattern. The modal's only focusable element is the close button, so in practice Tab just keeps focus there.
- Existing click-outside-to-close behavior for both is preserved unchanged.
- No visual/styling change - button resets keep menu items and the close button looking exactly as they do today.

**Character counter:**
- A live character count is displayed under the story textarea (e.g. "342 characters"), with no enforced maximum length - free-form creative writing, this is guidance not a limit (approved during design discussion).
- The textarea is associated with the counter via `aria-describedby`, so screen reader users can navigate to it on demand; it is not `aria-live` (approved during design discussion - a live region announcing on every keystroke would be disruptive while composing a story).
- The counter reflects whatever text is present at load time (draft, saved story, or empty), and updates as the user types.

### Non-Functional Requirements
- No new dependencies. Plain DOM APIs (`addEventListener('keydown', ...)`, `focus()`), matching the rest of the codebase.
- No behavior change to existing draft autosave, share, history, or CSV export flows.
- New pure logic (if any emerges, e.g. a character-count formatter) follows the existing pattern: module scope, exported, unit tested.

## Architecture

### Menu & Modal Markup Changes (`index.html`)

```html
<button id="menu-btn" class="menu-btn" aria-label="Menu" aria-haspopup="true" aria-expanded="false">🍔</button>
<div id="menu-dropdown" class="menu-dropdown" role="menu">
    <button class="menu-item" role="menuitem" id="menu-about">About</button>
    <button class="menu-item" role="menuitem" id="menu-export">Export History</button>
</div>
```

```html
<div id="about-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
    <div class="modal-content">
        <button class="close-button" aria-label="Close">&times;</button>
        <h2 id="about-modal-title">About</h2>
        ...
```

`.menu-item` and `.close-button` CSS already style by class, not tag, so switching `div`/`span` to `button` needs a small CSS addition (`background: none; border: none; font: inherit; text-align: left; cursor: pointer;` etc.) to strip default button chrome - no layout changes.

### Menu Behavior (`app.js`, inside existing menu wiring ~line 514)

```javascript
menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isShown = menuDropdown.classList.contains('show');
    if (isShown) {
        closeMenu();
    } else {
        menuDropdown.classList.add('show');
        menuBtn.setAttribute('aria-expanded', 'true');
        menuAbout.focus();
        setTimeout(() => document.addEventListener('click', closeMenuOnClickOutside), 0);
        document.addEventListener('keydown', closeMenuOnEscape);
    }
});

function closeMenu() {
    menuDropdown.classList.remove('show');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', closeMenuOnClickOutside);
    document.removeEventListener('keydown', closeMenuOnEscape);
}

function closeMenuOnEscape(event) {
    if (event.key === 'Escape') {
        closeMenu();
        menuBtn.focus();
    }
}
```

`closeMenuOnClickOutside` and the `menuAbout`/`menuExport` click handlers call `closeMenu()` instead of the current two-line remove-class/remove-listener, consolidating what's already duplicated in three places in the current code.

### Modal Behavior (`app.js`, inside existing modal wiring ~line 552)

```javascript
menuAbout.addEventListener('click', () => {
    closeMenu();
    aboutModal.style.display = 'flex';
    closeButton.focus();
    document.addEventListener('keydown', modalKeyHandler);
});

function closeModal() {
    aboutModal.style.display = 'none';
    document.removeEventListener('keydown', modalKeyHandler);
    menuAbout.focus();
}

function modalKeyHandler(event) {
    if (event.key === 'Escape') {
        closeModal();
    } else if (event.key === 'Tab') {
        // Only focusable element in the modal is closeButton - keep focus trapped on it.
        event.preventDefault();
        closeButton.focus();
    }
}

closeButton.addEventListener('click', closeModal);
```

The existing "click outside modal closes it" `window` click listener stays, calling `closeModal()` instead of setting `display = 'none'` directly, so focus-return and the keydown listener cleanup happen consistently regardless of how the modal closes.

### Character Counter Markup (`index.html`)

```html
<div class="story-area">
    <textarea id="story-input" autocomplete="off" aria-describedby="story-char-count" placeholder="..."></textarea>
    <div id="story-char-count" class="char-count">0 characters</div>
    <a href="#" id="history-toggle">open history</a>
</div>
```

### Character Counter Behavior (`app.js`)

Extends the existing `input` listener that already drives draft autosave (`app.js` draft-autosave section), rather than adding a second listener:

```javascript
function updateCharCount() {
    const n = storyInput.value.length;
    charCount.textContent = `${n} character${n === 1 ? '' : 's'}`;
}

storyInput.addEventListener('input', () => {
    updateCharCount();
    // ...existing debounced draft-save logic unchanged...
});
```

`applyTodayStory()` calls `updateCharCount()` right after setting `storyInput.value`, so the counter is correct on initial load and on `pageshow`, matching whichever source (draft/story/empty) won.

### Explicitly Out of Scope
- No maximum length / `maxlength` enforcement (approved during design discussion - soft guidance only).
- No live-region announcement of the character count (approved during design discussion - avoids interrupting typing).
- No broader modal/menu visual redesign - this is semantics and keyboard behavior only.
- No changes to the history cards, CSV export, or other DOM flows not named in the roadmap items.

## Testing

### Unit Tests (`app.test.js`)
No new pure logic is introduced by the menu/modal changes (pure DOM/event wiring). If the character count formatter (`${n} character${n === 1 ? '' : 's'}`) is extracted as a small pure function, e.g. `formatCharCount(n)`, it will be unit tested for `0`, `1`, and `>1` (singular/plural boundary). Otherwise this logic is trivial enough to stay inline and covered only by the manual script below.

### Scripted Manual Test
Extends `scripts/manual_tests/` following the existing pattern (see `story_persistence.sh`):

**New script:** `scripts/manual_tests/accessibility.sh`
1. Tab to the menu button, press Enter → menu opens, focus lands on "About".
2. Tab to "Export History", Shift+Tab back to "About" → focus stays within the two menu items (menu has no trap requirement, but confirms both are reachable).
3. Press `Escape` with the menu open → menu closes, focus returns to the menu button.
4. Open menu, click "About" → modal opens, focus lands on the close button.
5. Press Tab repeatedly with modal open → focus stays on the close button (trap).
6. Press `Escape` with modal open → modal closes, focus returns to the "About" menu item.
7. Click outside the modal → modal closes via existing click-outside behavior, `closeModal()` path confirmed (focus returns, listener cleaned up).
8. Type in the story textarea → character count updates live; reload → count matches restored draft/story text.

## Success Criteria
- Menu button, menu items, and modal close control are all reachable and operable via keyboard alone.
- `Escape` closes an open menu or modal and returns focus sensibly.
- Screen reader announces the menu button's expanded state, the menu's role, and the modal's role/label (spot-checked with VoiceOver during manual testing).
- Character count is visible, updates as the user types, and is associated with the textarea via `aria-describedby`.
- No visual regressions - menu, modal, and textarea all look the same as before except for the new counter text.
- `npm test` still passes; `scripts/manual_tests/accessibility.sh` passes alongside the existing `story_persistence.sh`.
