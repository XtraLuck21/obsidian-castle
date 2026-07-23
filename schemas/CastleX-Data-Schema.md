# CastleX Data Schema v0.5

## Daily tracker

A Daily Note has a complete Daily State when all six required tracker fields
contain a numeric value from 1 to 5:

| Field | Meaning | Scale |
| --- | --- | --- |
| `sleep_quality` | 主观睡眠质量 | 1 poor → 5 restorative |
| `physical_state` | 身体舒适与可用状态 | 1 poor → 5 good |
| `stress` | 压力与紧绷程度 | 1 low → 5 high |
| `energy` | 精神与体力容量 | 1 low → 5 high |
| `agency` | 行动感／启动能力 | 1 low → 5 high |
| `appetite_stability` | 食欲与进食节律稳定程度 | 1 unstable → 5 stable |

Radar charts convert `stress` to `calmness = 6 - stress`, so every Radar axis
uses the same “larger is better” direction.

When the six fields first become complete, CastleX writes one source timestamp:

```yaml
state_recorded_at: 2026-07-13T21:30:00-07:00
```

The timestamp is preserved when a completed state is corrected later. Entry
timing is derived from the Daily Note `date` and `state_recorded_at`; no separate
status property is stored.

## Voyage streak

- All six tracker values are required for a Voyage Day.
- Same-day entries completed on the Daily Note date are Voyage Days.
- A **Late entry** completed during the following local calendar day is also a
  Voyage Day and counts toward the streak.
- An entry completed from the second following day onward is Retrospective: its
  values remain available to Radar and trend charts, but the date is a
  **休整日**, is not illuminated in Calendar or the 14-day route, and does not
  count toward current or longest streaks.
- Complete legacy notes without `state_recorded_at` remain Voyage Days. CastleX
  does not fabricate historical timestamps.
- An incomplete current day does not break the streak before the day ends.
- Missing or partial historical days break a streak.
- Heatmap metrics do not affect the Voyage streak.

The `castlex-status` block is interactive in every Daily Note. Opening an older
note allows Late or Retrospective entry while displaying the resulting timing
classification before and after completion.

## Daily sections

Daily Notes contain, in order:

1. Six-dimension `Daily State`
2. Editable `Time Allocation`
3. `Today’s Wins` as encouraging bullet points about effective habits, choices,
   and responses
4. `Completed Today` as factual bullet points for verified tasks and outcomes
5. `Open Loops` for started, committed, awaiting, or unresolved follow-ups
6. `Backlog` for explicitly deferred work that has not started
7. `Raw Notes` at the end

Daily Notes do not contain task checkboxes or a Timeline. Project tasks exist
only in Project notes. All four synthesis sections use flat bullet lists.
`Today’s Wins` must not repeat the accomplishment list: it recognizes how the
day was handled, while `Completed Today` records what was finished. AI must not
invent an Open Loop or Backlog item when the source provides no evidence.
`Today’s Wins` contains three to five highest-priority observations. Overlapping
observations are consolidated rather than expanded into an exhaustive list. Cross-day
patterns are not repeated in Daily Notes; Weekly Review decides whether the
accumulated evidence supports a pattern.

Daily Notes do not contain an `AI Summary` or `Decisions & Insights` section.
Cross-day AI synthesis belongs in the Weekly Review under `AI Weekly Summary`,
where the source set is broad enough to identify patterns without rewriting a
single day’s Raw Notes.

## Time allocation

Daily Notes store source time values in whole minutes:

```yaml
project_minutes: 120
admin_minutes: 40
workout_minutes: 50
personal_enrichment_minutes: 60

project_minutes_origin: ai
admin_minutes_origin: ai
workout_minutes_origin: ai
personal_enrichment_minutes_origin: ai
time_data_reviewed: false
```

- Empty means the category has not been recorded.
- `0` means the day was reviewed and no time was spent in that category.
- Values must be non-negative whole minutes. The Dashboard derives display
  levels and never writes a subjective score.
- `*_origin: human` means the current value was entered or corrected manually.
- `*_origin: ai` means Codex transcribed and categorized the duration from the
  user's source record.
- `time_data_reviewed: false` means one or more AI-filled values still await
  human confirmation. Review status does not change their origin.
- The interactive Time Allocation card displays AI values as
  `AI · Unreviewed` until the human selects `Verify AI time`. Verification
  changes only `time_data_reviewed` to `true`; the provenance remains `ai` and
  the badge becomes `AI · Verified`. `Reopen review` reverses only the review
  flag.
