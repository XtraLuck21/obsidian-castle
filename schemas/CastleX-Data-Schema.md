# CastleX Data Schema v0.3

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

1. `Completed Today / Project Contributions`
2. `Completed Today / Life & Admin`
3. `Decisions & Insights`
4. Explicitly marked `AI Summary`
5. `Raw Notes` at the end

Daily Notes do not contain task checkboxes or a Timeline. Project tasks exist
only in Project notes.

## Activity heatmap

Codex derives two independent 0–5 fields from the Daily record:

```yaml
project_contribution: 0
admin_load: 0
activity_origin: ai
activity_reviewed: false
```

- `null` / empty means the day has not been processed.
- `0` means the record was processed and no activity of that type occurred.
- Values `1–5` form five colored intensity levels in the dashboard.
- Project: 1 preparation, 2 small advance, 3 clear output, 4 substantial
  milestone progress, 5 key breakthrough or delivery.
- Admin: 1 light maintenance, 2 routine load, 3 meaningful capacity cost,
  4 heavy load, 5 dominant or exhausting load.
- The dashboard never invents these values. Codex writes them while processing
  the Daily record; `activity_origin: ai` records provenance and
  `activity_reviewed: false` means the derived result still awaits human review.
- Original human text remains the source of truth.

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
