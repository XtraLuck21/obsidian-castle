# CastleX for Obsidian

CastleX is a privacy-first Obsidian setup for daily tracking, project progress,
AI-assisted reviews, and long-term personal knowledge management.

> 中文简介：CastleX 是一个将 Daily Notes、Project Tasks、状态追踪和
> AI 总结分离管理的 Obsidian 系统。这个公开仓库只包含系统代码与虚构示例，
> 不包含作者的真实 Vault 或私人笔记。

![Blue-hour rain-glass beach visual direction](assets/rain-glass-sunset-beach-v2.webp)

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

- Full-screen blue-hour rain-glass Dashboard with separate 3072×2048 desktop and 1440×2560 mobile backgrounds
- Separate Chinese-first Health Dashboard linked from CastleX Home, with its own empty outdoor-pool desktop/mobile backgrounds
- Separate warm, cabin-inspired Mental Dashboard for one evening reflection and voyage closure
- Home, Health, and Mental share one Hero structure: left-aligned date/time/signature content and three vertically stacked navigation buttons; Health and Mental use matching compact typography
- The Home 14-day route anchors its line and voyage nodes to the card's vertical center while weekday labels sit independently below
- Health stages remain directly accessible in 夜间, 早晨, 傍晚, 晚间 order; 00:00–08:59, 09:00–13:59, 14:00–20:59, and 21:00–23:59 recommend those stages without locking them
- Health records always belong to the current natural-date Daily; stage tabs reset at midnight instead of holding a prior-date Night entry
- Health stages become recorded when all core answers are present or the explicit completion action is used; optional notes never block completion
- Health Evening records whole-day appetite stability and Overall Energy; Morning and Sleep retain their own start/end rituals
- Morning and Afternoon body-region choices include the chest; chest soreness participates in Upper-body recommendation safeguards
- Deterministic live workout recommendations, manual override, rotation tracking, and set-level Workout Mode with a progress bar
- Viewport-sized sticky background layer prevents long mobile dashboards from upscaling one image across the full scroll height
- Persistent mobile ship-wheel button returns directly to CastleX Home from notes and other views
- Dashboard Check-in writes are serialized so rapid multi-field entry cannot overwrite earlier ratings
- Daily State and Time Allocation render from the current Markdown file instead of relying on potentially stale cross-device metadata cache
- Desktop remains the automatic Daily creator; mobile waits for the canonical iCloud file and requires explicit confirmation before creating a missing Daily
- Same-device Daily creation is locked and Dashboard date queries prefer the canonical `YYYY-MM-DD.md` path over iCloud conflict copies
- When a canonical Daily exists, device-local same-date conflict copies are moved into `99_Archive/Sync-Conflicts/<date>/` without deletion or automatic value merging
- Desktop cards use a light background blur for contrast; mobile cards stay blur-free for sharp rendering
- Health and Mental title content stays left-aligned on mobile while remaining vertically centered within its copy area
- System-following appearance: the existing deep-navy Dark mode and an airy coastal-blue Light mode cover app chrome, all three Dashboards, embedded note components, and the desktop Project tracker
- Theme-independent Paper mode exports notes with a white page, dark text, print-safe cards and charts, no scenic backgrounds, and page-break protection for major components
- Six-dimension start-of-voyage Navigation check-in stored in YAML
- Full-card animated `开始航行` ritual beside the voyage streak, with a preserved Daily start timestamp
- Editable Navigation gauges with Late entry and Retrospective provenance
- Cross-model 14-day Overall Energy/Sleep trend chart
- Responsive time-driven Heatmap with Project/Admin/Workout/Enrichment views
- Four editable Apple Fitness-inspired time rings in each Daily Note
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

Navigation v1 Daily Notes store one voyage ritual timestamp and six start-of-day
working conditions:

```yaml
daily_checkin_model: navigation-v1
voyage_started_at: 2099-01-01T09:20:00-08:00
voyage_ended_at: 2099-01-01T22:40:00-08:00
navigation_direction: 4
navigation_activation: 3
navigation_work_energy: 4
navigation_focus: 3
navigation_calmness: 4
navigation_outlook: 4
navigation_recorded_at: 2099-01-01T09:24:00-08:00
```

