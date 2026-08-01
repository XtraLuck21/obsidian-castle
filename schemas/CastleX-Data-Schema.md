# CastleX Data Schema v0.6

## Daily tracker

### Navigation v1 · 2026-07-25 onward

CastleX Home is the command deck. Starting with Daily Notes dated 2026-07-25,
its check-in records the conditions at the moment the user sits down to begin
the day's work. It is not a wake-up check, an all-day health summary, or an
evening reflection.

The user may select `开始航行` once. CastleX records the exact ritual timestamp
without starting a timer or displaying elapsed voyage time:

```yaml
daily_checkin_model: navigation-v1
voyage_started_at: 2026-07-25T09:30:00-07:00
voyage_ended_at: 2026-07-25T22:40:00-07:00
```

The full first KPI card on CastleX Home owns this ritual; Time Allocation is not
repeated there. After activation, the card displays only an animated sailing
boat and `航行中`. The exact time remains visible in the first block of the
Daily Navigation component.

A Navigation Check-in is complete when all six fields contain a value from 1
to 5. The UI order is two rows of three:

| Field | UI label | Meaning | Scale |
| --- | --- | --- | --- |
| `navigation_direction` | 航向清晰 | Today's priorities and rough rhythm are understood | 1 unclear → 5 clear |
| `navigation_activation` | 启动意愿 | Willingness to move from preparation into action | 1 resistant → 5 ready |
| `navigation_work_energy` | 工作能量 | Energy currently available for work | 1 depleted → 5 abundant |
| `navigation_focus` | 专注程度 | Ability to place attention on one work block | 1 scattered → 5 focused |
| `navigation_calmness` | 内心平和 | Current internal tension versus peace | 1 agitated → 5 peaceful |
| `navigation_outlook` | 今日展望 | Emotional stance toward the day ahead | 1 heavy → 5 positive |

Low values describe the day's starting conditions; they do not judge effort,
character, or whether the plan was correct. When the sixth field first becomes
complete, CastleX preserves:

```yaml
navigation_recorded_at: 2026-07-25T09:34:00-07:00
```

`voyage_started_at` and `navigation_recorded_at` are deliberately separate.
Starting the ritual alone does not qualify the date as a Voyage Day; the six
Navigation values do.

Mental Dashboard writes `voyage_ended_at` to the same Daily that owns the open
voyage. A single open voyage may be selected across midnight only while its
start is within the last 24 hours. Multiple recent open voyages require an
explicit target choice. Older unfinished voyages remain missing an end
timestamp, but Home no longer displays them as sailing and no later Mental
record is written into them automatically.

### Legacy Daily State · through 2026-07-24

Daily Notes dated through 2026-07-24 retain the original six-field state model:

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

Legacy fields and `state_recorded_at` remain untouched in existing Daily Notes.
New templates do not create them, and CastleX does not convert their values into
Navigation v1 fields.

## Voyage streak

- All six fields from the Daily Note's declared model are required for a Voyage
  Day.
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
- Returning after several unused days creates or opens only the current
  canonical Daily. CastleX does not create the skipped dates, infer check-ins,
  fill trend values with zero, or illuminate Calendar for those dates.
- Heatmap metrics do not affect the Voyage streak.

The `castlex-navigation` block is interactive in Navigation v1 Daily Notes and
places the start-time block first. Historical `castlex-status` blocks remain
interactive in legacy Daily Notes. Opening an older note still allows Late or
Retrospective entry while displaying the resulting timing classification.

The 14-day trend preserves its continuity across the model boundary. Sleep reads
`sleep_quality` through 2026-07-24 and `health_morning_sleep` from 2026-07-25.
Overall Energy reads legacy `energy` through 2026-07-24, uses
`navigation_work_energy` as a labeled Work Energy fallback on 2026-07-25, and
reads `health_evening_overall_energy` from 2026-07-26. Missing Overall Energy
after that date remains missing. The UI tabs remain `Energy` and `Sleep`.

## Daily sections

