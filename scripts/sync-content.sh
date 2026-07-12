#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/paths.sh"

mode="dry-run"
files=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) mode="dry-run" ;;
    --apply) mode="apply" ;;
    --) shift; files+=("$@"); break ;;
    -*) echo "Unknown option: $1" >&2; exit 2 ;;
    *) files+=("$1") ;;
  esac
  shift
done

[[ ${#files[@]} -gt 0 ]] || {
  echo "Refusing to sync without explicit Vault-relative file paths." >&2
  echo "Usage: $0 [--dry-run|--apply] 10_Journal/Daily/YYYY/MM/YYYY-MM-DD.md [...]" >&2
  exit 2
}

[[ -d "$LOCAL_VAULT" && -d "$ICLOUD_VAULT" ]] || { echo "Vault path missing." >&2; exit 1; }

validate_relative_file() {
  local rel="$1"
  [[ "$rel" != /* && "$rel" != ".." && "$rel" != ../* && "$rel" != */../* && "$rel" != */.. ]] || {
    echo "Unsafe path rejected: $rel" >&2
    exit 2
  }
  case "$rel" in
    00_Home/*|01_Inbox/*|10_Journal/*|20_Areas/*|30_Projects/*|40_Library/*|99_Archive/*|90_System/AI-Ledger/*) ;;
    *) echo "Path is outside approved private-content roots: $rel" >&2; exit 2 ;;
  esac
  [[ -f "$LOCAL_VAULT/$rel" && ! -L "$LOCAL_VAULT/$rel" ]] || {
    echo "Local regular file not found or is a symlink: $rel" >&2
    exit 1
  }
}

for rel in "${files[@]}"; do
  validate_relative_file "$rel"
  source_file="$LOCAL_VAULT/$rel"
  target_file="$ICLOUD_VAULT/$rel"
  echo "--- $rel"
  if [[ -f "$target_file" ]]; then
    if cmp -s "$source_file" "$target_file"; then
      echo "Already identical."
      continue
    fi
    echo "Different content (content is not printed)."
    shasum -a 256 "$source_file" "$target_file"
  else
    echo "New iCloud file."
  fi
  if [[ -d "$(dirname "$target_file")" ]]; then
    rsync -ani "$source_file" "$target_file"
  else
    echo "Would create parent directory: $(dirname "$target_file")"
    echo ">f+++++++++ $rel"
  fi
  if [[ "$mode" == "apply" ]]; then
    mkdir -p "$(dirname "$target_file")"
    rsync -a "$source_file" "$target_file"
    cmp -s "$source_file" "$target_file" || { echo "Post-sync verification failed: $rel" >&2; exit 1; }
    echo "Applied and verified."
  fi
done

if [[ "$mode" == "dry-run" ]]; then
  echo "Preview only. Re-run with --apply after reviewing every path."
fi
