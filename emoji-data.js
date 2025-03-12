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
        { emoji: "🙃", name: "Upside-Down Face" },
        { emoji: "😊", name: "Smiling Face with Smiling Eyes" },
        { emoji: "😇", name: "Smiling Face with Halo" },
        { emoji: "🥰", name: "Smiling Face with Hearts" },
        { emoji: "😍", name: "Smiling Face with Heart-Eyes" },
        { emoji: "🤩", name: "Star-Struck" },
        { emoji: "😘", name: "Face Blowing a Kiss" },
        { emoji: "😗", name: "Kissing Face" },
        { emoji: "☺️", name: "Smiling Face" },
        { emoji: "😚", name: "Kissing Face with Closed Eyes" },
        { emoji: "😙", name: "Kissing Face with Smiling Eyes" },
        { emoji: "🥲", name: "Smiling Face with Tear" },
        { emoji: "😋", name: "Face Savoring Food" },
        { emoji: "😛", name: "Face with Tongue" },
        { emoji: "😜", name: "Winking Face with Tongue" },
        { emoji: "🤪", name: "Zany Face" },
        { emoji: "😝", name: "Squinting Face with Tongue" },
        { emoji: "🤑", name: "Money-Mouth Face" },
        { emoji: "🤗", name: "Hugging Face" },
        { emoji: "🤭", name: "Face with Hand Over Mouth" },
        { emoji: "🤫", name: "Shushing Face" },
        { emoji: "🤔", name: "Thinking Face" },
        { emoji: "🤐", name: "Zipper-Mouth Face" },
        { emoji: "🤨", name: "Face with Raised Eyebrow" },
        { emoji: "😐", name: "Neutral Face" },
        { emoji: "😑", name: "Expressionless Face" },
        { emoji: "😶", name: "Face Without Mouth" },
        { emoji: "😶‍🌫️", name: "Face in Clouds" },
        { emoji: "😏", name: "Smirking Face" },
        { emoji: "😒", name: "Unamused Face" },
        { emoji: "🙄", name: "Face with Rolling Eyes" },
        { emoji: "😬", name: "Grimacing Face" },
        { emoji: "😮‍💨", name: "Face Exhaling" },
        { emoji: "🤥", name: "Lying Face" },
        { emoji: "😌", name: "Relieved Face" },
        { emoji: "😔", name: "Pensive Face" },
        { emoji: "😪", name: "Sleepy Face" },
        { emoji: "🤤", name: "Drooling Face" },
        { emoji: "😴", name: "Sleeping Face" },
        { emoji: "😷", name: "Face with Medical Mask" },
        { emoji: "🤒", name: "Face with Thermometer" },
        { emoji: "🤕", name: "Face with Head-Bandage" },
        { emoji: "🤢", name: "Nauseated Face" },
        { emoji: "🤮", name: "Face Vomiting" },
        { emoji: "🤧", name: "Sneezing Face" },
        { emoji: "🥵", name: "Hot Face" },
        { emoji: "🥶", name: "Cold Face" },
        { emoji: "🥴", name: "Woozy Face" },
        { emoji: "😵", name: "Dizzy Face" },
        { emoji: "😵‍💫", name: "Face with Spiral Eyes" },
        { emoji: "🤯", name: "Exploding Head" }
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
        { emoji: "👩‍⚕️", name: "Health Worker" },
        { emoji: "👨‍⚕️", name: "Man Health Worker" },
        { emoji: "👩‍🎓", name: "Woman Student" },
        { emoji: "👨‍🎓", name: "Man Student" },
        { emoji: "👩‍🏫", name: "Woman Teacher" },
        { emoji: "👨‍🏫", name: "Man Teacher" },
        { emoji: "👩‍⚖️", name: "Woman Judge" },
        { emoji: "👨‍⚖️", name: "Man Judge" },
        { emoji: "👩‍🌾", name: "Woman Farmer" },
        { emoji: "👨‍🌾", name: "Man Farmer" },
        { emoji: "👩‍🍳", name: "Woman Cook" },
        { emoji: "👨‍🍳", name: "Man Cook" },
        { emoji: "👩‍🔧", name: "Woman Mechanic" },
        { emoji: "👨‍🔧", name: "Man Mechanic" },
        { emoji: "👩‍🏭", name: "Woman Factory Worker" },
        { emoji: "👨‍🏭", name: "Man Factory Worker" },
        { emoji: "👩‍💼", name: "Woman Office Worker" },
        { emoji: "👨‍💼", name: "Man Office Worker" },
        { emoji: "👩‍🔬", name: "Woman Scientist" },
        { emoji: "👨‍🔬", name: "Man Scientist" },
        { emoji: "👩‍💻", name: "Woman Technologist" },
        { emoji: "👨‍💻", name: "Man Technologist" },
        { emoji: "👩‍🎤", name: "Woman Singer" },
        { emoji: "👨‍🎤", name: "Man Singer" },
        { emoji: "👩‍🎨", name: "Woman Artist" },
        { emoji: "👨‍🎨", name: "Man Artist" },
        { emoji: "👩‍✈️", name: "Woman Pilot" },
        { emoji: "👨‍✈️", name: "Man Pilot" },
        { emoji: "👩‍🚀", name: "Woman Astronaut" },
        { emoji: "👨‍🚀", name: "Man Astronaut" },
        { emoji: "👩‍🚒", name: "Woman Firefighter" },
        { emoji: "👨‍🚒", name: "Man Firefighter" },
        { emoji: "👮‍♀️", name: "Woman Police Officer" },
        { emoji: "👮‍♂️", name: "Man Police Officer" },
        { emoji: "🕵️‍♀️", name: "Woman Detective" },
        { emoji: "🕵️‍♂️", name: "Man Detective" },
        { emoji: "💂‍♀️", name: "Woman Guard" },
        { emoji: "💂‍♂️", name: "Man Guard" },
        { emoji: "👷‍♀️", name: "Woman Construction Worker" },
        { emoji: "👷‍♂️", name: "Man Construction Worker" },
        { emoji: "👳‍♀️", name: "Woman Wearing Turban" },
        { emoji: "👳‍♂️", name: "Man Wearing Turban" },
        { emoji: "🧕", name: "Woman with Headscarf" },
        { emoji: "👲", name: "Person with Skullcap" },
        { emoji: "🧔", name: "Person with Beard" },
        { emoji: "👱‍♀️", name: "Woman with Blond Hair" },
        { emoji: "👱‍♂️", name: "Man with Blond Hair" },
        { emoji: "🧓", name: "Older Person" },
        { emoji: "🧑‍🦰", name: "Person with Red Hair" },
        { emoji: "🧑‍🦱", name: "Person with Curly Hair" },
        { emoji: "🧑‍🦳", name: "Person with White Hair" },
        { emoji: "🧑‍🦲", name: "Person with Bald Head" }
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
        { emoji: "🐯", name: "Tiger Face" },
        { emoji: "🦁", name: "Lion Face" },
        { emoji: "🐮", name: "Cow Face" },
        { emoji: "🐷", name: "Pig Face" },
        { emoji: "🐽", name: "Pig Nose" },
        { emoji: "🐸", name: "Frog Face" },
        { emoji: "🐵", name: "Monkey Face" },
        { emoji: "🙈", name: "See-No-Evil Monkey" },
        { emoji: "🙉", name: "Hear-No-Evil Monkey" },
        { emoji: "🙊", name: "Speak-No-Evil Monkey" },
        { emoji: "🐒", name: "Monkey" },
        { emoji: "🐔", name: "Chicken" },
        { emoji: "🐧", name: "Penguin" },
        { emoji: "🐦", name: "Bird" },
        { emoji: "🐤", name: "Baby Chick" },
        { emoji: "🐣", name: "Hatching Chick" },
        { emoji: "🐥", name: "Front-Facing Baby Chick" },
        { emoji: "🦆", name: "Duck" },
        { emoji: "🦅", name: "Eagle" },
        { emoji: "🦉", name: "Owl" },
        { emoji: "🦇", name: "Bat" },
        { emoji: "🐺", name: "Wolf Face" },
        { emoji: "🐗", name: "Boar" },
        { emoji: "🐴", name: "Horse Face" },
        { emoji: "🦄", name: "Unicorn Face" },
        { emoji: "🐝", name: "Honeybee" },
        { emoji: "🪱", name: "Worm" },
        { emoji: "🐛", name: "Bug" },
        { emoji: "🦋", name: "Butterfly" },
        { emoji: "🐌", name: "Snail" },
        { emoji: "🐞", name: "Lady Beetle" },
        { emoji: "🐜", name: "Ant" },
        { emoji: "🪰", name: "Fly" },
        { emoji: "🪲", name: "Beetle" },
        { emoji: "🪳", name: "Cockroach" },
        { emoji: "🦟", name: "Mosquito" },
        { emoji: "🦗", name: "Cricket" },
        { emoji: "🕷️", name: "Spider" },
        { emoji: "🕸️", name: "Spider Web" },
        { emoji: "🦂", name: "Scorpion" },
        { emoji: "🦕", name: "Sauropod" },
        { emoji: "🦖", name: "T-Rex" },
        { emoji: "🦎", name: "Lizard" },
        { emoji: "🐍", name: "Snake" },
        { emoji: "🐢", name: "Turtle" },
        { emoji: "🐙", name: "Octopus" },
        { emoji: "🦑", name: "Squid" },
        { emoji: "🦐", name: "Shrimp" },
        { emoji: "🦞", name: "Lobster" },
        { emoji: "🦀", name: "Crab" },
        { emoji: "🐡", name: "Blowfish" },
        { emoji: "🐠", name: "Tropical Fish" },
        { emoji: "🐟", name: "Fish" },
        { emoji: "🐬", name: "Dolphin" },
        { emoji: "🐳", name: "Spouting Whale" },
        { emoji: "🐋", name: "Whale" },
        { emoji: "🦈", name: "Shark" },
        { emoji: "🦭", name: "Seal" },
        { emoji: "🐊", name: "Crocodile" },
        { emoji: "🦓", name: "Zebra" },
        { emoji: "🦍", name: "Gorilla" },
        { emoji: "🦧", name: "Orangutan" },
        { emoji: "🦣", name: "Mammoth" },
        { emoji: "🐘", name: "Elephant" },
        { emoji: "🦛", name: "Hippopotamus" },
        { emoji: "🦏", name: "Rhinoceros" },
        { emoji: "🐪", name: "Camel" },
        { emoji: "🐫", name: "Two-Hump Camel" },
        { emoji: "🦒", name: "Giraffe" },
        { emoji: "🦘", name: "Kangaroo" },
        { emoji: "🦬", name: "Bison" },
        { emoji: "🐃", name: "Water Buffalo" },
        { emoji: "🐂", name: "Ox" },
        { emoji: "🐄", name: "Cow" },
        { emoji: "🐎", name: "Horse" },
        { emoji: "🐖", name: "Pig" },
        { emoji: "🐏", name: "Ram" },
        { emoji: "🐑", name: "Ewe" },
        { emoji: "🦙", name: "Llama" },
        { emoji: "🐐", name: "Goat" },
        { emoji: "🦌", name: "Deer" },
        { emoji: "🐕", name: "Dog" },
        { emoji: "🐩", name: "Poodle" },
        { emoji: "🦮", name: "Guide Dog" },
        { emoji: "🐕‍🦺", name: "Service Dog" },
        { emoji: "🐈", name: "Cat" },
        { emoji: "🐈‍⬛", name: "Black Cat" },
        { emoji: "🪶", name: "Feather" },
        { emoji: "🐓", name: "Rooster" },
        { emoji: "🦃", name: "Turkey" },
        { emoji: "🦤", name: "Dodo" },
        { emoji: "🦚", name: "Peacock" },
        { emoji: "🦜", name: "Parrot" },
        { emoji: "🦢", name: "Swan" },
        { emoji: "🦩", name: "Flamingo" },
        { emoji: "🕊️", name: "Dove" },
        { emoji: "🐇", name: "Rabbit" },
        { emoji: "🦝", name: "Raccoon" },
        { emoji: "🦨", name: "Skunk" },
        { emoji: "🦡", name: "Badger" },
        { emoji: "🦫", name: "Beaver" },
        { emoji: "🦦", name: "Otter" },
        { emoji: "🦥", name: "Sloth" }
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
        { emoji: "🍅", name: "Tomato" },
        { emoji: "🍑", name: "Peach" },
        { emoji: "🍍", name: "Pineapple" },
        { emoji: "🥭", name: "Mango" },
        { emoji: "🍈", name: "Melon" },
        { emoji: "🍏", name: "Green Apple" },
        { emoji: "🍆", name: "Eggplant" },
        { emoji: "🥑", name: "Avocado" },
        { emoji: "🥦", name: "Broccoli" },
        { emoji: "🥬", name: "Leafy Green" },
        { emoji: "🥒", name: "Cucumber" },
        { emoji: "🌶️", name: "Hot Pepper" },
        { emoji: "🫑", name: "Bell Pepper" },
        { emoji: "🌽", name: "Ear of Corn" },
        { emoji: "🥕", name: "Carrot" },
        { emoji: "🧄", name: "Garlic" },
        { emoji: "🧅", name: "Onion" },
        { emoji: "🥔", name: "Potato" },
        { emoji: "🍠", name: "Roasted Sweet Potato" },
        { emoji: "🥐", name: "Croissant" },
        { emoji: "🥯", name: "Bagel" },
        { emoji: "🍞", name: "Bread" },
        { emoji: "🥖", name: "Baguette Bread" },
        { emoji: "🥨", name: "Pretzel" },
        { emoji: "🧀", name: "Cheese Wedge" },
        { emoji: "🥚", name: "Egg" },
        { emoji: "🍳", name: "Cooking" },
        { emoji: "🧈", name: "Butter" },
        { emoji: "🥞", name: "Pancakes" },
        { emoji: "🧇", name: "Waffle" },
        { emoji: "🥓", name: "Bacon" },
        { emoji: "🥩", name: "Cut of Meat" },
        { emoji: "🍗", name: "Poultry Leg" },
        { emoji: "🍖", name: "Meat on Bone" },
        { emoji: "🌭", name: "Hot Dog" },
        { emoji: "🍔", name: "Hamburger" },
        { emoji: "🍟", name: "French Fries" },
        { emoji: "🍕", name: "Pizza" },
        { emoji: "🥪", name: "Sandwich" },
        { emoji: "🥙", name: "Stuffed Flatbread" },
        { emoji: "🧆", name: "Falafel" },
        { emoji: "🌮", name: "Taco" },
        { emoji: "🌯", name: "Burrito" },
        { emoji: "🥗", name: "Green Salad" },
        { emoji: "🥘", name: "Shallow Pan of Food" },
        { emoji: "🫕", name: "Fondue" },
        { emoji: "🥫", name: "Canned Food" },
        { emoji: "🍝", name: "Spaghetti" },
        { emoji: "🍜", name: "Steaming Bowl" },
        { emoji: "🍲", name: "Pot of Food" },
        { emoji: "🍛", name: "Curry Rice" },
        { emoji: "🍣", name: "Sushi" },
        { emoji: "🍱", name: "Bento Box" },
        { emoji: "🥟", name: "Dumpling" },
        { emoji: "🦪", name: "Oyster" },
        { emoji: "🍤", name: "Fried Shrimp" },
        { emoji: "🍙", name: "Rice Ball" },
        { emoji: "🍚", name: "Cooked Rice" },
        { emoji: "🍘", name: "Rice Cracker" },
        { emoji: "🍥", name: "Fish Cake with Swirl" },
        { emoji: "🥠", name: "Fortune Cookie" },
        { emoji: "🥮", name: "Moon Cake" },
        { emoji: "🍢", name: "Oden" },
        { emoji: "🍡", name: "Dango" },
        { emoji: "🍧", name: "Shaved Ice" },
        { emoji: "🍨", name: "Ice Cream" },
        { emoji: "🍦", name: "Soft Ice Cream" },
        { emoji: "🥧", name: "Pie" },
        { emoji: "🧁", name: "Cupcake" },
        { emoji: "🍰", name: "Shortcake" },
        { emoji: "🎂", name: "Birthday Cake" },
        { emoji: "🍮", name: "Custard" },
        { emoji: "🍭", name: "Lollipop" },
        { emoji: "🍬", name: "Candy" },
        { emoji: "🍫", name: "Chocolate Bar" },
        { emoji: "🍿", name: "Popcorn" },
        { emoji: "🍩", name: "Doughnut" },
        { emoji: "🍪", name: "Cookie" },
        { emoji: "🌰", name: "Chestnut" },
        { emoji: "🥜", name: "Peanuts" },
        { emoji: "🍯", name: "Honey Pot" },
        { emoji: "🍼", name: "Baby Bottle" },
        { emoji: "🥛", name: "Glass of Milk" },
        { emoji: "☕", name: "Hot Beverage" },
        { emoji: "🫖", name: "Teapot" },
        { emoji: "🍵", name: "Teacup Without Handle" },
        { emoji: "🧃", name: "Beverage Box" },
        { emoji: "🥤", name: "Cup with Straw" },
        { emoji: "🧋", name: "Bubble Tea" },
        { emoji: "🍶", name: "Sake" },
        { emoji: "🍺", name: "Beer Mug" },
        { emoji: "🍻", name: "Clinking Beer Mugs" },
        { emoji: "🥂", name: "Clinking Glasses" },
        { emoji: "🍷", name: "Wine Glass" },
        { emoji: "🥃", name: "Tumbler Glass" },
        { emoji: "🍸", name: "Cocktail Glass" },
        { emoji: "🍹", name: "Tropical Drink" },
        { emoji: "🧉", name: "Mate Drink" },
        { emoji: "🍾", name: "Bottle with Popping Cork" },
        { emoji: "🧊", name: "Ice Cube" },
        { emoji: "🥄", name: "Spoon" },
        { emoji: "🍴", name: "Fork and Knife" },
        { emoji: "🍽️", name: "Fork and Knife with Plate" },
        { emoji: "🥣", name: "Bowl with Spoon" },
        { emoji: "🧂", name: "Salt" },
        { emoji: "🥢", name: "Chopsticks" }
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
        { emoji: "🛼", name: "Roller Skate" },
        { emoji: "🥊", name: "Boxing Glove" },
        { emoji: "🥋", name: "Martial Arts Uniform" },
        { emoji: "🥅", name: "Goal Net" },
        { emoji: "⛳", name: "Flag in Hole" },
        { emoji: "⛸️", name: "Ice Skate" },
        { emoji: "🎣", name: "Fishing Pole" },
        { emoji: "🤿", name: "Diving Mask" },
        { emoji: "🎽", name: "Running Shirt" },
        { emoji: "🎿", name: "Skis" },
        { emoji: "🛷", name: "Sled" },
        { emoji: "🥌", name: "Curling Stone" },
        { emoji: "🎯", name: "Direct Hit" },
        { emoji: "🪀", name: "Yo-Yo" },
        { emoji: "🪁", name: "Kite" },
        { emoji: "🎮", name: "Video Game" },
        { emoji: "🎲", name: "Game Die" },
        { emoji: "♟️", name: "Chess Pawn" },
        { emoji: "🎭", name: "Performing Arts" },
        { emoji: "🎨", name: "Artist Palette" },
        { emoji: "🧩", name: "Puzzle Piece" },
        { emoji: "🎪", name: "Circus Tent" },
        { emoji: "🎤", name: "Microphone" },
        { emoji: "🎧", name: "Headphone" },
        { emoji: "🎼", name: "Musical Score" },
        { emoji: "🎹", name: "Musical Keyboard" },
        { emoji: "🥁", name: "Drum" },
        { emoji: "🎷", name: "Saxophone" },
        { emoji: "🎺", name: "Trumpet" },
        { emoji: "🎸", name: "Guitar" },
        { emoji: "🪕", name: "Banjo" },
        { emoji: "🎻", name: "Violin" },
        { emoji: "🎬", name: "Clapper Board" },
        { emoji: "🏹", name: "Bow and Arrow" },
        { emoji: "🏸", name: "Badminton" },
        { emoji: "🏏", name: "Cricket Game" },
        { emoji: "🏑", name: "Field Hockey" },
        { emoji: "🏒", name: "Ice Hockey" },
        { emoji: "🥍", name: "Lacrosse" },
        { emoji: "🏄", name: "Person Surfing" },
        { emoji: "🏊", name: "Person Swimming" },
        { emoji: "🤽", name: "Person Playing Water Polo" },
        { emoji: "🧗", name: "Person Climbing" },
        { emoji: "🚴", name: "Person Biking" },
        { emoji: "🚵", name: "Person Mountain Biking" },
        { emoji: "🏇", name: "Horse Racing" },
        { emoji: "⛷️", name: "Skier" },
        { emoji: "🏂", name: "Snowboarder" },
        { emoji: "🪂", name: "Parachute" },
        { emoji: "🏋️", name: "Person Lifting Weights" },
        { emoji: "🤸", name: "Person Cartwheeling" },
        { emoji: "⛹️", name: "Person Bouncing Ball" },
        { emoji: "🤺", name: "Person Fencing" },
        { emoji: "🤾", name: "Person Playing Handball" },
        { emoji: "🏌️", name: "Person Golfing" },
        { emoji: "🧘", name: "Person in Lotus Position" },
        { emoji: "🏆", name: "Trophy" },
        { emoji: "🥇", name: "1st Place Medal" },
        { emoji: "🥈", name: "2nd Place Medal" },
        { emoji: "🥉", name: "3rd Place Medal" },
        { emoji: "🏅", name: "Sports Medal" },
        { emoji: "🎖️", name: "Military Medal" },
        { emoji: "🏵️", name: "Rosette Award" }
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
        { emoji: "🕯️", name: "Candle" },
        { emoji: "🧯", name: "Fire Extinguisher" },
        { emoji: "🗑️", name: "Wastebasket" },
        { emoji: "🔋", name: "Battery" },
        { emoji: "🔌", name: "Electric Plug" },
        { emoji: "🧰", name: "Toolbox" },
        { emoji: "🧲", name: "Magnet" },
        { emoji: "🪜", name: "Ladder" },
        { emoji: "⚗️", name: "Alembic" },
        { emoji: "🧪", name: "Test Tube" },
        { emoji: "🧫", name: "Petri Dish" },
        { emoji: "🧬", name: "DNA" },
        { emoji: "🔬", name: "Microscope" },
        { emoji: "🔭", name: "Telescope" },
        { emoji: "📡", name: "Satellite Antenna" },
        { emoji: "💉", name: "Syringe" },
        { emoji: "🩸", name: "Drop of Blood" },
        { emoji: "💊", name: "Pill" },
        { emoji: "🩹", name: "Adhesive Bandage" },
        { emoji: "🩺", name: "Stethoscope" },
        { emoji: "🚪", name: "Door" },
        { emoji: "🪑", name: "Chair" },
        { emoji: "🚽", name: "Toilet" },
        { emoji: "🚿", name: "Shower" },
        { emoji: "🛁", name: "Bathtub" },
        { emoji: "🪒", name: "Razor" },
        { emoji: "🧴", name: "Lotion Bottle" },
        { emoji: "🧷", name: "Safety Pin" },
        { emoji: "🧹", name: "Broom" },
        { emoji: "🧺", name: "Basket" },
        { emoji: "🧻", name: "Roll of Paper" },
        { emoji: "🪣", name: "Bucket" },
        { emoji: "🧼", name: "Soap" },
        { emoji: "🪥", name: "Toothbrush" },
        { emoji: "🧽", name: "Sponge" },
        { emoji: "🧸", name: "Teddy Bear" },
        { emoji: "🪆", name: "Nesting Dolls" },
        { emoji: "🧶", name: "Yarn" },
        { emoji: "🧵", name: "Thread" },
        { emoji: "🪡", name: "Sewing Needle" },
        { emoji: "🧮", name: "Abacus" },
        { emoji: "🪞", name: "Mirror" },
        { emoji: "🪟", name: "Window" },
        { emoji: "🪠", name: "Plunger" },
        { emoji: "🧾", name: "Receipt" },
        { emoji: "🧱", name: "Brick" },
        { emoji: "🔨", name: "Hammer" },
        { emoji: "🪓", name: "Axe" },
        { emoji: "⛏️", name: "Pick" },
        { emoji: "⚒️", name: "Hammer and Pick" },
        { emoji: "🛠️", name: "Hammer and Wrench" },
        { emoji: "🗡️", name: "Dagger" },
        { emoji: "⚔️", name: "Crossed Swords" },
        { emoji: "🔫", name: "Water Pistol" },
        { emoji: "🪃", name: "Boomerang" },
        { emoji: "🏹", name: "Bow and Arrow" },
        { emoji: "🛡️", name: "Shield" },
        { emoji: "🪚", name: "Carpentry Saw" },
        { emoji: "🔧", name: "Wrench" },
        { emoji: "🪛", name: "Screwdriver" },
        { emoji: "🔩", name: "Nut and Bolt" },
        { emoji: "⚙️", name: "Gear" },
        { emoji: "🗜️", name: "Clamp" },
        { emoji: "⚖️", name: "Balance Scale" },
        { emoji: "🦯", name: "White Cane" },
        { emoji: "🔗", name: "Link" },
        { emoji: "⛓️", name: "Chains" },
        { emoji: "🧲", name: "Magnet" },
        { emoji: "🪝", name: "Hook" },
        { emoji: "📏", name: "Straight Ruler" },
        { emoji: "📐", name: "Triangular Ruler" },
        { emoji: "✂️", name: "Scissors" },
        { emoji: "📌", name: "Pushpin" },
        { emoji: "📍", name: "Round Pushpin" },
        { emoji: "📎", name: "Paperclip" },
        { emoji: "🖇️", name: "Linked Paperclips" },
        { emoji: "📝", name: "Memo" },
        { emoji: "✏️", name: "Pencil" },
        { emoji: "✒️", name: "Black Nib" },
        { emoji: "🖋️", name: "Fountain Pen" },
        { emoji: "🖊️", name: "Pen" },
        { emoji: "🖌️", name: "Paintbrush" },
        { emoji: "🖍️", name: "Crayon" },
        { emoji: "📖", name: "Open Book" },
        { emoji: "📚", name: "Books" },
        { emoji: "📙", name: "Orange Book" },
        { emoji: "📓", name: "Notebook" },
        { emoji: "📒", name: "Ledger" },
        { emoji: "📃", name: "Page with Curl" },
        { emoji: "📜", name: "Scroll" },
        { emoji: "📄", name: "Page Facing Up" },
        { emoji: "📰", name: "Newspaper" },
        { emoji: "🗞️", name: "Rolled-Up Newspaper" },
        { emoji: "📑", name: "Bookmark Tabs" },
        { emoji: "🔖", name: "Bookmark" },
        { emoji: "🏷️", name: "Label" }
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
        { emoji: "💟", name: "Heart Decoration" },
        { emoji: "❣️", name: "Heart Exclamation" },
        { emoji: "💌", name: "Love Letter" },
        { emoji: "💋", name: "Kiss Mark" },
        { emoji: "💯", name: "Hundred Points" },
        { emoji: "💢", name: "Anger Symbol" },
        { emoji: "💥", name: "Collision" },
        { emoji: "💫", name: "Dizzy" },
        { emoji: "💦", name: "Sweat Droplets" },
        { emoji: "💨", name: "Dashing Away" },
        { emoji: "🕳️", name: "Hole" },
        { emoji: "💣", name: "Bomb" },
        { emoji: "💬", name: "Speech Balloon" },
        { emoji: "👁️‍🗨️", name: "Eye in Speech Bubble" },
        { emoji: "🗨️", name: "Left Speech Bubble" },
        { emoji: "🗯️", name: "Right Anger Bubble" },
        { emoji: "💭", name: "Thought Balloon" },
        { emoji: "💤", name: "Zzz" },
        { emoji: "🏁", name: "Chequered Flag" },
        { emoji: "♾️", name: "Infinity" },
        { emoji: "💲", name: "Heavy Dollar Sign" },
        { emoji: "♻️", name: "Recycling Symbol" },
        { emoji: "🔱", name: "Trident Emblem" },
        { emoji: "📛", name: "Name Badge" },
        { emoji: "✔️", name: "Check Mark" },
        { emoji: "❌", name: "Cross Mark" },
        { emoji: "❇️", name: "Sparkle" },
        // Sky & Weather Emojis
        { emoji: "🌝", name: "Full Moon Face" },
        { emoji: "🌞", name: "Sun with Face" },
        { emoji: "🌎", name: "Earth" },
        { emoji: "✨", name: "Sparkles" },
        { emoji: "⚡", name: "High Voltage" },
        { emoji: "☄️", name: "Comet" },
        { emoji: "🔥", name: "Fire" },
        { emoji: "🌪️", name: "Tornado" },
        { emoji: "🌈", name: "Rainbow" },
        { emoji: "☁️", name: "Cloud" },
        { emoji: "⛅", name: "Sun Behind Cloud" },
        { emoji: "⛈️", name: "Cloud with Lightning and Rain" },
        { emoji: "🌤️", name: "Sun Behind Small Cloud" },
        { emoji: "🌥️", name: "Sun Behind Large Cloud" },
        { emoji: "🌦️", name: "Sun Behind Rain Cloud" },
        { emoji: "🌧️", name: "Cloud with Rain" },
        { emoji: "🌨️", name: "Cloud with Snow" },
        { emoji: "🌩️", name: "Cloud with Lightning" },
        { emoji: "🌬️", name: "Wind Face" },
        { emoji: "💨", name: "Dashing Away" },
        { emoji: "☔", name: "Umbrella with Rain Drops" },
        { emoji: "☂️", name: "Umbrella" },
        { emoji: "🌊", name: "Water Wave" },
        { emoji: "🌫️", name: "Fog" }
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
        { emoji: "🚚", name: "Delivery Truck" },
        { emoji: "🚛", name: "Articulated Lorry" },
        { emoji: "🚜", name: "Tractor" },
        { emoji: "🛴", name: "Kick Scooter" },
        { emoji: "🚲", name: "Bicycle" },
        { emoji: "🛵", name: "Motor Scooter" },
        { emoji: "🏍️", name: "Motorcycle" },
        { emoji: "🚨", name: "Police Car Light" },
        { emoji: "🚔", name: "Oncoming Police Car" },
        { emoji: "🚍", name: "Oncoming Bus" },
        { emoji: "🚘", name: "Oncoming Automobile" },
        { emoji: "🚖", name: "Oncoming Taxi" },
        { emoji: "🚡", name: "Aerial Tramway" },
        { emoji: "🚠", name: "Mountain Cableway" },
        { emoji: "🚟", name: "Suspension Railway" },
        { emoji: "🚃", name: "Railway Car" },
        { emoji: "🚋", name: "Tram Car" },
        { emoji: "🚞", name: "Mountain Railway" },
        { emoji: "🚝", name: "Monorail" },
        { emoji: "🚄", name: "High-Speed Train" },
        { emoji: "🚅", name: "Bullet Train" },
        { emoji: "🚈", name: "Light Rail" },
        { emoji: "🚂", name: "Locomotive" },
        { emoji: "🚆", name: "Train" },
        { emoji: "🚇", name: "Metro" },
        { emoji: "🚊", name: "Tram" },
        { emoji: "🚉", name: "Station" },
        { emoji: "✈️", name: "Airplane" },
        { emoji: "🛫", name: "Airplane Departure" },
        { emoji: "🛬", name: "Airplane Arrival" },
        { emoji: "🛩️", name: "Small Airplane" },
        { emoji: "💺", name: "Seat" },
        { emoji: "🛰️", name: "Satellite" },
        { emoji: "🚀", name: "Rocket" },
        { emoji: "🛸", name: "Flying Saucer" },
        { emoji: "🚁", name: "Helicopter" },
        { emoji: "🛶", name: "Canoe" },
        { emoji: "⛵", name: "Sailboat" },
        { emoji: "🚤", name: "Speedboat" },
        { emoji: "🛥️", name: "Motor Boat" },
        { emoji: "🛳️", name: "Passenger Ship" },
        { emoji: "⛴️", name: "Ferry" },
        { emoji: "🚢", name: "Ship" },
        { emoji: "⚓", name: "Anchor" },
        { emoji: "🚧", name: "Construction" },
        { emoji: "⛽", name: "Fuel Pump" },
        { emoji: "🚏", name: "Bus Stop" },
        { emoji: "🚦", name: "Vertical Traffic Light" },
        { emoji: "🚥", name: "Horizontal Traffic Light" },
        { emoji: "🗺️", name: "World Map" },
        { emoji: "🗿", name: "Moai" },
        { emoji: "🗽", name: "Statue of Liberty" },
        { emoji: "🗼", name: "Tokyo Tower" },
        { emoji: "🏰", name: "Castle" },
        { emoji: "🏯", name: "Japanese Castle" },
        { emoji: "🏟️", name: "Stadium" },
        { emoji: "🎡", name: "Ferris Wheel" },
        { emoji: "🎢", name: "Roller Coaster" },
        { emoji: "🎠", name: "Carousel Horse" },
        { emoji: "⛲", name: "Fountain" },
        { emoji: "⛱️", name: "Umbrella on Ground" },
        { emoji: "🏖️", name: "Beach with Umbrella" },
        { emoji: "🏝️", name: "Desert Island" },
        { emoji: "🏜️", name: "Desert" },
        { emoji: "🌋", name: "Volcano" }
    ]
};
