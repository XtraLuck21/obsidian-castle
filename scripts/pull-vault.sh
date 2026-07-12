#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/paths.sh"

mode="dry-run"
case "${1:-}" in
  ""|--dry-run) ;;
  --apply) mode="apply" ;;
  *) echo "Usage: $0 [--dry-run|--apply]" >&2; exit 2 ;;
esac

[[ -d "$ICLOUD_VAULT" ]] || { echo "iCloud Vault not found: $ICLOUD_VAULT" >&2; exit 1; }
[[ -d "$LOCAL_VAULT" ]] || { echo "Local Vault not found: $LOCAL_VAULT" >&2; exit 1; }

args=(-a --itemize-changes --exclude=.git/ --exclude=CastleX-System/)
[[ "$mode" == "dry-run" ]] && args+=(-n)

echo "Mode: $mode"
echo "Pull: $ICLOUD_VAULT -> $LOCAL_VAULT"
echo "Policy: no deletion; local-only files are preserved."
rsync "${args[@]}" "$ICLOUD_VAULT/" "$LOCAL_VAULT/"

if [[ "$mode" == "dry-run" ]]; then
  echo "Preview only. Run with --apply after reviewing the itemized paths."
else
  echo "Pull complete. Run scripts/verify-system.sh to detect system drift."
fi

