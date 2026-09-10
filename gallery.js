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
