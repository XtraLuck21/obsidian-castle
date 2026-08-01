#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/paths.sh"

check_local=yes
check_icloud=no
case "${1:-}" in
  "") ;;
  --source-only) check_local=no ;;
  --with-icloud) check_icloud=yes ;;
  *) echo "Usage: $0 [--source-only|--with-icloud]" >&2; exit 2 ;;
esac

fail() { echo "VERIFY FAILED: $*" >&2; exit 1; }
pass() { echo "✓ $*"; }

plugin="$SYSTEM_ROOT/plugin/castlex-dashboard"
template="$SYSTEM_ROOT/templates/010-Daily-Dashboard.md"
weekly_template="$SYSTEM_ROOT/templates/020-Weekly-Review.md"
schema="$SYSTEM_ROOT/schemas/CastleX-Data-Schema.md"
manifest="$plugin/manifest.json"
project_template="$SYSTEM_ROOT/templates/100-Project.md"

node --check "$plugin/main.js"
pass "plugin JavaScript syntax"

jq -e '.id == "castlex-dashboard" and (.version | type == "string") and (.name | type == "string") and (.minAppVersion | type == "string")' "$manifest" >/dev/null
node -e 'const m=require(process.argv[1]); const p=m.version.split(".").map(Number); if (p[0] < 1 && (p[1] || 0) < 23) process.exit(1)' "$manifest" || fail "plugin version must be at least 0.23.0"
pass "manifest fields and version"

rg -q 'rain-glass-sunset-beach-v2.webp' "$plugin/main.js" || fail "Dashboard missing rain-glass sunset beach background"
rg -q '^rain-glass-sunset-beach-v2.webp$' "$SYSTEM_ROOT/assets/allowlist.txt" || fail "Rain-glass sunset beach background missing from asset allowlist"
rg -q 'rain-glass-sunset-mobile-v1.webp' "$plugin/main.js" || fail "Dashboard missing portrait mobile sunset background"
rg -q '^rain-glass-sunset-mobile-v1.webp$' "$SYSTEM_ROOT/assets/allowlist.txt" || fail "Portrait mobile sunset background missing from asset allowlist"
rg -q 'rain-glass-outdoor-pool-desktop-v1.webp' "$plugin/main.js" || fail "Health Dashboard missing outdoor pool desktop background"
rg -q '^rain-glass-outdoor-pool-desktop-v1.webp$' "$SYSTEM_ROOT/assets/allowlist.txt" || fail "Health desktop background missing from asset allowlist"
rg -q 'rain-glass-outdoor-pool-mobile-v1.webp' "$plugin/main.js" || fail "Health Dashboard missing outdoor pool mobile background"
rg -q '^rain-glass-outdoor-pool-mobile-v1.webp$' "$SYSTEM_ROOT/assets/allowlist.txt" || fail "Health mobile background missing from asset allowlist"
rg -q 'cx-background-layer' "$plugin/main.js" || fail "Dashboard missing viewport-sized background layer"
pass "responsive desktop/mobile rain-glass backgrounds"

rg -q 'Platform.isMobile' "$plugin/main.js" || fail "Dashboard missing mobile return entry"
rg -q 'cx-mobile-home-button' "$plugin/main.js" || fail "Dashboard missing mobile home button"
rg -Fq 'this.writeQueue = this.writeQueue.then(write, write)' "$plugin/main.js" || fail "Dashboard missing serialized Check-in writes"
rg -q 'freshFrontmatter' "$plugin/main.js" || fail "Dashboard missing fresh frontmatter reads"
rg -Fq 'await app.vault.read(file)' "$plugin/main.js" || fail "Dashboard fresh frontmatter reads do not bypass stale cache"
pass "mobile Dashboard entry, serialized writes, and fresh frontmatter reads"

rg -q 'dailyCreationPromises' "$plugin/main.js" || fail "Dashboard missing Daily creation lock"
rg -q 'renderDailySyncPending' "$plugin/main.js" || fail "Dashboard missing mobile Daily sync gate"
rg -Fq 'options.allowCreate ?? !Platform.isMobile' "$plugin/main.js" || fail "Mobile still auto-creates missing Daily files"
rg -q 'archiveDailyConflicts' "$plugin/main.js" || fail "Dashboard missing device-local conflict archiving"
pass "single canonical Daily creation and conflict-archiving policy"

