// Wait for the DOM to be fully loaded
window.onload = function() {
    // DOM elements
    const currentDateElement = document.getElementById('current-date');
    const emojiContainer = document.getElementById('emoji-container');
    const storyInput = document.getElementById('story-input');
    const shareBtn = document.getElementById('share-btn');
    const historyToggle = document.getElementById('history-toggle');
    const historyContainer = document.getElementById('history-container');
    const storyCards = document.getElementById('story-cards');
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
    if (currentDateElement) {
        currentDateElement.textContent = formattedDate;
    } else {
        console.error("Date element not found!");
    }

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
        // Ensure emojiCategories is defined
        if (typeof emojiCategories === 'undefined') {
            console.error("Emoji categories not defined!");
            return getDefaultEmojis();
        }
        
        try {
            const categories = Object.keys(emojiCategories);
            if (categories.length < 4) {
                console.error("Not enough emoji categories!");
                return getDefaultEmojis();
            }
            
            // Get 4 random categories
            const shuffledCategories = shuffleArray(categories, dateSeed);
            const selectedCategories = shuffledCategories.slice(0, 4);
            
            // Get one emoji from each category
            const selectedEmojis = [];
            
            for (const category of selectedCategories) {
                const categoryEmojis = emojiCategories[category];
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
    
    // Default emojis as fallback
    function getDefaultEmojis() {
        return [
            { emoji: "😩", name: "Crying Face" },
            { emoji: "4️⃣", name: "Four" },
            { emoji: "0️⃣", name: "Zero" },
            { emoji: "4️⃣", name: "Four" }
        ];
    }

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
    function saveStoryToHistory(story, emojis, date) {
        // Get existing stories or initialize empty array
        const storiesJSON = localStorage.getItem('stormoji-stories') || '[]';
        let stories = JSON.parse(storiesJSON);
        
        // Create a date key in format YYYY-MM-DD
        const dateObj = new Date(date);
        const dateKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;
        
        // Check if a story for this date already exists
        const existingIndex = stories.findIndex(item => item.dateKey === dateKey);
        
        if (existingIndex !== -1) {
            // Update existing story
            stories[existingIndex] = { dateKey, date, emojis, story };
        } else {
            // Add new story
            stories.push({ dateKey, date, emojis, story });
        }
        
        // Sort stories by date (newest first)
        stories.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Keep only the last 6 months of stories
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        stories = stories.filter(item => new Date(item.date) >= sixMonthsAgo);
        
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
        saveStoryToHistory(story, emojis, formattedDate);
        
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
  
    function getDefaultCategories() {
        return {
            smileys: [{ emoji: "😩", name: "Crying Face" }],
            animals: [{ emoji: "4️⃣", name: "Four" }],
            food: [{ emoji: "0️⃣", name: "Zero" }],
            activity: [{ emoji: "4️⃣", name: "Four" }]
        };
    }

    // Initialize the app
    
    // Ensure emoji-data.js is loaded
    if (typeof emojiCategories === 'undefined') {
        console.error("emojiCategories is undefined. Loading fallback data.");
        window.emojiCategories = getDefaultCategories();
    }
    
    // Select and display emojis
    const dailyEmojis = selectDailyEmojis();
    displayEmojis(dailyEmojis);
    
    // Force display of date if it's not showing
    if (currentDateElement && !currentDateElement.textContent) {
        currentDateElement.textContent = formattedDate;
    }
    
    // Check if there's a story for today
    const storiesJSON = localStorage.getItem('stormoji-stories') || '[]';
    const stories = JSON.parse(storiesJSON);
    
    const todayKey = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    
    const todayStory = stories.find(item => item.dateKey === todayKey);
    if (todayStory) {
        storyInput.value = todayStory.story;
    }
    
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
};
