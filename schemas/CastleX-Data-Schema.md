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
enrichment_minutes: 60

project_minutes_origin: ai
admin_minutes_origin: ai
workout_minutes_origin: ai
enrichment_minutes_origin: ai
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
- `Enrichment`: reading, learning, art, media, reflection, or hobbies
  that do not directly advance a defined Project.

Assign a time block to one primary category unless the source explicitly splits
it. Project-directed learning belongs to `Project`, not both Project and
Enrichment.

### Four Heatmap levels

For Project and Enrichment:

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

## Health Dashboard

Health Dashboard is an independent companion view. Its `health_*` fields do not
read, write, infer, or complete the six-field Daily State used by CastleX Home.
Both systems may live in the same Daily Note without sharing check-in answers.

### Time-aware check-ins

- From 00:00 through 08:59, the default form is Night State.
- From 09:00 through 16:59, the default form is Morning Check-in.
- From 17:00 through 21:59, the default form is Afternoon Check-in.
- From 22:00 through 23:59, the default form is Evening Reflection.
- Time controls only the default visible form. Every period remains available
  through the Backfill control.
- Every discrete selection writes immediately. A period completion timestamp is
  optional and does not gate recommendations.
- Text fields use a short debounce before writing to reduce sync churn.

Five-level state questions use signal bars whose illuminated count matches the
stored value. Except where the wording is explicitly inverted into a positive
dimension such as Calmness or Clarity, more illuminated bars always mean a
better or more available state. Afternoon Energy also uses the same `1–5`
signal-bar scale and is stored in `health_afternoon_energy_signal`.

The principal input fields are:

```yaml
health_night_bedtime_at:
health_night_sleepiness:
health_night_calmness:
health_night_awake_reasons: []
health_night_completed_at:

health_morning_sleep:
health_morning_recovery:
health_morning_body:
health_morning_outlook:
health_morning_dream:
health_morning_regions: []
health_morning_discomfort: []
health_morning_need:
health_morning_completed_at:
health_morning_capacity:

health_afternoon_energy_signal:
health_afternoon_calmness:
health_afternoon_clarity:
health_afternoon_body_change:
health_afternoon_nap:
health_afternoon_regions: []
health_afternoon_discomfort: []
health_afternoon_preference:
health_afternoon_challenge:
health_afternoon_completed_at:
health_afternoon_state:

health_evening_body:
health_evening_post_workout:
health_evening_body_note:
health_evening_completed_at:
```

Night State belongs to the current calendar Daily. For example, a Night State
recorded at 00:08 on July 24 is stored in the July 24 Daily, pairing the
pre-sleep condition with the Morning Check-in after waking. The full-width
lights-out control records the exact preparation time and completes the period.
Sleepiness and Calmness use positive `1–5` signal scales. Awake reasons are a
multi-select set: not sleepy, active mind, screen or entertainment, work or
study, social activity, late workout, or other. Night fields do not affect the
workout recommendation formula.

Evening asks only about the current body state and, when a workout was recorded,
the post-workout body state. It does not ask general life-reflection questions.

### Deterministic workout recommendation

Recommendations are local deterministic rules, not AI output. The view derives
a provisional result from every available answer and recalculates after each
change. Missing answers are excluded from the weighted denominator, and the UI
always shows information completeness.

Morning Recovery Capacity is a `0–100%` score:

`((sleep × 30) + (wake recovery × 40) + (body availability × 20) + (outlook × 10)) ÷ 5`

Each input is a `1–5` signal value. If some answers are missing, their weights
are removed from the denominator rather than treated as zero.

Afternoon Body State is also a `0–100%` score:

`((energy × 40) + (calmness × 20) + (clarity × 20) + (change × 20)) ÷ 5 − penalties`

Tightness subtracts `8` points and training soreness subtracts `12` points.
Both may be selected together. The result is clamped to `0–100`.

When both periods exist, the workout engine uses `40%` Morning Recovery
Capacity plus `60%` Afternoon Body State. Before Afternoon Check-in, Morning
Recovery Capacity is used alone.

The seven-day trend uses the three raw `1–5` answers for Morning Sleep,
Morning Wake Recovery, and Afternoon Energy. It does not plot either derived
percentage.

The underlying signal weights are:

| Input | Weight |
| --- | ---: |
| Morning sleep | 30 |
| Morning wake recovery | 40 |
| Morning body availability | 20 |
| Morning outlook | 10 |
| Afternoon energy | 40 |
| Afternoon calmness | 20 |
| Afternoon clarity | 20 |
| Afternoon body change | 20 |

The engine decides training load before it considers changing the workout:

| Current information | Recommendation |
| --- | --- |
| Morning only, capacity `≥75` | planned workout · Standard |
| Morning only, capacity `55–74` | planned workout · Light |
| Morning only, capacity `<55` | provisional Stretch; reassess after Afternoon |
| Afternoon available, readiness `≥75`, Energy `4–5`, Body Change `3–5` | planned workout · Standard |
| Readiness `55–74`, Energy `3`, or Body Change `2` | planned workout · Light |
| Readiness `35–54`, Energy `2`, or Body Change `1` | Stretch |
| Readiness `<35` or Energy `1` | Rest |

