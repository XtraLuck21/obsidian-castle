#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/paths.sh"

mode="dry-run"
confirmation=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) mode="dry-run" ;;
    --apply-local) mode="local" ;;
    --apply-icloud) mode="icloud" ;;
    --confirm-icloud)
      shift
      confirmation="${1:-}"
      ;;
    *)
      echo "Usage: $0 [--dry-run|--apply-local|--apply-icloud --confirm-icloud SYSTEM-ONLY]" >&2
      exit 2
      ;;
  esac
  shift
done

if [[ "$mode" == "icloud" && "$confirmation" != "SYSTEM-ONLY" ]]; then
  echo "iCloud deployment requires: --confirm-icloud SYSTEM-ONLY" >&2
  exit 2
fi

"$SCRIPT_DIR/verify-system.sh" --source-only

sync_tree() {
  local source="$1"
  local target="$2"
  local apply="$3"
  local args=(-a --delete --itemize-changes)
  [[ "$apply" != "yes" ]] && args+=(-n)
  rsync "${args[@]}" "$source/" "$target/"
}

sync_assets() {
  local target="$1"
  local apply="$2"
  local args=(-a --itemize-changes --files-from="$SYSTEM_ROOT/assets/allowlist.txt")
  [[ "$apply" != "yes" ]] && args+=(-n)
  rsync "${args[@]}" "$SYSTEM_ROOT/assets/" "$target/90_System/Assets/"
}

deploy_to() {
  local target="$1"
  local apply="$2"
  [[ -d "$target" ]] || { echo "Vault not found: $target" >&2; exit 1; }
  echo "System deployment to: $target (apply=$apply)"
  sync_tree "$SYSTEM_ROOT/plugin/castlex-dashboard" "$target/.obsidian/plugins/castlex-dashboard" "$apply"
  sync_tree "$SYSTEM_ROOT/templates" "$target/90_System/Templates" "$apply"
  sync_tree "$SYSTEM_ROOT/schemas" "$target/90_System/Schemas" "$apply"
  sync_assets "$target" "$apply"
}

case "$mode" in
  dry-run)
    deploy_to "$LOCAL_VAULT" no
    deploy_to "$ICLOUD_VAULT" no
    echo "Preview only; no files changed."
    ;;
  local)
    deploy_to "$LOCAL_VAULT" yes
    "$SCRIPT_DIR/verify-system.sh"
    ;;
  icloud)
    deploy_to "$LOCAL_VAULT" yes
    "$SCRIPT_DIR/verify-system.sh"
    deploy_to "$ICLOUD_VAULT" yes
    "$SCRIPT_DIR/verify-system.sh" --with-icloud
    ;;
esac

