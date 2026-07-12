#!/usr/bin/env bash

# Shared path configuration. Override either vault through the environment when
# testing on another machine; no user-specific absolute path is committed.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEM_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$SYSTEM_ROOT/.." && pwd)"
LOCAL_VAULT="${CASTLEX_LOCAL_VAULT:-$PROJECT_ROOT/CastleX}"
ICLOUD_VAULT="${CASTLEX_ICLOUD_VAULT:-$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/CastleX}"