The two-row Navigation order is 航向清晰, 启动意愿, 工作能量, 专注程度,
内心平和, and 今日展望. The Home Dashboard keeps Time Allocation in its
dedicated visualizations rather than repeating a Today total in the top KPI row.

A day counts as a Voyage Day when all six fields contain values from `1` to `5`
and are completed either on the note date or during the following local calendar
day. CastleX records the first complete time in `navigation_recorded_at`.
Selecting `开始航行` stores `voyage_started_at`, plays a short launch animation,
and then leaves only `航行中` on CastleX Home; it does not start a timer or
qualify the day on its own. Mental Dashboard's `结束今日航程` stores
`voyage_ended_at`. Daily Navigation derives a boarding-pass-style route from
those two timestamps: departure time, a static sailing arrow, and arrival time.
An arrival on a later natural date carries a superscript `+N`, such as
`14:48 → 00:54⁺¹`, without adding another YAML field. An open voyage is eligible
for automatic evening continuation
for 24 hours only; older unfinished voyages are disclosed but never treated as
still sailing or chosen as a new Mental target. Entries
completed later are shown as **休整日 · Retrospective**: their values remain in
Radar and trend charts but do not illuminate Calendar or count toward streaks.
Complete legacy notes through 2026-07-24 remain Voyage Days and keep their
original `sleep_quality`, `energy`, and other state fields. Navigation can be
edited from either the current Dashboard or the gauges inside the Daily Note.

The 14-day chart keeps the short `Energy` and `Sleep` tabs. Sleep reads legacy
`sleep_quality` through 2026-07-24 and Health Morning `health_morning_sleep`
afterward. Overall Energy reads legacy `energy` through 2026-07-24, uses
`navigation_work_energy` as an explicit fallback on 2026-07-25, and reads
Health Evening `health_evening_overall_energy` from 2026-07-26 onward.

Mental Dashboard writes five independent evening dimensions, three optional
context questions, one closure state, and the voyage-end timestamp into the
Daily Note that owns the open voyage. If reflection occurs after midnight, the
most recent single open voyage within 24 hours remains the target. Multiple
recent open voyages require an explicit date selection. The final action links
directly to Health's `夜间` stage; it does not perform the Health lights-out
ritual. After closure, the header replaces `正在收束` with the voyage date and
places the unframed completion time directly below it in the left copy column.
Until a new voyage starts, reopening Mental keeps the most recently completed
voyage within 24 hours as its read-only context instead of switching to an empty
current-date Daily. A Daily with no `voyage_started_at` shows no voyage-status
line.
Its date-and-time header, responsive rainy-coast lighthouse background,
typeface, and glass cards use a dedicated warm dusk-brown and honey-gold palette.
Five compact desktop columns each contain one contiguous five-petal star: the
petals are directly selectable, accumulate to the chosen level, and merge into
one solid star at level five without a center dot. The selected state word stays
below the star. The Daily Mental Log repeats that state word and adds its
display-direction score in smaller type, for example `平静 3/5`, while
the stored `mental_evening_load` and
`mental_evening_thought_occupancy` directions remain backward-compatible.
`今日风向` keeps the same structured context fields but presents them as three
full-width choice rows. Closure uses three static icons—two sheets, a sheet
entering an envelope, and a conventional airplane—and Mental choices update
in place without replaying an animation or rebuilding the full background.

The note keeps `Raw Notes` at the end so AI processing never needs to replace
the original human writing. Raw Notes preserve chronological insertion order:
later additions and corrections are appended after existing entries rather
than prepended or reordered.

Daily Notes also include a `Time Allocation` card. Its four rings can be edited
manually in 15-minute steps or filled by an AI-assisted review. After Raw Notes
are provided, Daily Notes dated 2026-08-01 or later receive a nested-bullet
`Time & Task Log`. Codex preserves explicit clock windows, attributable engaged
durations, Project links or non-Project categories, Activity Modes, activities,
and a single Source bullet. For example:

