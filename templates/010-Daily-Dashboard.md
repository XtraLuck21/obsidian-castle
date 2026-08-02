---
type: daily
date: {{date:YYYY-MM-DD}}
week: {{date:gggg-[W]ww}}
month: {{date:YYYY-MM}}
daily_checkin_model: navigation-v1
time_log_model: allocation-v2
core_snapshot: []
voyage_started_at:
voyage_ended_at:
navigation_direction:
navigation_activation:
navigation_work_energy:
navigation_focus:
navigation_calmness:
navigation_outlook:
navigation_recorded_at:
project_minutes:
admin_minutes:
workout_minutes:
enrichment_minutes:
project_minutes_origin:
admin_minutes_origin:
workout_minutes_origin:
enrichment_minutes_origin:
time_data_reviewed: false
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
health_planned_workout:
health_planned_rotation_slot:
health_recommended_workout:
health_recommended_mode:
health_recommendation_status:
health_recommendation_capacity:
health_recommendation_completeness:
health_recommendation_reasons: []
health_recommendation_updated_at:
health_selected_workout:
health_selected_mode:
health_manual_override:
health_override_reason:
health_primary_session_id:
health_primary_workout:
health_primary_mode:
health_primary_source:
health_rotation_advance:
health_rotation_advanced:
health_rotation_slot:
health_rotation_skipped:
health_rotation_skipped_slot:
health_rotation_skipped_workout:
health_rotation_skipped_at:
health_workout_type:
health_workout_mode:
health_workout_status:
health_workout_session_id:
health_current_session_role:
health_workout_started_at:
health_workout_completed_at:
health_workout_completed_sets: []
health_workout_sessions: []
health_actual_workout:
health_actual_workout_mode:
mental_evening_mood:
mental_evening_load:
mental_evening_clarity:
mental_evening_thought_occupancy:
mental_evening_connection:
mental_evening_stress_source:
mental_evening_emotions: []
mental_evening_relief_factors: []
mental_evening_closure:
mental_evening_recorded_at:
mental_evening_completed_at:
origin: human
cssclasses:
  - daily-voyage
---
# {{date:YYYY-MM-DD · dddd}}

## Daily Navigation

```castlex-navigation
```

## Time Allocation

```castlex-time-rings
```

<!-- Codex 新增或整理的 Daily 内容默认使用普通文本；不得为 bullet title、前缀、标签、callout 元数据或说明主动添加 Markdown 粗体。仅当用户明确要求，或需要原样保留用户本人书写中已有的粗体时例外。 -->

## Time & Task Log

<!--
从 2026-08-01 起，Codex 根据 Raw Notes 提取有明确证据的投入，按自然日顺序写入 nested bullet ledger。
每个顶层 bullet 是一个时间块，格式为「HH:MM–HH:MM · Engaged: 时长」；Window 是时段，Engaged 是可归属的实际投入。跨午夜的记录在 00:00 处分成两条对应自然日记录。
每个时间块下面固定写 Activity 与 Source；Project 行再写 Activity Mode 与 Project。Activity Mode 只使用 Execution、Planning、System、Not Classified；没有对应 `30_Projects/` Project 文件的标题直接写普通文本，不使用 Wikilink，默认为 non-core。
凡涉及脑力工作、写文件、规划、系统维护或 review 的投入都归 Project / Domain（即使该 Domain 是 non-core）；Admin 只用于买菜、通勤、回邮件、打客服电话等日常事务。非 Project 时间块只写 category 与 activity，并使用 Enrichment、Admin、Workout 等裸 category bullet；不要给 Workout 或 Counseling 强行套用 Execution。
Source 只使用 human、dashboard、ai、legacy-derived、unknown 等受控值。无法可靠分类的旧资料只标记为 legacy-derived 或 unknown。
core_snapshot 是按本 Daily 生成时 Project 的 status 冻结出的内部派生数据，不要求每天手填，也不要追溯改写。
旧格式的 2026-07-26–2026-07-31 仅供 Weekly/Monthly 只读 derived mapping 使用，不回写旧 Daily。
-->

<!-- 新格式示例：
- 14:00–16:00 · Engaged: 2h
  - Activity: Drafted a section
  - Activity Mode: Execution
  - Project: [[30_Projects/Example-Project|Example Project]]
  - Source: human

- 14:00–17:00 · Engaged: 1h
  - Activity: Commute to campus
  - Admin
  - Source: human
-->

## Health Snapshot

```castlex-health-summary
```

## Mental Log

```castlex-mental-summary
```

## Today’s Wins

<!-- 鼓励有效习惯、选择与应对方式；不要复述 Completed Today 的成果。仅保留最重要的 3–5 条，并只使用 Raw Notes 中有证据的内容。 -->

## Completed Today

<!-- 已完成的可验证任务或结果；只用最短措辞写“完成了什么”。不得包含时间戳、日期、时段或投入时长，不得把 Time & Task Log 改写成另一份流水账；不写鼓励性评价，不分子 section。 -->

## Open Loops

<!-- 已经启动、承诺、等待反馈或需要明确跟进，但尚未闭环的事项。 -->

## Backlog

<!-- 尚未启动且明确延后的事项；不得从模糊想法中发明任务。 -->

## Raw Notes

<!-- 你的原始记录放在最后；Codex 整理时不得静默改写。按写入时间从早到晚保留，后续补充或更正一律追加在已有内容之后。Codex 追加标签时使用普通文本，例如「时间补充：」；不得主动增加粗体。若用户原文已经包含粗体，则原样保留。 -->
