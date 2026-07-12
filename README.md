# CastleX for Obsidian

CastleX is a privacy-first Obsidian setup for daily tracking, project progress,
AI-assisted reviews, and long-term personal knowledge management.

> 中文简介：CastleX 是一个将 Daily Notes、Project Tasks、状态追踪和
> AI 总结分离管理的 Obsidian 系统。这个公开仓库只包含系统代码与虚构示例，
> 不包含作者的真实 Vault 或私人笔记。

![Night-voyage visual direction](assets/night-voyage-modern.png)

## What this repository is

This repository is a **deployable system kit**, not a personal Vault export. It
contains:

- the `castlex-dashboard` Obsidian plugin;
- generic Daily, Weekly Review, and Project templates;
- the CastleX data schema;
- approved UI assets;
- fictional example notes;
- conservative scripts for verification and deployment.

Your notes stay in your own Vault. Journal entries, real Projects, attachments,
AI summaries, workspace state, and health or work information should never be
committed to this repository.

## Dashboard features

- Full-screen night-voyage Dashboard with glass panels
- Six-dimension Daily check-in stored in YAML
- Read-only Daily status gauges and radar chart
- 14-day Energy/Sleep trend chart
- Responsive Activity Heatmap with Project/Admin views and `0–5` intensity
- Calendar navigation that opens or creates Daily Notes
- Active Project progress and Project Task overview
- Voyage-day streak calculation based on complete Daily check-ins
- Explicit separation between human writing and AI-generated summaries

## Requirements

- Obsidian `1.8.0` or newer
- Git
- Bash, `rsync`, Node.js, `jq`, and `rg` for the included scripts

The plugin itself runs inside Obsidian and does not require Node.js at runtime.

## Recommended folder layout

Keep the public system repository separate from the Vault that contains your
notes:

```text
Castle Workspace/
├── CastleX-System/   # this Git repository
└── CastleX/          # your private Obsidian Vault; never commit this folder
```

`CastleX-System` is the source of truth for system code. Make system changes
here, deploy them into `CastleX`, and keep all personal content inside the Vault.

## Quick start

### 1. Clone the system repository

```bash
git clone https://github.com/XtraLuck21/obsidian-castle.git CastleX-System
cd CastleX-System
```

### 2. Create or choose an Obsidian Vault

Create a Vault in Obsidian, or use an existing one. Keep it outside this Git
repository. Set its absolute path for the deployment tools:

```bash
export CASTLEX_LOCAL_VAULT="/absolute/path/to/your/CastleX"
```

For a fresh Vault, create the system target directories once:

```bash
mkdir -p \
  "$CASTLEX_LOCAL_VAULT/.obsidian/plugins/castlex-dashboard" \
  "$CASTLEX_LOCAL_VAULT/90_System/Templates" \
  "$CASTLEX_LOCAL_VAULT/90_System/Schemas" \
  "$CASTLEX_LOCAL_VAULT/90_System/Assets"
```

### 3. Verify and install the system layer

```bash
./scripts/verify-system.sh --source-only
./scripts/deploy-system.sh --apply-local
```

This deploys only the Dashboard plugin, templates, Schema, and allowlisted UI
assets. It does not create, read, or overwrite Journal or Project content.

### 4. Enable the plugin in Obsidian

1. Open the target Vault in Obsidian.
2. Go to **Settings → Community plugins**.
3. Enable community plugins if needed.
4. Enable **CastleX Dashboard**.
5. Reload Obsidian.

Open the Dashboard from the ship-wheel ribbon icon or run **Open CastleX Home**
from the command palette.

## Using CastleX

### Daily Notes

The Dashboard calendar creates Daily Notes at:

```text
10_Journal/Daily/YYYY/MM/YYYY-MM-DD.md
```

Each Daily Note stores six check-in values:

```yaml
sleep_quality: 4
physical_state: 3
stress: 2
energy: 4
agency: 3
appetite_stability: 4
```

A day counts as a Voyage Day when all six fields contain values from `1` to
`5`. The note keeps `Raw Notes` at the end so AI processing never needs to
replace the original human writing.

### Projects