Navigation v1 Daily Notes contain, in order:

1. `Daily Navigation`, beginning with a derived voyage ticket containing the
   exact start and end times, followed by the six Navigation dimensions
2. Editable `Time Allocation`
3. `Time & Task Log` as a source-backed chronological list extracted from Raw
   Notes for Daily Notes dated 2026-07-26 or later
4. Read-only `Health Snapshot`
5. Read-only `Mental Log`
6. `Today’s Wins` as encouraging bullet points about effective habits, choices,
   and responses
7. `Completed Today` as factual bullet points for verified tasks and outcomes
8. `Open Loops` for started, committed, awaiting, or unresolved follow-ups
9. `Backlog` for explicitly deferred work that has not started
10. `Raw Notes` at the end

Daily Notes do not contain task checkboxes or a Timeline. Project tasks exist
only in Project notes. All four synthesis sections use flat bullet lists and
plain text.

The voyage ticket reads `voyage_started_at` and `voyage_ended_at` without
writing derived values. Its center shows a static sailing arrow. When the end
timestamp falls one or more natural dates after the Daily `date`, the arrival
time displays a superscript `+N`; for example, a July 26 voyage ending at 00:54
on July 27 displays `00:54` with `+1`.
`Today’s Wins` must not repeat the accomplishment list: it recognizes how the
day was handled, while `Completed Today` records what was finished. AI must not
invent an Open Loop or Backlog item when the source provides no evidence.
`Today’s Wins` contains three to five highest-priority observations. Overlapping
observations are consolidated rather than expanded into an exhaustive list. Cross-day
patterns are not repeated in Daily Notes; Weekly Review decides whether the
accumulated evidence supports a pattern.

`Completed Today` is deliberately shorter than `Time & Task Log`. Each bullet
states only what was completed in the fewest useful words. It contains no
timestamp, date, clock range, or duration and must not reproduce the
chronological activity ledger.

Codex-generated Daily Note content uses plain Markdown text by default. It must
not add bold styling to bullet titles, prefixes, labels, callout metadata, or
explanatory text. This applies to AI Time Allocation notes, `Time & Task Log`,
`Today’s Wins`, `Completed Today`, `Open Loops`, `Backlog`, and Codex-appended
`Raw Notes`. The only exceptions are an explicit user request for bold or
verbatim preservation of bold already present in the user's own writing.

```text
时间补充：7 月 26 日凌晨约 01:30–03:00，我也在策划 Mental Dashboard，投入约 1.5 小时。
```

This formatting rule is prospective. Existing Daily Notes are not rewritten to
remove bold. User-authored formatting remains part of the preserved source and
does not change the chronological append-only policy.

Daily Notes do not contain an `AI Summary` or `Decisions & Insights` section.
Cross-day AI synthesis belongs in the Weekly Review under `AI Weekly Summary`,
where the source set is broad enough to identify patterns without rewriting a
single day’s Raw Notes.

### Time & Task Log

Starting with Daily Notes dated 2026-07-26, Codex extracts explicit task-time
evidence from `Raw Notes` into `Time & Task Log`. This is a compact factual
activity ledger for later Weekly Review comparison; it is not a Timeline,
dashboard visualization, or end-of-day reflection.

Use one chronological flat bullet per attributable task:

```text
- 14:00–16:00 · 2h engaged · Research · Direct · 阅读 abstract 和 introduction
- 14:00–17:00 window · 1h engaged · System · Dashboard
```

- An exact continuous block keeps its start, end, and explicit engaged
  duration.
- When Raw Notes describe a wider mixed or interrupted window plus a smaller
  task duration, preserve both by adding `window`; never convert the whole
  window into engaged time.
- Parallel tasks may appear as separate bullets when the user gives an
  attributable duration for each. Their engaged durations are not required to
  add up to the enclosing window.
- Preserve the user's task domain and description. `Direct`, `Planning`,
  `System`, or another mode may be used only when the source supports it.
- Do not infer missing clock times, durations, task modes, or task boundaries.
- The ledger is derived from Raw Notes but never replaces or silently rewrites
  them. Human corrections take precedence.
