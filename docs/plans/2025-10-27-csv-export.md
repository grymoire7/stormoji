# CSV Export Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add CSV export functionality with menu dropdown UI to export story history from localStorage.

**Architecture:** Replace settings button with menu button, add dropdown component with "About" and "Export History" options, implement CSV generation and download logic using Blob API.

**Tech Stack:** Vanilla JavaScript, HTML5, CSS3, Blob API, localStorage

**Design Document:** `docs/plans/2025-10-27-csv-export-design.md`

---

## Task 1: Update HTML - Add Menu Structure

**Files:**
- Modify: `index.html:14,49-57`

**Step 1: Change settings button to menu button**

In `index.html` line 14, change:
```html
<button id="settings-btn" aria-label="Settings">⚙️</button>
```

To:
```html
<button id="menu-btn" aria-label="Menu">☰</button>
```

**Step 2: Add dropdown menu HTML**

After line 15 (inside the header), add:
```html
<div id="menu-dropdown" class="menu-dropdown">
    <div class="menu-item" id="menu-about">About</div>
    <div class="menu-item" id="menu-export">Export History</div>
</div>
```

**Step 3: Rename modal to about-modal**

In `index.html` line 49, change:
```html
<div id="settings-modal" class="modal">
```

To:
```html
<div id="about-modal" class="modal">
```

**Step 4: Verify HTML in browser**

Open: `open index.html` (or serve with `python3 -m http.server 8000`)
Expected: Page loads, menu button shows ☰ icon, dropdown not visible yet

**Step 5: Commit**

```bash
cd /Users/tracy/projects/stormoji/.worktrees/csv-export
git add index.html
git commit -m "feat: replace settings button with menu structure

- Change gear icon to hamburger menu icon
- Add dropdown menu with About and Export History items
- Rename settings-modal to about-modal for clarity"
```

---

## Task 2: Add CSS - Style Dropdown Menu

**Files:**
- Modify: `styles.css` (append at end)

**Step 1: Add dropdown container styles**

Append to `styles.css`:
```css
/* Menu dropdown */
.menu-dropdown {
    display: none;
    position: absolute;
    top: 60px;
    right: 20px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 180px;
    z-index: 1000;
}

.menu-dropdown.show {
    display: block;
}

.menu-item {
    padding: 12px 20px;
    cursor: pointer;
    border-bottom: 1px solid #eee;
    transition: background-color 0.2s;
}

.menu-item:last-child {
    border-bottom: none;
}

.menu-item:hover {
    background-color: #f5f5f5;
}
```

**Step 2: Test dropdown visibility in browser**

In browser console, run:
```javascript
document.getElementById('menu-dropdown').classList.add('show');
```

Expected: Dropdown appears below menu button, styled correctly, hover works

**Step 3: Reset and verify hidden by default**

Refresh page.
Expected: Dropdown not visible by default

**Step 4: Commit**

```bash
git add styles.css
git commit -m "style: add dropdown menu styles

- Position dropdown below menu button
- Add hover effects for menu items
- Add box shadow and border styling"
```

---

## Task 3: Update JavaScript - Menu Toggle Logic

**Files:**
- Modify: `app.js:11-13,340-370`

**Step 1: Update DOM element references**

In `app.js` lines 11-13, change:
```javascript
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
```

To:
```javascript
const menuBtn = document.getElementById('menu-btn');
const menuDropdown = document.getElementById('menu-dropdown');
const menuAbout = document.getElementById('menu-about');
const menuExport = document.getElementById('menu-export');
const aboutModal = document.getElementById('about-modal');
```

**Step 2: Replace settings button event listener**

In `app.js` lines 356-370, remove this code:
```javascript
// Settings modal functionality
settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
});

closeButton.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});
```

**Step 3: Add menu toggle logic**

Replace with:
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

**Step 4: Test menu toggle in browser**

Manual test:
1. Click menu button → dropdown appears
2. Click outside → dropdown closes
3. Click "About" → dropdown closes, modal opens
4. Close modal → modal closes
5. Open menu, click Export → dropdown closes (will error until we add function)

Expected: Menu toggle works, About modal works, Export throws error (function not defined)

**Step 5: Commit**

```bash
git add app.js
git commit -m "feat: implement menu toggle and dropdown logic

- Replace settings button logic with menu dropdown
- Add click-outside detection to close menu
- Wire up About menu item to modal
- Add placeholder for Export History action"
```

---

## Task 4: Implement CSV Export Function

**Files:**
- Modify: `app.js:297` (after `showNotification` function)

**Step 1: Add CSV export function**

After the `showNotification` function (around line 297), add:
```javascript

// Export history to CSV
function exportHistoryToCSV() {
    // Get stories from localStorage
    const storiesJSON = localStorage.getItem('stormoji-stories') || '[]';
    const stories = JSON.parse(storiesJSON);

    // Check if history is empty
    if (stories.length === 0) {
        showNotification('No stories to export');
        return;
    }

    // Generate CSV content
    try {
        // CSV header
        let csvContent = '"Date Key","Date","Emojis","Story"\n';

        // Add each story as a row
        stories.forEach(story => {
            const dateKey = escapeCSV(story.dateKey);
            const date = escapeCSV(story.date);
            const emojis = escapeCSV(story.emojis);
            const storyText = escapeCSV(story.story);

            csvContent += `${dateKey},${date},${emojis},${storyText}\n`;
        });

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // Generate filename with current date
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        const filename = `stormoji-history-${dateStr}.csv`;

        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        // Clean up
        URL.revokeObjectURL(url);

        showNotification('History exported successfully!');
    } catch (error) {
        console.error('Export failed:', error);
        showNotification('Failed to export history');
    }
}

// Helper function to escape CSV fields
function escapeCSV(field) {
    if (field === undefined || field === null) {
        return '""';
    }

    // Convert to string
    const str = String(field);

    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }

    return '"' + str + '"';
}
```