Project notes live under `30_Projects/` and use frontmatter to control state:

```yaml
---
type: project
status: active
area: Example Area
progress: 35
started: 2099-01-01
target: 2099-03-31
---
```

Supported status values are `active`, `on-hold`, `completed`, `someday`, and
`cancelled`. The Dashboard only lists tasks from Projects whose status is
`active`.

### Activity Heatmap and AI provenance

The Dashboard reads two independent Daily fields:

```yaml
project_contribution: 0
admin_load: 0
activity_origin: ai
activity_reviewed: false
```

Empty means the day has not been processed. `0` means processed with no activity
of that type, and `1–5` are five increasing intensity levels. The Dashboard
never invents these values; an AI-assisted review or the user must explicitly
write them.

AI-generated content must remain visibly marked. `activity_origin: ai` records
where a derived value came from, while `activity_reviewed: false` means it still
awaits human review. Review status does not change authorship.

See [`examples/`](examples/) for deliberately fictional Daily, Project, and
Weekly Review notes.

## Optional local-mirror and iCloud workflow

On macOS, the scripts support a private local Vault mirror plus an iCloud Vault:

```text
iCloud CastleX → pull → local CastleX mirror
CastleX-System → deploy → local mirror → verified system deploy → iCloud
```

The default iCloud path is:

```text
$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/CastleX
```

Override either location when needed:

```bash
export CASTLEX_LOCAL_VAULT="/path/to/local/CastleX"
export CASTLEX_ICLOUD_VAULT="/path/to/iCloud/CastleX"
```

Pull the latest Vault state before working with notes:

```bash
./scripts/pull-vault.sh --dry-run
./scripts/pull-vault.sh --apply
```

Preview and deploy system files:

```bash
./scripts/deploy-system.sh --dry-run
./scripts/deploy-system.sh --apply-local
./scripts/deploy-system.sh --apply-icloud --confirm-icloud SYSTEM-ONLY
```

The iCloud command deploys only system paths. It does not synchronize the whole
Vault from local to iCloud.

To sync an explicitly reviewed private content file, preview it first:

```bash
./scripts/sync-content.sh "10_Journal/Daily/2099/01/2099-01-01.md"
./scripts/sync-content.sh --apply "10_Journal/Daily/2099/01/2099-01-01.md"
```

`sync-content.sh` refuses to run without file arguments and rejects directories,
absolute paths, traversal, symlinks, and system-code paths.

## Repository structure

```text
plugin/castlex-dashboard/  Dashboard plugin source
templates/                 reusable Vault templates
schemas/                   data contract and AI provenance rules
assets/                    public UI assets and deployment allowlist
examples/                  fictional test notes only
scripts/                   verification and conservative sync tools
```

## Development workflow

1. Pull the latest private Vault if your work depends on content.
2. Edit system files only in `CastleX-System`.
3. Run `./scripts/verify-system.sh --source-only`.
4. Preview with `./scripts/deploy-system.sh --dry-run`.
5. Deploy locally and test in Obsidian.
6. Deploy system files to the formal Vault only after testing.
7. Review `git status`, `git diff --cached`, and `git ls-files` before pushing.

To restore the stable `0.6.0` system baseline:

```bash
git show castlex-system-v0.6.0
git restore --source castlex-system-v0.6.0 -- \
  plugin templates schemas assets scripts README.md .gitignore
./scripts/verify-system.sh --source-only
./scripts/deploy-system.sh --dry-run
```

## Privacy rules

Never commit:

- Inbox, Journal, Areas, real Projects, Library, or Archive content
- AI-Ledger or real Daily/Weekly/Monthly/Quarterly reviews
- private attachments, screenshots, photographs, exports, or raw notes
- `.obsidian/workspace*.json`, caches, or plugin `data.json`
- the complete private Vault
- files containing private names, paths, health data, or work information

The `.gitignore` and `verify-system.sh` provide guardrails, but they do not
replace reviewing the staged file list before every public push.

## Status

CastleX is currently an early public system baseline. Expect the plugin,
templates, and data schema to evolve. Back up your Vault and preview every
deployment before applying changes.

