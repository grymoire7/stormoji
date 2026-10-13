// ---------------------------------------------------------------------------
// Pure helpers (no DOM/browser APIs) - exported below for unit testing.
// ---------------------------------------------------------------------------

const APP_VERSION = '1.1.0';

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

// Seeded random function
function seededRandom(seed) {
    const x = Math.sin(hashCode(seed) * 10000) * 10000;
    return x - Math.floor(x);
}

// Fisher-Yates shuffle with seeded random
function shuffleArray(array, seed) {
    const shuffled = [...array];
    let currentIndex = shuffled.length;
    let seedValue = seed;

    while (currentIndex !== 0) {
        seedValue = seedValue + 'x'; // Change seed for each iteration
        const randomIndex = Math.floor(seededRandom(seedValue) * currentIndex);
        currentIndex--;

        // Swap elements
        [shuffled[currentIndex], shuffled[randomIndex]] =
        [shuffled[randomIndex], shuffled[currentIndex]];
    }

    return shuffled;
}

// Default emojis as fallback
function getDefaultEmojis() {
    return [
        { emoji: "😩", name: "Crying Face" },
        { emoji: "4️⃣", name: "Four" },
        { emoji: "0️⃣", name: "Zero" },
        { emoji: "4️⃣", name: "Four" }
    ];
}

function getDefaultCategories() {
    return {
        smileys: [{ emoji: "😩", name: "Crying Face" }],
        animals: [{ emoji: "4️⃣", name: "Four" }],
        food: [{ emoji: "0️⃣", name: "Zero" }],
        activity: [{ emoji: "4️⃣", name: "Four" }]
    };
}

// Select one emoji from each of four categories, deterministically from dateSeed
function selectDailyEmojis(categories, dateSeed) {
    if (!categories || typeof categories !== 'object') {
        return getDefaultEmojis();
    }

    try {
        const categoryNames = Object.keys(categories);
        if (categoryNames.length < 4) {
            return getDefaultEmojis();
        }

        // Get 4 random categories
        const shuffledCategories = shuffleArray(categoryNames, dateSeed);
        const selectedCategories = shuffledCategories.slice(0, 4);

        // Get one emoji from each category
        const selectedEmojis = [];

        for (const category of selectedCategories) {
            const categoryEmojis = categories[category];
            if (!categoryEmojis || categoryEmojis.length === 0) {
                selectedEmojis.push({ emoji: "❓", name: "Unknown" });
                continue;
            }

            const randomIndex = Math.floor(seededRandom(dateSeed + category) * categoryEmojis.length);
            selectedEmojis.push(categoryEmojis[randomIndex]);
        }

        // If we don't have 4 emojis, use defaults
        if (selectedEmojis.length < 4) {
            return getDefaultEmojis();
        }

        // Shuffle the selected emojis
        return shuffleArray(selectedEmojis, dateSeed + 'final');
    } catch (error) {
        console.error("Error selecting emojis:", error);
        return getDefaultEmojis();
    }
}

// Format a Date as a YYYY-MM-DD key for matching stories to days.
// Uses local fields, not UTC, so the puzzle flips at each user's own
// midnight - matching dateSeed below and how Wordle/NYT Connections/
// Spelling Bee/Mini all do their daily reset. The alternative (a single
// shared UTC instant) doesn't actually deliver "everyone sees the same
// puzzle at the same moment" in any way players notice; it just moves
// the reset to a fixed instant that's midnight for nobody outside UTC.
function formatDateKey(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

// Find the saved story matching a given date key, if any
function findStoryForDate(stories, dateKey) {
    return stories.find(item => item.dateKey === dateKey);
}

// Return the draft's story if it belongs to the given date key, else null.
// null (not undefined) distinguishes "no relevant draft" from "the saved
// draft is an explicitly-empty string" - callers rely on this.
function getDraftForToday(draft, todayKey) {
    return draft && draft.dateKey === todayKey ? draft.story : null;
}

// Insert or replace the story for a given date, keeping stories sorted newest first
function upsertStory(stories, entry) {
    const updated = [...stories];
    const existingIndex = updated.findIndex(item => item.dateKey === entry.dateKey);

    if (existingIndex !== -1) {
        updated[existingIndex] = entry;
    } else {
        updated.push(entry);
    }

    // Sort by dateKey (YYYY-MM-DD sorts lexicographically = chronologically),
    // rather than re-parsing the human-readable date string, which is
    // ambiguous with respect to timezone.
    updated.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    return updated;
}

// Remove stories older than the given number of months relative to referenceDate
function pruneStoriesOlderThan(stories, referenceDate, months) {
    const cutoff = new Date(referenceDate);
    cutoff.setMonth(cutoff.getMonth() - months);
    return stories.filter(item => new Date(item.date) >= cutoff);
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

// Parse CSV text into an array of rows (arrays of strings). The inverse of
// escapeCSV: handles quoted fields, "" escapes, and commas/newlines inside
// quotes. Accepts LF or CRLF line endings and a leading UTF-8 BOM.
function parseCSV(text) {
    if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
    }

    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            row.push(field);
            field = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') {
                i++;
            }
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += ch;
        }
    }

    // Last row when the text has no trailing newline
    if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows;
}

