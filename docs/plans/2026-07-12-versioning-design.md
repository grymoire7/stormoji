# Versioning and 1.0 release notes design

Stormoji has never had a version number. Over 2026-07-11 and 2026-07-12,
a large batch of work landed (draft autosave, dark mode, accessibility
pass, new test coverage, a UTC date-anchoring bug fix). The user wants
this treated as the `1.0.0` release, with everything before it
(2025-03-12 through 2026-01-23, i.e. "before June 11") treated as the
`0.9.0` baseline. This closes three things: a version number surfaced in
the app, a `CHANGELOG.md`, and a README mention.

## Version storage

Stormoji has no build step and must keep working when `index.html` is
opened directly via `file://` (per `README.md`'s "Getting Started").
That rules out reading `package.json` at runtime (a `fetch()` of a local
file is blocked by the browser's `file://` CORS restrictions) or adding
a bundler just to inject a version string.

Instead, the version is a plain module-scope constant in `app.js`:

```js
const APP_VERSION = '1.0.0';
```

placed near the other module-scope constants at the top of the file
(alongside the seeded-random / date-key logic already exported for
tests — this constant doesn't need a test, so it isn't added to the
`module.exports` guard).

`package.json` also gets a matching `"version": "1.0.0"` field. This is
not read at runtime; it's there so `npm`/tooling and anyone browsing the
repo see accurate metadata. Two places to keep in sync (`app.js` and
`package.json`) is an accepted tradeoff of having no build step — each
future release bumps both in the same commit as the `CHANGELOG.md`
entry.

## About dialog

`index.html`'s `#about-modal` gets one more line at the end of
`.modal-content`, after the existing two `<p>` tags:

```html
<p class="app-version">v<span id="app-version"></span></p>
```

The DOM-wiring code in `app.js` (inside `window.onload`, near where
other one-time static content is set) sets that span's text from
`APP_VERSION` on load:

```js
document.getElementById('app-version').textContent = APP_VERSION;
```

`styles.css` gets a small `.app-version` rule (muted text color via the
existing `--muted-text` custom property, smaller font-size) so it reads
as a footnote rather than competing with the About copy.

## README.md

Add one more badge to the existing badge row (same shields.io style
already used for JavaScript/HTML5/CSS3/License), directly after the
JavaScript/HTML5/CSS3 badges:

```
<img src="https://img.shields.io/badge/Version-1.0.0-informational" alt="Version 1.0.0" />
```

No other README changes — the existing "Project Overview" section
doesn't need a version callout beyond the badge.

## CHANGELOG.md

New file at the repo root, [Keep a Changelog](https://keepachangelog.com)
format:

- `## [1.0.0] - 2026-07-12` — grouped `### Added`, `### Changed`,
  `### Fixed` subsections with user-facing bullets (not a 1:1 commit
  dump) summarizing the last two days: draft autosave, dark mode +
  Light/Dark/System toggle, keyboard/ARIA accessibility pass (menu,
  modal focus return), story character counter, UTC date-anchoring
  fix, CSS custom-property refactor, and new test coverage (the
  `node:test` suite plus rodney scripts for persistence, accessibility,
  history render, CSV export, and dark mode).
- `## [0.9.0] - 2025-03-12` — one short paragraph, not itemized: initial
  release baseline (daily emoji puzzle, story history, CSV export,
  hamburger menu). Dated to the actual first commit
  (`797f215 Initial stormoji version`); framed as the pre-changelog
  baseline rather than reconstructed feature-by-feature.

## Out of scope

- No automated enforcement that `app.js` and `package.json` versions
  match (no build step to add a check to; a code-review note in the
  release commit is enough at this scale).
- No `git tag` — the user didn't ask for one, and it's a
  reversible/shareable action worth confirming separately if wanted.