- Do not copy its timestamps, ranges, or durations into `Completed Today`;
  that section contains only terse completed outcomes.
- Do not backfill Daily Notes dated before 2026-07-26.
- Do not create an `End-of-day Evidence` section.

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
For mixed windows in `Time & Task Log`, Time Allocation uses the explicit
`engaged` duration rather than the enclosing clock-window length. A task is not
double-counted merely because several bullets share the same window.

### Deprecated score fields

`project_contribution`, `admin_load`, `activity_origin`, and
`activity_reviewed` belong to the pre-0.7 scoring model. New templates and the
Dashboard do not read them. Existing values remain historical data and must
never be converted into minutes.

## Health Dashboard

Health Dashboard is an independent body-and-workout companion view. Its
`health_*` fields do not write, infer, or complete the six-field Navigation
Check-in used by CastleX Home. Both systems live in the same Daily Note without
duplicating check-in answers. The one intentional cross-view read is the
read-only 14-day Sleep series, which uses `health_morning_sleep` from
Navigation v1 dates.

### Time-aware check-ins

- From 00:00 through 08:59, the recommended form is 夜间.
- From 09:00 through 13:59, the recommended form is 早晨.
- From 14:00 through 20:59, the recommended form is 傍晚.
- From 21:00 through 23:59, the recommended form is 晚间.
- Stage controls are displayed in the same 夜间 → 早晨 → 傍晚 → 晚间
  order, so the first stage describes the preceding night's close.
- Time only recommends a default. The four stage controls remain directly
  selectable at all times.
- Entering Health from Mental's completed voyage opens 夜间 directly. Manual
  stage choice outranks the time recommendation until the natural date changes.
- Health always belongs to the current natural date. A 02:00 lights-out action
  writes the Daily whose date contains that 02:00 timestamp. No previous-date
  lock or voyage-style cross-midnight ownership is applied.
- Every discrete selection writes immediately. A period completion timestamp is
  optional. The stage tracker shows `已记录` when every core field for that
  stage has an answer, or when the user explicitly presses its completion
  button. Optional text fields do not gate completion. 夜间 completes through
  the lights-out action.
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

health_morning_started_at:
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
health_afternoon_body:
health_afternoon_nap:
health_afternoon_regions: []
health_afternoon_discomfort: []
health_afternoon_preference:
health_afternoon_challenge:
health_afternoon_completed_at:
health_afternoon_state:

health_evening_body:
health_evening_overall_energy:
health_evening_appetite_stability:
health_evening_post_workout:
health_evening_body_note:
health_evening_completed_at:
```

`health_morning_regions` and `health_afternoon_regions` accept `chest` in
addition to the existing shoulder, back, arm, leg, whole-body, and none values.
When paired with soreness, `chest` is treated as relevant to Upper-body
training recommendations.

Sleep State belongs to the natural calendar date on which the entry begins. For
example, an entry opened at 23:50 on July 24 remains in the July 24 Daily if the
user presses `关灯` after midnight. An entry first opened at 00:08 on July 25
belongs to July 25. The full-width
lights-out control records the exact preparation time and completes the period.
Sleepiness and Calmness use positive `1–5` signal scales. Awake reasons are a
multi-select set including not sleepy, screen or entertainment, work or study,
social activity, late workout, physical discomfort, hunger or thirst, ordinary
active thoughts, anxiety, panic, low mood, rumination, environment, or other.
Sleep fields do not affect the workout recommendation formula.

Morning begins with an optional `迎接晨光` ritual stored in
`health_morning_started_at`; this means Morning Check-in began, not the true wake
time. Evening asks about current body state, whole-day Overall Energy, and
whole-day appetite stability on positive `1–5` scales. When a workout was
recorded, it also asks for post-workout body state. These fields do not affect
the workout recommendation or Voyage Day calculation.

## Mental Dashboard

Mental Dashboard is the one-point evening reflection and work-voyage closure.
It does not diagnose, compute a composite mental-health score, qualify a Voyage
Day, or replace Health's final sleep ritual. The page signature is
`用舍由时，行藏在我。`

Five stable numeric dimensions remain independent:

| Field | Mental UI label | Stored scale direction |
| --- | --- | --- |
| `mental_evening_mood` | 情绪亮度 | 1 low/dim → 5 light/bright |
| `mental_evening_load` | 心理余量 | 1 light → 5 heavy |
| `mental_evening_clarity` | 思维清晰 | 1 confused → 5 clear |
| `mental_evening_thought_occupancy` | 思绪留白 | 1 loose → 5 full |
| `mental_evening_connection` | 连接感受 | 1 distant → 5 connected |

The Dashboard presents all five dimensions as a compact five-column grid. Each
dimension owns one contiguous five-point star split into five directly
interactive petals. Choosing a petal illuminates that petal and every preceding
petal; all five illuminated petals merge into one solid star without a center
dot. The current state word remains visible below the star. Therefore `心理余量`
displays `6 - mental_evening_load`, and `思绪留白` displays
`6 - mental_evening_thought_occupancy`. Storage semantics and historical values
remain unchanged.

The read-only Daily `Mental Log` uses the same display direction. Each recorded
dimension shows its state word followed by a smaller `N/5` value; missing
dimensions show `—` without a numeric score.

Context and closure fields:

```yaml
mental_evening_stress_source:
mental_evening_emotions: []
mental_evening_relief_factors: []
mental_evening_closure:
mental_evening_recorded_at:
mental_evening_completed_at:
voyage_ended_at:
```

Stress source is single-select. Emotions and relief factors accept at most two
values each. `今日风向` presents the three fields as full-width rows with a
stable title, short explanation, and visible choices. Context questions are
optional and never block voyage closure.
`mental_evening_closure` is one of `active`, `shelved`, or `released`, presented
as 还在心上, 暂时搁置, or 可以放下. Their static icons respectively show two
sheets, a sheet placed into an envelope, or a conventional airplane indicating
that the message has left. Mental selections update in place without replaying
an animation or rebuilding the full background. Holding `结束今日航程` records both
`mental_evening_completed_at` and `voyage_ended_at`; afterward the view links to
Health's 夜间 stage. Unlike Mental, Health does not follow voyage ownership
across midnight.

Mental target selection prefers one open voyage, then the most recently ended
voyage within 24 hours, and only then the current-date Daily. This keeps a
completed reflection visible after closure. The Header renders `正在收束` only
when the selected Daily contains `voyage_started_at` without `voyage_ended_at`;
a selected Daily that has never started a voyage has no voyage-status line.

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

`((energy × 40) + (calmness × 20) + (clarity × 20) + (body availability × 20)) ÷ 5 − penalties`

Tightness subtracts `8` points and training soreness subtracts `12` points.
Both may be selected together. The result is clamped to `0–100`.
Afternoon Body Availability is an absolute current-state `1–5` signal, using
the same positive scale as Morning Body Availability. The system may compare
the two values later; the human does not need to translate change into a
relative score.

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
| Afternoon body availability | 20 |

The engine decides training load before it considers changing the workout:

| Current information | Recommendation |
| --- | --- |
| Morning only, capacity `≥75` | planned workout · Standard |
| Morning only, capacity `55–74` | planned workout · Light |
| Morning only, capacity `<55` | provisional Stretch; reassess after Afternoon |
| Afternoon available, readiness `≥75`, Energy `4–5`, Body Availability `3–5` | planned workout · Standard |
| Readiness `55–74`, Energy `3`, or Body Availability `2` | planned workout · Light |
| Readiness `35–54`, Energy `2`, or Body Availability `1` | Stretch |
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

## Project and Workstream organization

All Project notes live under `30_Projects/`. The canonical Manager-facing
Workstream lifecycle is stored in the existing `status` field:

```yaml
type: project
status: incubating
focus: false
area:
priority:
progress_sections:
  Tasks: 100