fields=(daily_checkin_model voyage_started_at voyage_ended_at navigation_direction navigation_activation navigation_work_energy navigation_focus navigation_calmness navigation_outlook navigation_recorded_at project_minutes admin_minutes workout_minutes enrichment_minutes project_minutes_origin admin_minutes_origin workout_minutes_origin enrichment_minutes_origin time_data_reviewed)
for field in "${fields[@]}"; do
  rg -q "^${field}:" "$template" || fail "Daily template missing $field"
  rg -q "\`${field}\`|${field}:" "$schema" || fail "Schema missing $field"
done
for legacy_field in sleep_quality physical_state stress energy agency appetite_stability state_recorded_at; do
  if rg -q "^${legacy_field}:" "$template"; then
    fail "Navigation v1 template still creates legacy field: $legacy_field"
  fi
  rg -q "\`${legacy_field}\`|${legacy_field}:" "$schema" || fail "Schema no longer documents legacy field: $legacy_field"
done
rg -q '^```castlex-navigation$' "$template" || fail "Daily template missing Navigation block"
rg -Fq 'const NAVIGATION_CUTOVER = "2026-07-25"' "$plugin/main.js" || fail "Plugin missing Navigation v1 cutover"
rg -Fq 'const label = lifecycle.ambiguous' "$plugin/main.js" || fail "Home missing voyage lifecycle states"
rg -Fq 'cls: `cx-kpi cx-glass cx-voyage-ritual' "$plugin/main.js" || fail "Voyage ritual is not rendered as the full KPI card"
rg -Fq 'height: 100% !important' "$plugin/styles.css" || fail "Voyage ritual does not fill the KPI grid cell"
rg -Fq 'cx-streak-kpi' "$plugin/main.js" || fail "Voyage streak card is missing the balanced horizontal layout"
if rg -Fq 'text: "刷新", cls: "cx-button"' "$plugin/main.js"; then
  fail "CastleX Home still exposes the redundant Refresh button"
fi
if rg -Fq 'label: "今日投入"' "$plugin/main.js"; then
  fail "CastleX Home still exposes the Today total KPI"
fi
if rg -Fq '与 Home Check-in 分开记录' "$plugin/main.js"; then
  fail "Daily Health Snapshot still carries the obsolete separation hint"
fi
rg -q 'cx-voyage-launch' "$plugin/styles.css" || fail "Voyage ritual missing launch animation"
rg -q 'overallEnergyValue' "$plugin/main.js" || fail "Trend does not use Overall Energy source rules"
rg -Fq 'const OVERALL_ENERGY_CUTOVER = "2026-07-26"' "$plugin/main.js" || fail "Trend missing Overall Energy cutover"
rg -Fq 'navigation ? "health_morning_sleep" : "sleep_quality"' "$plugin/main.js" || fail "Trend does not switch Sleep sources"
rg -Fq 'OPEN_VOYAGE_HOURS = 24' "$plugin/main.js" || fail "Voyage lifecycle missing 24-hour stale guard"
rg -Fq 'cx-navigation-voyage-ticket' "$plugin/main.js" "$plugin/styles.css" || fail "Daily Navigation missing voyage ticket"
rg -Fq 'calendarDayDifference(frontmatter.date, endedAt)' "$plugin/main.js" || fail "Voyage ticket does not derive cross-date arrival offset"
rg -Fq 'cls: "cx-navigation-voyage-day-offset"' "$plugin/main.js" || fail "Voyage ticket missing +N arrival marker"
rg -Fq 'cx-navigation-voyage-line::after' "$plugin/styles.css" || fail "Voyage ticket missing route arrow"
pass "Navigation v1 template, voyage ritual, dual-model compatibility, and trend sources"

