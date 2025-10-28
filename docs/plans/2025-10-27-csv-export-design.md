# CSV Export Feature Design

**Date:** 2025-10-27
**Feature:** Export story history to CSV file
**Status:** Design Complete - Ready for Implementation

## Overview

Add CSV export capability to Stormoji, allowing users to download their story history as a spreadsheet file. Replace the settings gear icon with a menu icon that provides access to both "About" and "Export History" options.

## Requirements

### Functional Requirements
- Export all saved stories from localStorage to CSV format
- CSV columns: Date Key, Date, Emojis, Story
- Downloaded filename: `stormoji-history-YYYY-MM-DD.csv` (date of export)
- Show notification if no stories exist (no download)
- Show success notification after export

### UI Requirements
- Replace gear icon (⚙️) with menu icon (☰)
- Dropdown menu with two options: "About" and "Export History"
- Menu appears below button, right-aligned
- Clicking outside closes menu
- Existing About modal functionality preserved

## Architecture

### Component Structure

**Pure Dropdown Component Approach**
- New menu button replaces settings button
- Dropdown positioned absolutely below button
- JavaScript-controlled visibility (click to toggle)
- Click-outside detection to close menu

### File Changes

**index.html**
- Change `id="settings-btn"` to `id="menu-btn"`
- Change button icon from ⚙️ to ☰
- Add `<div id="menu-dropdown" class="menu-dropdown">` with menu items
- Rename `settings-modal` to `about-modal` for clarity

**styles.css**
- `.menu-dropdown`: absolute positioning, white background, border/shadow, `display: none` by default
- `.menu-dropdown.show`: `display: block`
- `.menu-item`: padding, hover effects, cursor pointer

**app.js**
- Replace settings button event listeners with menu toggle logic
- Add `exportHistoryToCSV()` function
- Add document click listener for click-outside detection
- Wire up menu items to actions

## CSV Export Implementation

### Function: exportHistoryToCSV()

**Flow:**
1. Read `stormoji-stories` from localStorage
2. Parse JSON, check if empty
3. If empty: show "No stories to export" notification, return
4. Generate CSV header: `"Date Key","Date","Emojis","Story"`
5. For each story: escape and format as CSV row
6. Create Blob with CSV content (`text/csv;charset=utf-8;`)
7. Generate filename with current date
8. Trigger download via temporary anchor element
9. Show "History exported successfully!" notification

### CSV Escaping Rules
- Wrap fields containing commas, quotes, or newlines in double quotes
- Escape internal double quotes by doubling: `"` → `""`
- Preserve newlines within story text
- Handle emoji characters properly (UTF-8 encoding)

### Download Mechanism
```javascript
const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = filename;
link.click();
URL.revokeObjectURL(url);
```

## Dropdown Menu Behavior

### Opening
1. User clicks menu button
2. Toggle `.show` class on dropdown
3. Add document click listener if opening

### Closing
1. Click menu item → close dropdown, execute action
2. Click outside → close dropdown
3. Click menu button again → toggle closed
4. Remove document listener when closed

### Menu Items
- **About**: Close dropdown, open About modal
- **Export History**: Close dropdown, call `exportHistoryToCSV()`

### Positioning
- Absolute position relative to header
- Right-aligned with menu button
- Below button with small gap

## Error Handling

### Edge Cases

**Empty History**
- Check: `stories.length === 0` or no localStorage key
- Action: Show notification, no file download
- Message: "No stories to export"

**CSV Special Characters**
- Stories with: quotes, commas, newlines, emojis
- Solution: Proper CSV escaping with quoted fields
- Test: Excel and Google Sheets compatibility

**Browser Compatibility**
- Use standard Blob API (all modern browsers)
- Use `URL.createObjectURL()` (widely supported)
- Revoke URL after download (prevent memory leak)
- Show error notification if download fails

**Date Formatting**
- CSV uses existing `dateKey` (YYYY-MM-DD) and `date` fields
- Filename uses current date in YYYY-MM-DD format
- Consistent with existing date handling in codebase

### Error Messages
- CSV generation fails: "Failed to export history"
- Download fails: "Failed to download file"
- Empty history: "No stories to export"

## Testing Considerations

### Manual Test Cases
1. Export with multiple stories → verify CSV format
2. Export with empty history → verify notification, no download
3. Export story with quotes in text → verify escaping
4. Export story with commas in text → verify escaping
5. Export story with newlines → verify preservation
6. Open in Excel/Google Sheets → verify readability
7. Menu click-outside behavior → verify closes
8. Menu items trigger correct actions → verify About modal and export

### Browser Testing
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Android)

## Success Criteria

- ✅ User can export all stories to CSV file
- ✅ CSV opens correctly in Excel and Google Sheets
- ✅ Menu provides access to both About and Export
- ✅ Special characters in stories are properly escaped
- ✅ Empty history shows clear notification
- ✅ Dropdown menu works on desktop and mobile
- ✅ No console errors or memory leaks

## Future Enhancements (Not in Scope)

- Date range filtering before export
- Export format selection (JSON, CSV, etc.)
- Import history from CSV
- Cloud backup/sync
