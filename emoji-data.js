// Emoji categories as described in the README
const emojiCategories = {
    smileys: [
        { emoji: "😀", name: "Grinning Face" },
        { emoji: "😃", name: "Grinning Face with Big Eyes" },
        { emoji: "😄", name: "Grinning Face with Smiling Eyes" },
        { emoji: "😁", name: "Beaming Face with Smiling Eyes" },
        { emoji: "😆", name: "Grinning Squinting Face" },
        { emoji: "😅", name: "Grinning Face with Sweat" },
        { emoji: "🤣", name: "Rolling on the Floor Laughing" },
        { emoji: "😂", name: "Face with Tears of Joy" },
        { emoji: "🙂", name: "Slightly Smiling Face" },
        { emoji: "🙃", name: "Upside-Down Face" }
    ],
    people: [
        { emoji: "👶", name: "Baby" },
        { emoji: "👧", name: "Girl" },
        { emoji: "👩", name: "Woman" },
        { emoji: "👨", name: "Man" },
        { emoji: "👴", name: "Old Man" },
        { emoji: "👵", name: "Old Woman" },
        { emoji: "🧑", name: "Person" },
        { emoji: "👮", name: "Police Officer" },
        { emoji: "🕵️", name: "Detective" },
        { emoji: "👩‍⚕️", name: "Health Worker" }
    ],
    animals: [
        { emoji: "🐶", name: "Dog Face" },
        { emoji: "🐱", name: "Cat Face" },
        { emoji: "🐭", name: "Mouse Face" },
        { emoji: "🐹", name: "Hamster Face" },
        { emoji: "🐰", name: "Rabbit Face" },
        { emoji: "🦊", name: "Fox Face" },
        { emoji: "🐻", name: "Bear Face" },
        { emoji: "🐼", name: "Panda Face" },
        { emoji: "🐨", name: "Koala Face" },
        { emoji: "🐯", name: "Tiger Face" }
    ],
    food: [
        { emoji: "🍎", name: "Red Apple" },
        { emoji: "🍐", name: "Pear" },
        { emoji: "🍊", name: "Tangerine" },
        { emoji: "🍋", name: "Lemon" },
        { emoji: "🍌", name: "Banana" },
        { emoji: "🍉", name: "Watermelon" },
        { emoji: "🍇", name: "Grapes" },
        { emoji: "🍓", name: "Strawberry" },
        { emoji: "🍒", name: "Cherries" },
        { emoji: "🍅", name: "Tomato" }
    ],
    activity: [
        { emoji: "⚽", name: "Soccer Ball" },
        { emoji: "🏀", name: "Basketball" },
        { emoji: "🏈", name: "American Football" },
        { emoji: "⚾", name: "Baseball" },
        { emoji: "🎾", name: "Tennis" },
        { emoji: "🏐", name: "Volleyball" },
        { emoji: "🎱", name: "Pool 8 Ball" },
        { emoji: "🏓", name: "Ping Pong" },
        { emoji: "🎳", name: "Bowling" },
        { emoji: "🛼", name: "Roller Skate" }
    ],
    travel: [
        { emoji: "🚗", name: "Car" },
        { emoji: "🚕", name: "Taxi" },
        { emoji: "🚙", name: "SUV" },
        { emoji: "🚌", name: "Bus" },
        { emoji: "🚎", name: "Trolleybus" },
        { emoji: "🏎️", name: "Racing Car" },
        { emoji: "🚓", name: "Police Car" },
        { emoji: "🚑", name: "Ambulance" },
        { emoji: "🚒", name: "Fire Engine" },
        { emoji: "🚀", name: "Rocket" }
    ],
    objects: [
        { emoji: "⌚", name: "Watch" },
        { emoji: "📱", name: "Mobile Phone" },
        { emoji: "💻", name: "Laptop" },
        { emoji: "⌨️", name: "Keyboard" },
        { emoji: "🖥️", name: "Desktop Computer" },
        { emoji: "🖨️", name: "Printer" },
        { emoji: "🖱️", name: "Computer Mouse" },
        { emoji: "💡", name: "Light Bulb" },
        { emoji: "🔦", name: "Flashlight" },
        { emoji: "🕯️", name: "Candle" }
    ],
    symbols: [
        { emoji: "❤️", name: "Red Heart" },
        { emoji: "💔", name: "Broken Heart" },
        { emoji: "💕", name: "Two Hearts" },
        { emoji: "💖", name: "Sparkling Heart" },
        { emoji: "💗", name: "Growing Heart" },
        { emoji: "💓", name: "Beating Heart" },
        { emoji: "💞", name: "Revolving Hearts" },
        { emoji: "💘", name: "Heart with Arrow" },
        { emoji: "💝", name: "Heart with Ribbon" },
        { emoji: "💟", name: "Heart Decoration" }
    ],
    flags: [
        { emoji: "🏁", name: "Chequered Flag" },
        { emoji: "🚩", name: "Triangular Flag" },
        { emoji: "🎌", name: "Crossed Flags" },
        { emoji: "🏴", name: "Black Flag" },
        { emoji: "🏳️", name: "White Flag" },
        { emoji: "🏳️‍🌈", name: "Rainbow Flag" },
        { emoji: "🏳️‍⚧️", name: "Transgender Flag" },
        { emoji: "🏴‍☠️", name: "Pirate Flag" },
        { emoji: "🇺🇳", name: "United Nations Flag" },
        { emoji: "🇪🇺", name: "European Union Flag" }
    ]
};
