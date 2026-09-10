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

const tooltip = document.getElementById('tooltip');

// Flattened emoji -> name lookup, built once from emoji-data.js's
// categories (loaded before this script). Falls back to "Unknown" for
// any future gallery entry using an emoji not present there, matching
// app.js's fallback for the same case.
const emojiNames = {};
for (const category in emojiCategories) {
    emojiCategories[category].forEach(item => {
        emojiNames[item.emoji] = item.name;
    });
}

// Duplicated from app.js's showTooltip/hideTooltip - same reasoning as
// the theme functions above for not sharing a module. Positioned above
// the emoji rather than below, unlike app.js's version - below would
// overlap the story text that sits right under each card's emoji row.
let tooltipHideTimer;

function showTooltip(event, text) {
    tooltip.textContent = text;
    tooltip.style.opacity = '1';

    const rect = event.target.getBoundingClientRect();
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;

    // Clearing any timer from a previous, still-pending show first is
    // what keeps this consistently 5 seconds - without it, a stale timer
    // from an earlier emoji can fire mid-way through a later one's 5
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

function renderGallery(stories, container) {
    container.innerHTML = '';
    stories.forEach(item => {
        const card = document.createElement('div');
        card.className = 'story-card';

        const emojisElement = document.createElement('div');
        emojisElement.className = 'story-card-emojis';
        item.emojis.split(' ').forEach((emoji, index) => {
            if (index > 0) {
                emojisElement.appendChild(document.createTextNode(' '));
            }

            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji';
            emojiSpan.textContent = emoji;
            emojiSpan.dataset.name = emojiNames[emoji] || 'Unknown';

            emojiSpan.addEventListener('mouseenter', (e) => {
                showTooltip(e, emojiNames[emoji] || 'Unknown');
            });
            emojiSpan.addEventListener('mouseleave', hideTooltip);

            emojisElement.appendChild(emojiSpan);
        });

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
