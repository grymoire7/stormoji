# Dark mode design

Closes the `docs/roadmap.md` "Other / lower priority" item: `styles.css`
has no `@media (prefers-color-scheme: dark)` rule. It also adds a
user-facing Light/Dark/System override, since a system-only preference
leaves no way to pick a theme that differs from the OS.

## Approach

`styles.css` already centralizes most colors in seven `:root` custom
properties. The plan is: (1) promote the remaining ~10 hardcoded colors to
custom properties too, with their light-mode values unchanged (a pure
refactor - the page must look pixel-identical afterward), then (2) add a
single `@media (prefers-color-scheme: dark)` block overriding the
properties that need to differ, plus `color-scheme: light dark` on
`:root` so native form controls (the textarea, scrollbars) pick up the
theme automatically.

## Why some properties split into two

`--primary-color` (`#4a6fa5`) currently does two unrelated jobs: it's a
**button background** (`.share-btn`, paired with white text) and a
**text-on-page color** (`h1`, `#history-toggle`, `.story-card-date`,
`.footer a`, `.menu-btn`). Those two jobs need different values in dark
mode:

- As a button background, `#4a6fa5` never touches the page background
  directly - white text on it is `5.11:1` regardless of page theme, so it
  doesn't need to change.
- As page text, `#4a6fa5` on the new dark background (`#1a1a1a`) is only
  `3.40:1` - passes for the large `h1` (needs `3:1`) but fails for
  smaller text like `#history-toggle` (`0.8rem`, needs `4.5:1`).

So a new `--link-color` variable takes over the text-on-page role,
`#4a6fa5` in light mode (identical to today) and a lighter `#8ab4e8` in
dark mode (`8.10:1` against `#1a1a1a`). `--primary-color` keeps its
original value in both themes and is used only for solid-fill button
backgrounds and hover states from here on (`--button-hover` likewise
stays `#3a5a80` in both themes - white-on-it is `7.10:1` regardless of
page theme).

Contrast ratios below use the standard WCAG relative-luminance formula
(`(L1 + 0.05) / (L2 + 0.05)`).

## Full variable table

| Variable | Light (unchanged) | Dark | Used for |
|---|---|---|---|
| `--primary-color` | `#4a6fa5` | *(same)* | `.share-btn` background |
| `--button-hover` | `#3a5a80` | *(same)* | `.share-btn:hover`, `.menu-btn:hover` background |
| `--background-color` | `#f9f9f9` | `#1a1a1a` | page background, `.menu-btn` background |
| `--text-color` | `#333` | `#e6e6e6` | body text; also reused (unchanged) for `.close-button:hover` |
| `--border-color` | `#ddd` | `#444` | all borders |
| `--shadow-color` | `rgba(0,0,0,0.1)` | `rgba(0,0,0,0.4)` | `.story-card` box-shadow |
| `--link-color` *(new)* | `#4a6fa5` | `#8ab4e8` | `h1`, `#history-toggle`, `.history-container h3`, `.story-card-date`, `.footer a`, `.menu-btn` text, `.close-button:focus-visible`/`.menu-item:focus-visible` outline |
| `--surface-color` *(new)* | `white` | `#2a2a2a` | `.modal-content`, `.story-card`, `.menu-dropdown` background |
| `--muted-text-color` *(new)* | `#777` | `#aaa` | `.close-button` default color, `.footer` text |
| `--char-count-color` *(new)* | `#666` | `#aaa` | `.char-count` |
| `--hover-surface-color` *(new)* | `#f5f5f5` | `#3a3a3a` | `.menu-item:hover` background |

Contrast check on the two new text colors against the new dark
background/surface:

- `--link-color` dark (`#8ab4e8`) vs `--background-color` dark
  (`#1a1a1a`): `8.10:1`.
- `--muted-text-color`/`--char-count-color` dark (`#aaa`) vs
  `--background-color` dark: `7.49:1`.

All comfortably clear the `4.5:1` AA threshold for normal text.

