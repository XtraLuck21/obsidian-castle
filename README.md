# CastleX System

CastleX System is the version-controlled system layer for the CastleX Obsidian
Vault. It contains the Dashboard plugin, generic templates, the data contract,
approved UI assets, fictional examples, and conservative deployment tools. It
must never contain the user's Vault content.

## Architecture and privacy boundary

```text
GitHub (optional private remote)
        ↕
CastleX-System  — system source of truth and the only Git repository
        ↓ deploy-system.sh
CastleX         — complete local development/test Vault, never pushed
        ↓ explicit system or content sync
iCloud CastleX  — formal Vault opened by Obsidian
```

`CastleX-System` and its sibling `CastleX` have different responsibilities:

- Edit system code only in `CastleX-System`.
- Deploy system changes into the local Vault, verify them, and only then deploy
  the approved system paths to iCloud.
- Pull the formal Vault before any work involving user content.
- Process private content only in the local `CastleX` mirror and sync only the
  explicitly named files back to iCloud.
- Never initialize Git in the parent directory or in the complete Vault.

The default formal Vault path is:

```text
$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/CastleX
```

It can be overridden with `CASTLEX_ICLOUD_VAULT`. The local mirror defaults to
the sibling `CastleX` directory and can be overridden with
`CASTLEX_LOCAL_VAULT`. All path definitions are centralized in
`scripts/paths.sh`.

## Repository layout

```text
plugin/castlex-dashboard/  Dashboard plugin source
templates/                 generic Daily, Weekly, and Project templates
schemas/                   CastleX data contract
assets/                    approved UI assets plus an explicit allowlist
examples/                  deliberately fictional notes for testing
scripts/                   pull, verify, deploy, and targeted content sync
```

## Standard workflow

Start by previewing and then pulling the latest formal Vault. Pulling never
deletes local-only files:

```bash
scripts/pull-vault.sh
scripts/pull-vault.sh --apply
```

Edit only the files in `CastleX-System`, then verify and preview deployment:

```bash
scripts/verify-system.sh --source-only
scripts/deploy-system.sh --dry-run
```

Deploy and verify the local test mirror:

```bash
scripts/deploy-system.sh --apply-local
```

After testing in Obsidian, deploy only the approved system paths to both local
and iCloud Vaults. The confirmation token is intentionally explicit:

```bash
scripts/deploy-system.sh --apply-icloud --confirm-icloud SYSTEM-ONLY
```

This command never touches Daily Notes, Projects, Areas, or other user content.
After plugin deployment, use Obsidian's command palette and run **Reload app
without saving**.

## Targeted private-content sync

`sync-content.sh` refuses to run without one or more Vault-relative file paths.
It previews by default and does not print private file contents:

```bash
scripts/sync-content.sh "10_Journal/Daily/2099/01/2099-01-01.md"
scripts/sync-content.sh --apply "10_Journal/Daily/2099/01/2099-01-01.md"
```

Never pass a directory or an entire Vault. The script rejects absolute paths,
path traversal, symlinks, and system-code paths.

## Files that must never enter Git

- Inbox, Journal, Areas, real Projects, Library, and Archive content
- AI-Ledger and real Daily, Weekly, Monthly, or Quarterly reviews
- private attachments, screenshots, photographs, exports, or raw notes
- `.obsidian/workspace*.json`, caches, and plugin `data.json`
- the complete sibling `CastleX` Vault
- files containing names, health information, work information, or private paths

The `.gitignore` is a second line of defense, not permission to copy private
data into this directory. Run `scripts/verify-system.sh --source-only` and
inspect `git status`, `git ls-files`, and `git diff --cached` before every push.

## AI provenance and review

Human text remains the source of truth. Codex must never silently rewrite
`Raw Notes`. AI-generated prose uses an explicit AI callout or `origin: ai`.
For Activity Heatmap values, `activity_origin: ai` identifies the derived
source, while `activity_reviewed: false` means the result still awaits human
review. Review status never changes authorship.

## Restore a stable system version

First pull the latest private Vault so content is safe. Then inspect or restore
a system tag inside this repository:

```bash
git tag --list
git show castlex-system-v0.6.0
git restore --source castlex-system-v0.6.0 -- plugin templates schemas assets scripts README.md .gitignore
scripts/verify-system.sh --source-only
scripts/deploy-system.sh --dry-run
scripts/deploy-system.sh --apply-local
```

Only deploy to iCloud after testing the restored system locally. Restoring a
system tag does not and must not modify private Vault content.

## GitHub

No remote is configured automatically. If a private GitHub repository is added
later, audit the complete tracked-file list first and push only from this
repository. The complete `CastleX` Vault must remain outside Git history.