```markdown
- 14:00–16:00 · Engaged: 2h
  - Activity: Read a section
  - Activity Mode: Execution
  - Project: [[30_Projects/Example-Project|Example Project]]
  - Source: human

- 14:00–17:00 · Engaged: 1h
  - Activity: Commute to campus
  - Admin
  - Source: human
```

Each top-level bullet is one time block in the form `HH:MM–HH:MM · Engaged:
duration`. Project rows backed by a `30_Projects/` note use a full Wikilink
with an optional short alias. Under each block, `Activity` and `Source` are
always present; Project rows also include `Activity Mode` and `Project`.
Rows without a corresponding Project note use a plain task or Domain title and
default to non-core. Their Activity Mode is one of `Execution`, `Planning`,
`System`, or `Not Classified`. Brainwork, document
writing, planning, system maintenance, and review belong to Project / Domain,
including when that Domain is non-core. `Admin` is reserved for routine
activities such as groceries, commuting, routine email, and customer-service
calls. Non-Project rows use a category such as `Enrichment`, `Admin`, or
`Workout` as a bare nested bullet and omit Activity Mode. Workout and
Counseling are never assigned an Activity Mode. A window crossing
midnight is split at the natural-date boundary. The ledger remains textual
source for later Weekly and Monthly Reviews; it does not add a dashboard
component or `End-of-day Evidence` section. Daily Notes from 2026-07-26 through
2026-07-31 remain frozen legacy input and are only read through marked derived
mapping.

Each new Daily may carry an internal `core_snapshot`: `status: active` is Core
and every other Project status is non-core, frozen at generation time. This is
not a user-facing Project property and does not use `project_role`. A Project
Day means at least 120 minutes of frozen Core Project time across Execution,
Planning, System, and Not Classified. An Execution Day means at least 120
minutes of actual doing: every Project row marked Execution plus all Admin and
Workout time; Enrichment, Planning, System, and Not Classified do not count.
New Weekly Reviews show both counts out of the seven-day period. Future Monthly
Reviews show both counts out of the month's 28, 29, 30, or 31 natural dates and
do not report a longest streak. Main Dashboard does not show these metrics.

AI may also populate four non-overlapping flat bullet lists: `Today’s Wins`
recognizes effective habits and choices, `Completed Today` records factual
finished work, `Open Loops` tracks unresolved follow-ups, and `Backlog` records
explicitly deferred work. Daily Notes do not contain an AI Summary; cross-day
synthesis belongs in the Weekly Review. `Today’s Wins` is limited to the three
to five most important observations. `Completed Today` uses the shortest useful
task or outcome wording and never repeats timestamps, clock ranges, dates, or
durations from `Time & Task Log`.

Daily Notes dated 2026-08-03 or later do not embed HTML instruction comments or
example ledgers. Canonical instructions live in the Schema, keeping each Daily
limited to its actual data and content. Earlier Daily Notes are not rewritten.

Codex-generated Daily content uses plain Markdown text by default, including
bullet titles, prefixes, labels, callout metadata, explanatory text, and
Codex-appended Raw Notes. Codex does not add bold unless the user explicitly
requests it or the user's own source writing already contains bold that must be
preserved verbatim. This rule applies prospectively; existing Daily Notes are
not rewritten.

### Projects

Project notes live under `30_Projects/` and use frontmatter to control state:

```yaml
---
type: project
status: incubating
focus: false
area:
priority:
progress_sections:
  Tasks: 100
created: 2099-01-01
started:
target:
origin:
---
```

Project records retain five canonical lifecycle states:

- `active`: current growth capacity and current execution;
- `maintenance`: minimum continuity capacity, visibly separate from growth;
- `incubating`: proposal or exploration with no default capacity;
- `paused`: intentionally suspended with history retained;
- `closed`: ended and retained for history.

New Project notes default to `incubating` and `focus: false`. `created` records
only when the canonical note was established; blank `started`, `target`, and
`priority` mean that no start, target, or portfolio priority has been committed.
A user-authorized Domain Expert may create the one canonical note directly under
`30_Projects/` and draft evidence, outcome, milestones, tasks, timeline, effort,
risks, and assumptions there. No Proposal folder or later copy is required.

