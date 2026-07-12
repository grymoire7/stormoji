# Shared helpers for scripts/manual_tests/*.sh.
# Source this file; it is not meant to be executed directly.
# See docs/manual_tests.md.

BASE_URL="http://localhost:8000"

# Parses --base-url URL out of "$@", setting BASE_URL. Any other arguments
# are left (in order) in the REMAINING_ARGS array for the caller to process.
parse_base_url() {
  REMAINING_ARGS=()
  while [ $# -gt 0 ]; do
    case "$1" in
      --base-url)
        BASE_URL="$2"
        shift 2
        ;;
      *)
        REMAINING_ARGS+=("$1")
        shift
        ;;
    esac
  done
}

start_rodney() {
  rodney start >/dev/null
  trap 'rodney stop >/dev/null' EXIT
}

# clear_storage
#
# Clears both stormoji-stories and stormoji-draft from localStorage on the
# currently-open page.
clear_storage() {
  rodney js "(function(){ localStorage.removeItem('stormoji-stories'); localStorage.removeItem('stormoji-draft'); return true; })()" >/dev/null
}

# type_into_story TEXT
#
# Sets #story-input's value directly and dispatches a real 'input' event,
# so the app's debounced-autosave listener fires exactly as it would from
# native typing, with fully deterministic final content (no reliance on
# whether a given automation tool's "type" command appends to or replaces
# existing text). TEXT must not contain ", \, or a newline - it's embedded
# in a JS double-quoted string literal.
type_into_story() {
  local text="$1"
  rodney js "(function(){ var el = document.getElementById('story-input'); el.value = \"$text\"; el.dispatchEvent(new Event('input', { bubbles: true })); return el.value; })()" >/dev/null
}

# trigger_browser_restore SCRATCH_URL
#
# Navigates away to SCRATCH_URL and back via browser history. This
# triggers the browser's own form-control-state restoration on the page
# navigated back to - the same mechanism responsible for the story
# textarea browser-restore bug fixed in this repo (see
# docs/plans/2026-07-12-draft-autosave-design.md). Must be called while
# already on the page you want to test the restore against.
#
# about:blank doesn't work as SCRATCH_URL (CDP refuses direct navigation
# to it) - pass a real same-origin URL instead, e.g. "$BASE_URL/emoji-data.js".
trigger_browser_restore() {
  local scratch_url="$1"
  rodney open "$scratch_url" >/dev/null
  rodney waitload >/dev/null
  rodney back >/dev/null
  rodney waitload >/dev/null
}