This ordering means a moderate day normally keeps the planned training
direction and reduces its volume instead of immediately switching to Pool or
Rest. Pool has its own Standard and Light modes and remains part of the normal
rotation.

Relevant localized training soreness excludes the affected strength workout.
When readiness is at least `55`, the engine selects an unaffected strength
region and preserves the calculated Standard/Light load. If no suitable
strength region remains, it recommends Stretch. Whole-body training soreness
caps the recommendation at Stretch. A recorded body preference may replace the
direction only when it does not conflict with the safety tier or an affected
region.

Every recommendation exposes its reasons. The human may select any workout,
including Rest, without changing the rule result. Planned, Recommended,
Selected, and Actual workout values remain separate:

```yaml
health_planned_workout:
health_recommended_workout:
health_selected_workout:
health_actual_workout:
health_actual_workout_mode:
health_manual_override:
health_override_reason:
health_primary_session_id:
health_primary_workout:
health_primary_mode:
health_primary_source:
```

### Rotation and workout sessions

The rotating plan is:

```text
Pool → Back → Pool → Upper → Legs → repeat
```

Only a completed workout whose `health_rotation_advance` is true advances the
rotation. Temporarily replacing the planned workout with another workout,
Stretch, or Rest holds the current planned slot.

The Rotation card also provides a one-time Skip Current action for the day.
Skipping records the skipped slot and immediately makes the next slot the
current plan. If the user then takes a recovery detour, the following Daily
starts from the post-skip slot. If the user completes the post-skip planned
workout on the same day, that completed slot takes precedence for the next
Daily.

```yaml
health_rotation_skipped:
health_rotation_skipped_slot:
health_rotation_skipped_workout:
health_rotation_skipped_at:
```

Strength sessions store completion at set level. Warm-up sets and working sets
have stable IDs inside `health_workout_completed_sets`. Standard and Light are
separate explicit plans rather than one plan with a generic set reduction. The
current calculated plans are:

| Day | Standard | Light |
| --- | ---: | ---: |
| Back | 19 groups | 13 groups |
| Upper | 16 groups | 11 groups |
| Legs | 19 groups | 12 groups |

Back Light omits Dumbbell Curl, removes Face Pull warm-up, and uses two Back
Extension working sets. Upper Light omits Cable Triceps Pushdown and removes Lateral
Raise warm-up. Legs Standard adds Dumbbell Romanian Deadlift; Legs Light omits
it, removes Bulgarian Split Squat and Leg Curl warm-ups, and uses two Back
Extension working sets. The Chinese exercise name for Back Extension is
`山羊挺身`.

Warm-up and working-set counts are displayed separately even though both remain
individually checkable. Standard carries the cue to leave approximately `2–3`
good repetitions in reserve; Light carries the cue to leave approximately
`4–5`. These are effort guides and do not require weight logging. The pre-workout
mode switch itself is a visually distinct two-option control labeled only
`Standard` and `Light`; set counts remain in the exercise preview and active
progress instead of inside the mode buttons.

Pool Standard is 60 minutes. Pool Light is 30–45 minutes. Stretching is not
part of either Pool plan. Pool has no subsection or interval checkboxes and
uses only session start/end time and completion status.

```yaml
health_workout_type:
health_workout_mode:
health_workout_status:
health_workout_session_id:
health_current_session_role:
health_workout_started_at:
health_workout_completed_at:
health_workout_completed_sets: []
health_workout_sessions: []
```

A Daily may contain multiple completed workout sessions. The first completed
workout is stored as the stable `primary` session; sessions created through
`再加入一个训练` are stored as `additional`. Each session stores its role,
workout, mode, timestamps, elapsed minutes, planned total sets, planned
working/warm-up counts, and completed set IDs inside
`health_workout_sessions`.

`health_primary_session_id`, `health_primary_workout`,
`health_primary_mode`, and `health_primary_source` preserve the main result.
After the primary session finishes, additional sessions never replace
`health_selected_workout`, `health_actual_workout`, or the Daily Snapshot's
main workout. They still contribute to `workout_minutes` and appear in the
plugin-managed `Completed Today` summary. Completed session cards identify
`主训练` and `追加` and always state whether each session was Standard, Light,
or Recovery.

After Finish Workout, the user may add another Pool, Back, Upper, Legs, or
Stretch session. Choosing the next session enters `ready` state and shows its
Standard/Light preview. Timing and the fresh checklist begin only after the
user presses `开始训练`.
There is no early-finish state: unchecked sets simply remain unchecked when the
session is finished.

Finishing a session updates total `workout_minutes`, keeps
`workout_minutes_origin: human`, and upserts one factual, plugin-managed
completion bullet summarizing all sessions under `Completed Today`. It never
rewrites Raw Notes.

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
