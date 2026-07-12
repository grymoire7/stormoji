// ---------------------------------------------------------------------------
// Pure helpers (no DOM/browser APIs) - exported below for unit testing.
// ---------------------------------------------------------------------------

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
// Uses UTC fields so the puzzle day boundary is the same instant for
// every user regardless of local timezone, matching dateSeed below.
function formatDateKey(date) {
    return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`;
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

// ---------------------------------------------------------------------------
// Browser wiring (DOM/localStorage) - skipped when loaded outside a browser.
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined') {
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

        // Generate a seed based on the UTC date for consistent random selection.
        // Using UTC (not local time) ensures every visitor sees the same daily
        // puzzle regardless of timezone, and that the day boundary is a single
        // shared instant rather than each user's local midnight.
        const dateSeed = `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`;

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
        function showTooltip(event, text) {
            tooltip.textContent = text;
            tooltip.style.opacity = '1';

            // Position the tooltip
            const rect = event.target.getBoundingClientRect();
            tooltip.style.top = `${rect.bottom + 10}px`;
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;

            // Hide tooltip after 5 seconds
            setTimeout(() => {
                hideTooltip();
            }, 5000);
        }

        function hideTooltip() {
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
        escapeCSV
    };
}
