# ⛈ Stormoji

**A daily creative storytelling puzzle game that challenges players to weave imaginative narratives using four randomly selected emojis.**

<a href="https://stormoji.com" target="_blank" ><img src="https://img.shields.io/badge/Live%20Site-stormoji.com-blue?logo=firefox" alt="Live Site: stormoji.com" /></a>
<img src="https://img.shields.io/badge/Version-1.0.1-informational" alt="Version 1.0.1" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript" />
<img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5" />
<img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3" />
<img src="https://img.shields.io/badge/License-GPL%20v3.0-green" alt="License GPL" />

## Overview

Stormoji is a single page web app that hands you a new creative writing prompt every day. Like Wordle's daily puzzle, every visitor sees the same four emojis and writes their own story weaving them together. Play today's puzzle at [stormoji.com](https://stormoji.com).

The four emojis are chosen deterministically from eight categories (smileys, people, animals, food, activity, objects, symbols, and travel), one per category, so everyone gets the exact same combination on the exact same calendar day. There's no backend and no accounts: stories are saved to your browser's local storage, with the last six months kept automatically and older entries pruned as you go, and you can export your full history to CSV at any time. Sharing a story copies it and its emojis straight to your clipboard.

The interface is responsive, keyboard accessible, and includes a light, dark, and system theme toggle.

Stormoji was created by [Tracy Atteberry](https://tracyatteberry.com), a full stack developer, inspired by [Wordle](https://www.nytimes.com/games/wordle/index.html)'s daily puzzle format and [Story Cubes](https://storycubes.com)'s approach to creative storytelling prompts. Find more of his work on [GitHub](https://github.com/grymoire7) or [LinkedIn](https://linkedin.com/in/tracyatteberry).

## Stack

- Frontend: vanilla JavaScript (ES6+), HTML5, and CSS3, with no framework or build step
- Storage: browser localStorage, serialized as JSON
- Data export: the Blob API for CSV generation
- Deployment: static hosting

## Setup

Clone the repo:

```bash
git clone https://github.com/grymoire7/stormoji.git
cd stormoji
```

There's no build step and nothing to install to run the app itself: open `index.html` directly in a browser, or serve it locally (see Tasks below).

Running the unit tests needs Node.js, since they use its built-in test runner. Running the integration tests needs [rodney](https://github.com/simonw/rodney), a Chrome automation CLI, installed and on your `PATH`.

## Tasks

Day-to-day commands, run via [mise](https://mise.jdx.dev) and [pitchfork](https://pitchfork.jdx.dev):

- `pitchfork start`: starts the `web` daemon (`python3 -m http.server 8000`), serving the app at `http://localhost:8000`.
- `mise run test`: runs Node's built-in test runner against `app.js`.
- `mise run integration-test`: runs the browser-automated regression tests. Requires the web daemon running via pitchfork first (`pitchfork start`).

## Documentation

- [docs/roadmap.md](docs/roadmap.md): a running backlog of known issues and possible improvements, including longer-term ideas like multi-language support, deeper emoji curation, cross-device history import, and richer social sharing
- [docs/manual_tests.md](docs/manual_tests.md): the scripted browser test suite behind `mise run integration-test`
- [docs/plans/](docs/plans/) and [docs/specs/](docs/specs/): design docs and specs for individual features
- [CHANGELOG.md](CHANGELOG.md): release history

## License

Stormoji is released under the [GNU General Public License v3.0](LICENSE.md).