Creation is Proposal authorization, not capacity authorization. Expert planning
remains advisory while the Project is Incubating. Manager or the user reviews
and edits that same file, then owns lifecycle, `focus`, priority, committed
dates, capacity, scope, effort, and expectations.

The Template leaves `origin` blank for explicit attribution: a human creator
sets `origin: human`; an AI Expert sets `origin: ai` and records generation time
and evidence sources in `AI Project Brief`; materially mixed authorship may use
`origin: mixed`. An AI workflow must never silently keep a false human origin.
CastleX Home intentionally presents only canonical `active` Projects in the
`Active Projects` card, ordered by priority with weighted progress and note
opening intact. Maintenance, Incubating, Paused, Closed, missing, and legacy
compatibility states remain part of the data model but do not render in that
execution card. When there are no Active Projects, the card shows one concise
empty state.
Upcoming Tasks are limited to `active` Projects with `focus: true`, grouped by
selected Focus Project, and show the first three unchecked checkboxes from the
Project's first unfinished `progress_sections` entry in file order, with `+n`
for remaining hidden tasks. The `focus` property remains an execution-display
choice and is not a lifecycle state. Each section has a fixed share of total
progress; its checkboxes divide that share equally and are recalculated when
scope changes.

Legacy `on-hold`, `someday`, `completed`, and `cancelled` values remain readable
as Paused, Incubating, or Closed compatibility states. Their raw YAML remains
untouched, preserving completion versus cancellation history. CastleX never
backfills private notes automatically.

### Time Allocation Heatmap and AI provenance

The Dashboard reads four source time values in whole minutes:

```yaml
project_minutes: 120
admin_minutes: 40
workout_minutes: 50
enrichment_minutes: 60

project_minutes_origin: ai
admin_minutes_origin: ai
workout_minutes_origin: ai
enrichment_minutes_origin: ai
time_data_reviewed: false
```

Empty means the category has not been recorded. `0` means it was reviewed with
no time in that category. The Dashboard derives four color levels from the
minutes: Project and Enrichment advance one level per hour; Admin and
Workout advance one level per 30 minutes. It never asks AI to score the day.

AI-generated content must remain visibly marked. Per-category `*_origin: ai`
records who filled the current value, while `time_data_reviewed: false` means AI
values still await human review. AI may categorize and total explicit durations
from the source record, but it must not invent minutes from vague descriptions.
Inside a Daily Note, pending values display `AI · Unreviewed` with a prominent
`Verify AI time` action. Verification preserves the AI provenance, changes only
`time_data_reviewed` to `true`, and displays `AI · Verified`; `Reopen review`
returns the values to the pending-review state.

### Weekly Reviews

Weekly Reviews live under `10_Journal/Weekly/`. Standard periods run Sunday
through Saturday and use explicit `period_start` and `period_end` fields. The
`castlex-weekly-snapshot` block reads those Daily Notes and renders a compact
period-specific view: Sleep, Energy, and Activation on one aligned state chart,
and the four Time Allocation categories as one stacked chart per day. The state
chart reads the legacy Daily State fields through 2026-07-24, then switches to
Health morning sleep plus Navigation work energy and activation from 2026-07-25.

The snapshot is read-only derived data and has no review button. It always reads
the current Daily YAML, so a later human correction takes precedence over an
earlier AI-filled value. Human reflection and decisions remain normal prose,
while AI summary, comparison, and advice remain visibly marked callouts.
For weeks beginning 2026-07-26, the cross-domain review also reads each Daily
`Time & Task Log` alongside Completed Today, Open Loops, Raw Notes, and YAML.
The 2026-07-26–2026-07-31 portion is legacy-derived and read-only; from the
2026-08-01 cutover onward, task-level comparison uses the nested ledger's explicit
engaged durations rather than the length of a wider mixed window.

See [`examples/`](examples/) for deliberately fictional Daily, Project, and
Weekly Review notes. Daily and Weekly examples are filled instances of their
canonical Templates: they preserve the same top-level frontmatter keys and
level-two section order so examples cannot become a competing note design.

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

To inspect or restore a tagged system baseline:

```bash
git tag --list
git show castlex-system-v0.7.0
git restore --source castlex-system-v0.7.0 -- \
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
