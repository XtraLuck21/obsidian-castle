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
3. `Completed Today` as one flat list of short keyword-style bullet points
4. `Decisions & Insights`
5. Explicitly marked, detailed `AI Summary`
6. `Raw Notes` at the end

Daily Notes do not contain task checkboxes or a Timeline. Project tasks exist
only in Project notes. `Completed Today` must not be divided into Project/Admin
subsections; detailed context belongs in `AI Summary`.

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
area: Learning
progress: 0
started:
target:
```

Allowed status values:

- `active`
- `on-hold`
- `completed`
- `someday`
- `cancelled`

Dashboard Project Tasks are read only from Projects with `status: active`.
Changing Project status never requires moving the file.

## Project progress

Project progress is based on weighted Milestones, not the raw number of Tasks.
Daily Project Contributions provide evidence for updating Task completion and
Milestone progress. Codex may update these fields, while preserving a dated
Progress Log and source Daily Note link.

## Provenance

- Unmarked prose is human-authored by default.
- AI text must use an AI callout or `origin: ai`.
- AI must include generation time, sources, and review status.
- Reviewing AI output does not change its origin.
- Codex must never silently rewrite `Raw Notes`.
