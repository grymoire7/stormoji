# ⛈ Stormoji

**A daily creative storytelling puzzle game that challenges players to weave
imaginative narratives using four randomly selected emojis.**

![Stormoji](https://img.shields.io/badge/Live%20Demo-stormoji.com-blue?logo=firefox)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![License](https://img.shields.io/badge/License-GPL%20v3.0-green)

<a href="https://stormoji.com"><img src="https://img.shields.io/badge/Live%20Demo-stormoji.com-blue?logo=firefox" alt="Live Demo: stormoji.com" /></a>
<a href="https://stormoji.com"><img src="https://img.shields.io/badge/Live%20Demo-stormoji.com-blue?logo=firefox" alt="Live Demo: stormoji.com" /></a>

## 🎯 Project Overview

Stormoji is a single-page web application that delivers a fresh creative challenge every day. Similar to Wordle's daily puzzle format, all users receive the same set of four emojis each day and craft unique stories incorporating them all. The application features:

- **Privacy First**: No user accounts or backend storage; all data stored locally
- **Deterministic daily emoji selection** ensuring consistent experience across all users
- **Local storage persistence** with automatic 6-month history management
- **Responsive, accessible design** with zero dependencies
- **CSV export functionality** for data portability

**Live Demo:** [stormoji.com](https://stormoji.com)

## 🏗️ Technical Architecture

### Core Technical Challenges Solved

**Deterministic Daily Emoji Selection**
- Implemented a cryptographically sound seeded random number generator using date-based hashing
- Created a sine-based pseudo-random generator that produces identical results across all users and sessions
- Designed category-based selection algorithm ensuring variety (4 distinct categories from 8 available)
- Applied Fisher-Yates shuffle with deterministic seeding for consistent emoji ordering

**Data Persistence & Management**
- Built localStorage-based story management with automatic 6-month retention policy
- Implemented efficient JSON serialization/deserialization with proper data validation
- Created CSV export functionality with proper escaping for special characters and multiline content

**Zero-Dependency Architecture**
- Crafted a complete web application using vanilla JavaScript, HTML, and CSS
- Handled cross-browser compatibility and responsive design without frameworks
- Implemented modular JavaScript architecture with clear separation of concerns

### Key Technical Features

- **Date-based Seeding**: Hash-based deterministic selection ensures all users see identical daily challenges
- **Category Diversity**: Algorithm selects from 8 emoji categories (Smileys, People, Animals, Food, Activity, Objects, Symbols, Travel) with maximum one per category
- **Responsive UI**: Mobile-first design with touch-friendly interactions and accessible semantic HTML
- **Data Export**: CSV generation with proper field escaping and automatic filename generation
- **History Management**: Automatic pruning of old stories while maintaining data integrity

## ✨ Key Features

- **🎯 Daily Creative Challenge**: Fresh emoji combinations every day
- **📱 Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **💾 Local Storage**: Automatic story saving with 6-month history retention
- **📤 Data Export**: Download complete story history as CSV
- **🎨 Accessible UI**: Semantic HTML with keyboard navigation support
- **🚀 Zero Dependencies**: Fast loading with no external libraries or build tools

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Storage**: Browser localStorage with JSON serialization
- **Architecture**: Single-page application with modular JavaScript
- **Data Export**: Blob API with CSV generation
- **Deployment**: Static hosting (no build process required)

## 🚀 Getting Started

### Running Locally

```bash
# Clone the repository
git clone https://github.com/yourusername/stormoji.git
cd stormoji

# Simply open the file directly
open index.html
```

### How to Play

1. **Visit** [stormoji.com](https://stormoji.com) to see today's emoji challenge
2. **Write** a creative story incorporating all four emojis
3. **Share** your story with friends and family
4. **Track** your creative journey with automatic history saving

## 📊 Project Impact & Learning

**Technical Demonstrations:**
- **Algorithm Design**: Implemented deterministic random selection using cryptographic hashing
- **Data Architecture**: Designed efficient localStorage schema with automatic cleanup
- **Cross-browser Compatibility**: Ensured consistent behavior across modern browsers
- **Performance Optimization**: Zero-dependency architecture for instant loading
- **User Experience**: Created intuitive interface with accessibility considerations

**Problem-Solving Skills:**
- Solved the challenge of creating consistent daily experiences across all users without backend infrastructure
- Implemented robust data persistence with proper serialization and validation
- Created engaging user interface with minimal technical complexity
- Designed scalable emoji categorization system for content variety

## 🤝 Contributing

I welcome contributions! Here are some areas where the project could be enhanced:

- **Multi-language Support**: Internationalization for global audience
- **Emoji Curation**: Expand and improve the emoji dataset with better categorization
- **User Settings**: Add customization options for themes and preferences
- **Import History**: Allow users to import story history across devices (export to CSV exists)
- **Social Integration**: Enhanced sharing capabilities with platform-specific optimizations
- **Testing Suite**: Add automated testing for core functionality
- **Enhanced Accessibility**: Screen reader optimizations and keyboard navigation
- **Private Analytics**: Usage metrics and engagement tracking (local only)

**Development Setup:** No build process required - just open `index.html` in a browser to start developing!

## 📄 License

Stormoji is released under the [GNU General Public License v3.0](LICENSE.md).

## 👨‍💻 About

Created by [Tracy Atteberry](https://tracyatteberry.com) - Full Stack Developer

**Inspired by:**
- [Wordle](https://www.nytimes.com/games/wordle/index.html) - Daily puzzle format
- [Story Cubes](https://storycubes.com) - Creative storytelling concept

**Connect with me:**
- [Portfolio](https://tracyatteberry.com)
- [GitHub](https://github.com/grymoire7)
- [LinkedIn](https://linkedin.com/in/tracyatteberry)