health_fields=(health_night_bedtime_at health_night_sleepiness health_night_calmness health_night_awake_reasons health_night_completed_at health_morning_started_at health_morning_sleep health_afternoon_energy_signal health_afternoon_body health_evening_body health_evening_overall_energy health_evening_appetite_stability health_planned_workout health_recommended_workout health_selected_workout health_primary_session_id health_primary_workout health_primary_mode health_primary_source health_workout_status health_workout_completed_sets health_workout_sessions health_actual_workout_mode)
for field in "${health_fields[@]}"; do
  rg -q "^${field}:" "$template" || fail "Daily template missing $field"
  rg -q "\`${field}\`|${field}:" "$schema" || fail "Schema missing $field"
done
rg -q '^```castlex-health-summary$' "$template" || fail "Daily template missing Health Snapshot block"
rg -q 'HEALTH_VIEW_TYPE' "$plugin/main.js" || fail "Plugin missing independent Health Dashboard view"
rg -q 'healthRecommendation' "$plugin/main.js" || fail "Plugin missing deterministic health recommendation engine"
rg -q 'healthMorningCapacity' "$plugin/main.js" || fail "Health Snapshot missing Morning Recovery Capacity"
rg -q 'healthAfternoonState' "$plugin/main.js" || fail "Health Snapshot missing Afternoon Body State"
rg -Fq 'this.renderSignal(fields, file, frontmatter, "health_evening_appetite_stability", "今日整体食欲平稳度"' "$plugin/main.js" || fail "Evening Reflection missing whole-day Appetite Stability signal"
rg -Fq 'this.renderSignal(fields, file, frontmatter, "health_evening_overall_energy", "今日整体精力"' "$plugin/main.js" || fail "Evening Reflection missing Overall Energy signal"
rg -Fq 'this.renderSignal(fields, file, frontmatter, "health_afternoon_body", "身体可用状态"' "$plugin/main.js" || fail "Afternoon check-in missing absolute Body Availability signal"
rg -Fq 'delete next.health_afternoon_body_change' "$plugin/main.js" || fail "Current Daily does not discard the incompatible legacy relative body score"
rg -Fq 'if (hour < 9) return "sleep"' "$plugin/main.js" || fail "Health Dashboard does not recommend Night from midnight through 08:59"
rg -Fq 'if (hour < 14) return "morning"' "$plugin/main.js" || fail "Health Dashboard does not recommend Morning from 09:00 through 13:59"
rg -Fq 'if (hour < 21) return "afternoon"' "$plugin/main.js" || fail "Health Dashboard does not recommend Afternoon from 14:00 through 20:59"
rg -Fq '["sleep", "morning", "afternoon", "evening"]' "$plugin/main.js" || fail "Health Dashboard stages are not ordered Night, Morning, Afternoon, Evening"
rg -Fq 'healthStageComplete(frontmatter, item)' "$plugin/main.js" || fail "Health stage tracker does not derive completion from all core answers"
rg -Fq 'healthStageComplete(frontmatter, "afternoon")' "$plugin/main.js" || fail "Health recommendation does not honor auto-completed Afternoon check-in"
if rg -q 'sleepTargetISO|text: "进入夜间状态"' "$plugin/main.js"; then
  fail "Health still locks Night to a prior date or exposes the removed Evening-to-Night shortcut"
