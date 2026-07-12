#!/usr/bin/env bash
# Runs all scripts in scripts/manual_tests/ against a local (or remote)
# Stormoji instance. See docs/manual_tests.md.

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

RESULTS=()

run_script() {
  local label="$1"
  shift
  echo
  echo "==== $label ===="
  set +e
  "$@"
  local status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    RESULTS+=("PASS  $label")
  else
    RESULTS+=("FAIL  $label (exit $status)")
  fi
}

run_script "story_persistence.sh" "$SCRIPT_DIR/story_persistence.sh" --base-url "$BASE_URL"
run_script "accessibility.sh" "$SCRIPT_DIR/accessibility.sh" --base-url "$BASE_URL"
run_script "history_export.sh" "$SCRIPT_DIR/history_export.sh" --base-url "$BASE_URL"
run_script "dark_mode.sh" "$SCRIPT_DIR/dark_mode.sh" --base-url "$BASE_URL"

echo
echo "==== Summary ===="
overall_status=0
for result in "${RESULTS[@]}"; do
  echo "$result"
  case "$result" in
    FAIL*) overall_status=1 ;;
  esac
done

exit "$overall_status"
