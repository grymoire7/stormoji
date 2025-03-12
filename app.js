document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const currentDateElement = document.getElementById('current-date');
    const emojiContainer = document.getElementById('emoji-container');
    const storyInput = document.getElementById('story-input');
    const shareBtn = document.getElementById('share-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeButton = document.querySelector('.close-button');
    const tooltip = document.getElementById('tooltip');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');

    // Get today's date in a readable format
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);
    currentDateElement.textContent = formattedDate;

    // Generate a seed based on the date for consistent random selection
    const dateSeed = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    
    // Seeded random function
    function seededRandom(seed) {
        const x = Math.sin(hashCode(seed) * 10000) * 10000;
        return x - Math.floor(x);
    }
    
    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
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

    // Select one emoji from each category
    function selectDailyEmojis() {
        const categories = Object.keys(emojiCategories);
        const shuffledCategories = shuffleArray(categories, dateSeed);
        
        // Select 4 categories
        const selectedCategories = shuffledCategories.slice(0, 4);
        
        // Select one emoji from each selected category
        const selectedEmojis = selectedCategories.map(category => {
            const categoryEmojis = emojiCategories[category];
            const randomIndex = Math.floor(seededRandom(dateSeed + category) * categoryEmojis.length);
            return categoryEmojis[randomIndex];
        });
        
        // Shuffle the selected emojis
        return shuffleArray(selectedEmojis, dateSeed + 'final');
    }

    // Display emojis
    function displayEmojis(emojis) {
        emojiContainer.innerHTML = '';
        
        emojis.forEach(emojiObj => {
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji';
            emojiSpan.textContent = emojiObj.emoji;
            emojiSpan.dataset.name = emojiObj.name;
            
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
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareText)
            .then(() => {
                showNotification('Copied to clipboard! Share your story!');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                showNotification('Failed to copy to clipboard');
            });
    }
    
    function showNotification(message) {
        notificationText.textContent = message;
        notification.style.opacity = '1';
        
        setTimeout(() => {
            notification.style.opacity = '0';
        }, 3000);
    }

    // Initialize the app
    const dailyEmojis = selectDailyEmojis();
    displayEmojis(dailyEmojis);
    
    // Event listeners
    shareBtn.addEventListener('click', shareStory);
    
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
});