fi
rg -Fq '夜间记录写入 ${targetISO} 自然日' "$plugin/main.js" || fail "Health Night does not disclose natural-date ownership"
rg -q 'health_morning_started_at' "$plugin/main.js" || fail "Health Morning missing 迎接晨光 ritual timestamp"
rg -q 'cx-health-night-ritual' "$plugin/main.js" "$plugin/styles.css" || fail "Night State missing full-width lights-out ritual"
rg -Fq 'next.health_night_bedtime_at = recordedAt' "$plugin/main.js" || fail "Lights-out ritual does not record exact bedtime"
rg -Fq 'this.renderSignal(fields, file, frontmatter, "health_night_sleepiness"' "$plugin/main.js" || fail "Night State missing Sleepiness signal"
rg -Fq 'this.renderSignal(fields, file, frontmatter, "health_night_calmness"' "$plugin/main.js" || fail "Night State missing Calmness signal"
rg -Fq 'this.renderMultiChoice(fields, file, frontmatter, "health_night_awake_reasons"' "$plugin/main.js" || fail "Night State missing multi-select awake reasons"
rg -A18 'health_night_awake_reasons' "$plugin/main.js" | rg -q '担忧／焦虑' || fail "Sleep State missing anxiety awake reason"
rg -A18 'health_night_awake_reasons' "$plugin/main.js" | rg -q '恐惧／恐慌' || fail "Sleep State missing panic awake reason"
rg -Fq 'this.renderMultiChoice(fields, file, frontmatter, "health_morning_discomfort"' "$plugin/main.js" || fail "Morning body feeling is not multi-select"
rg -Fq 'this.renderMultiChoice(fields, file, frontmatter, "health_afternoon_discomfort"' "$plugin/main.js" || fail "Afternoon body feeling is not multi-select"
[[ $(rg -F -o '["chest", "胸部"]' "$plugin/main.js" | wc -l | tr -d ' ') -eq 2 ]] || fail "Morning and Afternoon region choices do not both include chest"
rg -Fq '["shoulders", "upper_back", "chest", "arms"]' "$plugin/main.js" || fail "Chest soreness does not affect Upper-body recommendations"
rg -q '^health_morning_discomfort: \[\]$' "$template" || fail "Daily template does not initialize Morning body feeling as an array"
rg -q 'cx-dashboard-hero-actions' "$plugin/main.js" "$plugin/styles.css" || fail "Dashboard hero actions do not share the vertical three-button layout"
[[ $(rg -o 'cx-dashboard-hero-actions' "$plugin/main.js" | wc -l | tr -d ' ') -eq 3 ]] || fail "Home, Health, and Mental do not all use the shared hero action layout"
rg -A12 '@media \(max-width: 480px\)' "$plugin/styles.css" | rg -q 'cx-health-hero-copy' || fail "Mobile Health and Mental title copy does not override centered flex alignment"
rg -A8 'cx-health-hero-copy,' "$plugin/styles.css" | rg -q 'align-self: stretch' || fail "Mobile Health and Mental title copy does not fill the title card width"
rg -Fq 'text: `${value}/5`' "$plugin/main.js" || fail "Daily Mental Log does not expose the display-direction score"
rg -q 'cx-mental-summary-score' "$plugin/main.js" "$plugin/styles.css" || fail "Daily Mental Log score styling is missing"
rg -Fq 'cls: "cx-mental-ended-status"' "$plugin/main.js" || fail "Mental header does not place the ended status in its copy flow"
rg -Fq '.cx-mental-ended-status {' "$plugin/styles.css" || fail "Mental ended status styling is missing"
rg -Fq 'if (startedAt) {' "$plugin/main.js" || fail "Mental header shows voyage status without a started voyage"
rg -Fq 'lifecycle.active || lifecycle.latestEnded || lifecycle.today' "$plugin/main.js" || fail "Mental target selection drops the latest completed voyage"
if rg -q 'cx-mental-ended-badge' "$plugin/main.js" "$plugin/styles.css"; then
  fail "Mental header still uses the overlapping ended badge"