const HISTORY_CSV_COLUMNS = ['Date Key', 'Date', 'Emojis', 'Story'];

// Is this a real calendar date in YYYY-MM-DD form? (Rejects 2026-02-30.)
function isValidDateKey(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
        return false;
    }
    const [year, month, day] = match.slice(1).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
}

// Parse and validate an exported history CSV. All or nothing: returns
// { ok: true, stories } or { ok: false, error } - never a partial list.
// Columns are located by header name, so order and extra columns don't
// matter. Row numbers in errors count the header as row 1. Rows older than
// the six-month retention window are deliberately kept.
function parseHistoryCSV(text) {
    // Blank lines parse as a single empty field; skip them
    const rows = parseCSV(text).filter(row => !(row.length === 1 && row[0].trim() === ''));

    if (rows.length === 0) {
        return { ok: false, error: 'The file is empty.' };
    }

    const header = rows[0].map(name => name.trim());
    const missing = HISTORY_CSV_COLUMNS.filter(name => !header.includes(name));
    if (missing.length > 0) {
        return { ok: false, error: `Missing required column(s): ${missing.join(', ')}.` };
    }

    if (rows.length === 1) {
        return { ok: false, error: 'The file has no stories to import.' };
    }

    const [dateKeyIdx, dateIdx, emojisIdx, storyIdx] = HISTORY_CSV_COLUMNS.map(name => header.indexOf(name));
    const stories = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 1;

        if (row.length < header.length) {
            return { ok: false, error: `Row ${rowNumber}: expected ${header.length} columns but found ${row.length}.` };
        }

        const dateKey = row[dateKeyIdx].trim();
        if (!isValidDateKey(dateKey)) {
            return { ok: false, error: `Row ${rowNumber}: Date Key "${dateKey}" is not a valid date (expected YYYY-MM-DD).` };
        }

        for (const [name, idx] of [['Date', dateIdx], ['Emojis', emojisIdx], ['Story', storyIdx]]) {
            if (row[idx].trim() === '') {
                return { ok: false, error: `Row ${rowNumber}: ${name} is empty.` };
            }
        }

        stories.push({ dateKey, date: row[dateIdx], emojis: row[emojisIdx], story: row[storyIdx] });
    }

    return { ok: true, stories };
}

// Merge imported stories into existing history. On a date collision the
// story already in the browser wins (in the browser-switch use case it's
// the newer one). Does not prune: imported entries older than the retention
// window are kept until the next save prunes them. Returns the merged list
// plus how many imported stories were added vs. skipped.
function mergeImportedStories(existing, imported) {
    let stories = existing;
    let added = 0;
    let skipped = 0;

    for (const entry of imported) {
        if (findStoryForDate(stories, entry.dateKey)) {
            skipped++;
        } else {
            stories = upsertStory(stories, entry);
            added++;
        }
    }

    return { stories: [...stories], added, skipped };
}

// Lines of text for the import-success modal
function describeImportSuccess(added, skipped) {
    const plural = (n) => `${n} ${n === 1 ? 'story' : 'stories'}`;

    if (added === 0) {
        return [`No new stories to import: the ${plural(skipped)} in the file ${skipped === 1 ? 'is' : 'are'} for days that already have a story.`];
    }

    const lines = [`Imported ${plural(added)}.`];
    if (skipped > 0) {
        lines.push(`Skipped ${plural(skipped)} because you already have a story for that day.`);
    }
    lines.push('View history to see the imported entries.');
    return lines;
}

// Given the raw stormoji-theme localStorage value, returns the value to
// force via <html data-theme="...">, or null to mean "no override" -
// letting the prefers-color-scheme media query decide instead.
function resolveThemeAttribute(storedValue) {
    return (storedValue === 'light' || storedValue === 'dark') ? storedValue : null;
}

