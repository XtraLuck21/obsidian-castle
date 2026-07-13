# CastleX Data Schema v0.4

## Daily tracker

A Daily Note becomes a **Voyage Day / 航行日** when all six required tracker
fields contain a numeric value from 1 to 5:

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

## Voyage streak

- All six tracker values are required for a Voyage Day.
- An incomplete current day does not break the streak before the day ends.
- Missing or partial historical days break a streak.
- Heatmap metrics do not affect the Voyage streak.

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

## Provenance

- Unmarked prose is human-authored by default.
- AI text must use an AI callout or `origin: ai`.
- AI must include generation time, sources, and review status.
- Reviewing AI output does not change its origin.
- Codex must never silently rewrite `Raw Notes`.