fi
rg -Fq 'top: 50%; transform: translateY(-50%)' "$plugin/styles.css" || fail "14-day route line is not vertically centered"
rg -Fq 'text: "CastleX Home", cls: "cx-button cx-button-primary"' "$plugin/main.js" || fail "Health and Mental hero navigation lacks the emphasized Home action"
rg -q 'skipRotation' "$plugin/main.js" || fail "Health rotation missing Skip Current action"
rg -q '^health_rotation_skipped:' "$template" || fail "Daily template missing rotation skip state"
rg -q 'prepareAdditionalWorkout' "$plugin/main.js" || fail "Workout Mode missing prepared additional session support"
rg -q 'health_workout_status = "ready"' "$plugin/main.js" || fail "Additional Workout starts timing before explicit Start Workout"
rg -q 'health_current_session_role = "additional"' "$plugin/main.js" || fail "Additional workout does not preserve a separate session role"
rg -q 'normalizePrimaryWorkout' "$plugin/main.js" || fail "Legacy workout sessions do not migrate to stable primary/additional roles"
rg -Fq 'session.role === "primary" ? "主训练" : "追加"' "$plugin/main.js" || fail "Completed workout cards do not label primary and additional sessions"
rg -q 'healthWorkoutPlan' "$plugin/main.js" || fail "Workout Mode missing explicit Standard and Light plans"
rg -q '山羊挺身' "$plugin/main.js" || fail "Workout plan missing 山羊挺身 naming"
rg -Fq 'healthModeLabel(session.mode)' "$plugin/main.js" || fail "Completed sessions do not display Standard or Light mode"
rg -q 'planned_working_sets' "$plugin/main.js" || fail "Completed sessions do not preserve working-set totals"
rg -q 'cx-health-set-breakdown' "$plugin/styles.css" || fail "Workout Mode does not separate working and warm-up set progress"
rg -Fq 'content: "✓"' "$plugin/styles.css" || fail "Completed Health Check-ins do not use a check mark"
rg -q 'cx-health-summary-tag' "$plugin/main.js" "$plugin/styles.css" || fail "Daily Health Snapshot missing compact workout status tag"
rg -q 'trendPages.push' "$plugin/main.js" || fail "Mobile Health trends do not force-include freshly read Today data"
[[ "$(rg -c 'cls: "cx-mobile-scroll-spacer"' "$plugin/main.js")" -ge 3 ]] || fail "Dashboards missing real mobile bottom spacer elements"
rg -Fq 'overflow-y: scroll !important' "$plugin/styles.css" || fail "Mobile Dashboards missing constrained scroll containers"
rg -Fq '168px + env(safe-area-inset-bottom)' "$plugin/styles.css" || fail "Mobile Dashboards missing balanced bottom toolbar safe space"
rg -Fq 'scroll-margin-bottom: calc(168px + env(safe-area-inset-bottom))' "$plugin/styles.css" || fail "Final Dashboard cards missing mobile toolbar clearance"
rg -Fq '.cx-health-dashboard-content > .cx-mobile-scroll-spacer' "$plugin/styles.css" || fail "Health Dashboard spacer is not anchored after ordered mobile sections"
rg -Fq 'order: 5' "$plugin/styles.css" || fail "Health Dashboard spacer is not placed after insights"
if rg -q '接受当前建议' "$plugin/main.js"; then
  fail "Health direction still contains redundant Accept Recommendation action"
fi
if rg -q 'health_workout_stopped_early|到这里结束并保存' "$plugin/main.js" "$template" "$schema"; then
  fail "Workout Mode still contains removed early-finish state"
fi
rg -q 'cx-health-progress-track' "$plugin/styles.css" || fail "Health Workout Mode missing progress bar"
pass "Health Dashboard fields, rules, summary, and workout progress"

mental_fields=(mental_evening_mood mental_evening_load mental_evening_clarity mental_evening_thought_occupancy mental_evening_connection mental_evening_stress_source mental_evening_emotions mental_evening_relief_factors mental_evening_closure mental_evening_recorded_at mental_evening_completed_at)
for field in "${mental_fields[@]}"; do
  rg -q "^${field}:" "$template" || fail "Daily template missing $field"
  rg -q "\`${field}\`|${field}:" "$schema" || fail "Schema missing $field"
done
rg -q '^```castlex-mental-summary$' "$template" || fail "Daily template missing Mental Log block"
rg -q 'MENTAL_VIEW_TYPE' "$plugin/main.js" || fail "Plugin missing Mental Dashboard view"
rg -Fq '用舍由时，行藏在我。' "$plugin/main.js" || fail "Mental Dashboard missing signature"
rg -q 'class CastleXMentalView' "$plugin/main.js" || fail "Plugin missing Mental Dashboard renderer"
rg -Fq 'rain-glass-mental-lighthouse-desktop-v2.webp' "$plugin/main.js" || fail "Mental Dashboard missing desktop lighthouse background"
rg -Fq 'rain-glass-mental-lighthouse-mobile-v2.webp' "$plugin/main.js" || fail "Mental Dashboard missing mobile lighthouse background"
rg -Fq 'mentalDisplayValue(metric' "$plugin/main.js" || fail "Mental Dashboard missing compatible positive-direction display mapping"
rg -Fq 'cx-mental-star-petal' "$plugin/main.js" "$plugin/styles.css" || fail "Mental Dashboard missing five-petal star lights"
rg -Fq 'grid-template-columns: repeat(5, minmax(0, 1fr))' "$plugin/styles.css" || fail "Mental metrics are not a compact five-column desktop grid"
rg -Fq 'petal.setAttribute("role", "button")' "$plugin/main.js" || fail "Mental star petals are not directly interactive"
rg -Fq 'height: 62px' "$plugin/styles.css" || fail "Mental desktop star is not reduced to the compact size"
rg -Fq 'font-size: .61rem' "$plugin/styles.css" || fail "Mental Today wind choice text is not enlarged"
if rg -q 'cx-mental-slider|cx-mental-star-center|向上推一点|点亮暖灯' "$plugin/main.js" "$plugin/styles.css"; then
  fail "Mental Dashboard still contains the removed slider, center dot, or interaction prompt"