created: 2026-08-01
started:
target:
origin:
```

`created` records when the canonical Project note was established. It is note
provenance only: it does not mean execution started, the Proposal received
capacity, or Manager accepted a Commitment. `started` records the actual Project
start and remains blank while that decision has not been made. `priority` and
`target` likewise remain blank until Manager or the user commits them. File
creation never fills those Commitment properties by inference.

The five canonical values and capacity semantics are:

| `status` | Manager label | Capacity semantics |
| --- | --- | --- |
| `active` | Active | Receives deliberate growth capacity and may produce current tasks. |
| `maintenance` | Maintenance | Receives only the minimum recurring capacity needed to preserve continuity; it is not growth work. |
| `incubating` | Incubating | Remains exploratory or proposed and receives no default scheduled capacity. |
| `paused` | Paused | Retains context and history but receives no current capacity until explicitly resumed. |
| `closed` | Closed | Is ended and retained for history; it receives no current capacity. |

New Project notes default to `incubating` and `focus: false`, so creating a note
does not silently create an Active Commitment or place proposed tasks in
Upcoming Tasks. A user-authorized Domain Expert may establish this one canonical
note directly under `30_Projects/`; no Proposal folder, duplicate intake note,
copy, move, or later conversion is required. Note creation authorizes durable
Proposal drafting, not portfolio capacity.

While the Project remains Incubating, its Outcome, evidence, milestones, tasks,
timeline, effort, risks, assumptions, and expectations are advisory. They stay
in the canonical Project body so Manager can review and edit the same file.
Manager or the user owns lifecycle, `focus`, committed `priority`, `started`,
`target`, capacity, scope, effort, and expectations. A Manager or the user
changes `status` only when the lifecycle decision changes. There is no recurring
lifecycle check-in, Proposal database, or closure form.

### Project creation provenance

The Project creator sets the top-level `origin` explicitly:

- `origin: human` means the initial Project content was human-authored.
- `origin: ai` means a user-authorized AI Expert created the initial draft.
- `origin: mixed` may be used after material human and AI contributions coexist.

The canonical Template deliberately leaves `origin` blank because it cannot
know who invoked it. An AI workflow must set `origin: ai` before saving and must
record generation time and evidence sources in `AI Project Brief`; it must not
silently retain or invent `origin: human`. AI-proposed priority, dates, effort,
capacity, or expectations remain advisory body content until Manager or the
user writes the accepted Commitment properties. Changing provenance does not by
itself change lifecycle or authorize capacity.

The Workstreams card groups every Project under one of the five lifecycle
headings. `priority` controls order within a lifecycle group; lower numbers
appear first. Active is the only state that receives growth capacity by default.
Maintenance stays visible in the portfolio but is separated from Active.
Incubating, Paused, and Closed remain visible for portfolio context but do not
enter current execution surfaces.

Upcoming Tasks reads only Projects with `status: active` and `focus: true`,
groups tasks by Project, lets the user select the source Project, and displays
only the first three unchecked Markdown checkboxes from the first unfinished
section declared in `progress_sections`. A `+n` indicator shows how many
unchecked items remain hidden. `focus` remains an independent execution-display
flag; it is not a lifecycle state and does not make a non-Active Workstream a
current Commitment. Dashboard completion appends `✅ YYYY-MM-DD`, matching
checkbox completion inside the Project note. Changing Project status never
requires moving the file.

### Legacy Project status compatibility

CastleX reads the earlier status vocabulary without rewriting private notes:

| Legacy value | Manager-facing lifecycle | Preserved fact |
| --- | --- | --- |
| `on-hold` | Paused | The raw `on-hold` value remains in the note. |
| `someday` | Incubating | The raw `someday` value remains in the note. |
| `completed` | Closed | Completion remains distinguishable in the raw YAML. |
| `cancelled` | Closed | Cancellation remains distinguishable in the raw YAML. |

The Dashboard labels these compatibility reads as legacy. A missing or unknown
status is conservatively displayed under Incubating and is not given capacity.
CastleX never writes the normalized value back automatically. Explicit Manager
or user review is required before changing a private Project to a canonical
five-state value, so completion and cancellation history cannot be silently
collapsed.

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

## Optional desktop Project session tracker

A short-lived Project may embed an interactive execution surface without
becoming a permanent Dashboard:

````markdown
```castlex-leetcode-tracker
bridge_path: /absolute/path/to/obsidian_bridge
```
````

The private Project note owns the machine-specific `bridge_path`; public
templates and plugin source never hard-code it. The tracker is desktop-only
because the external Bridge lives outside the Vault. Mobile renders a clear
unavailable state while the rest of CastleX remains mobile-compatible.

The LeetCode repository owns plan order, test evidence, mastery, and review
scheduling through the Bridge `to_obsidian/` files. The Project tracker owns
only execution sessions. Start is clicked when the problem is first read.
Pause and Resume persist local timer state in plugin data. Finish appends
exactly one schema-v3 `session_completed` event to
`from_obsidian/session_events.jsonl`; it never writes Daily Note time fields.

Total active time always accumulates while the session is running. After Start,
the user may optionally classify time as `thinking`, `implementation`, or
`debugging`. Before the first phase selection, all three values render as
`N/A`, meaning that no phase breakdown was recorded. The first phase selection
enables the breakdown and initializes all three values to zero. From then on,
an unused phase remains an intentional `0`, while the selected phase
accumulates classified seconds. Selecting a different phase changes
classification without interrupting Total; tapping the active phase again
records subsequent time as Unclassified. Once enabled, a breakdown does not
return to the `N/A` state during that Session.

Schema-v3 events omit both `phase_seconds` and `unclassified_seconds` when no
phase was ever selected. When phase tracking was enabled, `phase_seconds`
contains all three integer keys, including zero values, and
`unclassified_seconds` stores the Total time not assigned to a phase. Existing
schema-v2 events remain readable with their legacy partial-key semantics.

`completion_status: completed` is clicked only after all tests pass and records
the user's completion declaration. The coding repository remains the source of
test evidence and mastery evaluation. `partial` and `stopped` preserve time and
attempt history without advancing the execution progress bar. Hint level and a
short note are optional. Planned dates remain anchors, while actual
`started_at`, `ended_at`, `active_seconds`, and optional `phase_seconds`
preserve what happened.

The Today recommendation follows the task-array order in `plan_export.json` and
selects the first task without a completed Session. A later task scheduled for
today never jumps ahead of an earlier unfinished task; completing work early
simply advances to the next open task in the same canonical order. The optional
`round_target_problem_count` in `current_state.json` supplies the Technical
Coverage denominator. When it is absent, the tracker infers the target without
double-counting plan tasks that already have completed Sessions.

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
Activation plus one stacked daily chart for the four Time Allocation
categories. Through 2026-07-24 those series use `sleep_quality`, `energy`, and
`agency`. Starting 2026-07-25 they use `health_morning_sleep`,
`navigation_work_energy`, and `navigation_activation`, so a Weekly Review that
crosses the cutover remains continuous without rewriting legacy Daily Notes.
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
- `AI Cross-Domain Review`: reads Daily YAML, `Time & Task Log`, factual Daily
  sections, Raw Notes, and the human Weekly Reflection. It compares time,
  concrete behavior, subjective experience, and outcomes while distinguishing
  direct work from planning or system construction. For periods starting
  2026-07-26, the explicit `engaged` durations in `Time & Task Log` are the
  preferred evidence for task-level allocation; the wider mixed window is
  context, not duration.
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

## Canonical Templates and examples

Files under `templates/` are the canonical creation contract deployed to
`90_System/Templates/`. Files under `examples/` are fictional filled instances,
not alternate templates. The Daily and Weekly examples retain the same top-level
frontmatter key set and the same level-two section sequence as their canonical
Templates; they differ only in placeholder replacement, fictional values, and
illustrative body content. Verification fails when those structural contracts
drift.
