# ⛈ Stormoji

**A daily creative storytelling puzzle game that challenges players to weave
imaginative narratives using four randomly selected emojis.**

<a href="https://stormoji.com" target="_blank" ><img src="https://img.shields.io/badge/Live%20Site-stormoji.com-blue?logo=firefox" alt="Live Site: stormoji.com" /></a>
<img src="https://img.shields.io/badge/Version-1.0.1-informational" alt="Version 1.0.1" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript" />
<img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5" />
<img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3" />
<img src="https://img.shields.io/badge/License-GPL%20v3.0-green" alt="License GPL" />

## 🎯 Project Overview

Stormoji is a single-page web application that delivers a fresh creative challenge every day. Similar to Wordle's daily puzzle format, all users receive the same set of four emojis each day and craft unique stories incorporating them all. The application features:

- **Privacy First**: No user accounts or backend storage; all data stored locally
- **Deterministic daily emoji selection** ensuring consistent experience across all users
- **Local storage persistence** with automatic 6-month history management
- **Responsive, accessible design** with zero dependencies
- **CSV export functionality** for data portability

**Live Site:** [stormoji.com](https://stormoji.com)

## ✨ Features

- **🎯 Daily Creative Challenge**: All users see the same fresh emoji combinations every day
- **🌈 Category Diversity**: Algorithm selects from 8 emoji categories (Smileys, People, Animals, Food, Activity, Objects, Symbols, Travel) with maximum one per category
- **📱 Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **💾 Local Storage**: Automatic story saving with 6-month history retention
- **📤 Data Export**: Download complete story history as CSV
- **🎨 Accessible UI**: Semantic HTML with keyboard navigation support
- **🚀 Zero Dependencies**: Fast loading with no external libraries or build tools
- **🌞 Dark mode toggle**: Dark/light/system style mode toggle

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
git clone https://github.com/grymoire7/stormoji.git
cd stormoji

# Simply open the file directly
open index.html
```

### Running Tests

The app's core logic (emoji selection, date/story matching, CSV escaping) is
unit tested with Node's built-in test runner - no dependencies to install
beyond Node.js itself:

```bash
npm test
# or directly:
node --test
```

DOM-dependent behavior (rendering, clipboard, localStorage side effects) isn't
covered by the above tests but may be covered by the manually run browser automation
tests:

```bash
python3 -m http.server 8000
./scripts/manual_tests/run_all.sh
```

### How to Play

1. **Visit** [stormoji.com](https://stormoji.com) to see today's emoji challenge
2. **Write** a creative story incorporating all four emojis
3. **Share** your story with friends and family
4. **Track** your creative journey with automatic history saving

## 🤝 Contributing

I welcome contributions! Here are some areas where the project could be enhanced:

- **Multi-language Support**: Internationalization for global audience
- **Emoji Curation**: Expand and improve the emoji dataset with better categorization
- **Import History**: Allow users to import story history across devices (export to CSV exists)
- **Social Integration**: Enhanced sharing capabilities with platform-specific optimizations

**Development Setup:** No build process required - just open `index.html` in a
browser to start developing! Run `npm test` and `scripts/manual_tests/run_all.sh` for
chrome automation testing.

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