fi
rg -Fq 'grid-template-columns: repeat(auto-fit, minmax(104px, 1fr))' "$plugin/styles.css" || fail "Mental Today wind choices are not equal-width cards"
if rg -q 'cx-mental-stale-note|超过24小时的旧航程尚未收束' "$plugin/main.js" "$plugin/styles.css"; then
  fail "Mental Dashboard still exposes the removed stale-voyage notice"
fi
rg -Fq 'cx-mental-wind-row' "$plugin/main.js" "$plugin/styles.css" || fail "Mental Dashboard missing full-width Today wind rows"
rg -Fq 'cx-mental-static-paper is-back' "$plugin/main.js" || fail "Mental closure missing static two-page icon"
rg -Fq 'cx-mental-static-envelope-paper' "$plugin/main.js" || fail "Mental closure missing static letter-in-envelope icon"
rg -Fq 'setIcon(icon, "plane")' "$plugin/main.js" || fail "Mental closure missing conventional airplane icon"
rg -Fq '{ rerender: false }' "$plugin/main.js" || fail "Mental choices do not update in place"
rg -Fq 'next.mental_evening_closure = value' "$plugin/main.js" || fail "Mental Dashboard missing closure interaction"
rg -Fq 'frontmatter.voyage_ended_at = endedAt' "$plugin/main.js" || fail "Mental Dashboard does not close the voyage"
rg -Fq 'this.plugin.activateHealthView("sleep")' "$plugin/main.js" || fail "Mental closure does not lead to Health Sleep"
if rg -q '夜间航海日志|cx-mental-sea-portrait|cx-mental-word-slot|is-animating|ui-serif|Georgia' "$plugin/main.js" "$plugin/styles.css"; then
  fail "Mental Dashboard still contains removed title, scene, sentence slots, motion state, or serif typeface"
fi
if rg -q '14-day Mental|mental.*trend|Mental.*14-day' "$plugin/main.js"; then
  fail "Mental Dashboard prematurely implements deferred 14-day review"
fi
pass "Mental Dashboard evening log, context, closure, and Daily summary"

rg -q 'Late entry' "$schema" || fail "Schema missing late-entry rule"
rg -q '休整日' "$schema" || fail "Schema missing retrospective rest-day rule"
rg -q 'navigation_recorded_at' "$plugin/main.js" || fail "Dashboard missing Navigation timestamp support"
rg -q 'state_recorded_at' "$plugin/main.js" || fail "Dashboard missing legacy Daily State timestamp support"
pass "Navigation and legacy timing and voyage eligibility rules"

rg -q '^focus: false$' "$project_template" || fail "Project template missing focus default"
rg -q '^progress_sections:$' "$project_template" || fail "Project template missing progress sections"
rg -q '^  Tasks: 100$' "$project_template" || fail "Project template missing default Tasks weight"
rg -q '`focus`|focus:' "$schema" || fail "Schema missing Project focus field"
rg -q '`progress_sections`|progress_sections:' "$schema" || fail "Schema missing Project progress sections"
rg -q 'Upcoming Tasks' "$schema" || fail "Schema missing Upcoming Tasks behavior"
if rg -q '^task_section:|^progress:' "$project_template"; then
  fail "Project template contains deprecated task_section or manual progress"
fi
pass "Project focus, weighted progress sections, and Upcoming Tasks fields"