// ---------------------------------------------------------------------------
// Browser wiring (DOM/localStorage) - skipped when loaded outside a browser.
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined') {
    const THEME_STORAGE_KEY = 'stormoji-theme';

    // Sets or removes <html data-theme> per the stored preference. Called
    // immediately below (not inside window.onload, which additionally
    // waits for the page's load event) so the correct theme applies as
    // early as this script can run, minimizing the flash of the wrong
    // theme for a stored choice that disagrees with the OS preference.
    function applyTheme(storedValue) {
        const attr = resolveThemeAttribute(storedValue);
        if (attr) {
            document.documentElement.setAttribute('data-theme', attr);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }
    applyTheme(localStorage.getItem(THEME_STORAGE_KEY));

    // Wait for the DOM to be fully loaded
    window.onload = function() {
        // DOM elements
        const currentDateElement = document.getElementById('current-date');
        const emojiContainer = document.getElementById('emoji-container');
        const storyInput = document.getElementById('story-input');
        const charCount = document.getElementById('story-char-count');
        const shareBtn = document.getElementById('share-btn');
        const historyToggle = document.getElementById('history-toggle');
        const historyContainer = document.getElementById('history-container');
        const storyCards = document.getElementById('story-cards');
        const menuBtn = document.getElementById('menu-btn');
        const menuDropdown = document.getElementById('menu-dropdown');
        const menuAbout = document.getElementById('menu-about');
        const menuExport = document.getElementById('menu-export');
        const menuImport = document.getElementById('menu-import');
        const aboutModal = document.getElementById('about-modal');
        const closeButton = document.querySelector('.close-button');
        const tooltip = document.getElementById('tooltip');
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        const appVersionElement = document.getElementById('app-version');

        // Get today's date in a readable format, in the visitor's local
        // timezone, so the displayed date always matches the local-anchored
        // puzzle day used by dateSeed/todayKey below.
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = today.toLocaleDateString('en-US', options);
        if (currentDateElement) {
            currentDateElement.textContent = formattedDate;
        } else {
            console.error("Date element not found!");
        }

        if (appVersionElement) {
            appVersionElement.textContent = APP_VERSION;
        }

        // Generate a seed based on the local date for consistent random
        // selection. Using local time (not UTC) means the puzzle flips at
        // each visitor's own midnight, like Wordle and the NYT daily games -
        // every calendar date still maps to one fixed emoji set, it's just
        // that players in different timezones reach a given date's puzzle
        // at different real-world moments (unavoidable for any timezone-
        // aware "daily" game, and not something players actually notice).
        const dateSeed = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

        // Display emojis
        function displayEmojis(emojis) {
            if (!emojiContainer) {
                console.error("Emoji container not found!");
                return;
            }

            if (!emojis || emojis.length === 0) {
                console.error("No emojis to display!");
                emojis = getDefaultEmojis();
            }

            // Clear the container
            emojiContainer.innerHTML = '';

            // Add each emoji
            emojis.forEach(emojiObj => {
                if (!emojiObj || !emojiObj.emoji) {
                    console.error("Invalid emoji object:", emojiObj);
                    return;
                }

                const emojiSpan = document.createElement('span');
                emojiSpan.className = 'emoji';
                emojiSpan.textContent = emojiObj.emoji;
                emojiSpan.dataset.name = emojiObj.name || "Unknown";

                // Add tooltip functionality
                emojiSpan.addEventListener('mouseenter', (e) => {
                    showTooltip(e, emojiObj.name);
                });

                emojiSpan.addEventListener('mouseleave', () => {
                    hideTooltip();
                });

                emojiContainer.appendChild(emojiSpan);
            });
        }

        // Tooltip functions
        let tooltipHideTimer;

        function showTooltip(event, text) {
            tooltip.textContent = text;
            tooltip.style.opacity = '1';

            // Position the tooltip. getBoundingClientRect() is viewport-
            // relative, but the tooltip is `position: absolute` (page-
            // relative), so the scroll offset has to be added back in -
            // otherwise the tooltip lands where the emoji would be if the
            // page were still scrolled to the top.
            const rect = event.target.getBoundingClientRect();
            tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
            tooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;

            // Hide tooltip after 5 seconds. Clearing any timer from a
            // previous, still-pending show first is what keeps this
            // consistently 5 seconds - without it, a stale timer from an
            // earlier emoji can fire mid-way through a later one's 5
            // seconds and hide it early.
            clearTimeout(tooltipHideTimer);
            tooltipHideTimer = setTimeout(() => {
                hideTooltip();
            }, 5000);
        }

        function hideTooltip() {
            clearTimeout(tooltipHideTimer);
            tooltip.style.opacity = '0';
        }

        // Story history functionality
        function saveStoryToHistory(story, emojis, date, dateKey) {
            // Get existing stories or initialize empty array
            const storiesJSON = localStorage.getItem('stormoji-stories') || '[]';
            let stories = JSON.parse(storiesJSON);

            // Add or update the story for this date
            stories = upsertStory(stories, { dateKey, date, emojis, story });

            // Keep only the last 6 months of stories
            stories = pruneStoriesOlderThan(stories, new Date(), 6);

            // Save back to localStorage
            localStorage.setItem('stormoji-stories', JSON.stringify(stories));

            // Update the display if history is open
            if (historyContainer.style.display === 'block') {
                displayStoryHistory();
            }
        }

        function displayStoryHistory() {
            // Clear existing cards
            storyCards.innerHTML = '';

            // Get stories from localStorage
            const storiesJSON = localStorage.getItem('stormoji-stories') || '[]';
            const stories = JSON.parse(storiesJSON);

            if (stories.length === 0) {
                storyCards.innerHTML = '<p>No stories in your history yet.</p>';
                return;
            }

            // Create a card for each story
            stories.forEach(item => {
                const card = document.createElement('div');
                card.className = 'story-card';

                const dateElement = document.createElement('div');
                dateElement.className = 'story-card-date';
                dateElement.textContent = item.date;

                const emojisElement = document.createElement('div');
                emojisElement.className = 'story-card-emojis';
                emojisElement.textContent = item.emojis;

                const storyElement = document.createElement('div');
                storyElement.className = 'story-card-text';
                storyElement.textContent = item.story;

                card.appendChild(dateElement);
                card.appendChild(emojisElement);
                card.appendChild(storyElement);

                storyCards.appendChild(card);
            });
        }

        // Share functionality
        function shareStory() {
            const story = storyInput.value.trim();

            if (!story) {
                showNotification('Please write a story first!');
                return;
            }

            // Get all emojis
            const emojis = Array.from(emojiContainer.querySelectorAll('.emoji'))
                .map(span => span.textContent)
                .join(' ');

            // Create share text
            const shareText = `Stormoji for ${formattedDate}\n${emojis}\n\n${story}`;

            // Save to history
            saveStoryToHistory(story, emojis, formattedDate, todayKey);

            // The shared content is now in permanent history - clear the
            // separate draft record so a later reload shows the shared
            // story instead of stale draft data. Also cancel any pending
            // debounced autosave so it can't fire after this and resurrect
            // the draft (which stores untrimmed text, unlike the shared
            // story). Typing more after this point re-creates the draft
            // via the 'input' listener above.
            clearTimeout(draftSaveTimer);
            localStorage.removeItem('stormoji-draft');

            // Copy to clipboard (unavailable in non-secure contexts and some browsers)
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareText)
                    .then(() => {
                        showNotification('Copied to clipboard! Share your story!');
                    })
                    .catch(err => {
                        console.error('Failed to copy: ', err);
                        showNotification('Failed to copy to clipboard');
                    });
            } else {
                console.error('Clipboard API not available');
                showNotification('Failed to copy to clipboard');
            }
        }

        function showNotification(message) {
            notificationText.textContent = message;
            notification.style.opacity = '1';

            setTimeout(() => {
                notification.style.opacity = '0';
            }, 3000);
        }

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

        // Initialize the app

        // Ensure emoji-data.js is loaded
        if (typeof emojiCategories === 'undefined') {
            console.error("emojiCategories is undefined. Loading fallback data.");
            window.emojiCategories = getDefaultCategories();
        }

        // Select and display emojis
        const dailyEmojis = selectDailyEmojis(emojiCategories, dateSeed);
        displayEmojis(dailyEmojis);

        // Force display of date if it's not showing
        if (currentDateElement && !currentDateElement.textContent) {
            currentDateElement.textContent = formattedDate;
        }

        const todayKey = formatDateKey(today);

        function updateCharCount() {
            const n = storyInput.value.length;
            charCount.textContent = `${n}`;
            charCount.setAttribute('aria-label', `${n} character${n === 1 ? '' : 's'}`);
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
        applyTodayStory();
        window.addEventListener('pageshow', applyTodayStory);

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

        // Event listeners
        shareBtn.addEventListener('click', shareStory);

        // History toggle functionality
        historyToggle.addEventListener('click', (e) => {
            e.preventDefault();

            if (historyContainer.style.display === 'block') {
                historyContainer.style.display = 'none';
                historyToggle.textContent = 'open history';
            } else {
                historyContainer.style.display = 'block';
                historyToggle.textContent = 'close history';
                displayStoryHistory();
            }
        });

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
            closeButton.focus();
            document.addEventListener('keydown', modalKeyHandler);
        });

        menuExport.addEventListener('click', () => {
            closeMenu();
            menuBtn.focus();
            exportHistoryToCSV();
        });

        menuImport.addEventListener('click', () => {
            closeMenu();
            menuBtn.focus();
            importFileInput.click();
        });

        // Theme menu wiring - unlike menuAbout/menuExport, selecting a
        // theme does not close the menu: switching themes benefits from
        // an immediate live preview, so a user comparing Light vs Dark
        // shouldn't have to reopen the menu for each click.
        const themeOptions = document.querySelectorAll('.theme-option');

        function updateThemeMenuState(storedValue) {
            const effective = resolveThemeAttribute(storedValue) || 'system';
            themeOptions.forEach(btn => {
                btn.setAttribute('aria-checked', btn.dataset.themeChoice === effective ? 'true' : 'false');
            });
        }

        themeOptions.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.dataset.themeChoice;
                localStorage.setItem(THEME_STORAGE_KEY, value);
                applyTheme(value);
                updateThemeMenuState(value);
            });
        });

        updateThemeMenuState(localStorage.getItem(THEME_STORAGE_KEY));

        // About modal functionality
        function closeModal() {
            aboutModal.style.display = 'none';
            document.removeEventListener('keydown', modalKeyHandler);
            menuBtn.focus();
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

        // Import history from a CSV produced by Export. All or nothing:
        // any invalid row rejects the whole file. See parseHistoryCSV and
        // mergeImportedStories for the rules.
        const importFileInput = document.getElementById('import-file');
        const importModal = document.getElementById('import-modal');
        const importModalTitle = document.getElementById('import-modal-title');
        const importModalBody = document.getElementById('import-modal-body');
        const importClose = document.getElementById('import-close');
        const importOk = document.getElementById('import-ok');

        function showImportModal(title, lines) {
            importModalTitle.textContent = title;
            importModalBody.replaceChildren(...lines.map(line => {
                const p = document.createElement('p');
                p.textContent = line;
                return p;
            }));
            importModal.style.display = 'flex';
            importOk.focus();
            document.addEventListener('keydown', importModalKeyHandler);
        }

        function closeImportModal() {
            importModal.style.display = 'none';
            document.removeEventListener('keydown', importModalKeyHandler);
            menuBtn.focus();
        }

        function importModalKeyHandler(event) {
            if (event.key === 'Escape') {
                closeImportModal();
            } else if (event.key === 'Tab') {
                // Keep focus inside the dialog: cycle between its two buttons
                event.preventDefault();
                (document.activeElement === importOk ? importClose : importOk).focus();
            }
        }

        importClose.addEventListener('click', closeImportModal);
        importOk.addEventListener('click', closeImportModal);
        window.addEventListener('click', (event) => {
            if (event.target === importModal) {
                closeImportModal();
            }
        });

        importFileInput.addEventListener('change', async () => {
            const file = importFileInput.files[0];
            // Reset so choosing the same file again still fires 'change'
            importFileInput.value = '';
            if (!file) {
                return;
            }

            try {
                const result = parseHistoryCSV(await file.text());
                if (!result.ok) {
                    showImportModal('Import failed', [result.error, 'Nothing was imported.']);
                    return;
                }

                const existing = JSON.parse(localStorage.getItem('stormoji-stories') || '[]');
                const { stories, added, skipped } = mergeImportedStories(existing, result.stories);
                localStorage.setItem('stormoji-stories', JSON.stringify(stories));

                applyTodayStory();
                if (historyContainer.style.display === 'block') {
                    displayStoryHistory();
                }
                showImportModal('Import complete', describeImportSuccess(added, skipped));
            } catch (error) {
                console.error('Import failed:', error);
                showImportModal('Import failed', [`Could not read or save the file: ${error.message}`, 'Nothing was imported.']);
            }
        });
    };
}

// ---------------------------------------------------------------------------
// Expose pure functions for unit tests (no-op in the browser).
// ---------------------------------------------------------------------------

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
        parseCSV,
        parseHistoryCSV,
        mergeImportedStories,
        describeImportSuccess,
        resolveThemeAttribute,
        APP_VERSION
    };
}
