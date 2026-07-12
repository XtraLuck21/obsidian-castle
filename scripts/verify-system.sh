#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/paths.sh"

check_local=yes
check_icloud=no
case "${1:-}" in
  "") ;;
  --source-only) check_local=no ;;
  --with-icloud) check_icloud=yes ;;
  *) echo "Usage: $0 [--source-only|--with-icloud]" >&2; exit 2 ;;
esac

fail() { echo "VERIFY FAILED: $*" >&2; exit 1; }
pass() { echo "✓ $*"; }

plugin="$SYSTEM_ROOT/plugin/castlex-dashboard"
template="$SYSTEM_ROOT/templates/010-Daily-Dashboard.md"
schema="$SYSTEM_ROOT/schemas/CastleX-Data-Schema.md"
manifest="$plugin/manifest.json"

node --check "$plugin/main.js"
pass "plugin JavaScript syntax"

jq -e '.id == "castlex-dashboard" and (.version | type == "string") and (.name | type == "string") and (.minAppVersion | type == "string")' "$manifest" >/dev/null
node -e 'const m=require(process.argv[1]); const p=m.version.split(".").map(Number); if (p[0] < 1 && (p[1] || 0) < 7) process.exit(1)' "$manifest" || fail "plugin version must be at least 0.7.0"
pass "manifest fields and version"

fields=(sleep_quality physical_state stress energy agency appetite_stability project_minutes admin_minutes workout_minutes personal_enrichment_minutes project_minutes_origin admin_minutes_origin workout_minutes_origin personal_enrichment_minutes_origin time_data_reviewed)
for field in "${fields[@]}"; do
  rg -q "^${field}:" "$template" || fail "Daily template missing $field"
  rg -q "\`${field}\`|${field}:" "$schema" || fail "Schema missing $field"
done
pass "Daily template and Schema core fields"

rg -q '^```castlex-time-rings$' "$template" || fail "Daily template missing time-ring block"
if rg -q '^### (Project Contributions|Life & Admin)$' "$template"; then
  fail "Completed Today must remain a flat bullet list"
fi
for deprecated in project_contribution admin_load activity_origin activity_reviewed; do
  if rg -q "^${deprecated}:" "$template"; then
    fail "Daily template still contains deprecated field: $deprecated"
  fi
done
pass "time-ring block and flat Completed Today structure"

for script in "$SYSTEM_ROOT"/scripts/*.sh; do bash -n "$script"; done
pass "shell script syntax"

obsolete_root="${HOME}/Documents/Castle"
if rg -n --hidden "/Users/[^/]+/|${obsolete_root}" "$SYSTEM_ROOT" \
  --glob '!scripts/verify-system.sh' \
  --glob '!plugin/castlex-dashboard/main.js.map'; then
  fail "user-specific or obsolete absolute path found"
fi
pass "no user-specific or obsolete development path"

banned=(01_Inbox 10_Journal 20_Areas 30_Projects 40_Library 99_Archive AI-Ledger 90_System/AI-Ledger CastleX)
for rel in "${banned[@]}"; do
  [[ ! -e "$SYSTEM_ROOT/$rel" ]] || fail "private path present: $rel"
done
if find "$SYSTEM_ROOT" -type d \( -name AI-Ledger -o -name 10_Journal -o -name 30_Projects \) -print -quit | grep -q .; then
  fail "nested private Vault directory found"
fi
pass "private Vault directories absent"

while IFS= read -r asset; do
  [[ -n "$asset" ]] || continue
  [[ "$asset" != */* && "$asset" != .* && -f "$SYSTEM_ROOT/assets/$asset" ]] || fail "unsafe or missing allowlisted asset: $asset"
done < "$SYSTEM_ROOT/assets/allowlist.txt"
pass "asset allowlist"

if git -C "$SYSTEM_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  while IFS= read -r staged; do
    case "$staged" in
      CastleX/*|01_Inbox/*|10_Journal/*|20_Areas/*|30_Projects/*|40_Library/*|99_Archive/*|AI-Ledger/*|90_System/AI-Ledger/*|*/01_Inbox/*|*/10_Journal/*|*/20_Areas/*|*/30_Projects/*|*/40_Library/*|*/99_Archive/*|*/AI-Ledger/*|*.icloud|*.DS_Store)
        fail "private or device file staged: $staged"
        ;;
    esac
  done < <(git -C "$SYSTEM_ROOT" diff --cached --name-only)
  pass "Git staged-path privacy check"
fi

compare_target() {
  local target="$1"
  diff -qr "$plugin" "$target/.obsidian/plugins/castlex-dashboard" >/dev/null || fail "plugin differs at $target"
  diff -qr "$SYSTEM_ROOT/templates" "$target/90_System/Templates" >/dev/null || fail "templates differ at $target"
  diff -qr "$SYSTEM_ROOT/schemas" "$target/90_System/Schemas" >/dev/null || fail "schemas differ at $target"
  while IFS= read -r asset; do
    [[ -n "$asset" ]] || continue
    cmp -s "$SYSTEM_ROOT/assets/$asset" "$target/90_System/Assets/$asset" || fail "asset differs at $target: $asset"
  done < "$SYSTEM_ROOT/assets/allowlist.txt"
}

if [[ "$check_local" == yes ]]; then
  compare_target "$LOCAL_VAULT"
  pass "source equals local CastleX system files"
fi
if [[ "$check_icloud" == yes ]]; then
  compare_target "$ICLOUD_VAULT"
  pass "source equals iCloud CastleX system files"
fi

echo "CastleX-System verification complete."