rg -q 'castlex-leetcode-tracker' "$plugin/main.js" "$schema" || fail "Plugin or Schema missing embedded LeetCode Project tracker"
rg -q 'class LeetCodeTrackerChild' "$plugin/main.js" || fail "Plugin missing LeetCode Tracker render child"
rg -Fq 'from_obsidian/session_events.jsonl' "$plugin/main.js" || fail "LeetCode Tracker missing Bridge session output"
rg -Fq 'appendFile(target' "$plugin/main.js" || fail "LeetCode Tracker does not append completed sessions"
rg -q 'cx-lc-timer-ring' "$plugin/styles.css" || fail "LeetCode Tracker missing visual timer"
rg -q 'leetcodeTimers' "$plugin/main.js" || fail "LeetCode Tracker timer state is not persisted"
rg -q 'TRACKER_PHASES' "$plugin/main.js" || fail "LeetCode Tracker missing optional phase timing"
rg -q 'phase_seconds' "$plugin/main.js" "$schema" || fail "LeetCode Tracker missing phase output"
rg -q 'phase_tracking' "$plugin/main.js" || fail "LeetCode Tracker cannot distinguish N/A from intentional zero"
rg -q 'unclassified_seconds' "$plugin/main.js" "$schema" || fail "LeetCode Tracker missing unclassified time"
rg -q 'initializes all three values to zero' "$schema" || fail "Schema does not define N/A-to-zero phase transition"
rg -Fq 'height: auto !important' "$plugin/styles.css" || fail "LeetCode phase labels may be clipped by theme button height"
rg -Fq '{ id: "implementation", label: "Implementing" }' "$plugin/main.js" || fail "LeetCode phase labels are not consistently action-oriented"
rg -Fq '.cx-lc-phase-choices { display: grid; gap: 7px; grid-template-columns: 1fr; }' "$plugin/styles.css" || fail "LeetCode phase controls are not stacked full-width rows"
rg -Fq 'Finish · Completed' "$plugin/main.js" || fail "LeetCode Tracker missing explicit completion action"
rg -q 'never writes Daily Note time fields' "$schema" || fail "Schema does not preserve LeetCode/Daily time boundary"
pass "embedded desktop Project tracker, optional phase timing, and Bridge session boundary"

rg -q '^```castlex-time-rings$' "$template" || fail "Daily template missing time-ring block"
previous_line=0
daily_sections=("## Time & Task Log" "## Health Snapshot" "## Mental Log" "## Today’s Wins" "## Completed Today" "## Open Loops" "## Backlog" "## Raw Notes")
for section in "${daily_sections[@]}"; do
  line="$(rg -n -F -m 1 "$section" "$template" | cut -d: -f1)"
  [[ -n "$line" ]] || fail "Daily template missing section: $section"
  (( line > previous_line )) || fail "Daily template section out of order: $section"
  previous_line="$line"
done
rg -Fq '14:00–17:00 window · 1h engaged · System · Dashboard' "$template" "$schema" || fail "Daily task log missing mixed-window example"
rg -Fq 'Do not create an `End-of-day Evidence` section.' "$schema" || fail "Schema does not prohibit End-of-day Evidence"
rg -Fq '不得包含时间戳、日期、时段或投入时长' "$template" || fail "Completed Today does not prohibit task-log timing details"
rg -Fq '**时间补充：**  7 月 26 日凌晨约 01:30–03:00' "$template" "$schema" || fail "Raw Notes bold-label spacing rule is missing"
if rg -q '^## (Decisions & Insights|AI Summary)$|^### (Project Contributions|Life & Admin)$' "$template"; then
  fail "Daily template contains a removed or nested synthesis section"
fi
for deprecated in project_contribution admin_load activity_origin activity_reviewed; do
  if rg -q "^${deprecated}:" "$template"; then
    fail "Daily template still contains deprecated field: $deprecated"
  fi
done
pass "time-ring block, Time & Task Log, and four-section Daily synthesis structure"

rg -q '^```castlex-weekly-snapshot$' "$weekly_template" || fail "Weekly template missing weekly snapshot block"
for field in period_start period_end; do
  rg -q "^${field}:" "$weekly_template" || fail "Weekly template missing $field"