## Deliberately left unchanged

- **Tooltip and notification** (`.tooltip`, `.notification`): stay
  `#333` background / white text in both themes. These are floating
  chips (like a toast), not page content - keeping them constant is a
  common pattern (matches how most toast/tooltip components behave
  regardless of host-page theme) and avoids adding two more variables
  for components whose whole purpose is to stand out from the page.
- **Modal overlay** (`rgba(0,0,0,0.5)`), **`.modal-content` box-shadow**
  (`rgba(0,0,0,0.2)`), **`.menu-dropdown` box-shadow**
  (`rgba(0,0,0,0.15)`): a black scrim/shadow still reads correctly
  regardless of page theme (it darkens whatever's behind it); in dark
  mode the shadows are simply less visible against an already-dark
  page, which is a cosmetic no-op, not a correctness bug. Not worth new
  variables for a "lower priority" roadmap item.
- `--secondary-color` (`#166088`): already unused anywhere in
  `styles.css` today (pre-existing dead custom property, unrelated to
  this change) - left alone.

## Manual Light/Dark/System toggle

**Placement:** three radio-style items in the existing hamburger dropdown
(`#menu-dropdown`), after a divider below "Export History" - not a
standalone header icon. Stormoji's primary audience is writers, who
favor an uncluttered UI; a theme preference is a set-once, rarely-revisited
setting, not something that earns permanent header real estate. The
2-click cost (open menu, pick theme) is the right tradeoff for that usage
pattern. This also reuses the existing `.menu-item` button/hover/
focus-visible styling and the dropdown's existing outside-click/Escape
handling verbatim - no new interaction surface to secure.

**Markup pattern:** each option is a real `<button class="menu-item
theme-option" role="radio" aria-checked="...">`, wrapped in `<div
role="radiogroup" aria-labelledby="theme-group-label">`. `role="radio"` +
`aria-checked` is the semantically correct pattern for a mutually-exclusive
choice (screen readers announce "radio button, Light, checked"), and
doesn't require retrofitting `role="menu"` onto the whole dropdown (which
the codebase doesn't actually have today, despite `docs/roadmap.md`
claiming otherwise - see the accessibility scoping note below).

**Deliberately not implemented:** roving-tabindex/arrow-key navigation
between the three radios (the full WAI-ARIA APG "radiogroup" keyboard
pattern). The three buttons are just Tab-reachable in DOM order and
individually Enter/Space/click-activatable via native `<button>`
semantics - correctly announced via `role="radio"`/`aria-checked`, just
without arrow-key cycling. This matches the keyboard sophistication
already present in the rest of the dropdown (`#menu-about`/`#menu-export`
have no arrow-key handling either); adding a new, more advanced keyboard
pattern for only this sub-widget would be inconsistent scope creep for a
"lower priority" roadmap item.

**Menu stays open on selection**, unlike About/Export (which both close
the menu because they navigate away or complete a one-shot action).
Switching themes benefits from an immediate live preview - a user
comparing Light vs Dark shouldn't have to reopen the menu each click.
Escape and click-outside still close the whole menu, theme group
included, via the existing unmodified `closeMenuOnEscape`/
`closeMenuOnClickOutside` handlers (the theme buttons are inside
`#menu-dropdown`, which those handlers already check `.contains()`
against).

**Storage and override mechanism:** a new `stormoji-theme` localStorage
key holds a plain string - `"light"`, `"dark"`, or `"system"` (or absent,
equivalent to `"system"`). Applying it is a single `data-theme` attribute
on `<html>`:

- `"light"`/`"dark"` &rarr; `document.documentElement.setAttribute('data-theme', value)`.
- `"system"`/absent &rarr; the attribute is removed entirely, so the
  plain `@media (prefers-color-scheme: dark)` block (already in place)
  governs - including live OS-theme-change updates, for free, since CSS
  media queries re-evaluate automatically. No JS `matchMedia` listener is
  needed for the "system" case.