- Original human text remains the source of truth.

### Category boundaries

- `Project`: time that directly advances a defined Project, Milestone, or
  observable work/study output.
- `Admin`: email, appointments, errands, household maintenance, purchasing,
  organizing, and similar life/work upkeep.
- `Workout`: deliberately recorded exercise, training, or physical activity.
- `Personal Enrichment`: reading, learning, art, media, reflection, or hobbies
  that do not directly advance a defined Project.

Assign a time block to one primary category unless the source explicitly splits
it. Project-directed learning belongs to `Project`, not both Project and
Personal Enrichment.

### Four Heatmap levels

For Project and Personal Enrichment:

- Level 1: `1–60` minutes
- Level 2: `61–120` minutes
- Level 3: `121–180` minutes
- Level 4: more than `180` minutes

For Admin and Workout:

- Level 1: `1–30` minutes
- Level 2: `31–60` minutes
- Level 3: `61–90` minutes
- Level 4: more than `90` minutes

Codex may only sum durations that are explicit in the source. It must not invent
minutes from vague phrases. A mentioned activity without a usable duration stays
empty and is called out for human clarification. A complete review may write
`0` when the source confirms that no activity of that category occurred.

### Deprecated score fields

`project_contribution`, `admin_load`, `activity_origin`, and
`activity_reviewed` belong to the pre-0.7 scoring model. New templates and the
Dashboard do not read them. Existing values remain historical data and must
never be converted into minutes.

## Project organization

All Project notes live under `30_Projects/`. Status is controlled only by YAML:

```yaml
type: project
status: active
focus: true
area: Learning
priority: 1
progress_sections:
  Execution: 90
  Retrospective: 10
started:
target:
```

Allowed status values:

- `active`
- `on-hold`
- `completed`
- `someday`
- `cancelled`

Dashboard Active Projects includes every Project with `status: active`, whether
focused or not. `priority` controls Project order; lower numbers appear first.
Upcoming Tasks reads only active Projects with `focus: true`, groups tasks by
Project, lets the user select the source Project, and displays only the first
three unchecked Markdown checkboxes from the first unfinished section declared
in `progress_sections`. A `+n` indicator shows how many unchecked items remain
hidden. Dashboard completion appends `✅ YYYY-MM-DD`, matching checkbox
completion inside the Project note. Changing Project status never requires
moving the file.

## Project progress

`progress_sections` maps level-two Markdown headings to fixed percentage
weights. Weights should total 100. Within each configured section, all
checkboxes share that section's weight equally:

```text
progress = Σ (checked items in section / all items in section × section weight)
```

Adding a checkpoint expands scope and automatically recalculates only that
section's denominator; section weights do not change. A configured section with
no checkboxes contributes zero progress. This model supports numeric work,
qualitative deliverables, and retrospectives without Project-specific fields or
double counting.

## Weekly Review

Weekly Review files live under `10_Journal/Weekly/` and declare their source
period explicitly. Standard review periods run from Sunday through Saturday so
adjacent Weekly Reviews remain continuous and non-overlapping:

```yaml
type: weekly-review
period_start: 2026-07-12
period_end: 2026-07-18
origin: mixed
```

The `castlex-weekly-snapshot` block reads the canonical Daily Notes inside that
inclusive period. It renders one aligned state chart for Sleep, Energy, and
Agency plus one stacked daily chart for the four Time Allocation categories.
The snapshot is computed from Daily YAML and never writes derived totals back
to the Weekly file. It is read-only derived information and does not require a
separate review status. When a human changes a Daily value after AI assistance,
the current Daily YAML value and its human origin take precedence in every
subsequent Weekly Snapshot. Human additions belong in `My Reflection` or
`Next Week · My Decision`; they do not silently become AI text.

Weekly AI output is intentionally brief:

- `AI Weekly Summary`: at most three highest-priority evidence-backed bullets.
- `AI Week-over-Week Comparison`: at most two bullets; no comparison without a
  reliable earlier Weekly Review.
- `AI Navigation Advice`: at most two suggestions, clearly labeled as advice.

## Provenance

- Unmarked prose is human-authored by default.
- AI text must use an AI callout or `origin: ai`.
- AI must include generation time and sources. Workflows that support a review
  state must also show that status.
- Reviewing AI output does not change its origin.
- Codex must never silently rewrite `Raw Notes`.
- Raw Notes remain in chronological insertion order from earliest to latest.
  Later additions and corrections are appended after existing content; they are
  never prepended or used to reorder earlier entries.