done
rg -q 'castlex-weekly-snapshot' "$plugin/main.js" || fail "Dashboard missing Weekly Snapshot processor"
rg -Fq 'navigation ? "navigation_activation" : "agency"' "$plugin/main.js" || fail "Weekly Snapshot does not switch Activation sources"
rg -Fq 'stateTrendValue(day.frontmatter, "sleep")' "$plugin/main.js" || fail "Weekly Snapshot does not use the dual-model Sleep source"
if rg -q 'cx-weekly-review|Verify AI review|Weekly AI review' "$plugin/main.js" "$plugin/styles.css" "$weekly_template"; then
  fail "Weekly Snapshot still contains AI review controls"
fi
rg -q 'Weekly Review' "$schema" || fail "Schema missing Weekly Review rules"
pass "Weekly Snapshot, source period, and read-only derived data"

for script in "$SYSTEM_ROOT"/scripts/*.sh; do bash -n "$script"; done
rg -Fq 'args+=(--exclude=data.json)' "$SYSTEM_ROOT/scripts/deploy-system.sh" || fail "System deployment does not preserve private plugin data.json"
pass "shell script syntax"

obsolete_root="${HOME}/Documents/Castle"
if rg -n --hidden "/Users/[^/]+/|${obsolete_root}" "$SYSTEM_ROOT" \
  --glob '!**/scripts/verify-system.sh' \
  --glob '!**/plugin/castlex-dashboard/main.js.map'; then
  fail "user-specific or obsolete absolute path found"
fi
pass "no user-specific or obsolete development path"

banned=(01_Inbox 10_Journal 20_Areas 30_Projects 40_Library 99_Archive AI-Ledger 90_System/AI-Ledger CastleX)
for rel in "${banned[@]}"; do
  [[ ! -e "$SYSTEM_ROOT/$rel" ]] || fail "private path present: $rel"
done
if find "$SYSTEM_ROOT" -type d \( -name AI-Ledger -o -name 10_Journal -o -name 30_Projects \) -print -quit | grep -q .; then
  fail "nested private Vault directory found"
fi
pass "private Vault directories absent"

while IFS= read -r asset; do
  [[ -n "$asset" ]] || continue
  [[ "$asset" != */* && "$asset" != .* && -f "$SYSTEM_ROOT/assets/$asset" ]] || fail "unsafe or missing allowlisted asset: $asset"
done < "$SYSTEM_ROOT/assets/allowlist.txt"
pass "asset allowlist"

if git -C "$SYSTEM_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  while IFS= read -r staged; do
    case "$staged" in
      CastleX/*|01_Inbox/*|10_Journal/*|20_Areas/*|30_Projects/*|40_Library/*|99_Archive/*|AI-Ledger/*|90_System/AI-Ledger/*|*/01_Inbox/*|*/10_Journal/*|*/20_Areas/*|*/30_Projects/*|*/40_Library/*|*/99_Archive/*|*/AI-Ledger/*|*.icloud|*.DS_Store)
        fail "private or device file staged: $staged"
        ;;
    esac
  done < <(git -C "$SYSTEM_ROOT" diff --cached --name-only)
  pass "Git staged-path privacy check"
fi

compare_target() {
  local target="$1"
  diff -qr --exclude=data.json "$plugin" "$target/.obsidian/plugins/castlex-dashboard" >/dev/null || fail "plugin differs at $target"
  diff -qr "$SYSTEM_ROOT/templates" "$target/90_System/Templates" >/dev/null || fail "templates differ at $target"
  diff -qr "$SYSTEM_ROOT/schemas" "$target/90_System/Schemas" >/dev/null || fail "schemas differ at $target"
  while IFS= read -r asset; do
    [[ -n "$asset" ]] || continue
    cmp -s "$SYSTEM_ROOT/assets/$asset" "$target/90_System/Assets/$asset" || fail "asset differs at $target: $asset"
  done < "$SYSTEM_ROOT/assets/allowlist.txt"
}

if [[ "$check_local" == yes ]]; then
  compare_target "$LOCAL_VAULT"
  pass "source equals local CastleX system files"
fi
if [[ "$check_icloud" == yes ]]; then
  compare_target "$ICLOUD_VAULT"
  pass "source equals iCloud CastleX system files"
fi

echo "CastleX-System verification complete."