**Step 2: Test with sample data in console**

In browser console, create test data:
```javascript
localStorage.setItem('stormoji-stories', JSON.stringify([
    {dateKey: '2025-10-27', date: 'October 27, 2025', emojis: '😀 🐻 🍔 ⚽', story: 'A simple test story.'},
    {dateKey: '2025-10-26', date: 'October 26, 2025', emojis: '🎃 👻 🦇 🍬', story: 'Story with "quotes" and, commas'}
]));
```

Then click menu → Export History

Expected: CSV file downloads with name `stormoji-history-2025-10-27.csv`

**Step 3: Verify CSV content**

Open downloaded CSV in text editor.
Expected content:
```
"Date Key","Date","Emojis","Story"
"2025-10-27","October 27, 2025","😀 🐻 🍔 ⚽","A simple test story."
"2025-10-26","October 26, 2025","🎃 👻 🦇 🍬","Story with ""quotes"" and, commas"
```

**Step 4: Test empty history case**

In browser console:
```javascript
localStorage.removeItem('stormoji-stories');
```

Click menu → Export History

Expected: Notification shows "No stories to export", no download occurs

**Step 5: Test CSV in spreadsheet app**

Open the CSV file in Excel or Google Sheets.
Expected:
- Four columns with correct headers
- Two data rows
- Quotes and commas properly handled
- Emojis display correctly

**Step 6: Commit**

```bash
git add app.js
git commit -m "feat: implement CSV export functionality

- Add exportHistoryToCSV function with Blob API
- Add CSV escaping for special characters
- Generate dated filename
- Handle empty history case with notification"
```

---

## Task 5: Manual Testing - Full Feature Validation

**Files:**
- None (testing only)

**Step 1: Test complete user flow**

Manual test checklist:
1. Open app in browser
2. Write a story for today, click Share
3. Open menu → verify two items visible
4. Click "About" → verify modal opens, close it
5. Open menu → click "Export History" → verify CSV downloads
6. Open CSV in spreadsheet → verify data correct
7. Click outside menu when open → verify closes
8. Test on mobile viewport (resize browser) → verify responsive

**Step 2: Test edge cases**

Edge case checklist:
1. Story with newlines → verify preserves in CSV
2. Story with emojis → verify displays correctly
3. Story with quotes → verify escaped properly
4. Multiple stories → verify all exported
5. Clear localStorage → verify "no stories" notification

**Step 3: Cross-browser testing**

Test in:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if on Mac)

Expected: All features work in all browsers

**Step 4: Document any issues**

If any issues found, create GitHub issues or fix immediately.

**Step 5: Final verification**

Verify all requirements met:
- ✅ CSV export with correct columns
- ✅ Menu dropdown with About and Export options
- ✅ Hamburger icon instead of gear
- ✅ Filename includes export date
- ✅ Empty history handled gracefully
- ✅ Special characters escaped properly

---

## Task 6: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (add CSV export documentation)

**Step 1: Add CSV export to architecture section**

In `CLAUDE.md`, add after the "Key Functions" section:

```markdown
### CSV Export

Users can export their story history to CSV format via the menu dropdown:

- Menu button (☰) in header opens dropdown with "About" and "Export History" options
- Export generates CSV with columns: Date Key, Date, Emojis, Story
- CSV properly escapes special characters (quotes, commas, newlines)
- Downloads as `stormoji-history-YYYY-MM-DD.csv`
- Empty history shows notification without downloading

**Implementation:**
- `exportHistoryToCSV()` (`app.js:298`): Main export logic with Blob API
- `escapeCSV()` (`app.js:340`): Helper for proper CSV field escaping
- Menu dropdown uses click-outside detection pattern for UX
```

**Step 2: Verify documentation accuracy**

Read through the updated CLAUDE.md.
Expected: New section accurately describes CSV export feature with line references

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document CSV export feature in CLAUDE.md

Add CSV export section with implementation details and line references"
```

---

## Task 7: Prepare for Merge

**Files:**
- None (git operations only)

**Step 1: Review all changes**

```bash
git log --oneline origin/main..HEAD
git diff origin/main..HEAD
```

Expected: 6 commits, clean diff with no unintended changes

**Step 2: Ensure working directory clean**

```bash
git status
```

Expected: "working tree clean"

**Step 3: Ready for review**

At this point, use **superpowers:finishing-a-development-branch** skill to:
- Run final verification
- Choose merge strategy (direct merge, PR, etc.)
- Clean up worktree

---

## Testing Notes

Since this is a vanilla JS project with no automated test framework:
- All testing is manual via browser
- Test checklist included in Task 5
- Verify in multiple browsers
- Test edge cases with console commands
- Open CSV in spreadsheet apps to verify compatibility

## Success Criteria

- ✅ Menu dropdown works on click, closes on outside click
- ✅ About modal still accessible via menu
- ✅ CSV export downloads file with correct naming
- ✅ CSV contains all stories with proper escaping
- ✅ Empty history shows notification
- ✅ Works in Chrome, Firefox, Safari
- ✅ No console errors
- ✅ Documentation updated
