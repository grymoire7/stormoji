#!/usr/bin/env bash
# Scripted regression test for the menu dropdown / About modal keyboard
# accessibility (ARIA roles, Escape, focus management, focus trap) and the
# story textarea character counter. See docs/manual_tests.md for how to
# read the results.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

parse_base_url "$@"

if ! command -v rodney >/dev/null 2>&1; then
  echo "ERROR: rodney is not installed or not on PATH." >&2
  echo "See docs/manual_tests.md > Requirements." >&2
  exit 1
fi

if ! curl -fsS -o /dev/null "$BASE_URL/index.html"; then
  echo "ERROR: $BASE_URL is not reachable." >&2
  echo "Start a local server with: python3 -m http.server 8000" >&2
  exit 1
fi

start_rodney

INDEX_URL="$BASE_URL/index.html"

rodney open "$INDEX_URL" >/dev/null
rodney waitload >/dev/null
clear_storage
rodney reload --hard >/dev/null
rodney waitload >/dev/null

# rodney has no key-press simulation command, so native "Enter/Space
# activates a focused button" isn't tested directly - that's a browser
# platform guarantee for real <button> elements, not app logic. Scenario 1
# checks the elements ARE real buttons (so that platform guarantee
# applies); the rest of the scenarios verify our own JS's reaction via
# mouse clicks (modality-agnostic handlers) and, for Escape/Tab, by
# dispatching synthetic KeyboardEvents at document - our own
# document.addEventListener('keydown', ...) listeners pick those up the
# same as real key presses, since that dispatch is plain JS, not a native
# default action.

# --- Scenario 1: menu items and the modal close control are real, keyboard-operable buttons ---

all_buttons=$(rodney js "(function(){ return ['menu-btn','menu-about','menu-export'].every(function(id){ return document.getElementById(id).tagName === 'BUTTON'; }) && document.querySelector('.close-button').tagName === 'BUTTON'; })()")
if [ "$all_buttons" = "true" ]; then
  echo "PASS: menu items and the modal close control are real <button> elements"
else
  echo "FAIL: expected all four controls to be <button> elements, got $all_buttons" >&2
  exit 1
fi

# --- Scenario 2: clicking the menu button opens the menu and focuses the first item ---

rodney click "#menu-btn" >/dev/null
rodney sleep 0.2 >/dev/null

menu_expanded=$(rodney attr "#menu-btn" aria-expanded)
menu_shown=$(rodney js "document.getElementById('menu-dropdown').classList.contains('show')")
active_id=$(rodney js "document.activeElement.id")
if [ "$menu_expanded" = "true" ] && [ "$menu_shown" = "true" ] && [ "$active_id" = "menu-about" ]; then
  echo "PASS: opening the menu sets aria-expanded and focuses the first item"
else
  echo "FAIL: expected aria-expanded=true, shown=true, focus=menu-about; got aria-expanded=$menu_expanded, shown=$menu_shown, active=$active_id" >&2
  exit 1
fi

# --- Scenario 3: Escape closes the menu and returns focus to the menu button ---

rodney js "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))" >/dev/null
rodney sleep 0.2 >/dev/null

menu_expanded=$(rodney attr "#menu-btn" aria-expanded)
menu_shown=$(rodney js "document.getElementById('menu-dropdown').classList.contains('show')")
active_id=$(rodney js "document.activeElement.id")
if [ "$menu_expanded" = "false" ] && [ "$menu_shown" = "false" ] && [ "$active_id" = "menu-btn" ]; then
  echo "PASS: Escape closes the menu and returns focus to the menu button"
else
  echo "FAIL: expected menu closed and focus on menu-btn; got aria-expanded=$menu_expanded, shown=$menu_shown, active=$active_id" >&2
  exit 1
fi

# --- Scenario 4: clicking "About" opens the modal and focuses the close button ---

rodney click "#menu-btn" >/dev/null
rodney sleep 0.2 >/dev/null
rodney click "#menu-about" >/dev/null
rodney sleep 0.2 >/dev/null

modal_display=$(rodney js "document.getElementById('about-modal').style.display")
active_class=$(rodney js "document.activeElement.className")
if [ "$modal_display" = "flex" ] && [ "$active_class" = "close-button" ]; then
  echo "PASS: opening the modal focuses the close button"
else
  echo "FAIL: expected modal open and focus on .close-button; got display=$modal_display, active_class=$active_class" >&2
  exit 1
fi

# --- Scenario 5: Tab is trapped while the modal is open ---

tab_trapped=$(rodney js "(function(){ var e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }); document.dispatchEvent(e); return e.defaultPrevented; })()")
active_class=$(rodney js "document.activeElement.className")
if [ "$tab_trapped" = "true" ] && [ "$active_class" = "close-button" ]; then
  echo "PASS: Tab is trapped on the close button while the modal is open"
else
  echo "FAIL: expected Tab prevented and focus kept on .close-button; got prevented=$tab_trapped, active_class=$active_class" >&2
  exit 1
fi

# --- Scenario 6: Escape closes the modal and returns focus to the menu button ---
# (menu-about itself sits inside the already-hidden #menu-dropdown by this
# point - closeMenu() hid it before the modal ever opened - so it can't
# receive focus; closeModal() returns focus to menu-btn instead.)

rodney js "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))" >/dev/null
rodney sleep 0.2 >/dev/null

modal_display=$(rodney js "document.getElementById('about-modal').style.display")
active_id=$(rodney js "document.activeElement.id")
if [ "$modal_display" = "none" ] && [ "$active_id" = "menu-btn" ]; then
  echo "PASS: Escape closes the modal and returns focus to the menu button"
else
  echo "FAIL: expected modal closed and focus on menu-btn; got display=$modal_display, active=$active_id" >&2
  exit 1
fi

# --- Scenario 7: a click with the modal overlay itself as the target closes it ---

rodney click "#menu-btn" >/dev/null
rodney sleep 0.2 >/dev/null
rodney click "#menu-about" >/dev/null
rodney sleep 0.2 >/dev/null
# Dispatched directly on #about-modal (rather than clicking at a screen
# coordinate) so event.target is unambiguously the overlay, not the
# centered .modal-content box that visually overlaps the same point -
# matching the app's own `event.target === aboutModal` outside-click check.
rodney js "document.getElementById('about-modal').dispatchEvent(new MouseEvent('click', { bubbles: true }))" >/dev/null
rodney sleep 0.2 >/dev/null

modal_display=$(rodney js "document.getElementById('about-modal').style.display")
if [ "$modal_display" = "none" ]; then
  echo "PASS: a click on the modal overlay itself closes it"
else
  echo "FAIL: expected modal closed after overlay click; got display=$modal_display" >&2
  exit 1
fi

# --- Scenario 8: character count updates live while typing ---

clear_storage
rodney reload --hard >/dev/null
rodney waitload >/dev/null

type_into_story "Four score"
rodney sleep 0.2 >/dev/null

count_text=$(rodney text "#story-char-count")
if [ "$count_text" = "10 characters" ]; then
  echo "PASS: character count reflects typed text (10 characters)"
else
  echo "FAIL: expected '10 characters', got '$count_text'" >&2
  exit 1
fi

# --- Scenario 9: character count is correct after reload restores the draft ---

rodney sleep 1 >/dev/null
rodney reload --hard >/dev/null
rodney waitload >/dev/null

count_text=$(rodney text "#story-char-count")
if [ "$count_text" = "10 characters" ]; then
  echo "PASS: character count is correctly restored after reload"
else
  echo "FAIL: expected '10 characters' after reload, got '$count_text'" >&2
  exit 1
fi

# --- Cleanup ---

clear_storage