New CSS rules add the explicit-override layer:

```css
:root[data-theme="dark"] { /* same 9 properties/values as the
                               @media (prefers-color-scheme: dark) block */ }
:root[data-theme="light"] { /* the original light values, explicitly */ }
```

`:root[data-theme="dark"]` (specificity `0,0,2,0` - one pseudo-class, one
attribute) beats a plain `:root` inside `@media (prefers-color-scheme:
dark)` (specificity `0,0,1,0`) regardless of source order or which way
the OS preference is actually set, because higher specificity always
wins over lower specificity. So an explicit "Light" choice correctly
forces light values even when the OS is in dark mode, and vice versa.
The cost is duplicating the 9 dark-value pairs between the `@media` block
and `:root[data-theme="dark"]` - unavoidable without a preprocessor
(this project has no build step), but small and low-drift-risk since both
blocks live a few lines apart in `styles.css`.

**Avoiding flash-of-wrong-theme (FOUC):** the theme-resolution function
runs at module scope in `app.js` - immediately when the script executes
(end of `<body>`, synchronous, not deferred) - rather than inside
`window.onload`, which additionally waits for the page's `load` event.
This isn't a full fix (a dedicated inline `<script>` in `<head>`, run
before the stylesheet, would be earlier still), but adding a new script
tag/file would break from this project's established two-file structure
(`emoji-data.js`, `app.js`, both loaded at the end of `<body>`) for a
"lower priority" feature. In the common case - no stored preference, or a
stored preference that matches the OS setting - there's no flash at all,
since the CSS `@media` block already renders correctly with zero JS
involvement. The only edge case with a brief flash is an explicit choice
that *disagrees* with the OS setting (e.g. OS is light, user chose Dark);
that's judged an acceptable tradeoff here.

**Accessibility scoping note:** `docs/roadmap.md`'s "Accessibility"
section claims `role="menu"`/`role="menuitem"`/`aria-haspopup` already
exist on `#menu-dropdown`/`.menu-item` - they don't, in the code as it
stands today (verified by reading `index.html`/`app.js` directly). That's
a pre-existing doc/code mismatch, unrelated to dark mode; this plan
doesn't attempt to fix it, since retrofitting the dropdown to a full
`role="menu"` pattern is a separate, larger task.

## Verification

One new pure, unit-tested function: `resolveThemeAttribute(storedValue)`
- given the raw `stormoji-theme` localStorage value, returns `"light"`/
`"dark"` to force, or `null` to mean "no override, let CSS decide."
Tested in `app.test.js` alongside the other pure lookup/decision
functions (`findStoryForDate`, `getDraftForToday`, etc.).

Everything else is verified via the existing scripted-`rodney` pattern
(`scripts/manual_tests/dark_mode.sh`), since DOM/localStorage-driven
behavior has no Node unit-test coverage in this project:

1. Toggle real macOS Appearance to Dark via
   `osascript -e 'tell application "System Events" to tell appearance preferences to set dark mode to true'`
   (headless Chrome on macOS follows the OS-level `prefers-color-scheme`
   setting - there's no rodney/CDP flag to emulate it directly), restoring
   the original setting in a `trap` on exit so the test doesn't leave the
   developer's machine appearance changed.
2. Assert `matchMedia('(prefers-color-scheme: dark)').matches` reflects
   the toggle, confirming Chrome actually picked it up.
3. Assert `getComputedStyle` on a handful of elements
   (`body`, `.share-btn`, `.story-card`) matches the expected literal
   RGB values in both light and dark, catching any typo'd hex or
   variable that fails to cascade.
4. Click each theme radio and assert: `<html data-theme>` is set/removed
   correctly, `aria-checked` moves to the clicked option and only that
   one, `localStorage['stormoji-theme']` is updated, the menu stays open,
   and an explicit choice overrides the OS setting (e.g. choosing "Light"
   while macOS is in Dark still renders light colors).
5. Screenshot all three states to the manual-test scratch convention for
   a human glance-check.
