const {
  ItemView,
  MarkdownRenderChild,
  Notice,
  Platform,
  Plugin,
  TFile,
  normalizePath,
  parseYaml,
  setIcon,
} = require("obsidian");

const VIEW_TYPE = "castlex-home";
const HEALTH_VIEW_TYPE = "castlex-health";
const MENTAL_VIEW_TYPE = "castlex-mental";
const DAILY_ROOT = "10_Journal/Daily";
const WEEKLY_ROOT = "10_Journal/Weekly";
const PROJECT_ROOT = "30_Projects";
const DESKTOP_ASSET_PATH = "90_System/Assets/rain-glass-sunset-beach-v2.webp";
const MOBILE_ASSET_PATH = "90_System/Assets/rain-glass-sunset-mobile-v1.webp";
const HEALTH_DESKTOP_ASSET_PATH = "90_System/Assets/rain-glass-outdoor-pool-desktop-v1.webp";
const HEALTH_MOBILE_ASSET_PATH = "90_System/Assets/rain-glass-outdoor-pool-mobile-v1.webp";
const MENTAL_DESKTOP_ASSET_PATH = "90_System/Assets/rain-glass-mental-lighthouse-desktop-v2.webp";
const MENTAL_MOBILE_ASSET_PATH = "90_System/Assets/rain-glass-mental-lighthouse-mobile-v2.webp";
const NAVIGATION_CUTOVER = "2026-07-25";
const OVERALL_ENERGY_CUTOVER = "2026-07-26";
const HEALTH_SCHEDULE_CUTOVER = "2026-08-07";
const OPEN_VOYAGE_HOURS = 24;
const WORKSTREAM_STATES = [
  { id: "active", label: "Active", capacity: "Growth capacity" },
  { id: "maintenance", label: "Maintenance", capacity: "Continuity only" },
  { id: "incubating", label: "Incubating", capacity: "No default capacity" },
  { id: "paused", label: "Paused", capacity: "No current capacity" },
  { id: "closed", label: "Closed", capacity: "History only" },
];
const LEGACY_WORKSTREAM_STATES = {
  "on-hold": "paused",
  someday: "incubating",
  completed: "closed",
  cancelled: "closed",
};
const LEGACY_REQUIRED = [
  "sleep_quality",
  "physical_state",
  "stress",
  "energy",
  "agency",
  "appetite_stability",
];
const LEGACY_METRICS = [
  { key: "sleep_quality", label: "睡眠质量", hint: "Sleep quality" },
  { key: "physical_state", label: "身体状态", hint: "Physical state" },
  { key: "appetite_stability", label: "食欲稳定", hint: "Appetite stability" },
  { key: "energy", label: "精力", hint: "Energy" },
  { key: "stress", label: "压力", hint: "Stress · 1 low / 5 high" },
  { key: "agency", label: "行动感", hint: "Agency / ability to start" },
];
const NAVIGATION_REQUIRED = [
  "navigation_direction",
  "navigation_activation",
  "navigation_work_energy",
  "navigation_focus",
  "navigation_calmness",
  "navigation_outlook",
];
const NAVIGATION_METRICS = [
  { key: "navigation_direction", label: "航向清晰", hint: "今日优先项与节奏" },
  { key: "navigation_activation", label: "启动意愿", hint: "此刻愿意开始行动" },
  { key: "navigation_work_energy", label: "工作能量", hint: "此刻可投入的能量" },
  { key: "navigation_focus", label: "专注程度", hint: "注意力进入工作块" },
  { key: "navigation_calmness", label: "内心平和", hint: "紧绷躁动 → 平静安定" },
  { key: "navigation_outlook", label: "今日展望", hint: "沉重消极 → 积极期待" },
];
const MENTAL_METRICS = [
  {
    key: "mental_evening_mood",
    label: "情绪亮度",
    hint: "今天整体的情绪底色",
    choices: ["低沉", "偏暗", "平静", "轻快", "明亮"],
  },
  {
    key: "mental_evening_load",
    label: "心理余量",
    hint: "此刻还剩多少可以安放自己的空间",
    choices: ["紧绷", "局促", "尚可", "宽裕", "舒展"],
    inverted: true,
  },
  {
    key: "mental_evening_clarity",
    label: "思维清晰",
    hint: "回看今天时，思路有多清楚",
    choices: ["混沌", "模糊", "一般", "清楚", "通透"],
  },
  {
    key: "mental_evening_thought_occupancy",
    label: "思绪留白",
    hint: "此刻心绪里还有多少空白",
    choices: ["拥挤", "偏满", "尚可", "较松", "留白"],
    inverted: true,
  },
  {
    key: "mental_evening_connection",
    label: "连接感受",
    hint: "今天与自己、他人或世界的连接",
    choices: ["疏离", "偏远", "一般", "有连接", "很有连接"],
  },
];
const MENTAL_STRESS_SOURCES = [
  ["none", "无明显压力"],
  ["work_study", "工作／学习"],
  ["health_body", "身体与健康"],
  ["relationships", "关系与社交"],
  ["uncertainty", "不确定性"],
  ["life_admin", "生活事务"],
  ["finance", "财务"],
  ["environment", "环境"],
  ["other", "其他"],
];
const MENTAL_EMOTIONS = [
  ["peaceful", "平静"],
  ["hopeful", "期待"],
  ["fulfilled", "充实"],
  ["joyful", "愉快"],
  ["grateful", "感激"],
  ["tired", "疲惫"],
  ["anxious", "焦虑"],
  ["sad", "低落"],
  ["wronged", "委屈"],
  ["angry", "愤怒"],
  ["frustrated", "挫败"],
  ["lonely", "孤独"],
  ["numb", "麻木"],
  ["conflicted", "矛盾"],
];
const MENTAL_RELIEF_FACTORS = [
  ["rest", "休息"],
  ["movement", "运动／活动"],
  ["conversation", "交流与陪伴"],
  ["progress", "完成与推进"],
  ["music_reading", "音乐／阅读"],
  ["solitude", "独处"],
  ["care", "饮食／洗澡／照顾身体"],
  ["nature", "自然与户外"],
  ["structure", "计划与秩序"],
  ["none", "没有明显帮助"],
  ["other", "其他"],
];
const MENTAL_CLOSURES = [
  ["active", "还在心上", "两张信纸仍留在这里", "files"],
  ["shelved", "暂时搁置", "把信纸收入信封", "envelope"],
  ["released", "可以放下", "让这封信离开这里", "plane"],
];
const ALL_CHECKIN_METRICS = [...LEGACY_METRICS, ...NAVIGATION_METRICS];
const TIME_METRICS = [
  {
    id: "project",
    key: "project_minutes",
    originKey: "project_minutes_origin",
    label: "Project",
    labelZh: "项目",
    unit: 60,
    goal: 180,
  },
  {
    id: "enrichment",
    key: "enrichment_minutes",
    originKey: "enrichment_minutes_origin",
    label: "Enrichment",
    labelZh: "个人充实",
    unit: 60,
    goal: 180,
  },
  {
    id: "workout",
    key: "workout_minutes",
    originKey: "workout_minutes_origin",
    label: "Workout",
    labelZh: "运动",
    unit: 30,
    goal: 90,
  },
  {
    id: "admin",
    key: "admin_minutes",
    originKey: "admin_minutes_origin",
    label: "Admin",
    labelZh: "日常维护",
    unit: 30,
    goal: 90,
  },
];
const HEALTH_ROTATION = ["pool", "back", "pool", "upper", "legs"];
const HEALTH_WORKOUTS = {
  pool: {
    label: "水中慢跑",
    shortLabel: "Pool",
    duration: 60,
    purpose: "降低压力，帮助恢复与睡眠。",
    plans: {
      standard: {
        summary: "Pool Running · 60 分钟",
        exercises: [],
      },
      light: {
        summary: "Pool Running · 30–45 分钟",
        exercises: [],
      },
    },
  },
  back: {
    label: "背部训练",
    shortLabel: "Back",
    duration: 60,
    purpose: "改善圆肩与上背紧绷，建立背部力量。",
    plans: {
      standard: {
        exercises: [
          { id: "lat_pulldown", label: "高位下拉", english: "Lat Pulldown", warmup: true, sets: 3, reps: "8–12" },
          { id: "seated_cable_row", label: "坐姿绳索划船", english: "Seated Cable Row", warmup: true, sets: 3, reps: "8–12" },
          { id: "face_pull", label: "面拉", english: "Face Pull", warmup: true, sets: 3, reps: "12–15" },
          { id: "dumbbell_curl", label: "哑铃弯举", english: "Dumbbell Curl", warmup: true, sets: 3, reps: "10–12" },
          { id: "back_extension", label: "山羊挺身", english: "Back Extension", warmup: false, sets: 3, reps: "12–15" },
        ],
      },
      light: {
        exercises: [
          { id: "lat_pulldown", label: "高位下拉", english: "Lat Pulldown", warmup: true, sets: 3, reps: "8–12" },
          { id: "seated_cable_row", label: "坐姿绳索划船", english: "Seated Cable Row", warmup: true, sets: 3, reps: "8–12" },
          { id: "face_pull", label: "面拉", english: "Face Pull", warmup: false, sets: 3, reps: "12–15" },
          { id: "back_extension", label: "山羊挺身", english: "Back Extension", warmup: false, sets: 2, reps: "12–15" },
        ],
      },
    },
  },
  upper: {
    label: "上肢训练",
    shortLabel: "Upper",
    duration: 60,
    purpose: "肩部与手臂优先，胸部保持适量。",
    plans: {
      standard: {
        exercises: [
          { id: "dumbbell_bench_press", label: "哑铃卧推", english: "Dumbbell Bench Press", warmup: true, sets: 3, reps: "8–10" },
          { id: "dumbbell_shoulder_press", label: "哑铃肩推", english: "Dumbbell Shoulder Press", warmup: true, sets: 3, reps: "8–10" },
          { id: "dumbbell_lateral_raise", label: "哑铃侧平举", english: "Dumbbell Lateral Raise", warmup: true, sets: 3, reps: "12–15" },
          { id: "cable_triceps_pushdown", label: "绳索下压", english: "Cable Triceps Pushdown", warmup: true, sets: 3, reps: "10–12" },
        ],
      },
      light: {
        exercises: [
          { id: "dumbbell_bench_press", label: "哑铃卧推", english: "Dumbbell Bench Press", warmup: true, sets: 3, reps: "8–10" },
          { id: "dumbbell_shoulder_press", label: "哑铃肩推", english: "Dumbbell Shoulder Press", warmup: true, sets: 3, reps: "8–10" },
          { id: "dumbbell_lateral_raise", label: "哑铃侧平举", english: "Dumbbell Lateral Raise", warmup: false, sets: 3, reps: "12–15" },
        ],
      },
    },
  },
  legs: {
    label: "腿部训练",
    shortLabel: "Legs",
    duration: 60,
    purpose: "维持下肢力量，不追逐极限重量。",
    plans: {
      standard: {
        exercises: [
          { id: "barbell_back_squat", label: "杠铃深蹲", english: "Barbell Back Squat", warmup: true, sets: 3, reps: "6–8" },
          { id: "bulgarian_split_squat", label: "保加利亚分腿蹲", english: "Bulgarian Split Squat", warmup: true, sets: 3, reps: "每侧 8–10" },
          { id: "leg_curl", label: "腿弯举", english: "Leg Curl", warmup: true, sets: 3, reps: "10–12" },
          { id: "dumbbell_romanian_deadlift", label: "哑铃罗马尼亚硬拉", english: "Dumbbell Romanian Deadlift", warmup: true, sets: 3, reps: "8–12" },
          { id: "back_extension", label: "山羊挺身", english: "Back Extension", warmup: false, sets: 3, reps: "12–15" },
        ],
      },
      light: {
        exercises: [
          { id: "barbell_back_squat", label: "杠铃深蹲", english: "Barbell Back Squat", warmup: true, sets: 3, reps: "6–8" },
          { id: "bulgarian_split_squat", label: "保加利亚分腿蹲", english: "Bulgarian Split Squat", warmup: false, sets: 3, reps: "每侧 8–10" },
          { id: "leg_curl", label: "腿弯举", english: "Leg Curl", warmup: false, sets: 3, reps: "10–12" },
          { id: "back_extension", label: "山羊挺身", english: "Back Extension", warmup: false, sets: 2, reps: "12–15" },
        ],
      },
    },
  },
  stretch: {
    label: "轻柔拉伸",
    shortLabel: "Stretch",
    duration: 15,
    purpose: "降低身体紧绷，不设置完成压力。",
    plans: { recovery: { summary: "轻柔拉伸 · 10–15 分钟", exercises: [] } },
  },
  rest: {
    label: "今日休息",
    shortLabel: "Rest",
    duration: 0,
    purpose: "恢复本身就是训练计划的一部分。",
    plans: { recovery: { summary: "完整休息", exercises: [] } },
  },
};
const HEALTH_SIGNAL_LABELS = {
  sleep: ["很差", "偏差", "一般", "不错", "很好"],
  recovery: ["精疲力尽", "很疲惫", "普通", "有恢复", "很清醒"],
  body: ["很沉重", "偏沉重", "一般", "比较舒展", "状态很好"],
  outlook: ["很抗拒", "有些沉重", "中性", "愿意开始", "很期待"],
  energy: ["几乎没有精力", "精力偏低", "精力一般", "比较有精力", "精力充足"],
  calmness: ["非常紧绷", "压力较高", "一般", "比较平稳", "很平静"],
  sleepiness: ["完全不困", "有一点困", "开始有睡意", "已经很困", "随时可以入睡"],
  nightCalmness: ["思绪很亢奋", "比较活跃", "一般", "逐渐安静", "非常平静"],
  clarity: ["脑雾很重", "比较模糊", "一般", "比较清晰", "很清晰"],
  eveningBody: ["很不舒服", "偏疲惫", "一般", "比较舒服", "很舒服"],
  appetiteStability: ["很不平稳", "不太平稳", "一般", "比较平稳", "非常平稳"],
  postWorkout: ["消耗过大", "有些透支", "一般", "感觉不错", "恢复良好"],
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function localISO(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date, amount) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + amount);
  return next;
}

function dateFromISO(value) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

function dailyPathFromISO(value) {
  const iso = isoDateValue(value);
  return iso ? `${DAILY_ROOT}/${iso.slice(0, 4)}/${iso.slice(5, 7)}/${iso}.md` : null;
}

function weeklyPathFromPeriod(startValue, endValue) {
  const start = isoDateValue(startValue);
  const end = isoDateValue(endValue);
  return start && end ? `${WEEKLY_ROOT}/${start}--${end}.md` : null;
}

function dateRange(startValue, endValue, maximumDays = 31) {
  const start = dateFromISO(isoDateValue(startValue));
  const end = dateFromISO(isoDateValue(endValue));
  if (!start || !end || start > end) return [];
  const dates = [];
  let cursor = start;
  while (cursor <= end && dates.length < maximumDays) {
    dates.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return dates;
}

function average(values) {
  const numeric = values.filter((value) => Number.isFinite(value));
  return numeric.length ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length : null;
}

function isoWeek(date) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${pad(week)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rating(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 && number <= 5 ? number : null;
}

function mentalDisplayValue(metric, value) {
  const stored = rating(value);
  if (stored === null) return null;
  return metric.inverted ? 6 - stored : stored;
}

function mentalStoredValue(metric, value) {
  return metric.inverted ? 6 - value : value;
}

function minutesValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
}

function timeLevel(value, metric) {
  const minutes = minutesValue(value);
  if (minutes === null) return null;
  if (minutes === 0) return 0;
  return Math.min(4, Math.floor(minutes / metric.unit) + 1);
}

function formatDuration(value) {
  const minutes = minutesValue(value);
  if (minutes === null) return "Not recorded";
  if (minutes === 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function timeThresholdLabel(metric) {
  if (metric.unit === 60) return "<1h · <2h · <3h · ≥3h";
  return "<30m · <60m · <90m · ≥90m";
}

function healthWorkout(id) {
  return HEALTH_WORKOUTS[id] ?? HEALTH_WORKOUTS.pool;
}

function usesHealthScheduleV2(value = new Date()) {
  const iso = value instanceof Date ? localISO(value) : isoDateValue(value?.date ?? value);
  return Boolean(iso && iso >= HEALTH_SCHEDULE_CUTOVER);
}

function healthStageForTime(date = new Date()) {
  const hour = date.getHours();
  if (usesHealthScheduleV2(date)) {
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    if (hour < 22) return "evening";
    return "sleep";
  }
  if (hour < 9) return "sleep";
  if (hour < 14) return "morning";
  if (hour < 21) return "afternoon";
  return "evening";
}

function healthStageOrder(value) {
  return usesHealthScheduleV2(value)
    ? ["morning", "afternoon", "evening", "sleep"]
    : ["sleep", "morning", "afternoon", "evening"];
}

function healthPostVoyageStage(date = new Date()) {
  if (!usesHealthScheduleV2(date)) return "sleep";
  return date.getHours() < 12 ? "morning" : "sleep";
}

function healthSignal(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 && number <= 5 ? number : null;
}

function healthAfternoonEnergy(frontmatter) {
  return healthSignal(frontmatter.health_afternoon_energy_signal);
}

function healthArray(value) {
  return Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
}

const HEALTH_STAGE_REQUIRED = {
  morning: [
    ["health_morning_sleep", "signal"],
    ["health_morning_recovery", "signal"],
    ["health_morning_body", "signal"],
    ["health_morning_outlook", "signal"],
    ["health_morning_dream", "choice"],
    ["health_morning_regions", "multi"],
    ["health_morning_discomfort", "multi"],
    ["health_morning_need", "choice"],
  ],
  afternoon: [
    ["health_afternoon_energy_signal", "signal"],
    ["health_afternoon_calmness", "signal"],
    ["health_afternoon_clarity", "signal"],
    ["health_afternoon_body", "signal"],
    ["health_afternoon_nap", "choice"],
    ["health_afternoon_regions", "multi"],
    ["health_afternoon_discomfort", "multi"],
    ["health_afternoon_preference", "choice"],
  ],
  evening: [
    ["health_evening_body", "signal"],
    ["health_evening_overall_energy", "signal"],
    ["health_evening_appetite_stability", "signal"],
  ],
};

function healthFieldAnswered(frontmatter, [key, kind]) {
  if (kind === "signal") return healthSignal(frontmatter?.[key]) !== null;
  if (kind === "multi") return healthArray(frontmatter?.[key]).length > 0;
  return String(frontmatter?.[key] ?? "").trim().length > 0;
}

function healthStageComplete(frontmatter, stage) {
  const timestampKeys = {
    sleep: "health_night_completed_at",
    morning: "health_morning_completed_at",
    afternoon: "health_afternoon_completed_at",
    evening: "health_evening_completed_at",
  };
  if (frontmatter?.[timestampKeys[stage]]) return true;
  if (stage === "sleep") return Boolean(frontmatter?.health_night_bedtime_at);
  const required = [...(HEALTH_STAGE_REQUIRED[stage] || [])];
  if (
    stage === "evening"
    && ["active", "completed"].includes(String(frontmatter?.health_workout_status || ""))
  ) {
    required.push(["health_evening_post_workout", "signal"]);
  }
  return required.length > 0 && required.every((field) => healthFieldAnswered(frontmatter, field));
}

function healthWorkoutIsStrength(id) {
  return ["back", "upper", "legs"].includes(id);
}

function healthWorkoutSupportsModes(id) {
  return ["pool", "back", "upper", "legs"].includes(id);
}

function healthModeLabel(mode) {
  if (mode === "light") return "Light";
  if (mode === "recovery") return "Recovery";
  return "Standard";
}

function healthWorkoutPlan(workoutId, mode = "standard") {
  const workout = healthWorkout(workoutId);
  const normalizedMode = mode === "light" ? "light" : mode === "recovery" ? "recovery" : "standard";
  return workout.plans?.[normalizedMode]
    ?? workout.plans?.standard
    ?? workout.plans?.recovery
    ?? { exercises: [] };
}

function healthPlanSetCounts(workoutId, mode = "standard") {
  return healthWorkoutPlan(workoutId, mode).exercises.reduce((counts, exercise) => {
    counts.working += exercise.sets;
    if (exercise.warmup) counts.warmup += 1;
    return counts;
  }, { working: 0, warmup: 0 });
}

function healthCompletedSetCounts(values) {
  return healthArray(values).reduce((counts, key) => {
    if (String(key).endsWith(":warmup")) counts.warmup += 1;
    else counts.working += 1;
    return counts;
  }, { working: 0, warmup: 0 });
}

function healthRotationSlot(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number < HEALTH_ROTATION.length ? number : null;
}

function healthTotalSets(workoutId, mode = "standard") {
  const plan = healthWorkoutPlan(workoutId, mode);
  return plan.exercises.reduce((total, exercise) => {
    return total + exercise.sets + (exercise.warmup ? 1 : 0);
  }, 0);
}

function healthSetKeys(workoutId, mode = "standard") {
  const keys = [];
  healthWorkoutPlan(workoutId, mode).exercises.forEach((exercise) => {
    if (exercise.warmup) keys.push(`${exercise.id}:warmup`);
    for (let index = 1; index <= exercise.sets; index += 1) keys.push(`${exercise.id}:set_${index}`);
  });
  return keys;
}

function healthWorkoutSessions(frontmatter) {
  const stored = Array.isArray(frontmatter.health_workout_sessions)
    ? frontmatter.health_workout_sessions.filter((session) => session && typeof session === "object")
    : [];
  if (stored.length) {
    const primaryId = String(frontmatter.health_primary_session_id || "");
    return stored.map((session, index) => {
      const id = String(session.id || `legacy-session-${index + 1}`);
      const explicitRole = ["primary", "additional"].includes(String(session.role))
        ? String(session.role)
        : "";
      return {
        ...session,
        id,
        workout: String(session.workout || "pool"),
        mode: String(session.mode || "standard"),
        role: explicitRole || (primaryId ? (id === primaryId ? "primary" : "additional") : index === 0 ? "primary" : "additional"),
        source: String(session.source || (index === 0 ? frontmatter.health_primary_source || "" : "additional")),
        completed_sets: healthArray(session.completed_sets),
      };
    });
  }
  if (String(frontmatter.health_workout_status || "") !== "completed" || !frontmatter.health_workout_type) return [];
  return [{
    id: String(frontmatter.health_workout_session_id || "legacy-session"),
    workout: String(frontmatter.health_workout_type),
    mode: String(frontmatter.health_workout_mode || "standard"),
    role: "primary",
    source: String(frontmatter.health_primary_source || ""),
    started_at: frontmatter.health_workout_started_at || null,
    completed_at: frontmatter.health_workout_completed_at || null,
    completed_sets: healthArray(frontmatter.health_workout_completed_sets),
    total_sets: healthWorkoutIsStrength(frontmatter.health_workout_type)
      ? healthTotalSets(frontmatter.health_workout_type, frontmatter.health_workout_mode)
      : 0,
    minutes: minutesValue(frontmatter.workout_minutes),
  }];
}

function healthPrimarySession(frontmatter, sessions = healthWorkoutSessions(frontmatter)) {
  const primaryId = String(frontmatter.health_primary_session_id || "");
  return sessions.find((session) => primaryId && String(session.id) === primaryId)
    ?? sessions.find((session) => session.role === "primary")
    ?? sessions[0]
    ?? null;
}

function healthSessionTotalSets(session) {
  const stored = Number(session.total_sets);
  return Number.isInteger(stored) && stored >= 0
    ? stored
    : healthTotalSets(session.workout, session.mode);
}

function healthSessionSetCounts(session) {
  const current = healthPlanSetCounts(session.workout, session.mode);
  const working = Number(session.planned_working_sets);
  const warmup = Number(session.planned_warmup_sets);
  return {
    working: Number.isInteger(working) && working >= 0 ? working : current.working,
    warmup: Number.isInteger(warmup) && warmup >= 0 ? warmup : current.warmup,
  };
}

function healthSessionProgress(sessions) {
  return sessions.reduce((summary, session) => {
    if (!healthWorkoutIsStrength(session.workout)) return summary;
    summary.completed += healthArray(session.completed_sets).length;
    summary.total += healthSessionTotalSets(session);
    return summary;
  }, { completed: 0, total: 0 });
}

function healthWeightedPercentage(entries) {
  let weightedTotal = 0;
  let availableWeight = 0;
  let answered = 0;
  entries.forEach(([value, weight]) => {
    if (value === null) return;
    weightedTotal += value / 5 * 100 * weight;
    availableWeight += weight;
    answered += 1;
  });
  return {
    value: availableWeight ? Math.round(weightedTotal / availableWeight) : null,
    answered,
  };
}

function healthMorningCapacity(frontmatter) {
  return healthWeightedPercentage([
    [healthSignal(frontmatter.health_morning_sleep), 30],
    [healthSignal(frontmatter.health_morning_recovery), 40],
    [healthSignal(frontmatter.health_morning_body), 20],
    [healthSignal(frontmatter.health_morning_outlook), 10],
  ]);
}

function healthAfternoonState(frontmatter) {
  const result = healthWeightedPercentage([
    [healthAfternoonEnergy(frontmatter), 40],
    [healthSignal(frontmatter.health_afternoon_calmness), 20],
    [healthSignal(frontmatter.health_afternoon_clarity), 20],
    [healthSignal(frontmatter.health_afternoon_body), 20],
  ]);
  if (result.value === null) return { ...result, penalty: 0 };
  const feelings = new Set(healthArray(frontmatter.health_afternoon_discomfort));
  const penalty = (feelings.has("tightness") ? 8 : 0) + (feelings.has("soreness") ? 12 : 0);
  return { ...result, value: clamp(result.value - penalty, 0, 100), penalty };
}

function healthStateLabel(value) {
  if (value === null) return "尚未记录";
  if (value < 25) return "需要休息";
  if (value < 45) return "状态偏低";
  if (value < 60) return "谨慎可动";
  if (value < 75) return "状态稳定";
  if (value < 90) return "状态良好";
  return "状态充足";
}

function healthRecommendation(frontmatter, plannedWorkout, now = new Date()) {
  const morning = healthMorningCapacity(frontmatter);
  const afternoon = healthAfternoonState(frontmatter);
  const daytimeLabel = usesHealthScheduleV2(frontmatter) ? "白天" : "傍晚";
  const hasAfternoon = afternoon.answered > 0;
  const capacity = morning.value !== null && afternoon.value !== null
    ? Math.round(morning.value * .4 + afternoon.value * .6)
    : afternoon.value ?? morning.value;
  const answered = morning.answered + afternoon.answered;
  const energy = healthAfternoonEnergy(frontmatter);
  const bodyAvailability = healthSignal(frontmatter.health_afternoon_body);
  const feelings = new Set([
    ...healthArray(frontmatter.health_afternoon_discomfort),
    ...healthArray(frontmatter.health_morning_discomfort),
  ]);
  const regions = new Set([
    ...healthArray(frontmatter.health_morning_regions),
    ...healthArray(frontmatter.health_afternoon_regions),
  ]);
  const hasSoreness = feelings.has("soreness");
  const wholeBodySore = hasSoreness && regions.has("whole_body");
  const soreFor = (workoutId) => hasSoreness && (
    (workoutId === "legs" && ["legs", "lower_back"].some((item) => regions.has(item)))
    || (workoutId === "back" && ["shoulders", "upper_back", "lower_back", "arms"].some((item) => regions.has(item)))
    || (workoutId === "upper" && ["shoulders", "upper_back", "chest", "arms"].some((item) => regions.has(item)))
  );
  const preference = String(frontmatter.health_afternoon_preference || "none");
  const reasons = [];
  let workout = plannedWorkout;
  let mode = "standard";
  let intensity = "standard";

  if (morning.value !== null) reasons.push(`今日恢复容量 ${morning.value}%`);
  if (afternoon.value !== null) reasons.push(`${daytimeLabel}身体状态 ${afternoon.value}% · ${healthStateLabel(afternoon.value)}`);

  if (hasAfternoon) {
    if (energy === 1 || (capacity !== null && capacity < 35)) {
      intensity = "rest";
    } else if (energy === 2 || bodyAvailability === 1 || (capacity !== null && capacity < 55)) {
      intensity = "stretch";
    } else if (energy === 3 || bodyAvailability === 2 || (capacity !== null && capacity < 75)) {
      intensity = "light";
    }
  } else if (capacity !== null) {
    if (capacity < 55) intensity = "stretch";
    else if (capacity < 75) intensity = "light";
  }

  if (wholeBodySore && intensity !== "rest") {
    intensity = "stretch";
    reasons.push("全身仍有训练酸痛，今天不安排力量训练");
  }

  if (intensity === "rest") {
    workout = "rest";
    mode = "recovery";
    reasons.push(energy === 1 ? `${daytimeLabel}精力处于最低档` : "综合训练准备度低于 35%");
  } else if (intensity === "stretch") {
    workout = "stretch";
    mode = "recovery";
    reasons.push(hasAfternoon ? "今天更适合低负荷活动" : `早晨信息暂定为低负荷，${daytimeLabel}后会再判断`);
  } else {
    mode = intensity;
    reasons.push(intensity === "standard"
      ? "训练准备度支持完整训练量"
      : "保留原定方向，但降低动作与总组数");
  }

  if (healthWorkoutIsStrength(workout) && soreFor(workout)) {
    const alternatives = {
      back: ["legs", "upper"],
      upper: ["legs", "back"],
      legs: ["upper", "back"],
    };
    const substitute = alternatives[workout]?.find((candidate) => !soreFor(candidate));
    if (substitute && capacity !== null && capacity >= 55) {
      workout = substitute;
      reasons.push(`原定部位仍有酸痛，改练${healthWorkout(substitute).label}`);
    } else {
      workout = "stretch";
      mode = "recovery";
      reasons.push("原定部位仍有酸痛，且没有合适的力量替代项目");
    }
  }

  if (preference !== "none" && intensity !== "rest") {
    if (["pool", "stretch", "rest"].includes(preference)) {
      workout = preference;
      mode = preference === "pool" ? (intensity === "standard" ? "standard" : "light") : "recovery";
      reasons.push(`身体当前更想选择${healthWorkout(preference).label}`);
    } else if (healthWorkoutIsStrength(preference) && ["standard", "light"].includes(intensity) && !soreFor(preference)) {
      workout = preference;
      mode = intensity;
      reasons.push(`身体当前更想选择${healthWorkout(preference).label}`);
    }
  }

  if (soreFor(workout) && healthWorkoutIsStrength(workout)) {
    workout = "stretch";
    mode = "recovery";
    reasons.push("身体偏好的部位仍有训练酸痛");
  }

  if (!reasons.length) reasons.push("当前先依照训练轮换");
  const completeness = `${answered}/8`;
  const status = healthStageComplete(frontmatter, "afternoon") ? "final" : answered ? "provisional" : "planned";
  return {
    workout,
    mode,
    capacity,
    morningCapacity: morning.value,
    afternoonState: afternoon.value,
    completeness,
    status,
    reasons,
  };
}

function usesNavigationModel(frontmatter) {
  if (frontmatter?.daily_checkin_model === "navigation-v1") return true;
  const date = isoDateValue(frontmatter?.date);
  return Boolean(date && date >= NAVIGATION_CUTOVER);
}

function checkinDefinition(frontmatter) {
  return usesNavigationModel(frontmatter)
    ? {
      model: "navigation-v1",
      required: NAVIGATION_REQUIRED,
      metrics: NAVIGATION_METRICS,
      recordedAtKey: "navigation_recorded_at",
    }
    : {
      model: "legacy-state",
      required: LEGACY_REQUIRED,
      metrics: LEGACY_METRICS,
      recordedAtKey: "state_recorded_at",
    };
}

function stateTrendValue(frontmatter, metric) {
  const navigation = usesNavigationModel(frontmatter);
  if (metric === "sleep") {
    return rating(frontmatter?.[navigation ? "health_morning_sleep" : "sleep_quality"]);
  }
  if (metric === "energy") {
    return rating(frontmatter?.[navigation ? "navigation_work_energy" : "energy"]);
  }
  if (metric === "activation") {
    return rating(frontmatter?.[navigation ? "navigation_activation" : "agency"]);
  }
  return null;
}

function completion(frontmatter) {
  const { required } = checkinDefinition(frontmatter);
  return required.filter((key) => rating(frontmatter?.[key]) !== null).length;
}

function localTimestamp(date = new Date()) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const offset = Math.abs(offsetMinutes);
  return `${localISO(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(Math.floor(offset / 60))}:${pad(offset % 60)}`;
}

function isoDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return localISO(value);
  return String(value ?? "").match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
}

function timestampAgeHours(value, now = new Date()) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return null;
  return (now.getTime() - timestamp.getTime()) / 3600000;
}

function voyageCandidates(pages, now = new Date()) {
  return pages
    .filter((page) => page.frontmatter.voyage_started_at && !page.frontmatter.voyage_ended_at)
    .map((page) => ({
      ...page,
      ageHours: timestampAgeHours(page.frontmatter.voyage_started_at, now),
    }))
    .sort((a, b) => String(b.frontmatter.voyage_started_at).localeCompare(String(a.frontmatter.voyage_started_at)));
}

function voyageLifecycle(pages, now = new Date()) {
  const todayISO = localISO(now);
  const today = pages.find((page) => isoDateValue(page.frontmatter.date) === todayISO) ?? null;
  const open = voyageCandidates(pages, now);
  const recentOpen = open.filter((page) => page.ageHours !== null && page.ageHours >= 0 && page.ageHours <= OPEN_VOYAGE_HOURS);
  const staleOpen = open.filter((page) => page.ageHours === null || page.ageHours < 0 || page.ageHours > OPEN_VOYAGE_HOURS);
  const recentEnded = pages
    .filter((page) => page.frontmatter.voyage_ended_at)
    .map((page) => ({ ...page, ageHours: timestampAgeHours(page.frontmatter.voyage_ended_at, now) }))
    .filter((page) => page.ageHours !== null && page.ageHours >= 0 && page.ageHours <= OPEN_VOYAGE_HOURS)
    .sort((a, b) => String(b.frontmatter.voyage_ended_at).localeCompare(String(a.frontmatter.voyage_ended_at)));
  return {
    today,
    recentOpen,
    staleOpen,
    active: recentOpen.length === 1 ? recentOpen[0] : null,
    ambiguous: recentOpen.length > 1,
    latestEnded: recentEnded[0] ?? null,
  };
}

function overallEnergyValue(frontmatter) {
  const date = isoDateValue(frontmatter?.date);
  if (!date) return { value: null, source: "Missing date" };
  if (date < NAVIGATION_CUTOVER) {
    return { value: rating(frontmatter.energy), source: "Legacy Energy" };
  }
  if (date < OVERALL_ENERGY_CUTOVER) {
    return { value: rating(frontmatter.navigation_work_energy), source: "Work Energy fallback" };
  }
  return { value: rating(frontmatter.health_evening_overall_energy), source: "Health Evening · Overall Energy" };
}

function calendarDayDifference(fromValue, toValue) {
  const from = isoDateValue(fromValue)?.split("-").map(Number);
  const to = isoDateValue(toValue)?.split("-").map(Number);
  if (!from || !to) return null;
  return Math.round((Date.UTC(to[0], to[1] - 1, to[2]) - Date.UTC(from[0], from[1] - 1, from[2])) / 86400000);
}

function stateEntryType(frontmatter) {
  const definition = checkinDefinition(frontmatter);
  if (completion(frontmatter) !== definition.required.length) return "incomplete";
  const recordedAt = frontmatter?.[definition.recordedAtKey];
  if (!recordedAt) return "legacy";
  const difference = calendarDayDifference(frontmatter.date, recordedAt);
  if (difference === 0) return "same-day";
  if (difference === 1) return "late";
  return "retrospective";
}

function isVoyageDay(frontmatter) {
  return ["same-day", "late", "legacy"].includes(stateEntryType(frontmatter));
}

function applyRating(frontmatter, key, value, now = new Date()) {
  const navigationMetric = NAVIGATION_REQUIRED.includes(key);
  if (navigationMetric) frontmatter.daily_checkin_model = "navigation-v1";
  const definition = navigationMetric
    ? {
      required: NAVIGATION_REQUIRED,
      recordedAtKey: "navigation_recorded_at",
    }
    : {
      required: LEGACY_REQUIRED,
      recordedAtKey: "state_recorded_at",
    };
  const wasComplete = definition.required.every((item) => rating(frontmatter?.[item]) !== null);
  frontmatter[key] = Number(value);
  const isComplete = definition.required.every((item) => rating(frontmatter?.[item]) !== null);
  if (!wasComplete && isComplete && !frontmatter[definition.recordedAtKey]) {
    frontmatter[definition.recordedAtKey] = localTimestamp(now);
  }
}

async function freshFrontmatter(app, file) {
  try {
    const content = await app.vault.read(file);
    const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) return {};
    return parseYaml(match[1]) ?? {};
  } catch (error) {
    console.warn(`CastleX could not read fresh frontmatter for ${file.path}; using metadata cache`, error);
    return app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  }
}

function stateStatusPresentation(frontmatter, now = new Date()) {
  const definition = checkinDefinition(frontmatter);
  const type = stateEntryType(frontmatter);
  const recordedDate = isoDateValue(frontmatter?.[definition.recordedAtKey]);
  if (type === "late") {
    return { type, label: "航行日 · Late entry", detail: `补录于 ${recordedDate}，计入连续航行` };
  }
  if (type === "retrospective") {
    return { type, label: "休整日 · Retrospective", detail: `补录于 ${recordedDate}；保留状态趋势，不计入连续航行` };
  }
  if (type === "legacy") {
    return { type, label: "航行日 · 历史记录", detail: "既有完整记录继续计入连续航行" };
  }
  if (type === "incomplete") {
    const difference = calendarDayDifference(frontmatter?.date, localISO(now));
    if (difference === 1) {
      return { type: "late-pending", label: "Late entry 窗口", detail: "今天完成六项状态，仍计入连续航行" };
    }
    if (difference !== null && difference >= 2) {
      return { type: "retrospective-pending", label: "休整日 · Retrospective", detail: "补录数据会进入状态趋势，但不会点亮航行记录" };
    }
  }
  return null;
}

function stripTaskSyntax(text) {
  return text
    .replace(/\s+[📅⏳🛫✅] ?\d{4}-\d{2}-\d{2}/g, "")
    .replace(/\s+🔁.*$/g, "")
    .trim();
}

function progressSections(value) {
  const entries = Array.isArray(value)
    ? value.map((item) => {
        const match = String(item).match(/^(.+?)\s*=\s*(-?\d+(?:\.\d+)?)$/);
        return match ? [match[1].trim(), Number(match[2])] : null;
      }).filter(Boolean)
    : value && typeof value === "object"
      ? Object.entries(value)
      : [];
  return entries
    .map(([section, weight]) => ({ section: String(section).trim(), weight: Number(weight) }))
    .filter(({ section, weight }) => section && Number.isFinite(weight) && weight > 0);
}

function workstreamStatus(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  const canonical = WORKSTREAM_STATES.some(({ id }) => id === raw)
    ? raw
    : LEGACY_WORKSTREAM_STATES[raw] ?? "incubating";
  return {
    ...WORKSTREAM_STATES.find(({ id }) => id === canonical),
    raw,
    legacy: Boolean(raw && raw !== canonical),
    missing: !raw,
  };
}

function createSvgElement(parent, tag, attributes = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
  parent.appendChild(node);
  return node;
}

function miniGaugePath(index) {
  const centerX = 52;
  const centerY = 47;
  const radius = 34;
  const gap = 0.045;
  const start = Math.PI - index * Math.PI / 5 - gap;
  const end = Math.PI - (index + 1) * Math.PI / 5 + gap;
  const points = [];
  for (let step = 0; step <= 7; step += 1) {
    const angle = start + (end - start) * (step / 7);
    points.push(`${centerX + Math.cos(angle) * radius},${centerY - Math.sin(angle) * radius}`);
  }
  return `M ${points.join(" L ")}`;
}

function renderDailyStatus(frontmatter, container, onSelect) {
  const definition = checkinDefinition(frontmatter);
  let host = container;
  if (definition.model === "navigation-v1") {
    host = container.createDiv({ cls: "cx-daily-navigation" });
    const startedAt = String(frontmatter.voyage_started_at ?? "");
    const endedAt = String(frontmatter.voyage_ended_at ?? "");
    const startTime = startedAt.match(/T(\d{2}:\d{2})/)?.[1] ?? null;
    const endTime = endedAt.match(/T(\d{2}:\d{2})/)?.[1] ?? null;
    const dayOffset = endedAt ? calendarDayDifference(frontmatter.date, endedAt) : null;
    const ticket = host.createDiv({
      cls: `cx-navigation-voyage-ticket${startTime ? " is-started" : ""}${endTime ? " is-ended" : ""}`,
    });

    const departure = ticket.createDiv({ cls: "cx-navigation-voyage-stop is-departure" });
    departure.createSpan({ text: "今日起航", cls: "cx-navigation-voyage-label" });
    departure.createSpan({ text: startTime ?? "尚未启航", cls: "cx-navigation-voyage-time" });

    const route = ticket.createDiv({ cls: "cx-navigation-voyage-route", attr: { "aria-hidden": "true" } });
    const routeMark = route.createDiv({ cls: "cx-navigation-voyage-mark" });
    const boat = routeMark.createSpan({ cls: "cx-navigation-voyage-boat" });
    setIcon(boat, "sailboat");
    routeMark.createSpan({ text: "航行" });
    route.createSpan({ cls: "cx-navigation-voyage-line" });

    const arrival = ticket.createDiv({ cls: "cx-navigation-voyage-stop is-arrival" });
    arrival.createSpan({ text: "今日收帆", cls: "cx-navigation-voyage-label" });
    const arrivalTime = arrival.createSpan({ cls: "cx-navigation-voyage-time" });
    arrivalTime.createSpan({ text: endTime ?? (startTime ? "航行中" : "尚未收帆") });
    if (endTime && dayOffset !== null && dayOffset > 0) {
      arrivalTime.createEl("sup", {
        text: `+${dayOffset}`,
        cls: "cx-navigation-voyage-day-offset",
        attr: { "aria-label": `次日加 ${dayOffset}` },
      });
    }
  }
  const wrap = host.createDiv({ cls: "cx-daily-status" });
  const presentation = stateStatusPresentation(frontmatter);
  if (presentation) {
    const status = wrap.createDiv({ cls: `cx-daily-status-meta is-${presentation.type}` });
    status.createSpan({ text: presentation.label, cls: "cx-daily-status-badge" });
    status.createSpan({ text: presentation.detail, cls: "cx-daily-status-detail" });
  }
  definition.metrics.forEach((metric) => {
    const item = wrap.createDiv({ cls: "cx-daily-status-item" });
    const svg = createSvgElement(item, "svg", { viewBox: "0 0 104 65", class: "cx-daily-status-svg" });
    const selected = rating(frontmatter[metric.key]);
    for (let index = 0; index < 5; index += 1) {
      const value = index + 1;
      const segment = createSvgElement(svg, "path", {
        d: miniGaugePath(index),
        class: `cx-daily-status-segment is-interactive${selected !== null && value <= selected ? " is-active" : ""}${value === selected ? " is-selected" : ""}`,
        role: "button",
        tabindex: "0",
        "aria-label": `${metric.label} ${value}/5`,
      });
      segment.addEventListener("click", () => onSelect(metric, value));
      segment.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(metric, value);
      });
    }
    const valueText = createSvgElement(svg, "text", { x: 52, y: 48, class: "cx-daily-status-value", "text-anchor": "middle" });
    valueText.textContent = selected ?? "—";
    item.createDiv({ text: metric.label, cls: "cx-daily-status-label" });
  });
}

function trackerDesktopIO() {
  if (Platform.isMobile) return null;
  try {
    return { fs: require("fs"), path: require("path") };
  } catch (_error) {
    return null;
  }
}

function trackerClock(totalSeconds) {
  const value = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function trackerDuration(totalSeconds) {
  const minutes = Math.max(0, Math.round((Number(totalSeconds) || 0) / 60));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function trackerDateLabel(value, options = {}) {
  const date = value instanceof Date
    ? value
    : /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))
      ? dateFromISO(value)
      : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(options.time ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
}

function trackerPatternLabel(value) {
  return String(value || "")
    .replace(/^\d+_/, "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function trackerTimerSeconds(timer, now = Date.now()) {
  if (!timer) return 0;
  const accumulated = Math.max(0, Number(timer.active_seconds) || 0);
  if (timer.status !== "running" || !timer.running_since) return accumulated;
  const runningSince = new Date(timer.running_since).getTime();
  return accumulated + (Number.isFinite(runningSince) ? Math.max(0, (now - runningSince) / 1000) : 0);
}

const TRACKER_OUTCOMES = [
  { id: "attempted", label: "Attempted" },
  { id: "partial", label: "Partial" },
  { id: "completed", label: "Completed" },
  { id: "reviewed", label: "Reviewed" },
];

function trackerOutcomeLabel(outcome) {
  return TRACKER_OUTCOMES.find(({ id }) => id === outcome)?.label ?? trackerPatternLabel(outcome);
}

function trackerEventId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `lc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function trackerEventDate(event) {
  return String(event?.ended_at || event?.date || "");
}

function trackerEventProblems(event) {
  if (event?.event_type === "study_block_completed" && Array.isArray(event.problems)) {
    return event.problems.filter((problem) => problem?.task_id && problem?.outcome);
  }
  if (event?.event_type === "session_completed" && event.task_id) {
    const legacyOutcome = event.completion_status === "completed"
      ? "completed"
      : event.completion_status === "partial" ? "partial" : "attempted";
    return [{ task_id: event.task_id, outcome: legacyOutcome }];
  }
  return [];
}

function trackerTaskEvents(events, taskId) {
  return events
    .filter((event) => trackerEventProblems(event).some((problem) => problem.task_id === taskId))
    .sort((a, b) => trackerEventDate(a).localeCompare(trackerEventDate(b)));
}

function trackerTaskExecutionStatus(events, taskId) {
  const taskEvents = trackerTaskEvents(events, taskId);
  const outcomes = taskEvents.flatMap((event) => trackerEventProblems(event)
    .filter((problem) => problem.task_id === taskId)
    .map((problem) => problem.outcome));
  if (outcomes.includes("completed")) return "completed";
  return outcomes[outcomes.length - 1] ?? "planned";
}

function trackerWeekRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  const end = addDays(start, 6);
  return { start: localISO(start), end: localISO(end) };
}

class LeetCodeTrackerChild extends MarkdownRenderChild {
  constructor(container, plugin, file, config) {
    super(container);
    this.plugin = plugin;
    this.app = plugin.app;
    this.file = file;
    this.config = config && typeof config === "object" ? config : {};
    this.data = null;
    this.loading = false;
    this.activeTab = "today";
    this.selectedTaskId = "";
    this.blockStatus = null;
    this.manualEntryOpen = false;
    this.manualDurationMinutes = "";
    this.manualProblems = {};
    this.userNote = "";
    this.savingBlock = false;
  }

  onload() {
    this.render();
    this.registerInterval(window.setInterval(() => this.updateTimerDisplay(), 1000));
  }

  timerKey() {
    return `${this.file.path}::${String(this.config.bridge_path || "")}`;
  }

  timer() {
    return this.plugin.getLeetcodeTimer(this.timerKey());
  }

  bridgePath(relativePath) {
    const io = trackerDesktopIO();
    const root = String(this.config.bridge_path || "").trim();
    return io && root ? io.path.join(root, relativePath) : null;
  }

  async readJson(relativePath) {
    const io = trackerDesktopIO();
    const target = this.bridgePath(relativePath);
    if (!io || !target) throw new Error("Bridge path is unavailable on this device.");
    return JSON.parse(await io.fs.promises.readFile(target, "utf8"));
  }

  async readEvents() {
    const io = trackerDesktopIO();
    const target = this.bridgePath("from_obsidian/session_events.jsonl");
    if (!io || !target) throw new Error("Session event output is unavailable on this device.");
    const content = await io.fs.promises.readFile(target, "utf8");
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (_error) {
          return null;
        }
      })
      .filter((event) => (event?.event_type === "session_completed" && event.task_id)
        || (event?.event_type === "study_block_completed" && Array.isArray(event.problems)));
  }

  async loadBridgeData() {
    if (Platform.isMobile) throw new Error("LeetCode Tracker is configured for desktop use.");
    if (!String(this.config.bridge_path || "").trim()) {
      throw new Error("Add bridge_path to the castlex-leetcode-tracker block.");
    }
    const [plan, current, review, events] = await Promise.all([
      this.readJson("to_obsidian/plan_export.json"),
      this.readJson("to_obsidian/current_state.json"),
      this.readJson("to_obsidian/review_queue.json"),
      this.readEvents(),
    ]);
    if (!Array.isArray(plan.tasks) || ![1, 2].includes(Number(plan.schema_version))) {
      throw new Error("The Bridge plan export is not a supported schema.");
    }
    if (Number(plan.schema_version) === 2 && plan.round_1_tracking_policy?.mode !== "daily_study_block") {
      throw new Error("The Bridge plan does not declare the Round 1 Daily Study Block policy.");
    }
    this.data = { plan, current, review, events };
    const taskIds = new Set(plan.tasks.map((task) => task.task_id));
    if (!this.selectedTaskId || !taskIds.has(this.selectedTaskId)) {
      this.selectedTaskId = this.recommendedTask()?.task_id ?? plan.tasks[0]?.task_id ?? "";
    }
  }

  tasks() {
    return this.data?.plan?.tasks ?? [];
  }

  problemTasks() {
    return this.tasks().filter((task) => task.task_type === "problem");
  }

  task(taskId) {
    return this.tasks().find((task) => task.task_id === taskId) ?? null;
  }

  activity(taskId = "") {
    const events = this.data?.events ?? [];
    return taskId ? trackerTaskEvents(events, taskId) : [...events];
  }

  taskStatus(taskId) {
    return trackerTaskExecutionStatus(this.data?.events ?? [], taskId);
  }

  completedTaskIds() {
    return new Set(this.tasks()
      .filter((task) => this.taskStatus(task.task_id) === "completed")
      .map((task) => task.task_id));
  }

  recommendedTask() {
    if (!this.data) return null;
    const completed = this.completedTaskIds();
    const open = this.tasks().filter((task) => !completed.has(task.task_id));
    return open[0]
      ?? this.tasks()[this.tasks().length - 1]
      ?? null;
  }

  selectedTask() {
    return this.task(this.selectedTaskId) ?? this.recommendedTask();
  }

  blockProblems() {
    const timer = this.timer();
    if (timer?.problems && typeof timer.problems === "object" && !Array.isArray(timer.problems)) {
      return { ...timer.problems };
    }
    if (timer?.task_id) return { [timer.task_id]: "attempted" };
    return { ...this.manualProblems };
  }

  async render() {
    if (this.loading) return;
    this.loading = true;
    this.containerEl.empty();
    const shell = this.containerEl.createDiv({ cls: "cx-lc-shell" });
    shell.createDiv({ cls: "cx-lc-loading", text: "Loading LeetCode plan…" });
    try {
      await this.loadBridgeData();
      this.renderTracker();
    } catch (error) {
      shell.empty();
      const card = shell.createDiv({ cls: "cx-lc-error" });
      card.createEl("h3", { text: "LeetCode Tracker unavailable" });
      card.createEl("p", { text: error instanceof Error ? error.message : String(error) });
      if (!Platform.isMobile) {
        const retry = card.createEl("button", { cls: "cx-lc-button", text: "Retry" });
        retry.addEventListener("click", () => this.render());
      }
    } finally {
      this.loading = false;
    }
  }

  renderTracker() {
    const shell = this.containerEl.querySelector(".cx-lc-shell");
    shell.empty();
    this.renderHeader(shell);
    this.renderNavigation(shell);
    const content = shell.createDiv({ cls: "cx-lc-content" });
    if (this.activeTab === "week") this.renderWeek(content);
    else if (this.activeTab === "plan") this.renderPlan(content);
    else if (this.activeTab === "review") this.renderReview(content);
    else if (this.activeTab === "activity") this.renderActivity(content);
    else this.renderToday(content);
    this.updateTimerDisplay();
  }

  renderHeader(shell) {
    const problems = this.problemTasks();
    const technicalCompleted = Math.max(0, Number(this.data.current.completed_problem_count) || 0);
    const completed = this.completedTaskIds();
    const executionCompleted = problems.filter((task) => completed.has(task.task_id)).length;
    const configuredTechnicalTotal = Number(this.data.current.round_target_problem_count);
    const inferredTechnicalTotal = technicalCompleted + problems.length - executionCompleted;
    const technicalTotal = Number.isFinite(configuredTechnicalTotal) && configuredTechnicalTotal > 0
      ? Math.max(technicalCompleted, configuredTechnicalTotal)
      : Math.max(technicalCompleted, inferredTechnicalTotal);
    const milestone = this.data.current.next_milestone;
    const milestoneIds = Array.isArray(milestone?.task_ids) ? milestone.task_ids : [];
    const milestoneCompleted = milestoneIds.filter((taskId) => completed.has(taskId)).length;

    const hero = shell.createDiv({ cls: "cx-lc-hero" });
    const heading = hero.createDiv({ cls: "cx-lc-heading" });
    heading.createDiv({ cls: "cx-lc-kicker", text: this.data.plan.round?.title || "LeetCode Training" });
    heading.createEl("h2", { text: "Execution Console" });
    heading.createDiv({
      cls: "cx-lc-subtitle",
      text: `${trackerPatternLabel(this.data.current.current_pattern)} · Checkpoint ${trackerDateLabel(this.data.plan.round?.checkpoint_date)}`,
    });
    const refresh = hero.createEl("button", {
      cls: "cx-lc-icon-button",
      attr: { "aria-label": "Refresh Bridge plan", title: "Refresh Bridge plan" },
    });
    setIcon(refresh, "refresh-cw");
    refresh.addEventListener("click", () => this.render());

    const progressGrid = shell.createDiv({ cls: "cx-lc-progress-grid" });
    this.renderProgress(progressGrid, "Technical coverage", technicalCompleted, technicalTotal, "Repository evidence");
    this.renderProgress(progressGrid, "Plan execution", executionCompleted, problems.length, "Completed outcomes");
    this.renderProgress(progressGrid, milestone?.title || "Current milestone", milestoneCompleted, milestoneIds.length, "Current focus");
  }

  renderProgress(parent, label, value, total, detail) {
    const safeTotal = Math.max(0, Number(total) || 0);
    const safeValue = Math.max(0, Number(value) || 0);
    const percentage = safeTotal ? Math.min(100, safeValue / safeTotal * 100) : 0;
    const card = parent.createDiv({ cls: "cx-lc-progress-card" });
    const line = card.createDiv({ cls: "cx-lc-progress-line" });
    line.createSpan({ cls: "cx-lc-progress-label", text: label });
    line.createSpan({ cls: "cx-lc-progress-count", text: `${safeValue} / ${safeTotal}` });
    const track = card.createDiv({ cls: "cx-lc-progress-track" });
    const bar = track.createSpan({ cls: "cx-lc-progress-bar" });
    bar.style.width = `${percentage}%`;
    card.createDiv({ cls: "cx-lc-progress-detail", text: detail });
  }

  renderNavigation(shell) {
    const nav = shell.createDiv({ cls: "cx-lc-tabs" });
    [
      ["today", "Today"],
      ["week", "This Week"],
      ["plan", "Plan"],
      ["review", "Review"],
      ["activity", "Activity"],
    ].forEach(([id, label]) => {
      const button = nav.createEl("button", {
        cls: `cx-lc-tab${this.activeTab === id ? " is-active" : ""}`,
        text: label,
      });
      button.addEventListener("click", () => {
        this.activeTab = id;
        this.renderTracker();
      });
    });
  }

  renderToday(parent) {
    const task = this.selectedTask();
    if (!task) {
      parent.createDiv({ cls: "cx-lc-empty", text: "No task is available in the current plan." });
      return;
    }
    const status = this.taskStatus(task.task_id);
    const card = parent.createDiv({ cls: "cx-lc-session-card" });
    const meta = card.createDiv({ cls: "cx-lc-task-meta" });
    meta.createSpan({ cls: `cx-lc-status is-${status}`, text: status === "planned" ? "Up next" : trackerOutcomeLabel(status) });
    meta.createSpan({ text: task.task_type === "checkpoint" ? "Round checkpoint" : `LC ${task.leetcode_id}` });
    meta.createSpan({ text: trackerPatternLabel(task.pattern) });
    meta.createSpan({ text: task.stage });
    card.createEl("h3", { text: "LeetCode Study Block" });
    card.createDiv({ cls: "cx-lc-block-prompt", text: `Recommended next · ${task.title}` });
    const schedule = card.createDiv({ cls: "cx-lc-schedule" });
    schedule.createSpan({ text: `Planned · ${trackerDateLabel(task.scheduled_date)}` });
    schedule.createSpan({ text: "Follow canonical plan order" });

    const blockArea = card.createDiv({ cls: "cx-lc-block-area" });
    this.blockStatus = blockArea.createDiv({ cls: "cx-lc-block-status", text: "Ready to begin" });
    this.renderBlockActions(blockArea, task);
    if (this.timer() || this.manualEntryOpen) {
      this.renderProblemOutcomes(card);
      this.renderBlockNote(card);
    }
    if (!this.timer() && this.manualEntryOpen) this.renderManualDuration(card);
    this.renderTaskChooser(parent, task);
  }

  renderBlockActions(parent, task) {
    const timer = this.timer();
    const actions = parent.createDiv({ cls: "cx-lc-block-actions" });
    if (timer?.status === "saving_manual") {
      const retry = actions.createEl("button", { cls: "cx-lc-button is-primary", text: "Retry Manual Save" });
      retry.addEventListener("click", () => this.retryPendingManualBlock());
      return;
    }
    if (!timer) {
      if (this.manualEntryOpen) {
        const save = actions.createEl("button", { cls: "cx-lc-button is-primary", text: "Save Manual Block" });
        save.addEventListener("click", () => this.finishManualBlock());
        const cancel = actions.createEl("button", { cls: "cx-lc-button is-quiet", text: "Cancel" });
        cancel.addEventListener("click", () => {
          this.manualEntryOpen = false;
          this.manualDurationMinutes = "";
          this.manualProblems = {};
          this.userNote = "";
          this.renderTracker();
        });
        return;
      }
      const start = actions.createEl("button", { cls: "cx-lc-button is-primary", text: "Start Study Block" });
      start.addEventListener("click", () => this.startBlock(task));
      const manual = actions.createEl("button", { cls: "cx-lc-button is-quiet", text: "Log Manually" });
      manual.addEventListener("click", () => {
        this.manualEntryOpen = true;
        this.manualProblems = { [task.task_id]: "attempted" };
        this.renderTracker();
      });
      return;
    }
    const pause = actions.createEl("button", {
      cls: "cx-lc-button",
      text: timer.status === "running" ? "Pause" : "Resume",
    });
    pause.addEventListener("click", () => timer.status === "running" ? this.pauseBlock() : this.resumeBlock());
    const finish = actions.createEl("button", { cls: "cx-lc-button is-primary", text: "Finish Study Block" });
    finish.addEventListener("click", () => this.finishTimedBlock());
  }

  renderProblemOutcomes(parent) {
    const problems = this.blockProblems();
    const panel = parent.createDiv({ cls: "cx-lc-outcome-panel" });
    const heading = panel.createDiv({ cls: "cx-lc-section-heading" });
    heading.createEl("h4", { text: "Problems in this block" });
    heading.createSpan({ text: "Choose one outcome for each touched problem" });
    Object.entries(problems).forEach(([taskId, outcome]) => {
      const task = this.task(taskId);
      if (!task) return;
      const row = panel.createDiv({ cls: "cx-lc-outcome-row" });
      const copy = row.createDiv({ cls: "cx-lc-task-row-main" });
      copy.createDiv({ cls: "cx-lc-task-title", text: `${task.leetcode_id ? `LC ${task.leetcode_id} · ` : ""}${task.title}` });
      copy.createDiv({ cls: "cx-lc-task-detail", text: `${trackerPatternLabel(task.pattern)} · ${task.stage}` });
      const select = row.createEl("select", { cls: "cx-lc-outcome-select", attr: { "aria-label": `Outcome for ${task.title}` } });
      TRACKER_OUTCOMES.forEach(({ id, label }) => select.createEl("option", { attr: { value: id }, text: label }));
      select.value = outcome;
      select.addEventListener("change", () => this.setProblemOutcome(taskId, select.value));
      const remove = row.createEl("button", { cls: "cx-lc-row-button", text: "Remove" });
      remove.addEventListener("click", () => this.removeProblem(taskId));
    });
    if (!Object.keys(problems).length) {
      panel.createDiv({ cls: "cx-lc-empty", text: "Add at least one problem before finishing the block." });
    }
  }

  renderBlockNote(parent) {
    const details = parent.createEl("details", { cls: "cx-lc-details" });
    details.createEl("summary", { text: "Optional note" });
    const fields = details.createDiv({ cls: "cx-lc-detail-fields" });
    const note = fields.createDiv({ cls: "cx-lc-field is-note" });
    note.createEl("label", { text: "Study Block note" });
    const textarea = note.createEl("textarea", {
      attr: { maxlength: "500", placeholder: "Optional friction, feeling, or next step…" },
    });
    textarea.value = this.userNote;
    textarea.addEventListener("input", () => { this.userNote = textarea.value; });
  }

  renderManualDuration(parent) {
    const field = parent.createDiv({ cls: "cx-lc-manual-duration" });
    field.createEl("label", { text: "Total active minutes" });
    const input = field.createEl("input", {
      attr: { type: "number", min: "1", step: "1", inputmode: "numeric", placeholder: "e.g. 45" },
    });
    input.value = this.manualDurationMinutes;
    input.addEventListener("input", () => { this.manualDurationMinutes = input.value; });
    field.createDiv({ cls: "cx-lc-task-detail", text: "One total for the whole block; it is never divided across problems." });
  }

  renderTaskChooser(parent, selectedTask) {
    const queue = parent.createDiv({ cls: "cx-lc-queue" });
    const header = queue.createDiv({ cls: "cx-lc-section-heading" });
    header.createEl("h4", { text: this.timer() || this.manualEntryOpen ? "Add another problem" : "Continue in plan order" });
    header.createSpan({ text: "Planned dates remain anchors; unfinished order comes first" });
    const selectedIds = new Set(Object.keys(this.blockProblems()));
    const open = this.tasks()
      .filter((task) => !selectedIds.has(task.task_id))
      .sort((a, b) => Number(this.taskStatus(a.task_id) === "completed") - Number(this.taskStatus(b.task_id) === "completed"))
      .slice(0, 6);
    if (!open.length) {
      queue.createDiv({ cls: "cx-lc-empty", text: "Every plan task is already included in this block." });
      return;
    }
    open.forEach((task) => this.renderTaskRow(queue, task));
  }

  renderWeek(parent) {
    const range = trackerWeekRange();
    const tasks = this.tasks().filter((task) => task.scheduled_date >= range.start && task.scheduled_date <= range.end);
    this.renderListHeader(parent, "This Week", `${trackerDateLabel(range.start)} – ${trackerDateLabel(range.end)}`);
    if (!tasks.length) {
      parent.createDiv({ cls: "cx-lc-empty", text: "No main problem is scheduled this week." });
      return;
    }
    tasks.forEach((task) => this.renderTaskRow(parent, task));
  }

  renderPlan(parent) {
    const problems = this.problemTasks();
    const completed = this.completedTaskIds();
    const openCount = problems.filter((task) => !completed.has(task.task_id)).length;
    this.renderListHeader(parent, "Round 1 Plan", `${openCount} open problems · ${problems.length} total · dates are planning anchors`);
    let currentPattern = "";
    this.tasks().forEach((task) => {
      if (task.pattern !== currentPattern) {
        currentPattern = task.pattern;
        parent.createDiv({ cls: "cx-lc-pattern-heading", text: trackerPatternLabel(currentPattern) });
      }
      this.renderTaskRow(parent, task);
    });
  }

  renderReview(parent) {
    const active = Array.isArray(this.data.review.active) ? this.data.review.active : [];
    this.renderListHeader(parent, "Review Due", "Owned by the LeetCode repository");
    if (!active.length) {
      parent.createDiv({ cls: "cx-lc-empty", text: "No active retrieval is due. Deferred Round 2 items stay out of the current workload." });
      return;
    }
    active.forEach((review) => {
      const row = parent.createDiv({ cls: "cx-lc-task-row" });
      const main = row.createDiv({ cls: "cx-lc-task-row-main" });
      main.createDiv({ cls: "cx-lc-task-title", text: review.title });
      main.createDiv({ cls: "cx-lc-task-detail", text: `${trackerPatternLabel(review.pattern)} · ${review.review_type || "Retrieval"}` });
    });
  }

  renderActivity(parent) {
    const tasks = new Map(this.tasks().map((task) => [task.task_id, task]));
    const events = this.activity().sort((a, b) => trackerEventDate(b).localeCompare(trackerEventDate(a)));
    this.renderListHeader(parent, "Recent Activity", `${events.length} append-only records in the Bridge`);
    if (!events.length) {
      parent.createDiv({ cls: "cx-lc-empty", text: "Finish a Study Block to create the first activity record." });
      return;
    }
    events.slice(0, 20).forEach((event) => {
      const row = parent.createDiv({ cls: "cx-lc-session-row" });
      const main = row.createDiv({ cls: "cx-lc-task-row-main" });
      const problems = trackerEventProblems(event);
      const legacy = event.event_type === "session_completed";
      main.createDiv({
        cls: "cx-lc-task-title",
        text: legacy
          ? `Legacy Session · ${tasks.get(event.task_id)?.title || event.task_id}`
          : `Study Block · ${problems.length} problem${problems.length === 1 ? "" : "s"}`,
      });
      main.createDiv({
        cls: "cx-lc-task-detail",
        text: [
          trackerDateLabel(event.ended_at || event.date, { time: Boolean(event.ended_at) }),
          legacy ? "Historical v2/v3 record" : trackerPatternLabel(event.duration_source),
        ].filter(Boolean).join(" · "),
      });
      const outcomes = main.createDiv({ cls: "cx-lc-activity-outcomes" });
      problems.forEach((problem) => {
        const task = tasks.get(problem.task_id);
        outcomes.createSpan({
          cls: `cx-lc-status is-${problem.outcome}`,
          text: `${task?.title || problem.task_id} · ${trackerOutcomeLabel(problem.outcome)}`,
        });
      });
      const note = event.note || event.user_note;
      if (note) main.createDiv({ cls: "cx-lc-session-note", text: note });
    });
  }

  renderListHeader(parent, title, detail) {
    const header = parent.createDiv({ cls: "cx-lc-section-heading" });
    header.createEl("h3", { text: title });
    header.createSpan({ text: detail });
  }

  renderTaskRow(parent, task) {
    const status = this.taskStatus(task.task_id);
    const row = parent.createDiv({ cls: "cx-lc-task-row" });
    const date = row.createDiv({ cls: "cx-lc-task-date" });
    date.createSpan({ text: trackerDateLabel(task.scheduled_date) });
    const main = row.createDiv({ cls: "cx-lc-task-row-main" });
    main.createDiv({ cls: "cx-lc-task-title", text: `${task.leetcode_id ? `LC ${task.leetcode_id} · ` : ""}${task.title}` });
    main.createDiv({
      cls: "cx-lc-task-detail",
      text: `${trackerPatternLabel(task.pattern)} · ${task.stage}`,
    });
    row.createSpan({ cls: `cx-lc-status is-${status}`, text: status === "planned" ? "planned" : trackerOutcomeLabel(status) });
    const collecting = Boolean(this.timer() || this.manualEntryOpen);
    const select = row.createEl("button", {
      cls: "cx-lc-row-button",
      text: collecting ? "Add" : "Open",
    });
    select.addEventListener("click", () => {
      if (collecting) {
        this.setProblemOutcome(task.task_id, status === "completed" ? "reviewed" : "attempted");
        return;
      }
      this.selectedTaskId = task.task_id;
      this.activeTab = "today";
      this.renderTracker();
    });
  }

  async startBlock(task) {
    if (this.timer()) {
      new Notice("Finish the active LeetCode Study Block first.");
      return;
    }
    const now = new Date().toISOString();
    await this.plugin.setLeetcodeTimer(this.timerKey(), {
      started_at: now,
      running_since: now,
      active_seconds: 0,
      problems: { [task.task_id]: "attempted" },
      status: "running",
    });
    this.manualEntryOpen = false;
    this.manualProblems = {};
    this.renderTracker();
  }

  async pauseBlock() {
    const timer = this.timer();
    if (!timer || timer.status !== "running") return;
    await this.plugin.setLeetcodeTimer(this.timerKey(), {
      ...timer,
      active_seconds: Math.max(0, trackerTimerSeconds(timer)),
      running_since: null,
      status: "paused",
    });
    this.renderTracker();
  }

  async resumeBlock() {
    const timer = this.timer();
    if (!timer || timer.status !== "paused") return;
    await this.plugin.setLeetcodeTimer(this.timerKey(), {
      ...timer,
      running_since: new Date().toISOString(),
      status: "running",
    });
    this.renderTracker();
  }

  async setProblemOutcome(taskId, outcome) {
    if (!this.task(taskId) || !TRACKER_OUTCOMES.some(({ id }) => id === outcome)) return;
    const timer = this.timer();
    if (timer) {
      const problems = this.blockProblems();
      problems[taskId] = outcome;
      await this.plugin.setLeetcodeTimer(this.timerKey(), { ...timer, problems });
    } else {
      this.manualProblems = { ...this.manualProblems, [taskId]: outcome };
    }
    this.renderTracker();
  }

  async removeProblem(taskId) {
    const timer = this.timer();
    const problems = this.blockProblems();
    delete problems[taskId];
    if (timer) await this.plugin.setLeetcodeTimer(this.timerKey(), { ...timer, problems });
    else this.manualProblems = problems;
    this.renderTracker();
  }

  async appendStudyBlock(event, pendingState = null) {
    const io = trackerDesktopIO();
    const target = this.bridgePath("from_obsidian/session_events.jsonl");
    if (!io || !target) throw new Error("Bridge output is unavailable.");
    if (pendingState) await this.plugin.setLeetcodeTimer(this.timerKey(), pendingState);
    const existing = await this.readEvents();
    if (!existing.some((item) => item.event_id === event.event_id)) {
      await io.fs.promises.appendFile(target, `${JSON.stringify(event)}\n`, "utf8");
    }
  }

  async finishTimedBlock() {
    if (this.savingBlock) return;
    let timer = this.timer();
    if (!timer || !["running", "paused"].includes(timer.status)) return;
    const problems = Object.entries(this.blockProblems())
      .filter(([taskId, outcome]) => this.task(taskId) && TRACKER_OUTCOMES.some(({ id }) => id === outcome))
      .map(([task_id, outcome]) => ({ task_id, outcome }));
    if (!problems.length) {
      new Notice("Add at least one problem before finishing the Study Block.");
      return;
    }
    this.savingBlock = true;
    try {
      const eventId = timer.pending_event_id || trackerEventId();
      timer = { ...timer, pending_event_id: eventId };
      const endedAt = new Date();
      const event = {
        schema_version: 4,
        event_id: eventId,
        event_type: "study_block_completed",
        date: localISO(endedAt),
        started_at: timer.started_at,
        ended_at: endedAt.toISOString(),
        active_seconds: Math.max(0, Math.floor(trackerTimerSeconds(timer))),
        duration_source: "timer",
        problems,
      };
      const note = this.userNote.trim().slice(0, 500);
      if (note) event.note = note;
      await this.appendStudyBlock(event, timer);
      await this.plugin.setLeetcodeTimer(this.timerKey(), null);
      this.userNote = "";
      new Notice("LeetCode Study Block saved.");
      await this.render();
    } catch (error) {
      new Notice(`Could not save the LeetCode Study Block: ${error.message || error}`);
    } finally {
      this.savingBlock = false;
    }
  }

  async finishManualBlock() {
    if (this.savingBlock) return;
    const minutes = Number(this.manualDurationMinutes);
    const problems = Object.entries(this.manualProblems)
      .filter(([taskId, outcome]) => this.task(taskId) && TRACKER_OUTCOMES.some(({ id }) => id === outcome))
      .map(([task_id, outcome]) => ({ task_id, outcome }));
    if (!Number.isFinite(minutes) || minutes <= 0) {
      new Notice("Enter a positive total duration in minutes.");
      return;
    }
    if (!problems.length) {
      new Notice("Add at least one problem before saving the Study Block.");
      return;
    }
    this.savingBlock = true;
    const eventId = trackerEventId();
    try {
      const event = {
        schema_version: 4,
        event_id: eventId,
        event_type: "study_block_completed",
        date: localISO(new Date()),
        active_seconds: Math.round(minutes * 60),
        duration_source: "manual",
        problems,
      };
      const note = this.userNote.trim().slice(0, 500);
      if (note) event.note = note;
      const pending = {
        status: "saving_manual",
        pending_event_id: eventId,
        active_seconds: event.active_seconds,
        problems: Object.fromEntries(problems.map(({ task_id, outcome }) => [task_id, outcome])),
        pending_event: event,
      };
      await this.appendStudyBlock(event, pending);
      await this.plugin.setLeetcodeTimer(this.timerKey(), null);
      this.manualEntryOpen = false;
      this.manualDurationMinutes = "";
      this.manualProblems = {};
      this.userNote = "";
      new Notice("Manual LeetCode Study Block saved.");
      await this.render();
    } catch (error) {
      new Notice(`Could not save the manual Study Block: ${error.message || error}`);
    } finally {
      this.savingBlock = false;
    }
  }

  async retryPendingManualBlock() {
    if (this.savingBlock) return;
    const timer = this.timer();
    const event = timer?.pending_event;
    if (timer?.status !== "saving_manual" || !event?.event_id) return;
    this.savingBlock = true;
    try {
      await this.appendStudyBlock(event, timer);
      await this.plugin.setLeetcodeTimer(this.timerKey(), null);
      new Notice("Manual LeetCode Study Block saved.");
      await this.render();
    } catch (error) {
      new Notice(`Could not save the manual Study Block: ${error.message || error}`);
    } finally {
      this.savingBlock = false;
    }
  }

  updateTimerDisplay() {
    if (!this.blockStatus) return;
    const timer = this.timer();
    if (!timer) this.blockStatus.setText(this.manualEntryOpen ? "Manual entry" : "Ready to begin");
    else if (timer.status === "paused") this.blockStatus.setText("Study Block paused");
    else if (timer.status === "saving_manual") this.blockStatus.setText("Saving manual Study Block…");
    else this.blockStatus.setText("Study Block active");
  }
}

class DailyStatusChild extends MarkdownRenderChild {
  constructor(container, app, file) {
    super(container);
    this.app = app;
    this.file = file;
    this.writeQueue = Promise.resolve();
  }

  onload() {
    this.render();
    this.registerEvent(this.app.metadataCache.on("changed", (changedFile) => {
      if (changedFile.path === this.file.path) this.render();
    }));
    this.registerEvent(this.app.vault.on("modify", (changedFile) => {
      if (changedFile.path === this.file.path) this.render();
    }));
  }

  async setRating(metric, value) {
    const write = async () => {
      await this.app.fileManager.processFrontMatter(this.file, (frontmatter) => {
        applyRating(frontmatter, metric.key, value);
      });
      new Notice(`${metric.label}: ${value}/5`);
    };
    this.writeQueue = this.writeQueue.then(write, write);
    await this.writeQueue;
  }

  async render() {
    const frontmatter = await freshFrontmatter(this.app, this.file);
    if (!this.containerEl.isConnected) return;
    this.containerEl.empty();
    renderDailyStatus(frontmatter, this.containerEl, (metric, value) => this.setRating(metric, value));
  }
}

class DailyTimeRingsChild extends MarkdownRenderChild {
  constructor(container, app, file) {
    super(container);
    this.app = app;
    this.file = file;
    this.writeQueue = Promise.resolve();
  }

  onload() {
    this.render();
    this.registerEvent(this.app.metadataCache.on("changed", (changedFile) => {
      if (changedFile.path === this.file.path) this.render();
    }));
    this.registerEvent(this.app.vault.on("modify", (changedFile) => {
      if (changedFile.path === this.file.path) this.render();
    }));
  }

  async setMinutes(metric, nextValue) {
    const next = nextValue === null ? null : Math.max(0, Math.round(Number(nextValue)));
    if (next !== null && !Number.isFinite(next)) return;
    const write = async () => {
      await this.app.fileManager.processFrontMatter(this.file, (frontmatter) => {
        const wasReviewed = frontmatter.time_data_reviewed === true;
        if (next === null) {
          delete frontmatter[metric.key];
          delete frontmatter[metric.originKey];
        } else {
          frontmatter[metric.key] = next;
          frontmatter[metric.originKey] = "human";
        }
        const hasPendingAI = TIME_METRICS.some((item) => frontmatter[item.originKey] === "ai");
        frontmatter.time_data_reviewed = wasReviewed || !hasPendingAI;
      });
      new Notice(`${metric.label}: ${formatDuration(next)}`);
    };
    this.writeQueue = this.writeQueue.then(write, write);
    await this.writeQueue;
  }

  async setAIReviewStatus(reviewed) {
    const write = async () => {
      await this.app.fileManager.processFrontMatter(this.file, (frontmatter) => {
        frontmatter.time_data_reviewed = reviewed;
      });
      new Notice(reviewed ? "AI time values verified" : "AI time review reopened");
    };
    this.writeQueue = this.writeQueue.then(write, write);
    await this.writeQueue;
  }

  async render() {
    const frontmatter = await freshFrontmatter(this.app, this.file);
    if (!this.containerEl.isConnected) return;
    this.containerEl.empty();
    const values = TIME_METRICS.map((metric) => minutesValue(frontmatter[metric.key]));
    const timeDataReviewed = frontmatter.time_data_reviewed === true;
    const wrap = this.containerEl.createDiv({ cls: "cx-time-allocation" });
    const visual = wrap.createDiv({ cls: "cx-time-rings-visual" });
    const svg = createSvgElement(visual, "svg", { viewBox: "0 0 250 250", class: "cx-time-rings-svg" });
    const radii = [106, 84, 62, 40];

    TIME_METRICS.forEach((metric, index) => {
      const radius = radii[index];
      const circumference = 2 * Math.PI * radius;
      const minutes = values[index];
      const progress = minutes === null ? 0 : clamp(minutes / metric.goal, 0, 1);
      createSvgElement(svg, "circle", {
        cx: 125,
        cy: 125,
        r: radius,
        class: "cx-time-ring-track",
      });
      createSvgElement(svg, "circle", {
        cx: 125,
        cy: 125,
        r: radius,
        class: `cx-time-ring-progress cx-time-ring-${metric.id}${minutes !== null && minutes >= metric.goal ? " is-complete" : ""}`,
        "stroke-dasharray": circumference,
        "stroke-dashoffset": circumference * (1 - progress),
        transform: "rotate(-90 125 125)",
      });
    });

    const recorded = values.filter((value) => value !== null);
    const total = recorded.reduce((sum, value) => sum + value, 0);
    const totalText = createSvgElement(svg, "text", { x: 125, y: 131, class: "cx-time-rings-total", "text-anchor": "middle" });
    totalText.textContent = recorded.length ? formatDuration(total) : "—";

    const editor = wrap.createDiv({ cls: "cx-time-editor" });
    TIME_METRICS.forEach((metric, index) => {
      const minutes = values[index];
      const origin = frontmatter[metric.originKey];
      const level = timeLevel(minutes, metric);
      const row = editor.createDiv({ cls: `cx-time-row cx-time-row-${metric.id}` });
      const heading = row.createDiv({ cls: "cx-time-row-heading" });
      const label = heading.createDiv({ cls: "cx-time-row-label" });
      label.createSpan({ cls: `cx-time-dot cx-time-dot-${metric.id}` });
      label.createSpan({ text: metric.label });
      const meta = heading.createDiv({ cls: "cx-time-row-meta" });
      meta.createSpan({
        text: minutes === null ? "Not recorded" : minutes === 0 ? "No time" : `Level ${level}/4`,
        cls: "cx-time-level",
      });
      if (origin === "human" || origin === "ai") {
        const originText = origin === "ai"
          ? `AI · ${timeDataReviewed ? "Verified" : "Unreviewed"}`
          : "Human";
        const reviewClass = origin === "ai" ? ` is-${timeDataReviewed ? "verified" : "unreviewed"}` : "";
        meta.createSpan({ text: originText, cls: `cx-time-origin is-${origin}${reviewClass}` });
      }

      const controls = row.createDiv({ cls: "cx-time-controls" });
      const minus = controls.createEl("button", { text: "−15", cls: "cx-time-step", attr: { "aria-label": `Subtract 15 minutes from ${metric.label}` } });
      const input = controls.createEl("input", {
        cls: "cx-time-input",
        attr: { type: "number", min: "0", step: "15", inputmode: "numeric", "aria-label": `${metric.label} minutes` },
      });
      input.value = minutes === null ? "" : String(minutes);
      controls.createSpan({ text: "min", cls: "cx-time-unit" });
      const plus = controls.createEl("button", { text: "+15", cls: "cx-time-step", attr: { "aria-label": `Add 15 minutes to ${metric.label}` } });
      const clear = controls.createEl("button", { text: "Clear", cls: "cx-time-clear", attr: { "aria-label": `Clear ${metric.label} time` } });

      minus.addEventListener("click", () => this.setMinutes(metric, Math.max(0, (minutesValue(input.value) ?? 0) - 15)));
      plus.addEventListener("click", () => this.setMinutes(metric, (minutesValue(input.value) ?? 0) + 15));
      clear.addEventListener("click", () => this.setMinutes(metric, null));
      input.addEventListener("change", () => {
        const raw = input.value.trim();
        this.setMinutes(metric, raw === "" ? null : Number(raw));
      });
    });

    const hasAI = TIME_METRICS.some((metric) => frontmatter[metric.originKey] === "ai");
    if (hasAI) {
      const reviewState = timeDataReviewed ? "verified" : "unreviewed";
      const review = wrap.createDiv({ cls: `cx-time-review is-${reviewState}` });
      review.createSpan({
        text: timeDataReviewed
          ? "AI-filled time values have been verified by you."
          : "AI-filled time values are awaiting your review.",
        cls: "cx-time-review-state",
      });
      const action = review.createEl("button", {
        text: timeDataReviewed ? "Reopen review" : "Verify AI time",
        cls: `cx-time-confirm${timeDataReviewed ? " is-secondary" : ""}`,
        attr: {
          type: "button",
          "aria-label": timeDataReviewed ? "Reopen AI time review" : "Verify AI time values",
        },
      });
      action.addEventListener("click", () => this.setAIReviewStatus(!timeDataReviewed));
    }
  }
}

const DAY_METRICS_MODEL = "project-execution-v1";

function weeklyDayMetricsEligible(frontmatter, startValue, endValue) {
  const start = isoDateValue(startValue);
  const end = isoDateValue(endValue);
  const startDate = dateFromISO(start);
  const expectedEnd = startDate ? localISO(addDays(startDate, 6)) : null;
  return Boolean(
    start
    && end
    && startDate?.getDay() === 0
    && end === expectedEnd
    && String(frontmatter?.type || "").trim() === "weekly-review"
    && isoDateValue(frontmatter?.period_start) === start
    && isoDateValue(frontmatter?.period_end) === end
    && String(frontmatter?.day_metrics_model || "").trim() === DAY_METRICS_MODEL
  );
}

function ledgerDurationMinutes(value) {
  const text = String(value || "").trim();
  const hours = text.match(/(\d+(?:\.\d+)?)\s*h/i);
  const minutes = text.match(/(\d+)\s*m/i);
  if (!hours && !minutes) return 0;
  return Math.round((hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0));
}

function ledgerProjectKeys(value) {
  const text = String(value || "").trim().replace(/^['"]|['"]$/g, "");
  if (!text) return [];
  const link = text.match(/^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]$/);
  if (!link) return [text.toLowerCase()];
  const target = link[1].replace(/\.md$/i, "");
  const basename = target.split("/").pop();
  return [...new Set([target, basename, link[2]].filter(Boolean).map((item) => item.trim().toLowerCase()))];
}

function ledgerProjectLabel(value) {
  const text = String(value || "").trim().replace(/^['"]|['"]$/g, "");
  const link = text.match(/^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]$/);
  if (!link) return text || "Unassigned Project";
  return String(link[2] || link[1].split("/").pop() || "Unassigned Project").replace(/\.md$/i, "");
}

function parseDailyLedger(markdown) {
  const start = /^## Time & Task Log\s*$/m.exec(markdown || "");
  if (!start) return [];
  let section = markdown.slice(start.index + start[0].length);
  const nextHeading = section.search(/^##\s+/m);
  if (nextHeading >= 0) section = section.slice(0, nextHeading);
  section = section.replace(/<!--[\s\S]*?-->/g, "");

  const blocks = [];
  let current = null;
  section.split(/\r?\n/).forEach((line) => {
    const header = line.match(/^-\s+(.+?)\s+·\s+Engaged:\s*(.+?)\s*$/);
    if (header) {
      current = {
        activity: header[1].trim(),
        minutes: ledgerDurationMinutes(header[2]),
        mode: "",
        project: "",
        category: "",
      };
      blocks.push(current);
      return;
    }
    if (!current) return;
    const mode = line.match(/^\s{2,}-\s+Activity Mode:\s*(.+?)\s*$/i);
    const project = line.match(/^\s{2,}-\s+Project:\s*(.+?)\s*$/i);
    const category = line.match(/^\s{2,}-\s+(Admin|Workout|Enrichment)\s*$/i);
    if (mode) current.mode = mode[1].trim();
    if (project) current.project = project[1].trim();
    if (category) current.category = category[1].toLowerCase();
  });
  return blocks.filter((block) => block.minutes > 0);
}

function parseDailyDayMetrics(markdown, frontmatter = {}) {
  const blocks = parseDailyLedger(markdown);

  const coreKeys = new Set();
  const snapshot = Array.isArray(frontmatter.core_snapshot) ? frontmatter.core_snapshot : [];
  snapshot.filter((entry) => entry?.core === true).forEach((entry) => {
    ledgerProjectKeys(entry.project).forEach((key) => coreKeys.add(key));
  });

  return blocks.reduce((totals, block) => {
    const isCoreProject = block.project && ledgerProjectKeys(block.project).some((key) => coreKeys.has(key));
    if (isCoreProject) totals.projectMinutes += block.minutes;
    if (isCoreProject && block.mode.toLowerCase() === "execution") totals.coreExecutionMinutes += block.minutes;
    if (block.project && block.mode.toLowerCase() === "execution") totals.executionMinutes += block.minutes;
    if (block.category === "admin" || block.category === "workout") totals.executionMinutes += block.minutes;
    return totals;
  }, { projectMinutes: 0, executionMinutes: 0, coreExecutionMinutes: 0 });
}

function weeklyAnalyticsConfigFromMarkdown(markdown) {
  const match = String(markdown || "").match(/^```castlex-weekly-analytics[\t ]*\r?\n([\s\S]*?)^```[\t ]*$/m);
  if (!match) return {};
  try {
    return parseYaml(match[1]) ?? {};
  } catch (_error) {
    return {};
  }
}

function weeklyDependencySignature(frontmatter, analyticsConfig = null) {
  const signature = {
    type: String(frontmatter?.type || "").trim(),
    periodStart: isoDateValue(frontmatter?.period_start),
    periodEnd: isoDateValue(frontmatter?.period_end),
    dayMetricsModel: String(frontmatter?.day_metrics_model || "").trim(),
  };
  if (analyticsConfig !== null) {
    signature.historyWeeks = clamp(Number(analyticsConfig?.history_weeks) || 4, 1, 8);
  }
  return JSON.stringify(signature);
}

async function freshWeeklyDependencyState(app, file, includeAnalyticsConfig = false) {
  try {
    const content = await app.vault.read(file);
    const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    const frontmatter = match ? parseYaml(match[1]) ?? {} : {};
    return {
      frontmatter,
      analyticsConfig: includeAnalyticsConfig ? weeklyAnalyticsConfigFromMarkdown(content) : null,
    };
  } catch (error) {
    console.warn(`CastleX could not read Weekly dependencies for ${file.path}`, error);
    return {
      frontmatter: app.metadataCache.getFileCache(file)?.frontmatter ?? {},
      analyticsConfig: includeAnalyticsConfig ? {} : null,
    };
  }
}

class WeeklyRenderChild extends MarkdownRenderChild {
  constructor(container, app, file, analyticsConfig = null) {
    super(container);
    this.app = app;
    this.file = file;
    this.config = analyticsConfig ?? {};
    this.includeAnalyticsConfig = analyticsConfig !== null;
    this.periodPaths = new Set();
    this.renderTimer = null;
    this.signatureTimer = null;
    this.signatureGeneration = 0;
    this.renderGeneration = 0;
    this.lastDependencySignature = null;
    this.weeklyUnloaded = false;
  }

  startWeeklyRefresh() {
    this.render();
    const schedule = (changedFile, oldPath = null) => {
      const currentFileEvent = changedFile === this.file
        || changedFile?.path === this.file.path
        || oldPath === this.file.path;
      if (currentFileEvent) {
        this.scheduleWeeklySignatureCheck();
        return;
      }
      if (!this.periodPaths.has(changedFile?.path) && !this.periodPaths.has(oldPath)) return;
      this.scheduleWeeklyRender();
    };
    this.registerEvent(this.app.metadataCache.on("changed", schedule));
    this.registerEvent(this.app.vault.on("modify", schedule));
    this.registerEvent(this.app.vault.on("create", schedule));
    this.registerEvent(this.app.vault.on("delete", schedule));
    this.registerEvent(this.app.vault.on("rename", schedule));
  }

  onunload() {
    this.weeklyUnloaded = true;
    this.renderGeneration += 1;
    this.signatureGeneration += 1;
    if (this.renderTimer) window.clearTimeout(this.renderTimer);
    if (this.signatureTimer) window.clearTimeout(this.signatureTimer);
  }

  scheduleWeeklyRender() {
    if (this.renderTimer) window.clearTimeout(this.renderTimer);
    this.renderTimer = window.setTimeout(() => {
      this.renderTimer = null;
      this.render();
    }, 180);
  }

  scheduleWeeklySignatureCheck() {
    const generation = ++this.signatureGeneration;
    if (this.signatureTimer) window.clearTimeout(this.signatureTimer);
    this.signatureTimer = window.setTimeout(async () => {
      this.signatureTimer = null;
      const state = await freshWeeklyDependencyState(this.app, this.file, this.includeAnalyticsConfig);
      if (this.weeklyUnloaded || generation !== this.signatureGeneration) return;
      const signature = weeklyDependencySignature(state.frontmatter, state.analyticsConfig);
      if (signature === this.lastDependencySignature) return;
      if (this.includeAnalyticsConfig) this.config = state.analyticsConfig;
      this.scheduleWeeklyRender();
    }, 120);
  }

  beginWeeklyRender() {
    return ++this.renderGeneration;
  }

  captureWeeklyDependencySignature(generation, frontmatter) {
    if (this.weeklyUnloaded || generation !== this.renderGeneration) return false;
    this.lastDependencySignature = weeklyDependencySignature(
      frontmatter,
      this.includeAnalyticsConfig ? this.config : null,
    );
    return true;
  }

  weeklyRenderIsCurrent(generation) {
    return !this.weeklyUnloaded
      && generation === this.renderGeneration
      && this.containerEl.isConnected;
  }
}

class WeeklySnapshotChild extends WeeklyRenderChild {
  constructor(container, app, file) {
    super(container, app, file);
  }

  onload() {
    this.startWeeklyRefresh();
  }

  renderStateChart(parent, days) {
    const section = parent.createDiv({ cls: "cx-weekly-section cx-weekly-state-section" });
    const heading = section.createDiv({ cls: "cx-weekly-section-heading" });
    heading.createEl("h4", { text: "State relationship" });
    heading.createSpan({ text: "Sleep · Energy · Activation", cls: "cx-weekly-section-subtitle" });
    const svg = createSvgElement(section, "svg", {
      viewBox: "0 0 760 244",
      class: "cx-weekly-state-chart",
      role: "img",
      "aria-label": "Daily sleep quality, work energy, and activation from one to five across the weekly period",
    });
    const left = 48;
    const right = 720;
    const top = 24;
    const bottom = 184;
    const denominator = Math.max(1, days.length - 1);
    const xAt = (index) => left + index * ((right - left) / denominator);
    const yAt = (value) => bottom - ((value - 1) / 4) * (bottom - top);
    for (let value = 1; value <= 5; value += 1) {
      const y = yAt(value);
      createSvgElement(svg, "line", { x1: left, y1: y, x2: right, y2: y, class: "cx-weekly-grid-line" });
      const label = createSvgElement(svg, "text", { x: 27, y: y + 4, class: "cx-weekly-axis-label", "text-anchor": "middle" });
      label.textContent = String(value);
    }
    const series = [
      { metric: "sleep", label: "Sleep", cls: "is-sleep" },
      { metric: "energy", label: "Energy", cls: "is-energy" },
      { metric: "activation", label: "Activation", cls: "is-activation" },
    ];
    series.forEach((definition) => {
      let segment = [];
      const flush = () => {
        if (segment.length > 1) createSvgElement(svg, "polyline", {
          points: segment.join(" "),
          class: `cx-weekly-state-line ${definition.cls}`,
        });
        segment = [];
      };
      days.forEach((day, index) => {
        const value = stateTrendValue(day.frontmatter, definition.metric);
        if (value === null) {
          flush();
          return;
        }
        const x = xAt(index);
        const y = yAt(value);
        segment.push(`${x},${y}`);
        const point = createSvgElement(svg, "circle", {
          cx: x,
          cy: y,
          r: 4.5,
          class: `cx-weekly-state-point ${definition.cls}`,
        });
        const title = createSvgElement(point, "title");
        title.textContent = `${day.iso} · ${definition.label}: ${value}/5`;
      });
      flush();
    });
    days.forEach((day, index) => {
      const label = createSvgElement(svg, "text", {
        x: xAt(index),
        y: 216,
        class: "cx-weekly-date-label",
        "text-anchor": "middle",
      });
      label.textContent = day.iso.slice(5).replace("-", "/");
    });
    const legend = section.createDiv({ cls: "cx-weekly-legend" });
    series.forEach((definition) => {
      const item = legend.createSpan({ cls: `cx-weekly-legend-item ${definition.cls}` });
      item.createSpan({ cls: "cx-weekly-legend-mark" });
      item.createSpan({ text: definition.label });
    });
  }

  renderAllocationChart(parent, days) {
    const section = parent.createDiv({ cls: "cx-weekly-section cx-weekly-allocation-section" });
    const heading = section.createDiv({ cls: "cx-weekly-section-heading" });
    heading.createEl("h4", { text: "Engaged time" });
    heading.createSpan({ text: "Daily total and allocation", cls: "cx-weekly-section-subtitle" });
    const maximum = Math.max(1, ...days.map((day) => day.totalMinutes));
    const chart = section.createDiv({
      cls: "cx-weekly-allocation-chart",
      attr: { role: "img", "aria-label": "Stacked daily engaged time by Project, Enrichment, Workout, and Admin" },
    });
    days.forEach((day) => {
      const row = chart.createDiv({ cls: "cx-weekly-allocation-row" });
      row.createSpan({ text: day.iso.slice(5).replace("-", "/"), cls: "cx-weekly-allocation-date" });
      const track = row.createDiv({ cls: "cx-weekly-allocation-track" });
      const fill = track.createDiv({ cls: "cx-weekly-allocation-fill" });
      fill.style.width = `${day.totalMinutes / maximum * 100}%`;
      TIME_METRICS.forEach((metric) => {
        const minutes = minutesValue(day.frontmatter?.[metric.key]) ?? 0;
        if (!minutes || !day.totalMinutes) return;
        const segment = fill.createSpan({ cls: `cx-weekly-allocation-segment is-${metric.id}` });
        segment.style.width = `${minutes / day.totalMinutes * 100}%`;
        segment.setAttr("title", `${day.iso} · ${metric.label}: ${formatDuration(minutes)}`);
        segment.setAttr("aria-label", `${metric.label}: ${formatDuration(minutes)}`);
      });
      if (!day.totalMinutes) track.createSpan({ text: "0", cls: "cx-weekly-allocation-zero" });
      row.createSpan({ text: formatDuration(day.totalMinutes), cls: "cx-weekly-allocation-total" });
    });
    const legend = section.createDiv({ cls: "cx-weekly-legend cx-weekly-time-legend" });
    TIME_METRICS.forEach((metric) => {
      const item = legend.createSpan({ cls: `cx-weekly-legend-item is-${metric.id}` });
      item.createSpan({ cls: "cx-weekly-legend-mark" });
      item.createSpan({ text: metric.label });
    });
  }

  async render() {
    const generation = this.beginWeeklyRender();
    const weeklyFrontmatter = await freshFrontmatter(this.app, this.file);
    if (!this.captureWeeklyDependencySignature(generation, weeklyFrontmatter)) return;
    const dayMetricsEnabled = weeklyFrontmatter.day_metrics_model === DAY_METRICS_MODEL;
    const dates = dateRange(weeklyFrontmatter.period_start, weeklyFrontmatter.period_end);
    this.periodPaths = new Set(dates.map((date) => dailyPathFromISO(localISO(date))).filter(Boolean));
    const days = await Promise.all(dates.map(async (date) => {
      const iso = localISO(date);
      const path = dailyPathFromISO(iso);
      const file = path ? this.app.vault.getAbstractFileByPath(path) : null;
      const frontmatter = file instanceof TFile ? await freshFrontmatter(this.app, file) : {};
      const markdown = dayMetricsEnabled && file instanceof TFile ? await this.app.vault.cachedRead(file) : "";
      const values = TIME_METRICS.map((metric) => minutesValue(frontmatter?.[metric.key]));
      return {
        iso,
        file,
        frontmatter,
        totalMinutes: values.filter((value) => value !== null).reduce((sum, value) => sum + value, 0),
        hasTimeData: values.some((value) => value !== null),
        dayMetrics: dayMetricsEnabled ? parseDailyDayMetrics(markdown, frontmatter) : null,
      };
    }));
    if (!this.weeklyRenderIsCurrent(generation)) return;
    this.containerEl.empty();
    if (!dates.length) {
      this.containerEl.createDiv({ text: "Set valid period_start and period_end values to render the Weekly Snapshot.", cls: "cx-weekly-empty" });
      return;
    }

    const totalMinutes = days.reduce((sum, day) => sum + day.totalMinutes, 0);
    const recordedDays = days.filter((day) => day.hasTimeData).length;
    const wrap = this.containerEl.createDiv({ cls: "cx-weekly-snapshot" });
    const header = wrap.createDiv({ cls: "cx-weekly-header" });
    const headerCopy = header.createDiv();
    headerCopy.createEl("h3", { text: "Weekly Data Snapshot" });
    headerCopy.createSpan({
      text: `${isoDateValue(weeklyFrontmatter.period_start)} → ${isoDateValue(weeklyFrontmatter.period_end)}`,
      cls: "cx-weekly-period",
    });

    const stats = wrap.createDiv({ cls: `cx-weekly-stats${dayMetricsEnabled ? " has-day-metrics" : ""}` });
    const statItems = [
      [formatDuration(totalMinutes), "Engaged time"],
      [formatDuration(Math.round(totalMinutes / days.length)), "Daily average"],
      [`${recordedDays}/${days.length}`, "Days with time data"],
    ];
    if (dayMetricsEnabled) {
      const projectDays = days.filter((day) => (day.dayMetrics?.projectMinutes || 0) >= 120).length;
      const executionDays = days.filter((day) => (day.dayMetrics?.executionMinutes || 0) >= 120).length;
      statItems.push(
        [`${projectDays}/${days.length}`, "Project Days"],
        [`${executionDays}/${days.length}`, "Execution Days"],
      );
    }
    statItems.forEach(([value, label]) => {
      const stat = stats.createDiv({ cls: "cx-weekly-stat" });
      stat.createDiv({ text: value, cls: "cx-weekly-stat-value" });
      stat.createDiv({ text: label, cls: "cx-weekly-stat-label" });
    });

    const charts = wrap.createDiv({ cls: "cx-weekly-charts" });
    this.renderAllocationChart(charts, days);
    const sleepAverage = average(days.map((day) => stateTrendValue(day.frontmatter, "sleep")));
    const energyAverage = average(days.map((day) => stateTrendValue(day.frontmatter, "energy")));
    const activationAverage = average(days.map((day) => stateTrendValue(day.frontmatter, "activation")));
    const footer = wrap.createDiv({ cls: "cx-weekly-snapshot-footer" });
    footer.createSpan({ text: `Sleep ${sleepAverage?.toFixed(1) ?? "—"} · Energy ${energyAverage?.toFixed(1) ?? "—"} · Activation ${activationAverage?.toFixed(1) ?? "—"}` });
    footer.createSpan({ text: "Current Daily Note YAML · human corrections take precedence" });
  }
}

function analyticsTimeHour(value, overnight = false) {
  const match = String(value || "").match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  let result = Number(match[1]) + Number(match[2]) / 60;
  if (overnight && result < 6) result += 24;
  return result;
}

function analyticsClock(value) {
  if (!Number.isFinite(value)) return "—";
  const normalized = ((value % 24) + 24) % 24;
  const roundedMinutes = Math.round(normalized * 60);
  const hours = Math.floor(roundedMinutes / 60) % 24;
  const minutes = roundedMinutes % 60;
  return `${pad(hours)}:${pad(minutes)}`;
}

function analyticsDeviation(values) {
  const numeric = values.filter(Number.isFinite);
  if (!numeric.length) return null;
  const mean = average(numeric);
  return Math.sqrt(numeric.reduce((sum, value) => sum + (value - mean) ** 2, 0) / numeric.length);
}

function analyticsAdd(map, key, amount) {
  if (!key || !amount) return;
  map.set(key, (map.get(key) || 0) + amount);
}

function analyticsCount(map, values) {
  healthArray(values).filter(Boolean).forEach((value) => map.set(value, (map.get(value) || 0) + 1));
}

function analyticsLabel(definitions, value) {
  return definitions.find(([id]) => id === value)?.[1] || String(value || "—");
}

function analyticsProjectProgressAt(markdown, frontmatter, cutoffISO) {
  const bySection = new Map();
  let currentSection = "";
  let reliable = true;
  String(markdown || "").split(/\r?\n/).forEach((line) => {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) currentSection = heading[1];
    const checkbox = line.match(/^\s*- \[([ xX])\] (.+)$/);
    if (!checkbox) return;
    const checked = checkbox[1].toLowerCase() === "x";
    const completedAt = checkbox[2].match(/✅ ?(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
    if (checked && !completedAt) reliable = false;
    const completed = checked && Boolean(completedAt && completedAt <= cutoffISO);
    if (!bySection.has(currentSection)) bySection.set(currentSection, []);
    bySection.get(currentSection).push({ completed, completedAt });
  });
  const configuredSections = progressSections(frontmatter.progress_sections);
  if (!configuredSections.length) return { progress: null, completed: 0, total: 0, reliable: false };
  let completed = 0;
  let total = 0;
  const progress = clamp(configuredSections.reduce((sum, { section, weight }) => {
    const items = bySection.get(section) ?? [];
    if (!items.length) return sum;
    completed += items.filter((item) => item.completed).length;
    total += items.length;
    return sum + items.filter((item) => item.completed).length / items.length * weight;
  }, 0), 0, 100);
  return { progress, completed, total, reliable };
}

function analyticsProjectTarget(value) {
  const text = String(value || "").trim().replace(/^['"]|['"]$/g, "");
  const link = text.match(/^\[\[([^|\]]+)(?:\|[^\]]+)?\]\]$/);
  if (!link) return null;
  const target = link[1].replace(/\.md$/i, "");
  return normalizePath(`${target}.md`);
}

function analyticsMentalIndex(frontmatter) {
  const values = MENTAL_METRICS.map((metric) => mentalDisplayValue(metric, frontmatter[metric.key]));
  const mean = average(values);
  return mean === null ? null : Math.round(mean / 5 * 100);
}

function analyticsFragmentation(blocks) {
  const minutes = blocks.map((block) => block.minutes).filter((value) => value > 0);
  const total = minutes.reduce((sum, value) => sum + value, 0);
  if (!total) return { index: null, count: 0, average: 0, longest: 0 };
  const concentration = minutes.reduce((sum, value) => sum + (value / total) ** 2, 0);
  return {
    index: Math.round((1 - concentration) * 100),
    count: minutes.length,
    average: Math.round(total / minutes.length),
    longest: Math.max(...minutes),
  };
}

function analyticsDelta(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return { label: "—", cls: "is-missing" };
  if (previous === 0) {
    if (current === 0) return { label: "→ 0%", cls: "is-flat" };
    return { label: "↑ New", cls: "is-up" };
  }
  const percent = (current - previous) / previous * 100;
  if (Math.abs(percent) < 0.05) return { label: "→ 0%", cls: "is-flat" };
  return {
    label: `${percent > 0 ? "↑" : "↓"} ${Math.abs(percent).toFixed(1)}%`,
    cls: percent > 0 ? "is-up" : "is-down",
  };
}

function analyticsWorkoutChoice(workout, mode) {
  const id = String(workout || "");
  if (!id) return "—";
  const definition = HEALTH_WORKOUTS[id];
  const label = definition?.shortLabel || definition?.label || id;
  return mode ? `${label} · ${healthModeLabel(mode)}` : label;
}

const ANALYTICS_HEALTH_TERMS = {
  dream: [["none", "无梦境印象"], ["dream", "普通梦境"], ["vivid", "明显梦境"], ["nightmare", "噩梦"]],
  need: [["rest", "休息"], ["movement", "活动"], ["quiet", "安静"], ["focus", "专注"], ["connection", "连接"], ["space", "空间"]],
  nap: [["none", "无午睡"], ["15-30", "午睡 15–30m"], ["30-45", "午睡 30–45m"], ["45-60", "午睡 45–60m"], ["60+", "午睡 60m+"]],
  workout: [["rest", "休息日"], ["pool", "水中慢跑"], ["back", "背部"], ["upper", "上肢"], ["legs", "腿部"], ["stretch", "拉伸"]],
};

class WeeklyAnalyticsChild extends WeeklyRenderChild {
  constructor(container, app, file, config = {}) {
    super(container, app, file, config);
  }

  onload() {
    this.startWeeklyRefresh();
  }

  async loadDay(date) {
    const iso = localISO(date);
    const path = dailyPathFromISO(iso);
    const file = path ? this.app.vault.getAbstractFileByPath(path) : null;
    const frontmatter = file instanceof TFile ? await freshFrontmatter(this.app, file) : {};
    const markdown = file instanceof TFile ? await this.app.vault.cachedRead(file) : "";
    const ledger = parseDailyLedger(markdown);
    const values = TIME_METRICS.map((metric) => minutesValue(frontmatter?.[metric.key]));
    return {
      iso,
      file,
      frontmatter,
      ledger,
      totalMinutes: values.filter((value) => value !== null).reduce((sum, value) => sum + value, 0),
      hasTimeData: values.some((value) => value !== null),
      dayMetrics: parseDailyDayMetrics(markdown, frontmatter),
    };
  }

  section(parent, title, subtitle = "") {
    const section = parent.createDiv({ cls: "cx-weekly-analytics-section" });
    const heading = section.createDiv({ cls: "cx-weekly-section-heading" });
    heading.createEl("h4", { text: title });
    if (subtitle) heading.createSpan({ text: subtitle, cls: "cx-weekly-section-subtitle" });
    return section;
  }

  renderStats(parent, days) {
    const projects = new Set(days.flatMap((day) => day.ledger.filter((block) => block.project).map((block) => ledgerProjectLabel(block.project))));
    const executionMinutes = days.flatMap((day) => day.ledger)
      .filter((block) => block.project && block.mode.toLowerCase() === "execution")
      .reduce((sum, block) => sum + block.minutes, 0);
    const values = [
      [String(projects.size), "Projects"],
      [formatDuration(executionMinutes), "Project Execution"],
      [`${days.filter((day) => day.frontmatter.time_data_reviewed === true).length}/${days.length}`, "Verified Time Days"],
      [`${days.filter((day) => MENTAL_METRICS.some((metric) => rating(day.frontmatter[metric.key]) !== null)).length}/${days.length}`, "Mental Entries"],
      [`${days.filter((day) => day.frontmatter.health_night_bedtime_at || day.frontmatter.health_early_morning_bedtime_at).length}/${days.length}`, "Bedtime Records"],
    ];
    const stats = parent.createDiv({ cls: "cx-weekly-analytics-stats" });
    values.forEach(([value, label]) => {
      const stat = stats.createDiv({ cls: "cx-weekly-analytics-stat" });
      stat.createDiv({ text: value, cls: "cx-weekly-stat-value" });
      stat.createDiv({ text: label, cls: "cx-weekly-stat-label" });
    });
  }

  renderBars(parent, title, subtitle, rows, className = "") {
    const section = this.section(parent, title, subtitle);
    const maximum = Math.max(1, ...rows.map((row) => row.value));
    const list = section.createDiv({ cls: `cx-weekly-analytics-bars ${className}` });
    rows.forEach((row) => {
      const item = list.createDiv({ cls: "cx-weekly-analytics-bar-row" });
      item.createSpan({ text: row.label, cls: "cx-weekly-analytics-bar-label" });
      const track = item.createDiv({ cls: "cx-weekly-analytics-bar-track" });
      const fill = track.createDiv({ cls: `cx-weekly-analytics-bar-fill${row.cls ? ` ${row.cls}` : ""}` });
      fill.style.width = `${row.value / maximum * 100}%`;
      item.createSpan({ text: row.format || formatDuration(row.value), cls: "cx-weekly-analytics-bar-value" });
    });
    return section;
  }

  renderTimeBreakdown(parent, days) {
    const projectMap = new Map();
    const modeMap = new Map();
    days.flatMap((day) => day.ledger).forEach((block) => {
      if (!block.project) return;
      analyticsAdd(projectMap, ledgerProjectLabel(block.project), block.minutes);
      analyticsAdd(modeMap, block.mode || "Not Classified", block.minutes);
    });
    const projectRows = [...projectMap].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
    const modeOrder = ["Execution", "Planning", "System", "Not Classified"];
    const modeRows = modeOrder.filter((label) => modeMap.has(label)).map((label) => ({ label, value: modeMap.get(label) }));
    const categoryRows = TIME_METRICS.map((metric) => ({
      label: metric.label,
      value: days.reduce((sum, day) => sum + (minutesValue(day.frontmatter[metric.key]) || 0), 0),
      cls: `is-${metric.id}`,
    })).sort((a, b) => b.value - a.value);
    const grid = parent.createDiv({ cls: "cx-weekly-analytics-grid is-three" });
    this.renderBars(grid, "Project Time", `${projectRows.length} projects`, projectRows);
    this.renderBars(grid, "Project Activity Mode", "Ledger classifications", modeRows);
    this.renderBars(grid, "Time Categories", "Daily YAML totals", categoryRows);
  }

  async renderProjectProgress(parent, days, weeklyFrontmatter, generation) {
    const invested = new Map();
    days.flatMap((day) => day.ledger).forEach((block) => {
      if (!block.project) return;
      const target = analyticsProjectTarget(block.project);
      if (!target) return;
      const current = invested.get(target) ?? { label: ledgerProjectLabel(block.project), minutes: 0, executionMinutes: 0 };
      current.minutes += block.minutes;
      if (block.mode.toLowerCase() === "execution") current.executionMinutes += block.minutes;
      invested.set(target, current);
    });
    const periodStart = isoDateValue(weeklyFrontmatter.period_start);
    const periodEnd = isoDateValue(weeklyFrontmatter.period_end);
    const startCutoff = localISO(addDays(dateFromISO(periodStart), -1));
    const rows = [];
    for (const [path, allocation] of invested) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) continue;
      const frontmatter = await freshFrontmatter(this.app, file);
      const markdown = await this.app.vault.cachedRead(file);
      this.periodPaths.add(file.path);
      const start = analyticsProjectProgressAt(markdown, frontmatter, startCutoff);
      const end = analyticsProjectProgressAt(markdown, frontmatter, periodEnd);
      rows.push({
        ...allocation,
        file,
        start,
        end,
        delta: start.progress === null || end.progress === null ? null : end.progress - start.progress,
        completedDelta: end.completed - start.completed,
        reliable: start.reliable && end.reliable,
      });
    }
    if (!this.weeklyRenderIsCurrent(generation)) return false;
    rows.sort((a, b) => (b.delta ?? -1) - (a.delta ?? -1) || b.minutes - a.minutes);
    const section = this.section(parent, "Project Velocity", "Progress Δ · completed tasks · execution time");
    const grid = section.createDiv({ cls: "cx-weekly-project-progress" });
    rows.forEach((row) => {
      const card = grid.createDiv({ cls: `cx-weekly-project-progress-card${row.reliable ? "" : " is-unreliable"}` });
      const header = card.createDiv({ cls: "cx-weekly-project-progress-header" });
      header.createSpan({ text: row.label, cls: "cx-weekly-project-progress-name" });
      header.createSpan({ text: `${formatDuration(row.executionMinutes)} execution`, cls: "cx-weekly-project-progress-time" });
      const values = card.createDiv({ cls: "cx-weekly-project-progress-values" });
      values.createSpan({ text: row.start.progress === null ? "—" : `${row.start.progress.toFixed(1)}%` });
      values.createSpan({ text: "→", cls: "cx-weekly-project-progress-arrow" });
      values.createSpan({ text: row.end.progress === null ? "—" : `${row.end.progress.toFixed(1)}%` });
      values.createSpan({
        text: row.delta === null ? "—" : `${row.delta >= 0 ? "+" : ""}${row.delta.toFixed(1)} pp`,
        cls: `cx-weekly-project-progress-delta${(row.delta || 0) > 0 ? " is-positive" : ""}`,
      });
      const track = card.createDiv({ cls: "cx-weekly-project-progress-track" });
      const startFill = track.createSpan({ cls: "cx-weekly-project-progress-start" });
      startFill.style.width = `${row.start.progress || 0}%`;
      const gainFill = track.createSpan({ cls: "cx-weekly-project-progress-gain" });
      gainFill.style.left = `${row.start.progress || 0}%`;
      gainFill.style.width = `${Math.max(0, row.delta || 0)}%`;
      card.createDiv({
        text: `${row.completedDelta >= 0 ? "+" : ""}${row.completedDelta} completed tasks · ${row.end.completed}/${row.end.total}`,
        cls: "cx-weekly-project-progress-tasks",
      });
      card.createDiv({
        text: `${formatDuration(row.executionMinutes)} execution · ${formatDuration(row.minutes)} total invested`,
        cls: "cx-weekly-project-progress-tasks",
      });
    });
    if (!rows.length) grid.createDiv({ text: "—", cls: "cx-weekly-frequency-empty" });
    return true;
  }

  renderDayMatrix(parent, days) {
    const section = this.section(parent, "Project / Execution Days", "Threshold: 120 minutes");
    const matrix = section.createDiv({ cls: "cx-weekly-day-matrix" });
    const labels = matrix.createDiv({ cls: "cx-weekly-day-matrix-labels" });
    labels.createSpan();
    days.forEach((day) => labels.createSpan({ text: day.iso.slice(5).replace("-", "/") }));
    [
      ["Project Day", "projectMinutes"],
      ["Execution Day", "executionMinutes"],
    ].forEach(([label, key]) => {
      const row = matrix.createDiv({ cls: "cx-weekly-day-matrix-row" });
      row.createSpan({ text: label, cls: "cx-weekly-day-matrix-name" });
      days.forEach((day) => {
        const minutes = day.dayMetrics[key] || 0;
        const cell = row.createDiv({ cls: `cx-weekly-day-cell${minutes >= 120 ? " is-active" : ""}` });
        cell.createSpan({ text: minutes >= 120 ? "●" : "○", cls: "cx-weekly-day-symbol" });
        cell.createSpan({ text: `${minutes}m`, cls: "cx-weekly-day-minutes" });
      });
    });
  }

  renderWeeklyTrend(parent, weeks) {
    const section = this.section(parent, "Four-Week Trend", "Sunday–Saturday · current Daily YAML");
    const chart = section.createDiv({ cls: "cx-weekly-history-chart" });
    const maximum = Math.max(1, ...weeks.map((week) => week.days.reduce((sum, day) => sum + day.totalMinutes, 0)));
    weeks.forEach((week) => {
      const total = week.days.reduce((sum, day) => sum + day.totalMinutes, 0);
      const column = chart.createDiv({ cls: `cx-weekly-history-column${week.current ? " is-current" : ""}` });
      column.createSpan({ text: formatDuration(total), cls: "cx-weekly-history-total" });
      const track = column.createDiv({ cls: "cx-weekly-history-track" });
      const fill = track.createDiv({ cls: "cx-weekly-history-fill" });
      fill.style.height = `${total / maximum * 100}%`;
      TIME_METRICS.forEach((metric) => {
        const minutes = week.days.reduce((sum, day) => sum + (minutesValue(day.frontmatter[metric.key]) || 0), 0);
        if (!minutes || !total) return;
        const segment = fill.createSpan({ cls: `cx-weekly-history-segment is-${metric.id}` });
        segment.style.height = `${minutes / total * 100}%`;
        segment.setAttr("title", `${metric.label}: ${formatDuration(minutes)}`);
      });
      column.createSpan({ text: week.start.slice(5).replace("-", "/"), cls: "cx-weekly-history-label" });
    });

    const table = section.createDiv({ cls: "cx-weekly-trend-table" });
    const header = table.createDiv({ cls: "cx-weekly-trend-row is-header" });
    header.createSpan();
    weeks.forEach((week) => header.createSpan({ text: week.start.slice(5).replace("-", "/") }));
    [
      ["Sleep", (day) => stateTrendValue(day.frontmatter, "sleep")],
      ["Energy", (day) => stateTrendValue(day.frontmatter, "energy")],
      ["Activation", (day) => stateTrendValue(day.frontmatter, "activation")],
      ["Project Days", null],
      ["Execution Days", null],
    ].forEach(([label, accessor], rowIndex) => {
      const row = table.createDiv({ cls: "cx-weekly-trend-row" });
      row.createSpan({ text: label });
      weeks.forEach((week) => {
        let value = "—";
        if (accessor) {
          const mean = average(week.days.map(accessor));
          value = mean === null ? "—" : mean.toFixed(1);
        } else if (week.dayMetricsEnabled) {
          const key = rowIndex === 3 ? "projectMinutes" : "executionMinutes";
          value = `${week.days.filter((day) => day.dayMetrics[key] >= 120).length}/7`;
        }
        row.createSpan({ text: value, cls: value === "—" ? "is-missing" : "" });
      });
    });
  }

  renderInvestmentChange(parent, weeks, precedingWeek = null) {
    const visibleWeeks = weeks.slice(-4);
    const contextWeeks = precedingWeek ? [precedingWeek, ...weeks] : weeks;
    const section = this.section(parent, "Week-over-Week Investment Change", "Rolling four weeks · each visible week compared with its preceding week");
    const cards = section.createDiv({ cls: "cx-weekly-investment-grid" });
    const definitions = [
      { id: "total", label: "Total Engaged", value: (week) => week.days.reduce((sum, day) => sum + day.totalMinutes, 0) },
      ...TIME_METRICS.map((metric) => ({
        id: metric.id,
        label: metric.label,
        value: (week) => week.days.reduce((sum, day) => sum + (minutesValue(day.frontmatter[metric.key]) || 0), 0),
      })),
    ];
    definitions.forEach((definition) => {
      const values = visibleWeeks.map((week) => definition.value(week));
      const contextValues = contextWeeks.map((week) => definition.value(week));
      const maximum = Math.max(1, ...values);
      const card = cards.createDiv({ cls: `cx-weekly-investment-card is-${definition.id}` });
      const header = card.createDiv({ cls: "cx-weekly-investment-header" });
      header.createSpan({ text: definition.label, cls: "cx-weekly-investment-title" });
      const chart = card.createDiv({ cls: "cx-weekly-investment-chart" });
      visibleWeeks.forEach((week, index) => {
        const contextIndex = contextWeeks.findIndex((candidate) => candidate.start === week.start);
        const previousWeek = contextWeeks[contextIndex - 1];
        const hasCurrentData = week.days.length === 7 && week.days.every((day) => day.hasTimeData);
        const hasPreviousData = previousWeek?.days.length === 7 && previousWeek.days.every((day) => day.hasTimeData);
        const delta = hasCurrentData && hasPreviousData
          ? analyticsDelta(contextValues[contextIndex], contextValues[contextIndex - 1])
          : { label: "—", cls: "is-missing" };
        const column = chart.createDiv({ cls: `cx-weekly-investment-column${week.current ? " is-current" : ""}` });
        column.createSpan({ text: delta.label, cls: `cx-weekly-investment-delta ${delta.cls}` });
        column.createSpan({ text: formatDuration(values[index]), cls: "cx-weekly-investment-time" });
        const track = column.createDiv({ cls: "cx-weekly-investment-track" });
        const fill = track.createDiv({ cls: `cx-weekly-investment-fill is-${definition.id}` });
        fill.style.height = `${values[index] / maximum * 100}%`;
        column.createSpan({ text: week.start.slice(5).replace("-", "/"), cls: "cx-weekly-investment-week" });
      });
    });
  }

  renderCapacityLoad(parent, days) {
    const health = days.map((day) => {
      const value = Number(day.frontmatter.health_recommendation_capacity);
      return Number.isFinite(value) ? value : null;
    });
    const mental = days.map((day) => analyticsMentalIndex(day.frontmatter));
    const gaps = days.map((day, index) => {
      if (health[index] === null || mental[index] === null) return null;
      const capacity = (health[index] + mental[index]) / 2;
      const load = clamp(day.totalMinutes / 480 * 100, 0, 100);
      return Math.round(load - capacity);
    });
    const gapSection = this.section(parent, "Capacity–Load Gap", "Load: engaged time ÷ 8h · Capacity: mean of Health and Mental");
    const gapSummary = average(gaps);
    gapSection.createDiv({
      text: gapSummary === null ? "—" : `${gapSummary > 0 ? "+" : ""}${gapSummary.toFixed(1)} pp weekly mean`,
      cls: `cx-weekly-derived-summary${gapSummary === null ? " is-missing" : gapSummary > 0 ? " is-over" : " is-reserve"}`,
    });
    const gapChart = gapSection.createDiv({ cls: "cx-weekly-gap-chart" });
    days.forEach((day, index) => {
      const row = gapChart.createDiv({ cls: "cx-weekly-gap-row" });
      row.createSpan({ text: day.iso.slice(5).replace("-", "/"), cls: "cx-weekly-derived-date" });
      const track = row.createDiv({ cls: "cx-weekly-gap-track" });
      track.createSpan({ cls: "cx-weekly-gap-zero" });
      const gap = gaps[index];
      if (gap !== null) {
        const fill = track.createSpan({ cls: `cx-weekly-gap-fill${gap > 0 ? " is-over" : " is-reserve"}` });
        fill.style.left = gap > 0 ? "50%" : `${50 - Math.min(50, Math.abs(gap) / 2)}%`;
        fill.style.width = `${Math.min(50, Math.abs(gap) / 2)}%`;
      }
      row.createSpan({ text: gap === null ? "—" : `${gap > 0 ? "+" : ""}${gap} pp`, cls: "cx-weekly-derived-value" });
    });
  }

  renderExecutionQuality(parent, days) {
    const grid = parent.createDiv({ cls: "cx-weekly-derived-grid" });
    const ratioSection = this.section(grid, "Core Execution Ratio", "Core Project Execution ÷ total engaged time");
    const coreExecution = days.reduce((sum, day) => sum + (day.dayMetrics.coreExecutionMinutes || 0), 0);
    const total = days.reduce((sum, day) => sum + day.totalMinutes, 0);
    const weeklyRatio = total ? coreExecution / total * 100 : null;
    ratioSection.createDiv({
      text: weeklyRatio === null ? "—" : `${weeklyRatio.toFixed(1)}% · ${formatDuration(coreExecution)} / ${formatDuration(total)}`,
      cls: "cx-weekly-derived-summary is-ratio",
    });
    const ratioChart = ratioSection.createDiv({ cls: "cx-weekly-derived-bars" });
    days.forEach((day) => {
      const value = day.totalMinutes ? day.dayMetrics.coreExecutionMinutes / day.totalMinutes * 100 : null;
      const row = ratioChart.createDiv({ cls: "cx-weekly-derived-row" });
      row.createSpan({ text: day.iso.slice(5).replace("-", "/"), cls: "cx-weekly-derived-date" });
      const track = row.createDiv({ cls: "cx-weekly-derived-track" });
      if (value !== null) {
        const fill = track.createSpan({ cls: "cx-weekly-derived-fill is-ratio" });
        fill.style.width = `${value}%`;
      }
      row.createSpan({ text: value === null ? "—" : `${value.toFixed(0)}%`, cls: "cx-weekly-derived-value" });
    });

    const fragmentation = days.map((day) => analyticsFragmentation(day.ledger));
    const fragmentSection = this.section(grid, "Time Fragmentation Index", "1 − Σ(block share²) · 0 single block → 100 dispersed");
    const allBlocks = days.flatMap((day) => day.ledger);
    const weeklyFragmentation = analyticsFragmentation(allBlocks);
    const weeklyFragmentationMean = average(fragmentation.map((value) => value.index));
    fragmentSection.createDiv({
      text: weeklyFragmentationMean === null ? "—" : `${weeklyFragmentationMean.toFixed(1)} daily mean · ${weeklyFragmentation.count} blocks · ${formatDuration(weeklyFragmentation.average)} avg`,
      cls: "cx-weekly-derived-summary is-fragmentation",
    });
    const fragmentChart = fragmentSection.createDiv({ cls: "cx-weekly-derived-bars" });
    days.forEach((day, index) => {
      const value = fragmentation[index];
      const row = fragmentChart.createDiv({ cls: "cx-weekly-derived-row" });
      row.createSpan({ text: day.iso.slice(5).replace("-", "/"), cls: "cx-weekly-derived-date" });
      const track = row.createDiv({ cls: "cx-weekly-derived-track" });
      if (value.index !== null) {
        const fill = track.createSpan({ cls: "cx-weekly-derived-fill is-fragmentation" });
        fill.style.width = `${value.index}%`;
      }
      row.createSpan({
        text: value.index === null ? "—" : `${value.index} · ${value.count}b`,
        cls: "cx-weekly-derived-value",
        attr: { title: value.index === null ? "No ledger blocks" : `Average ${formatDuration(value.average)} · longest ${formatDuration(value.longest)}` },
      });
    });
  }

  renderCrossDomain(parent, days) {
    const section = this.section(parent, "Health × Mental × Time", "Daily alignment · no causal inference");
    const healthValues = days.map((day) => {
      const value = Number(day.frontmatter.health_recommendation_capacity);
      return Number.isFinite(value) ? value : null;
    });
    const mentalValues = days.map((day) => analyticsMentalIndex(day.frontmatter));
    const maximumMinutes = Math.max(1, ...days.map((day) => day.totalMinutes));
    const svg = createSvgElement(section, "svg", {
      viewBox: "0 0 760 286",
      class: "cx-weekly-cross-chart",
      role: "img",
      "aria-label": "Daily health capacity and mental availability over engaged time",
    });
    const left = 48; const right = 712; const top = 24; const bottom = 214; const edgeInset = 18;
    const xAt = (index) => days.length === 1
      ? (left + right) / 2
      : left + edgeInset + index * ((right - left - edgeInset * 2) / (days.length - 1));
    const yAt = (value) => bottom - value / 100 * (bottom - top);
    [0, 25, 50, 75, 100].forEach((value) => {
      const y = yAt(value);
      createSvgElement(svg, "line", { x1: left, y1: y, x2: right, y2: y, class: "cx-weekly-grid-line" });
      const label = createSvgElement(svg, "text", { x: 27, y: y + 4, class: "cx-weekly-axis-label", "text-anchor": "middle" });
      label.textContent = String(value);
    });
    days.forEach((day, index) => {
      const height = day.totalMinutes / maximumMinutes * (bottom - top);
      const bar = createSvgElement(svg, "rect", {
        x: xAt(index) - 17,
        y: bottom - height,
        width: 34,
        height,
        rx: 6,
        class: "cx-weekly-cross-time-bar",
      });
      const title = createSvgElement(bar, "title");
      title.textContent = `${day.iso} · Engaged: ${formatDuration(day.totalMinutes)}`;
    });
    [
      { label: "Health", values: healthValues, cls: "is-health" },
      { label: "Mental", values: mentalValues, cls: "is-mental" },
    ].forEach((series) => {
      let segment = [];
      const flush = () => {
        if (segment.length > 1) createSvgElement(svg, "polyline", { points: segment.join(" "), class: `cx-weekly-cross-line ${series.cls}` });
        segment = [];
      };
      series.values.forEach((value, index) => {
        if (value === null) { flush(); return; }
        const x = xAt(index); const y = yAt(value);
        segment.push(`${x},${y}`);
        const point = createSvgElement(svg, "circle", { cx: x, cy: y, r: 4.5, class: `cx-weekly-cross-point ${series.cls}` });
        const title = createSvgElement(point, "title");
        title.textContent = `${days[index].iso} · ${series.label}: ${value}%`;
      });
      flush();
    });
    days.forEach((day, index) => {
      const label = createSvgElement(svg, "text", { x: xAt(index), y: 244, class: "cx-weekly-date-label", "text-anchor": "middle" });
      label.textContent = day.iso.slice(5).replace("-", "/");
    });
    const rightTop = createSvgElement(svg, "text", { x: 745, y: top + 4, class: "cx-weekly-axis-label", "text-anchor": "end" });
    rightTop.textContent = formatDuration(maximumMinutes);
    const rightBottom = createSvgElement(svg, "text", { x: 745, y: bottom + 4, class: "cx-weekly-axis-label", "text-anchor": "end" });
    rightBottom.textContent = "0m";
    const legend = section.createDiv({ cls: "cx-weekly-legend cx-weekly-cross-legend" });
    [["is-health", "Health Capacity"], ["is-mental", "Mental Availability"], ["is-time", "Engaged Time"]].forEach(([cls, label]) => {
      const item = legend.createSpan({ cls: `cx-weekly-legend-item ${cls}` });
      item.createSpan({ cls: "cx-weekly-legend-mark" });
      item.createSpan({ text: label });
    });
    const matrix = section.createDiv({ cls: "cx-weekly-cross-matrix" });
    const header = matrix.createDiv({ cls: "cx-weekly-cross-row is-header" });
    header.createSpan();
    days.forEach((day) => header.createSpan({ text: day.iso.slice(5).replace("-", "/") }));
    [
      ["Health", healthValues, (value) => value === null ? "—" : `${value}%`],
      ["Mental", mentalValues, (value) => value === null ? "—" : `${value}%`],
      ["Time", days.map((day) => day.totalMinutes), (value) => formatDuration(value)],
    ].forEach(([label, values, format]) => {
      const row = matrix.createDiv({ cls: `cx-weekly-cross-row is-${label.toLowerCase()}` });
      row.createSpan({ text: label });
      values.forEach((value) => row.createSpan({ text: format(value), cls: value === null ? "is-missing" : "" }));
    });
  }

  renderHeatmap(parent, title, subtitle, days, metrics) {
    const section = this.section(parent, title, subtitle);
    const table = section.createDiv({ cls: "cx-weekly-metric-matrix" });
    const header = table.createDiv({ cls: "cx-weekly-metric-row is-header" });
    header.createSpan();
    days.forEach((day) => header.createSpan({ text: day.iso.slice(5).replace("-", "/") }));
    metrics.forEach((metric) => {
      const row = table.createDiv({ cls: "cx-weekly-metric-row" });
      row.createSpan({ text: metric.label, cls: "cx-weekly-metric-label" });
      days.forEach((day) => {
        const value = metric.value(day.frontmatter);
        row.createSpan({ text: value === null ? "—" : String(value), cls: `cx-weekly-metric-cell${value === null ? " is-missing" : ` is-${value}`}` });
      });
    });
  }

  renderPercentageChart(parent, days) {
    const section = this.section(parent, "Health Capacity", "Morning · Daytime · Recommendation (%)");
    const series = [
      { key: "health_morning_capacity", label: "Morning", cls: "is-morning" },
      { key: "health_afternoon_state", label: "Daytime", cls: "is-daytime" },
      { key: "health_recommendation_capacity", label: "Recommendation", cls: "is-recommendation" },
    ];
    const svg = createSvgElement(section, "svg", { viewBox: "0 0 760 244", class: "cx-weekly-percentage-chart", role: "img", "aria-label": "Daily health capacity percentages" });
    const left = 48; const right = 720; const top = 22; const bottom = 184; const edgeInset = 18;
    const xAt = (index) => days.length === 1
      ? (left + right) / 2
      : left + edgeInset + index * ((right - left - edgeInset * 2) / (days.length - 1));
    const yAt = (value) => bottom - value / 100 * (bottom - top);
    [0, 25, 50, 75, 100].forEach((value) => {
      const y = yAt(value);
      createSvgElement(svg, "line", { x1: left, y1: y, x2: right, y2: y, class: "cx-weekly-grid-line" });
      const label = createSvgElement(svg, "text", { x: 27, y: y + 4, class: "cx-weekly-axis-label", "text-anchor": "middle" });
      label.textContent = String(value);
    });
    series.forEach((definition) => {
      const points = [];
      days.forEach((day, index) => {
        const value = Number(day.frontmatter[definition.key]);
        if (!Number.isFinite(value)) return;
        const x = xAt(index); const y = yAt(value);
        points.push(`${x},${y}`);
        const point = createSvgElement(svg, "circle", { cx: x, cy: y, r: 4.5, class: `cx-weekly-percentage-point ${definition.cls}` });
        const title = createSvgElement(point, "title"); title.textContent = `${day.iso} · ${definition.label}: ${value}%`;
      });
      if (points.length > 1) createSvgElement(svg, "polyline", { points: points.join(" "), class: `cx-weekly-percentage-line ${definition.cls}` });
    });
    days.forEach((day, index) => {
      const label = createSvgElement(svg, "text", { x: xAt(index), y: 216, class: "cx-weekly-date-label", "text-anchor": "middle" });
      label.textContent = day.iso.slice(5).replace("-", "/");
    });
    const legend = section.createDiv({ cls: "cx-weekly-legend" });
    series.forEach((definition) => {
      const item = legend.createSpan({ cls: `cx-weekly-legend-item ${definition.cls}` });
      item.createSpan({ cls: "cx-weekly-legend-mark" }); item.createSpan({ text: definition.label });
    });
  }

  renderFrequency(parent, title, groups) {
    const section = this.section(parent, title, "Frequency");
    const grid = section.createDiv({ cls: "cx-weekly-frequency-grid" });
    groups.forEach((group) => {
      const card = grid.createDiv({ cls: "cx-weekly-frequency-card" });
      card.createDiv({ text: group.label, cls: "cx-weekly-frequency-title" });
      const rows = [...group.map].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
      if (!rows.length) card.createDiv({ text: "—", cls: "cx-weekly-frequency-empty" });
      rows.forEach(([key, count]) => {
        const row = card.createDiv({ cls: "cx-weekly-frequency-row" });
        row.createSpan({ text: group.format(key) });
        const dots = row.createSpan({ cls: "cx-weekly-frequency-dots" });
        for (let index = 0; index < count; index += 1) dots.createSpan({ text: "●" });
        row.createSpan({ text: String(count), cls: "cx-weekly-frequency-count" });
      });
    });
  }

  renderMentalDimensions(parent, days) {
    this.renderHeatmap(parent, "Mental Dimensions", "Display direction: higher = more available", days, MENTAL_METRICS.map((metric) => ({
      label: metric.label,
      value: (frontmatter) => mentalDisplayValue(metric, frontmatter[metric.key]),
    })));
  }

  renderMentalTerms(parent, days) {
    const stress = new Map(); const emotions = new Map(); const relief = new Map(); const closure = new Map();
    days.forEach((day) => {
      analyticsCount(stress, day.frontmatter.mental_evening_stress_source);
      analyticsCount(emotions, day.frontmatter.mental_evening_emotions);
      analyticsCount(relief, day.frontmatter.mental_evening_relief_factors);
      analyticsCount(closure, day.frontmatter.mental_evening_closure);
    });
    this.renderFrequency(parent, "Mental Terms", [
      { label: "Stress Source", map: stress, format: (key) => analyticsLabel(MENTAL_STRESS_SOURCES, key) },
      { label: "Emotions", map: emotions, format: (key) => analyticsLabel(MENTAL_EMOTIONS, key) },
      { label: "Relief Factors", map: relief, format: (key) => analyticsLabel(MENTAL_RELIEF_FACTORS, key) },
      { label: "Closure", map: closure, format: (key) => analyticsLabel(MENTAL_CLOSURES, key) },
    ]);
  }

  renderHealthSignals(parent, days) {
    const healthMetrics = [
      ["Morning · Sleep", "health_morning_sleep"], ["Morning · Recovery", "health_morning_recovery"],
      ["Morning · Body", "health_morning_body"], ["Morning · Outlook", "health_morning_outlook"],
      ["Daytime · Energy", "health_afternoon_energy_signal"], ["Daytime · Calmness", "health_afternoon_calmness"],
      ["Daytime · Clarity", "health_afternoon_clarity"], ["Daytime · Body", "health_afternoon_body"],
      ["Evening · Body", "health_evening_body"], ["Evening · Energy", "health_evening_overall_energy"],
      ["Evening · Appetite", "health_evening_appetite_stability"], ["Night · Sleepiness", "health_night_sleepiness"],
      ["Night · Calmness", "health_night_calmness"],
    ].map(([label, key]) => ({ label, value: (frontmatter) => healthSignal(frontmatter[key]) }));
    this.renderHeatmap(parent, "Health Signals", "1–5", days, healthMetrics);
  }

  renderHealthCategories(parent, days) {
    const dream = new Map(); const need = new Map(); const nap = new Map(); const workout = new Map();
    days.forEach((day) => {
      analyticsCount(dream, day.frontmatter.health_morning_dream);
      analyticsCount(need, day.frontmatter.health_morning_need);
      analyticsCount(nap, day.frontmatter.health_afternoon_nap);
      analyticsCount(workout, day.frontmatter.health_workout_type);
    });
    this.renderFrequency(parent, "Health Categories", [
      { label: "Dream", map: dream, format: (key) => analyticsLabel(ANALYTICS_HEALTH_TERMS.dream, key) },
      { label: "Morning Need", map: need, format: (key) => analyticsLabel(ANALYTICS_HEALTH_TERMS.need, key) },
      { label: "Nap", map: nap, format: (key) => analyticsLabel(ANALYTICS_HEALTH_TERMS.nap, key) },
      { label: "Workout", map: workout, format: (key) => analyticsLabel(ANALYTICS_HEALTH_TERMS.workout, key) },
    ]);
  }

  renderWorkoutFunnel(parent, days) {
    const section = this.section(parent, "Workout Decision → Execution", "Planned · Recommended · Selected · Actual");
    const stageDefinitions = [
      { id: "planned", label: "Planned", value: (fm) => ({ workout: fm.health_planned_workout, mode: "" }) },
      { id: "recommended", label: "Recommended", value: (fm) => ({ workout: fm.health_recommended_workout, mode: fm.health_recommended_mode }) },
      { id: "selected", label: "Selected", value: (fm) => ({ workout: fm.health_selected_workout, mode: fm.health_selected_mode }) },
      { id: "actual", label: "Actual", value: (fm) => {
        const executed = ["completed", "rest"].includes(String(fm.health_workout_status || ""));
        return {
          workout: fm.health_actual_workout || (executed ? fm.health_workout_type : ""),
          mode: fm.health_actual_workout_mode || (executed ? fm.health_workout_mode : ""),
        };
      } },
    ];
    const stageValues = stageDefinitions.map((stage) => ({
      ...stage,
      values: days.map((day) => stage.value(day.frontmatter)),
    }));
    const funnel = section.createDiv({ cls: "cx-weekly-workout-funnel" });
    stageValues.forEach((stage, index) => {
      const recorded = stage.values.filter((value) => value.workout).length;
      const step = funnel.createDiv({ cls: `cx-weekly-workout-funnel-step is-${stage.id}` });
      step.style.width = `${(72 + (stageValues.length - index) * 7) * recorded / Math.max(1, days.length)}%`;
      step.createSpan({ text: stage.label });
      step.createSpan({ text: `${recorded}/${days.length}` });
    });

    const table = section.createDiv({ cls: "cx-weekly-workout-flow" });
    const header = table.createDiv({ cls: "cx-weekly-workout-flow-row is-header" });
    header.createSpan();
    stageDefinitions.forEach((stage) => header.createSpan({ text: stage.label }));
    days.forEach((day, dayIndex) => {
      const row = table.createDiv({ cls: "cx-weekly-workout-flow-row" });
      row.createSpan({ text: day.iso.slice(5).replace("-", "/"), cls: "cx-weekly-workout-date" });
      let previous = null;
      stageValues.forEach((stage) => {
        const value = stage.values[dayIndex];
        const currentKey = value.workout ? `${value.workout}:${value.mode || ""}` : "";
        const previousKey = previous?.workout ? `${previous.workout}:${previous.mode || ""}` : "";
        const state = !value.workout ? " is-missing" : previous && currentKey !== previousKey ? " is-changed" : " is-aligned";
        const cell = row.createDiv({ cls: `cx-weekly-workout-flow-cell${state}` });
        cell.createSpan({ text: analyticsWorkoutChoice(value.workout, value.mode), cls: "cx-weekly-workout-choice" });
        if (stage.id === "selected" && day.frontmatter.health_manual_override === true) {
          cell.createSpan({ text: "Override", cls: "cx-weekly-workout-flag" });
        }
        if (stage.id === "actual" && value.workout) {
          const minutes = minutesValue(day.frontmatter.workout_minutes) || 0;
          cell.createSpan({ text: `${String(day.frontmatter.health_workout_status || "—")} · ${formatDuration(minutes)}`, cls: "cx-weekly-workout-meta" });
        }
        previous = value;
      });
    });
  }

  renderRhythm(parent, days) {
    const section = this.section(parent, "Daily Rhythm", "Clock time · bedtime shown on 24–28h axis");
    const definitions = [
      { label: "Bedtime", value: (frontmatter) => analyticsTimeHour(frontmatter.health_early_morning_bedtime_at || frontmatter.health_night_bedtime_at, true), cls: "is-bedtime" },
      { label: "Morning Check-in", value: (frontmatter) => analyticsTimeHour(frontmatter.health_morning_started_at), cls: "is-morning" },
      { label: "Voyage Start", value: (frontmatter) => analyticsTimeHour(frontmatter.voyage_started_at), cls: "is-start" },
      { label: "Voyage End", value: (frontmatter) => analyticsTimeHour(frontmatter.voyage_ended_at, true), cls: "is-end" },
    ];
    const svg = createSvgElement(section, "svg", { viewBox: "0 0 760 286", class: "cx-weekly-rhythm-chart", role: "img", "aria-label": "Daily bedtime, morning check-in, voyage start, and voyage end clock times" });
    const left = 130; const right = 718; const top = 30; const rowGap = 52;
    const xAt = (hour) => left + (clamp(hour, 0, 28) / 28) * (right - left);
    [0, 4, 8, 12, 16, 20, 24, 28].forEach((hour) => {
      const x = xAt(hour);
      createSvgElement(svg, "line", { x1: x, y1: 16, x2: x, y2: 238, class: "cx-weekly-grid-line" });
      const label = createSvgElement(svg, "text", { x, y: 264, class: "cx-weekly-axis-label", "text-anchor": "middle" });
      label.textContent = hour === 28 ? "04" : pad(hour % 24);
    });
    definitions.forEach((definition, rowIndex) => {
      const y = top + rowIndex * rowGap;
      const values = days.map((day) => definition.value(day.frontmatter));
      const mean = average(values); const deviation = analyticsDeviation(values);
      const label = createSvgElement(svg, "text", { x: 8, y: y + 4, class: "cx-weekly-rhythm-label" });
      label.textContent = definition.label;
      if (mean !== null) {
        const spread = createSvgElement(svg, "line", { x1: xAt(mean - deviation), y1: y, x2: xAt(mean + deviation), y2: y, class: `cx-weekly-rhythm-spread ${definition.cls}` });
        const title = createSvgElement(spread, "title"); title.textContent = `${analyticsClock(mean)} ± ${Math.round(deviation * 60)}m`;
      }
      values.forEach((value, index) => {
        if (!Number.isFinite(value)) return;
        const point = createSvgElement(svg, "circle", { cx: xAt(value), cy: y, r: 5, class: `cx-weekly-rhythm-point ${definition.cls}` });
        const title = createSvgElement(point, "title"); title.textContent = `${days[index].iso} · ${analyticsClock(value)}`;
      });
      const stat = createSvgElement(svg, "text", { x: 8, y: y + 19, class: "cx-weekly-rhythm-stat" });
      stat.textContent = mean === null ? "—" : `${analyticsClock(mean)} ± ${Math.round(deviation * 60)}m`;
    });
  }

  async render() {
    const generation = this.beginWeeklyRender();
    const weeklyFrontmatter = await freshFrontmatter(this.app, this.file);
    if (!this.captureWeeklyDependencySignature(generation, weeklyFrontmatter)) return;
    const dates = dateRange(weeklyFrontmatter.period_start, weeklyFrontmatter.period_end);
    const historyWeeks = clamp(Number(this.config.history_weeks) || 4, 1, 8);
    const currentStart = dateFromISO(isoDateValue(weeklyFrontmatter.period_start));
    if (!dates.length || !currentStart) {
      if (!this.weeklyRenderIsCurrent(generation)) return;
      this.containerEl.empty();
      this.containerEl.createDiv({ text: "Set valid period_start and period_end values.", cls: "cx-weekly-empty" });
      return;
    }
    const allDates = [];
    for (let offset = historyWeeks * 7; offset >= 0; offset -= 7) {
      dateRange(localISO(addDays(currentStart, -offset)), localISO(addDays(currentStart, -offset + 6))).forEach((date) => allDates.push(date));
    }
    const uniqueDates = [...new Map(allDates.map((date) => [localISO(date), date])).values()];
    const loaded = await Promise.all(uniqueDates.map((date) => this.loadDay(date)));
    const byISO = new Map(loaded.map((day) => [day.iso, day]));
    const periodPaths = new Set(uniqueDates.map((date) => dailyPathFromISO(localISO(date))).filter(Boolean));
    const days = dates.map((date) => byISO.get(localISO(date))).filter(Boolean);
    const weeks = [];
    for (let offset = (historyWeeks - 1) * 7; offset >= 0; offset -= 7) {
      const start = localISO(addDays(currentStart, -offset));
      const end = localISO(addDays(dateFromISO(start), 6));
      const weeklyPath = weeklyPathFromPeriod(start, end);
      if (weeklyPath) periodPaths.add(weeklyPath);
      const weeklyFile = weeklyPath ? this.app.vault.getAbstractFileByPath(weeklyPath) : null;
      const historicalFrontmatter = weeklyFile instanceof TFile ? await freshFrontmatter(this.app, weeklyFile) : {};
      const weekDays = dateRange(start, end).map((date) => byISO.get(localISO(date))).filter(Boolean);
      weeks.push({
        start,
        end,
        current: offset === 0,
        days: weekDays,
        weeklyFile,
        dayMetricsEnabled: weeklyFile instanceof TFile
          && weeklyDayMetricsEligible(historicalFrontmatter, start, end)
          && weekDays.length === 7
          && weekDays.every((day) => day.file instanceof TFile),
      });
    }
    if (!this.weeklyRenderIsCurrent(generation)) return;
    this.periodPaths = periodPaths;
    const precedingStart = localISO(addDays(currentStart, -historyWeeks * 7));
    const precedingWeek = {
      start: precedingStart,
      current: false,
      days: dateRange(precedingStart, localISO(addDays(dateFromISO(precedingStart), 6))).map((date) => byISO.get(localISO(date))).filter(Boolean),
    };
    if (!this.weeklyRenderIsCurrent(generation)) return;
    this.containerEl.empty();
    const wrap = this.containerEl.createDiv({ cls: "cx-weekly-analytics" });
    const header = wrap.createDiv({ cls: "cx-weekly-header" });
    const copy = header.createDiv();
    copy.createEl("h3", { text: "Detailed Weekly Analytics" });
    copy.createSpan({ text: `${isoDateValue(weeklyFrontmatter.period_start)} → ${isoDateValue(weeklyFrontmatter.period_end)}`, cls: "cx-weekly-period" });
    this.renderStats(wrap, days);
    this.renderInvestmentChange(wrap, weeks, precedingWeek);
    this.renderWeeklyTrend(wrap, weeks);
    this.renderTimeBreakdown(wrap, days);
    if (!await this.renderProjectProgress(wrap, days, weeklyFrontmatter, generation)) return;
    if (!this.weeklyRenderIsCurrent(generation)) return;
    this.renderDayMatrix(wrap, days);
    this.renderExecutionQuality(wrap, days);
    this.renderCapacityLoad(wrap, days);
    this.renderCrossDomain(wrap, days);
    this.renderPercentageChart(wrap, days);
    WeeklySnapshotChild.prototype.renderStateChart.call(this, wrap, days);
    this.renderWorkoutFunnel(wrap, days);
    this.renderRhythm(wrap, days);
    this.renderHealthSignals(wrap, days);
    this.renderHealthCategories(wrap, days);
    this.renderMentalDimensions(wrap, days);
    this.renderMentalTerms(wrap, days);
  }
}

class DailyHealthSummaryChild extends MarkdownRenderChild {
  constructor(container, app, file) {
    super(container);
    this.app = app;
    this.file = file;
  }

  onload() {
    this.render();
    this.registerEvent(this.app.metadataCache.on("changed", (changedFile) => {
      if (changedFile.path === this.file.path) this.render();
    }));
    this.registerEvent(this.app.vault.on("modify", (changedFile) => {
      if (changedFile.path === this.file.path) this.render();
    }));
  }

  async render() {
    const frontmatter = await freshFrontmatter(this.app, this.file);
    if (!this.containerEl.isConnected) return;
    this.containerEl.empty();
    const wrap = this.containerEl.createDiv({ cls: "cx-health-daily-summary" });
    const planned = String(frontmatter.health_planned_workout || "pool");
    const recommendation = String(frontmatter.health_recommended_workout || planned);
    const recommendationMode = String(frontmatter.health_recommended_mode || "standard");
    const selected = String(frontmatter.health_selected_workout || "");
    const status = String(frontmatter.health_workout_status || "");
    const workoutId = String(frontmatter.health_workout_type || selected || recommendation);
    const workoutMode = String(frontmatter.health_workout_mode || frontmatter.health_selected_mode || recommendationMode);
    const sessions = healthWorkoutSessions(frontmatter);
    const primarySession = healthPrimarySession(frontmatter, sessions);
    const additionalSessions = sessions.filter((session) => session !== primarySession);
    const currentRole = String(frontmatter.health_current_session_role || "");
    const primaryWorkout = String(primarySession?.workout || frontmatter.health_primary_workout || selected || recommendation);
    const primaryMode = String(primarySession?.mode || frontmatter.health_primary_mode || frontmatter.health_selected_mode || recommendationMode);
    const primaryCompleted = Boolean(primarySession) || status === "rest";
    const progressSummary = primarySession
      ? healthSessionProgress([primarySession])
      : { completed: 0, total: 0 };
    if (!primaryCompleted && status === "active" && healthWorkoutIsStrength(workoutId)) {
      progressSummary.completed += healthArray(frontmatter.health_workout_completed_sets).length;
      progressSummary.total += healthTotalSets(workoutId, workoutMode);
    }
    const morning = healthMorningCapacity(frontmatter);
    const afternoon = healthAfternoonState(frontmatter);
    const scheduleV2 = usesHealthScheduleV2(frontmatter);
    const earlyMorningBedtime = String(frontmatter.health_early_morning_bedtime_at || "");
    const header = wrap.createDiv({ cls: "cx-health-summary-header" });
    header.createEl("h3", { text: "Health Snapshot" });
    const grid = wrap.createDiv({ cls: "cx-health-summary-grid" });
    if (scheduleV2) grid.addClass("is-schedule-v2");
    const recommendationChanged = recommendation !== planned || recommendationMode !== "standard";
    const manuallyChanged = String(frontmatter.health_primary_source || "") === "manual"
      || (!primaryCompleted && frontmatter.health_manual_override === true);
    const displayWorkout = status === "rest" ? "rest" : primaryWorkout;
    const displayMode = primaryMode;
    const workoutValue = displayWorkout === "rest"
      ? "今日休息"
      : `${healthWorkout(displayWorkout).label}${healthWorkoutSupportsModes(displayWorkout) ? ` · ${healthModeLabel(displayMode)}` : ""}${!primaryCompleted && status === "active" ? " · 进行中" : ""}`;
    const workoutTag = primaryCompleted
      ? "已完成"
      : manuallyChanged
        ? "手动修改"
        : selected || recommendationChanged
          ? "建议"
          : "原计划";
    const summaryItems = [
      { label: "今日恢复容量", value: morning.value === null ? "—" : `${morning.value}%` },
      { label: scheduleV2 ? "白天身体状态" : "傍晚身体状态", value: afternoon.value === null ? "—" : `${afternoon.value}% · ${healthStateLabel(afternoon.value)}` },
      {
        label: "训练状态",
        value: workoutValue,
        tag: workoutTag,
        meta: currentRole === "additional" && status === "active"
          ? `追加：${healthWorkout(workoutId).label}进行中`
          : additionalSessions.length
            ? `另有 ${additionalSessions.map((session) => healthWorkout(session.workout).label).join("、")} · 今日共 ${minutesValue(frontmatter.workout_minutes) ?? 0} 分钟`
            : primaryCompleted && minutesValue(frontmatter.workout_minutes) !== null
              ? `今日共 ${minutesValue(frontmatter.workout_minutes)} 分钟`
              : "",
      },
    ];
    if (scheduleV2) {
      summaryItems.unshift({
        label: "跨夜入睡",
        value: earlyMorningBedtime ? `${earlyMorningBedtime.slice(11, 16)} · 准备入睡` : "—",
      });
    }
    summaryItems.forEach(({ label, value, tag, meta }) => {
      const item = grid.createDiv({ cls: "cx-health-summary-item" });
      item.createSpan({ text: label, cls: "cx-health-summary-label" });
      item.createSpan({ text: value, cls: "cx-health-summary-value" });
      if (tag) {
        item.addClass("has-tag");
        item.createSpan({ text: tag, cls: "cx-health-summary-tag" });
      }
      if (meta) item.createSpan({ text: meta, cls: "cx-health-summary-meta" });
    });
    if (progressSummary.total) {
      const progress = wrap.createDiv({ cls: "cx-health-summary-progress" });
      progress.createSpan({ text: `训练组数 ${progressSummary.completed} / ${progressSummary.total}` });
      const track = progress.createDiv({ cls: "cx-health-progress-track" });
      const fill = track.createSpan({ cls: "cx-health-progress-fill" });
      fill.style.width = `${progressSummary.completed / progressSummary.total * 100}%`;
    }
  }
}

class DailyMentalSummaryChild extends MarkdownRenderChild {
  constructor(container, app, file) {
    super(container);
    this.app = app;
    this.file = file;
  }

  onload() {
    this.render();
    this.registerEvent(this.app.metadataCache.on("changed", (changedFile) => {
      if (changedFile.path === this.file.path) this.render();
    }));
    this.registerEvent(this.app.vault.on("modify", (changedFile) => {
      if (changedFile.path === this.file.path) this.render();
    }));
  }

  async render() {
    const frontmatter = await freshFrontmatter(this.app, this.file);
    if (!this.containerEl.isConnected) return;
    this.containerEl.empty();
    const wrap = this.containerEl.createDiv({ cls: "cx-mental-daily-summary" });
    const header = wrap.createDiv({ cls: "cx-health-summary-header" });
    header.createEl("h3", { text: "Mental Log" });
    const ended = String(frontmatter.voyage_ended_at || "");
    header.createSpan({ text: ended ? `航程结束于 ${ended.slice(11, 16)}` : "今日航程尚未收束" });
    const grid = wrap.createDiv({ cls: "cx-mental-summary-grid" });
    MENTAL_METRICS.forEach((metric) => {
      const value = mentalDisplayValue(metric, frontmatter[metric.key]);
      const item = grid.createDiv({ cls: "cx-mental-summary-item" });
      item.createSpan({ text: metric.label, cls: "cx-health-summary-label" });
      const valueRow = item.createDiv({ cls: "cx-mental-summary-value-row" });
      valueRow.createSpan({
        text: value === null ? "—" : metric.choices[value - 1],
        cls: "cx-health-summary-value",
      });
      if (value !== null) {
        valueRow.createSpan({
          text: `${value}/5`,
          cls: "cx-mental-summary-score",
        });
      }
    });
    const context = wrap.createDiv({ cls: "cx-mental-summary-context" });
    const labelFor = (choices, value) => choices.find(([key]) => key === String(value))?.[1] ?? "";
    const labelsFor = (choices, values) => healthArray(values)
      .map((value) => labelFor(choices, value))
      .filter(Boolean)
      .join("、");
    [
      ["最大压力来源", labelFor(MENTAL_STRESS_SOURCES, frontmatter.mental_evening_stress_source)],
      ["主要心绪", labelsFor(MENTAL_EMOTIONS, frontmatter.mental_evening_emotions)],
      ["什么帮助了我", labelsFor(MENTAL_RELIEF_FACTORS, frontmatter.mental_evening_relief_factors)],
    ].forEach(([label, value]) => {
      const item = context.createDiv();
      item.createSpan({ text: label });
      item.createEl("strong", { text: value || "—" });
    });
    const closure = MENTAL_CLOSURES.find(([key]) => key === String(frontmatter.mental_evening_closure));
    if (closure) wrap.createDiv({ text: `${closure[1]} · ${closure[2]}`, cls: "cx-mental-summary-closure" });
  }
}

class CastleXHomeView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.heatmapMode = "project";
    this.trendMode = "energy";
    this.calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    this.currentDateISO = localISO();
    this.taskProjectPath = null;
    this.renderTimer = null;
    this.heatmapObserver = null;
    this.writeQueue = Promise.resolve();
    this.voyageAnimationUntil = 0;
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "CastleX Home";
  }

  getIcon() {
    return "ship-wheel";
  }

  async onOpen() {
    this.contentEl.addClass("castlex-home-view");
    this.registerEvent(this.app.metadataCache.on("changed", () => this.scheduleRender()));
    this.registerEvent(this.app.vault.on("modify", () => this.scheduleRender()));
    this.registerInterval(window.setInterval(() => this.updateClock(), 30000));
    await this.renderDashboard();
  }

  async onClose() {
    if (this.renderTimer) window.clearTimeout(this.renderTimer);
    this.heatmapObserver?.disconnect();
  }

  scheduleRender() {
    if (this.renderTimer) window.clearTimeout(this.renderTimer);
    this.renderTimer = window.setTimeout(() => this.renderDashboard(), 350);
  }

  updateClock() {
    const now = new Date();
    if (this.clockEl) {
      this.clockEl.setText(new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now));
    }

    const todayISO = localISO(now);
    if (todayISO !== this.currentDateISO) {
      this.currentDateISO = todayISO;
      this.calendarCursor = new Date(now.getFullYear(), now.getMonth(), 1);
      this.scheduleRender();
    }
  }

  async ensureFolder(path) {
    const normalized = normalizePath(path);
    if (this.app.vault.getAbstractFileByPath(normalized)) return;
    const parts = normalized.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current);
    }
  }

  dailyPath(date = new Date()) {
    return `${DAILY_ROOT}/${date.getFullYear()}/${pad(date.getMonth() + 1)}/${localISO(date)}.md`;
  }

  async createDailyContent(date) {
    const iso = localISO(date);
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
    const templatePath = "90_System/Templates/010-Daily-Dashboard.md";
    const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
    if (!(templateFile instanceof TFile)) {
      new Notice(`CastleX Daily template not found: ${templatePath}`);
      throw new Error(`Missing Daily template: ${templatePath}`);
    }
    let content = await this.app.vault.cachedRead(templateFile);
    const replacements = [
      ["{{date:YYYY-MM-DD · dddd}}", `${iso} · ${weekday}`],
      ["{{date:gggg-[W]ww}}", isoWeek(date)],
      ["{{date:YYYY-MM-DD}}", iso],
      ["{{date:YYYY-MM}}", iso.slice(0, 7)],
      ["{{date:dddd}}", weekday],
    ];
    replacements.forEach(([token, value]) => {
      content = content.split(token).join(value);
    });
    return content;
  }

  async ensureDaily(date = new Date(), options = {}) {
    const path = this.dailyPath(date);
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) return existing;
    const allowCreate = options.allowCreate ?? !Platform.isMobile;
    if (!allowCreate) return null;

    const pending = this.plugin.dailyCreationPromises.get(path);
    if (pending) return pending;

    const creation = (async () => {
      await this.ensureFolder(path.split("/").slice(0, -1).join("/"));
      const afterFolder = this.app.vault.getAbstractFileByPath(path);
      if (afterFolder instanceof TFile) return afterFolder;
      const content = await this.createDailyContent(date);
      try {
        return await this.app.vault.create(path, content);
      } catch (error) {
        const concurrent = this.app.vault.getAbstractFileByPath(path);
        if (concurrent instanceof TFile) return concurrent;
        throw error;
      }
    })();
    this.plugin.dailyCreationPromises.set(path, creation);
    try {
      return await creation;
    } finally {
      this.plugin.dailyCreationPromises.delete(path);
    }
  }

  frontmatter(file) {
    return this.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  }

  dailyPages() {
    const pages = this.app.vault.getMarkdownFiles()
      .filter((file) => file.path.startsWith(`${DAILY_ROOT}/`))
      .map((file) => ({ file, frontmatter: this.frontmatter(file) }))
      .filter((page) => page.frontmatter.type === "daily" && page.frontmatter.date);
    const byDate = new Map();
    pages.forEach((page) => {
      const iso = isoDateValue(page.frontmatter.date);
      if (!iso) return;
      const canonicalPath = `${DAILY_ROOT}/${iso.slice(0, 4)}/${iso.slice(5, 7)}/${iso}.md`;
      const current = byDate.get(iso);
      const pageIsCanonical = page.file.path === canonicalPath;
      const currentIsCanonical = current?.file.path === canonicalPath;
      if (!current || (pageIsCanonical && !currentIsCanonical) || (!currentIsCanonical && page.file.stat.mtime > current.file.stat.mtime)) {
        byDate.set(iso, page);
      }
    });
    return [...byDate.values()]
      .sort((a, b) => String(a.frontmatter.date).localeCompare(String(b.frontmatter.date)));
  }

  async archiveDailyConflicts(date = new Date()) {
    const iso = localISO(date);
    const canonicalPath = this.dailyPath(date);
    const canonical = this.app.vault.getAbstractFileByPath(canonicalPath);
    if (!(canonical instanceof TFile)) return 0;

    const directory = canonicalPath.split("/").slice(0, -1).join("/");
    const candidates = this.app.vault.getMarkdownFiles()
      .filter((file) => file.parent?.path === directory && file.path !== canonicalPath);
    const conflicts = [];
    for (const file of candidates) {
      const frontmatter = await freshFrontmatter(this.app, file);
      if (isoDateValue(frontmatter.date) === iso && frontmatter.type === "daily") conflicts.push(file);
    }
    if (!conflicts.length) return 0;

    const archiveRoot = `99_Archive/Sync-Conflicts/${iso}`;
    await this.ensureFolder(archiveRoot);
    for (const file of conflicts) {
      let destination = `${archiveRoot}/${file.name}`;
      let suffix = 2;
      while (this.app.vault.getAbstractFileByPath(destination)) {
        destination = `${archiveRoot}/${file.basename}-${suffix}.${file.extension}`;
        suffix += 1;
      }
      await this.app.vault.rename(file, normalizePath(destination));
    }
    new Notice(`Archived ${conflicts.length} duplicate Daily file${conflicts.length === 1 ? "" : "s"} for ${iso}`);
    return conflicts.length;
  }

  projectPages() {
    return this.app.vault.getMarkdownFiles()
      .filter((file) => file.path.startsWith(`${PROJECT_ROOT}/`))
      .map((file) => {
        const frontmatter = this.frontmatter(file);
        return { file, frontmatter, lifecycle: workstreamStatus(frontmatter.status) };
      })
      .filter((page) => page.frontmatter.type === "project")
      .sort((a, b) => {
        const stateOrder = (page) => WORKSTREAM_STATES.findIndex(({ id }) => id === page.lifecycle.id);
        const priority = (page) => {
          const raw = page.frontmatter.priority;
          const value = raw === null || raw === undefined || raw === "" ? Number.MAX_SAFE_INTEGER : Number(raw);
          return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
        };
        return stateOrder(a) - stateOrder(b) || priority(a) - priority(b) || a.file.path.localeCompare(b.file.path);
      });
  }

  async collectProjectTasks(projects) {
    return Promise.all(projects.map(async (project) => {
      const { file, frontmatter } = project;
      const content = await this.app.vault.cachedRead(file);
      const bySection = new Map();
      let currentSection = "";
      content.split("\n").forEach((line, lineNumber) => {
        const heading = line.match(/^##\s+(.+?)\s*$/);
        if (heading) currentSection = heading[1];
        const checkbox = line.match(/^\s*- \[([ xX])\] (.+)$/);
        if (!checkbox) return;
        const checked = checkbox[1].toLowerCase() === "x";
        const due = checkbox[2].match(/📅 ?(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
        const item = { file, line, lineNumber, text: stripTaskSyntax(checkbox[2]), due, checked };
        if (!bySection.has(currentSection)) bySection.set(currentSection, []);
        bySection.get(currentSection).push(item);
      });

      const configuredSections = progressSections(frontmatter.progress_sections);
      const progress = configuredSections.length
        ? clamp(configuredSections.reduce((total, { section, weight }) => {
            const items = bySection.get(section) ?? [];
            if (!items.length) return total;
            const completed = items.filter((item) => item.checked).length;
            return total + completed / items.length * weight;
          }, 0), 0, 100)
        : null;

      let tasks = [];
      if (configuredSections.length) {
        for (const { section } of configuredSections) {
          const open = (bySection.get(section) ?? []).filter((item) => !item.checked);
          if (open.length) {
            tasks = open;
            break;
          }
        }
      } else {
        const taskSection = String(frontmatter.task_section ?? "Tasks").trim();
        tasks = (bySection.get(taskSection) ?? []).filter((item) => !item.checked);
      }
      return { project, tasks, progress };
    }));
  }

  calculateStreaks(pages) {
    const byDate = new Map(pages.map((page) => [String(page.frontmatter.date).slice(0, 10), page]));
    const todayISO = localISO();
    const yesterdayISO = localISO(addDays(new Date(), -1));
    const voyageAt = (iso) => isVoyageDay(byDate.get(iso)?.frontmatter);
    const streakAt = (iso) => {
      let cursor = dateFromISO(iso);
      let count = 0;
      while (cursor && voyageAt(localISO(cursor))) {
        count += 1;
        cursor = addDays(cursor, -1);
      }
      return count;
    };
    const active = voyageAt(todayISO) ? streakAt(todayISO) : streakAt(yesterdayISO);
    let longest = 0;
    let running = 0;
    let previous = null;
    for (const page of pages) {
      const iso = String(page.frontmatter.date).slice(0, 10);
      const contiguous = previous && localISO(addDays(dateFromISO(previous), 1)) === iso;
      running = isVoyageDay(page.frontmatter) ? (contiguous ? running + 1 : 1) : 0;
      longest = Math.max(longest, running);
      previous = iso;
    }
    return { active, longest, byDate };
  }

  async setRating(file, key, value) {
    const write = async () => {
      await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        applyRating(frontmatter, key, value);
      });
      new Notice(`${ALL_CHECKIN_METRICS.find((metric) => metric.key === key)?.label ?? key}: ${value}/5`);
    };
    this.writeQueue = this.writeQueue.then(write, write);
    await this.writeQueue;
    this.scheduleRender();
  }

  async startVoyage(file) {
    const write = async () => {
      let started = false;
      await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter.daily_checkin_model = "navigation-v1";
        if (!frontmatter.voyage_started_at) {
          frontmatter.voyage_started_at = localTimestamp();
          started = true;
        }
      });
      if (started) {
        this.voyageAnimationUntil = Date.now() + 1700;
        new Notice("今日已启航");
      }
    };
    this.writeQueue = this.writeQueue.then(write, write);
    await this.writeQueue;
    this.scheduleRender();
    window.setTimeout(() => this.scheduleRender(), 1750);
  }

  async completeTask(task) {
    const today = localISO();
    const recordCompletionDate = this.frontmatter(task.file).record_task_completion_date !== false;
    await this.app.vault.process(task.file, (content) => {
      const lines = content.split("\n");
      if (lines[task.lineNumber] === task.line) {
        lines[task.lineNumber] = task.line.replace("- [ ]", "- [x]") + (recordCompletionDate ? ` ✅ ${today}` : "");
      }
      return lines.join("\n");
    });
    await this.renderDashboard();
  }

  async openFile(file) {
    if (file instanceof TFile) await this.app.workspace.getLeaf("tab").openFile(file);
  }

  createCard(parent, title, subtitle = "") {
    const card = parent.createDiv({ cls: "cx-card" });
    const header = card.createDiv({ cls: "cx-card-header" });
    const titleWrap = header.createDiv();
    titleWrap.createEl("h3", { text: title });
    if (subtitle) titleWrap.createEl("span", { text: subtitle });
    return card;
  }

  renderModeTabs(parent, options, active, onChange) {
    const control = parent.createDiv({ cls: "cx-mode-tabs", attr: { role: "tablist" } });
    options.forEach(([value, label]) => {
      const tab = control.createEl("button", {
        text: label,
        cls: `cx-mode-tab${value === active ? " is-active" : ""}`,
        attr: {
          role: "tab",
          "aria-selected": String(value === active),
        },
      });
      tab.addEventListener("click", () => onChange(value));
    });
  }

  renderHero(parent, todayFile) {
    const hero = parent.createDiv({ cls: "cx-hero cx-glass" });
    const copy = hero.createDiv({ cls: "cx-hero-copy" });
    copy.createEl("p", { text: new Intl.DateTimeFormat("zh-CN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }).format(new Date()), cls: "cx-overline" });
    this.clockEl = copy.createEl("div", { cls: "cx-clock" });
    this.updateClock();
    copy.createEl("p", { text: "青山一道同云雨，明月何曾是两乡。", cls: "cx-hero-note" });
    const actions = hero.createDiv({ cls: "cx-hero-actions cx-dashboard-hero-actions" });
    const today = actions.createEl("button", { text: "今日 Daily", cls: "cx-button cx-button-primary" });
    today.addEventListener("click", () => this.openFile(todayFile));
    const health = actions.createEl("button", { text: "Health Dashboard", cls: "cx-button" });
    health.addEventListener("click", () => this.plugin.activateHealthView());
    const mental = actions.createEl("button", { text: "Mental Dashboard", cls: "cx-button" });
    mental.addEventListener("click", () => this.plugin.activateMentalView());
  }

  renderKpis(parent, todayFile, todayFrontmatter, streaks, lifecycle) {
    const grid = parent.createDiv({ cls: "cx-kpi-grid" });
    const todayStarted = Boolean(todayFrontmatter.voyage_started_at);
    const todayEnded = Boolean(todayFrontmatter.voyage_ended_at);
    const active = lifecycle.active;
    const todayOpen = todayStarted && !todayEnded;
    const sailing = lifecycle.recentOpen.length > 0 || todayOpen;
    const activeDate = isoDateValue(active?.frontmatter?.date) || (todayOpen ? this.currentDateISO : null);
    const ended = todayStarted && todayEnded;
    const state = ended ? "is-ended" : sailing ? "is-sailing" : "is-docked";
    const label = lifecycle.ambiguous
      ? "待确认航程"
      : ended
      ? "已收帆"
      : sailing
        ? activeDate === this.currentDateISO ? "航行中" : "昨日航程中"
        : "开始航行";
    const voyage = grid.createEl("button", {
      cls: `cx-kpi cx-glass cx-voyage-ritual ${Date.now() < this.voyageAnimationUntil ? "is-starting" : state}`,
      attr: {
        type: "button",
        "aria-label": label,
        title: lifecycle.staleOpen.length
          ? `有 ${lifecycle.staleOpen.length} 次旧航程未收束；不会自动延续`
          : label,
      },
    });
    const scene = voyage.createSpan({ cls: "cx-voyage-scene", attr: { "aria-hidden": "true" } });
    scene.createSpan({ cls: "cx-voyage-water" });
    scene.createSpan({ cls: "cx-voyage-wake" });
    const boat = scene.createSpan({ cls: "cx-voyage-boat" });
    setIcon(boat, "sailboat");
    const copy = voyage.createSpan({ cls: "cx-voyage-copy" });
    copy.createSpan({ text: label, cls: "cx-voyage-label" });
    if (!todayStarted && !sailing && lifecycle.latestEnded) {
      copy.createSpan({
        text: `上一航程 ${String(lifecycle.latestEnded.frontmatter.voyage_ended_at).slice(11, 16)} 收帆`,
        cls: "cx-voyage-note",
      });
    } else if (!todayStarted && !sailing && lifecycle.staleOpen.length) {
      copy.createSpan({ text: "上次航程未收束", cls: "cx-voyage-note" });
    }
    if (!todayStarted && !sailing) voyage.addEventListener("click", () => this.startVoyage(todayFile));
    else voyage.addEventListener("click", () => this.plugin.activateMentalView(
      lifecycle.ambiguous ? null : activeDate || this.currentDateISO,
    ));

    const streak = grid.createDiv({ cls: "cx-kpi cx-glass cx-streak-kpi" });
    streak.createDiv({ text: String(streaks.active), cls: "cx-kpi-value" });
    const streakCopy = streak.createDiv({ cls: "cx-streak-copy" });
    streakCopy.createDiv({ text: "连续航行", cls: "cx-kpi-label" });
    streakCopy.createDiv({ text: `最长 ${streaks.longest} 天`, cls: "cx-kpi-detail" });
  }

  renderProjects(parent, projects, taskGroups) {
    const card = this.createCard(parent, "Active Projects");
    card.addClass("cx-project-card");
    const list = card.createDiv({ cls: "cx-project-list" });
    if (!projects.length) {
      list.createDiv({ text: "尚无 Active Project", cls: "cx-empty" });
      return;
    }
    projects.slice(0, 6).forEach((project) => {
      const derived = taskGroups.find((item) => item.project.file.path === project.file.path)?.progress;
      const progress = clamp(derived ?? Number(project.frontmatter.progress ?? 0), 0, 100);
      const item = list.createDiv({ cls: "cx-project" });
      const line = item.createDiv({ cls: "cx-project-line" });
      const link = line.createEl("button", { text: project.file.basename, cls: "cx-text-link" });
      link.addEventListener("click", () => this.openFile(project.file));
      line.createSpan({ text: `${Math.round(progress * 10) / 10}%` });
      const track = item.createDiv({ cls: "cx-progress-track" });
      const bar = track.createSpan({ cls: "cx-progress-bar" });
      bar.style.width = `${progress}%`;
    });
  }

  renderTasks(parent, taskGroups) {
    const card = this.createCard(parent, "Upcoming Tasks", "Active + focus");
    card.addClass("cx-task-card");
    const header = card.querySelector(".cx-card-header");
    const list = card.createDiv({ cls: "cx-task-list" });
    if (!taskGroups.length) {
      list.createDiv({ text: "尚无 Active Focus Project", cls: "cx-empty" });
      return;
    }

    const selectedGroup = taskGroups.find((group) => group.project.file.path === this.taskProjectPath) ?? taskGroups[0];
    this.taskProjectPath = selectedGroup.project.file.path;
    const select = header.createEl("select", {
      cls: "cx-task-project-select",
      attr: { "aria-label": "选择 Upcoming Tasks 的 Project", title: "选择 Focus Project" },
    });
    taskGroups.forEach((group) => {
      select.createEl("option", {
        text: group.project.file.basename,
        attr: { value: group.project.file.path },
      });
    });
    select.value = this.taskProjectPath;
    select.addEventListener("change", () => {
      this.taskProjectPath = select.value;
      this.renderDashboard();
    });

    if (!selectedGroup.tasks.length) {
      list.createDiv({ text: "该 Project 暂无未完成任务", cls: "cx-empty" });
      return;
    }

    selectedGroup.tasks.slice(0, 3).forEach((task) => {
      const row = list.createDiv({ cls: "cx-task" });
      const check = row.createEl("button", { cls: "cx-task-check", attr: { "aria-label": "完成任务" } });
      setIcon(check, "circle");
      check.addEventListener("click", () => this.completeTask(task));
      row.createDiv({ text: task.text || "Untitled task", cls: "cx-task-label" });
    });
    const remaining = selectedGroup.tasks.length - 3;
    if (remaining > 0) list.createDiv({ text: `+${remaining}`, cls: "cx-task-more" });
  }

  renderRoute(shell, streaks) {
    const route = shell.createDiv({ cls: "cx-route cx-glass" });
    route.createDiv({ text: "最近 14 天", cls: "cx-route-label" });
    const track = route.createDiv({ cls: "cx-route-track" });
    let voyageDays = 0;
    for (let offset = -13; offset <= 0; offset += 1) {
      const date = addDays(new Date(), offset);
      const iso = localISO(date);
      const frontmatter = streaks.byDate.get(iso)?.frontmatter;
      const count = completion(frontmatter);
      const voyage = isVoyageDay(frontmatter);
      const entryType = stateEntryType(frontmatter);
      if (voyage) voyageDays += 1;
      const level = entryType === "retrospective" ? 0 : count;
      const day = track.createDiv({ cls: `cx-route-day cx-level-${level}${voyage ? " is-voyage" : " is-rest"}${offset === 0 ? " is-today" : ""}` });
      day.createSpan({ cls: "cx-route-node" });
      day.createSpan({ text: new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(date), cls: "cx-route-weekday" });
      day.setAttr("aria-label", entryType === "retrospective" ? `${iso}: 休整日 · Retrospective` : `${iso}: ${count}/6 Navigation`);
    }
    const sailingRate = Math.round(voyageDays / 14 * 100);
    route.createDiv({ text: `近14日航行 ${voyageDays}天 · 出海率 ${sailingRate}%`, cls: "cx-route-milestone" });
  }

  createSvg(parent, tag, attributes = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    parent.appendChild(node);
    return node;
  }

  gaugePath(index) {
    const centerX = 80;
    const centerY = 73;
    const radius = 53;
    const gap = 0.035;
    const start = Math.PI - index * Math.PI / 5 - gap;
    const end = Math.PI - (index + 1) * Math.PI / 5 + gap;
    const points = [];
    for (let step = 0; step <= 8; step += 1) {
      const angle = start + (end - start) * (step / 8);
      points.push(`${centerX + Math.cos(angle) * radius},${centerY - Math.sin(angle) * radius}`);
    }
    return `M ${points.join(" L ")}`;
  }

  renderCheckin(parent, todayFile, frontmatter) {
    const card = this.createCard(parent, "Navigation Check-in", "启航当下 · 记录条件，不评价努力");
    card.addClass("cx-checkin-card");
    const body = card.createDiv({ cls: "cx-checkin-grid" });
    NAVIGATION_METRICS.forEach((metric) => {
      const gauge = body.createDiv({ cls: "cx-mini-gauge" });
      const svg = this.createSvg(gauge, "svg", { viewBox: "0 0 160 104", class: "cx-gauge-svg" });
      const selected = rating(frontmatter[metric.key]);
      for (let index = 0; index < 5; index += 1) {
        const value = index + 1;
        const segment = this.createSvg(svg, "path", {
          d: this.gaugePath(index),
          class: `cx-gauge-segment${selected !== null && value <= selected ? " is-active" : ""}${value === selected ? " is-selected" : ""}`,
          role: "button",
          tabindex: "0",
          "aria-label": `${metric.label} ${value}/5`,
        });
        segment.addEventListener("click", () => this.setRating(todayFile, metric.key, value));
        segment.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") this.setRating(todayFile, metric.key, value);
        });
      }
      const valueText = this.createSvg(svg, "text", { x: 80, y: 70, class: "cx-gauge-value", "text-anchor": "middle" });
      valueText.textContent = selected ?? "—";
      gauge.createDiv({ text: metric.label, cls: "cx-gauge-label" });
      gauge.createDiv({ text: metric.hint, cls: "cx-gauge-hint" });
    });
  }

  radarValues(frontmatter) {
    if (usesNavigationModel(frontmatter)) {
      return NAVIGATION_METRICS.map((metric) => rating(frontmatter[metric.key]) ?? 0);
    }
    return [
      rating(frontmatter.sleep_quality) ?? 0,
      rating(frontmatter.physical_state) ?? 0,
      rating(frontmatter.appetite_stability) ?? 0,
      rating(frontmatter.agency) ?? 0,
      rating(frontmatter.stress) === null ? 0 : 6 - rating(frontmatter.stress),
      rating(frontmatter.energy) ?? 0,
    ];
  }

  polygonPoints(values, centerX, centerY, radius) {
    return values.map((value, index) => {
      const angle = -Math.PI / 2 + index * Math.PI / 3;
      const scaled = radius * clamp(Number(value) / 5, 0, 1);
      return `${centerX + Math.cos(angle) * scaled},${centerY + Math.sin(angle) * scaled}`;
    }).join(" ");
  }

  renderRadar(parent, todayFrontmatter, pages) {
    const navigation = usesNavigationModel(todayFrontmatter);
    const card = this.createCard(
      parent,
      navigation ? "Navigation Radar" : "状态 Radar",
      navigation ? "启航时的工作条件 · 面积越大代表越可用" : "压力转换为平稳度；面积越大代表可用状态越好",
    );
    card.addClass("cx-radar-card");
    const svg = this.createSvg(card, "svg", { viewBox: "0 0 340 300", class: "cx-radar" });
    const centerX = 170;
    const centerY = 142;
    const radius = 88;
    const hex = (level) => this.polygonPoints(Array(6).fill(level), centerX, centerY, radius);
    for (let level = 1; level <= 5; level += 1) this.createSvg(svg, "polygon", { points: hex(level), class: "cx-radar-grid" });
    for (let index = 0; index < 6; index += 1) {
      const angle = -Math.PI / 2 + index * Math.PI / 3;
      this.createSvg(svg, "line", {
        x1: centerX,
        y1: centerY,
        x2: centerX + Math.cos(angle) * radius,
        y2: centerY + Math.sin(angle) * radius,
        class: "cx-radar-axis",
      });
    }
    const completePages = pages
      .filter((page) => usesNavigationModel(page.frontmatter) === navigation)
      .filter((page) => completion(page.frontmatter) === checkinDefinition(page.frontmatter).required.length)
      .slice(-7);
    const recent = completePages.map((page) => this.radarValues(page.frontmatter));
    const averages = Array.from({ length: 6 }, (_, index) => {
      const values = recent.map((row) => row[index]).filter((value) => value > 0);
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    });
    if (completePages.length >= 3) {
      this.createSvg(svg, "polygon", { points: this.polygonPoints(averages, centerX, centerY, radius), class: "cx-radar-average" });
    }
    this.createSvg(svg, "polygon", { points: this.polygonPoints(this.radarValues(todayFrontmatter), centerX, centerY, radius), class: "cx-radar-today" });
    const labels = navigation
      ? NAVIGATION_METRICS.map((metric) => metric.label)
      : ["睡眠", "身体", "食欲", "行动感", "平稳", "精力"];
    labels.forEach((label, index) => {
      const angle = -Math.PI / 2 + index * Math.PI / 3;
      const text = this.createSvg(svg, "text", {
        x: centerX + Math.cos(angle) * (radius + 25),
        y: centerY + Math.sin(angle) * (radius + 25) + 4,
        class: "cx-radar-label",
        "text-anchor": "middle",
      });
      text.textContent = label;
    });
    const legend = card.createDiv({ cls: "cx-radar-legend" });
    legend.createSpan({ text: "● 今日", cls: "is-today" });
    if (completePages.length >= 3) {
      legend.createSpan({ text: completePages.length >= 7 ? "◇ 七日平均" : `◇ 近期平均（${completePages.length} 天）`, cls: "is-average" });
    } else {
      legend.createSpan({ text: "至少 3 个完整记录日后显示平均", cls: "is-pending" });
    }
    if (completePages.some((page) => stateEntryType(page.frontmatter) === "retrospective")) {
      legend.createSpan({ text: "含休整日补录", cls: "is-retrospective" });
    }
  }

  renderCalendar(parent, streaks) {
    const cursor = this.calendarCursor;
    const card = this.createCard(parent, "Calendar", `${cursor.getFullYear()} · ${pad(cursor.getMonth() + 1)}`);
    card.addClass("cx-calendar-card");
    const header = card.querySelector(".cx-card-header");
    const navigation = header.createDiv({ cls: "cx-calendar-nav" });
    const previous = navigation.createEl("button", { attr: { "aria-label": "Previous month" } });
    setIcon(previous, "chevron-left");
    previous.addEventListener("click", () => {
      this.calendarCursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
      this.renderDashboard();
    });
    const todayButton = navigation.createEl("button", { text: "Today", cls: "cx-calendar-today" });
    todayButton.addEventListener("click", () => {
      this.calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      this.renderDashboard();
    });
    const next = navigation.createEl("button", { attr: { "aria-label": "Next month" } });
    setIcon(next, "chevron-right");
    next.addEventListener("click", () => {
      this.calendarCursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      this.renderDashboard();
    });
    const grid = card.createDiv({ cls: "cx-calendar" });
    ["S", "M", "T", "W", "T", "F", "S"].forEach((day) => {
      const cell = grid.createDiv({ cls: "cx-calendar-cell is-weekday" });
      cell.createSpan({ text: day, cls: "cx-calendar-weekday" });
    });
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    for (let i = 0; i < first.getDay(); i += 1) grid.createDiv({ cls: "cx-calendar-cell is-empty" });
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= days; day += 1) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      const iso = localISO(date);
      const page = streaks.byDate.get(iso);
      const count = completion(page?.frontmatter);
      const entryType = stateEntryType(page?.frontmatter);
      const voyage = isVoyageDay(page?.frontmatter);
      const cell = grid.createDiv({ cls: "cx-calendar-cell" });
      const state = !page ? " is-uncreated" : voyage ? " is-complete" : entryType === "retrospective" ? " cx-rest-day" : count > 0 ? " is-partial" : " has-note";
      const description = !page
        ? "click to create"
        : entryType === "retrospective"
          ? "休整日 · Retrospective data"
          : voyage
            ? "Voyage Day"
            : `${count}/6 recorded`;
      const button = cell.createEl("button", {
        text: String(day),
        cls: `cx-calendar-day${state}${iso === localISO() ? " is-today" : ""}`,
        attr: { "aria-label": `${iso}: ${description}` },
      });
      button.addEventListener("click", async () => {
        const file = page?.file ?? await this.ensureDaily(date);
        await this.openFile(file);
      });
    }
  }

  renderHeatmap(parent, streaks) {
    const metric = TIME_METRICS.find((item) => item.id === this.heatmapMode) ?? TIME_METRICS[0];
    const card = this.createCard(parent, "Time Allocation Heatmap", "按实际分钟数派生四档颜色；空白代表尚未记录");
    card.addClass("cx-heatmap-card");
    const header = card.querySelector(".cx-card-header");
    this.renderModeTabs(header, TIME_METRICS.map((item) => [item.id, item.label]), this.heatmapMode, (mode) => {
      this.heatmapMode = mode;
      this.renderDashboard();
    });
    const grid = card.createDiv({ cls: `cx-heatmap cx-heatmap-${metric.id}` });
    const legend = card.createDiv({ cls: "cx-heatmap-legend" });
    const coverage = legend.createSpan();
    legend.createSpan({ text: "0 · none" });
    legend.createSpan({ text: timeThresholdLabel(metric), cls: "cx-heatmap-thresholds" });

    let renderSignature = "";
    const paint = (width, height) => {
      const gap = 5;
      const usableWidth = Math.max(width, 240);
      const usableHeight = Math.max(height, 120);
      const rowSizedCell = (usableHeight - gap * 6) / 7;
      const weeks = Math.max(8, Math.round((usableWidth + gap) / (rowSizedCell + gap)));
      const signature = `${weeks}:${Math.round(usableWidth)}:${Math.round(usableHeight)}`;
      if (signature === renderSignature) return;
      renderSignature = signature;

      const cellSize = Math.max(6, Math.min(
        rowSizedCell,
        (usableWidth - gap * (weeks - 1)) / weeks,
      ));
      const columnGap = weeks > 1 ? Math.max(0, (usableWidth - cellSize * weeks) / (weeks - 1)) : 0;
      const rowGap = Math.max(0, (usableHeight - cellSize * 7) / 6);
      grid.style.gridTemplateColumns = `repeat(${weeks}, ${cellSize}px)`;
      grid.style.gridTemplateRows = `repeat(7, ${cellSize}px)`;
      grid.style.columnGap = `${columnGap}px`;
      grid.style.rowGap = `${rowGap}px`;
      grid.empty();

      const today = dateFromISO(localISO());
      const currentWeekStart = addDays(today, -today.getDay());
      const start = addDays(currentWeekStart, -(weeks - 1) * 7);
      const visibleDays = Math.round((today - start) / 86400000) + 1;
      let processed = 0;
      for (let offset = 0; offset < weeks * 7; offset += 1) {
        const date = addDays(start, offset);
        const iso = localISO(date);
        const isFuture = date > today;
        const page = isFuture ? null : streaks.byDate.get(iso);
        const minutes = isFuture ? null : minutesValue(page?.frontmatter[metric.key]);
        const level = isFuture ? null : timeLevel(minutes, metric);
        if (level !== null) processed += 1;
        const state = isFuture ? " is-future" : level === null ? " is-missing" : ` cx-intensity-${level}`;
        const cell = grid.createSpan({ cls: `cx-heat-cell${state}` });
        const description = isFuture
          ? "future"
          : level === null
            ? "not recorded"
            : `${metric.label}: ${formatDuration(minutes)} · ${level === 0 ? "no activity" : `level ${level}/4`}`;
        cell.setAttr("aria-label", `${iso}: ${description}`);
        cell.setAttr("title", `${iso}: ${description}`);
      }
      coverage.setText(`过去 ${visibleDays} 天 · 已记录 ${processed} 天`);
    };

    this.heatmapObserver?.disconnect();
    this.heatmapObserver = new ResizeObserver(([entry]) => {
      paint(entry.contentRect.width, entry.contentRect.height);
    });
    this.heatmapObserver.observe(grid);
    const bounds = grid.getBoundingClientRect();
    paint(bounds.width, bounds.height);
  }

  trendSeries(pages, mode) {
    const byDate = new Map(pages.map((page) => [String(page.frontmatter.date).slice(0, 10), page.frontmatter]));
    return Array.from({ length: 14 }, (_, index) => {
      const date = addDays(new Date(), index - 13);
      const frontmatter = byDate.get(localISO(date));
      const navigation = usesNavigationModel(frontmatter);
      const energy = overallEnergyValue(frontmatter);
      const key = navigation ? "health_morning_sleep" : "sleep_quality";
      return {
        date,
        iso: localISO(date),
        value: mode === "energy" ? energy.value : rating(frontmatter?.[key]),
        entryType: stateEntryType(frontmatter),
        source: mode === "energy" ? energy.source : navigation ? "Health Morning Sleep" : "Legacy Sleep",
      };
    });
  }

  renderTrend(parent, pages) {
    const label = this.trendMode === "energy" ? "Overall Energy" : "Sleep Quality";
    const card = this.createCard(parent, `14-day ${label}`);
    card.addClass("cx-trend-card");
    const header = card.querySelector(".cx-card-header");
    this.renderModeTabs(header, [["energy", "Energy"], ["sleep_quality", "Sleep"]], this.trendMode, (mode) => {
      this.trendMode = mode;
      this.renderDashboard();
    });
    const series = this.trendSeries(pages, this.trendMode);
    const values = series.map((item) => item.value).filter((value) => value !== null);
    const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    const chartWrap = card.createDiv({ cls: "cx-trend-wrap" });
    const svg = this.createSvg(chartWrap, "svg", { viewBox: "0 0 720 220", class: "cx-trend" });
    const left = 44;
    const right = 696;
    const top = 22;
    const bottom = 174;
    const xAt = (index) => left + index * ((right - left) / 13);
    const yAt = (value) => bottom - ((value - 1) / 4) * (bottom - top);
    for (let value = 1; value <= 5; value += 1) {
      const y = yAt(value);
      this.createSvg(svg, "line", { x1: left, y1: y, x2: right, y2: y, class: "cx-trend-grid" });
      const text = this.createSvg(svg, "text", { x: 28, y: y + 4, class: "cx-trend-axis", "text-anchor": "middle" });
      text.textContent = String(value);
    }
    let segment = [];
    const flush = () => {
      if (segment.length > 1) this.createSvg(svg, "polyline", { points: segment.join(" "), class: "cx-trend-line" });
      segment = [];
    };
    series.forEach((item, index) => {
      if (item.value === null) {
        flush();
        return;
      }
      const x = xAt(index);
      const y = yAt(item.value);
      segment.push(`${x},${y}`);
      const retrospective = item.entryType === "retrospective";
      const point = this.createSvg(svg, "circle", { cx: x, cy: y, r: 4.5, class: `cx-trend-point${retrospective ? " is-retrospective" : ""}` });
      const title = this.createSvg(point, "title");
      title.textContent = retrospective
        ? `${item.iso}: ${item.value}/5 · ${item.source} · 休整日 Retrospective`
        : `${item.iso}: ${item.value}/5 · ${item.source}`;
    });
    flush();
    [0, 6, 13].forEach((index) => {
      const text = this.createSvg(svg, "text", { x: xAt(index), y: 202, class: "cx-trend-date", "text-anchor": "middle" });
      text.textContent = `${pad(series[index].date.getMonth() + 1)}/${pad(series[index].date.getDate())}`;
    });
    const summary = card.createDiv({ cls: "cx-trend-summary" });
    summary.createSpan({ text: average === null ? "14 天暂无数据" : `14 天平均 ${average.toFixed(2)}` });
    const includesRetrospective = series.some((item) => item.value !== null && item.entryType === "retrospective");
    summary.createSpan({ text: `${values.length}/14 days recorded${includesRetrospective ? " · 含休整日补录" : ""}` });
  }

  createDashboardCanvas() {
    this.contentEl.empty();
    this.contentEl.addClass("castlex-home-view");
    const shell = this.contentEl.createDiv({ cls: "cx-shell" });
    const desktopAsset = this.app.vault.getAbstractFileByPath(DESKTOP_ASSET_PATH);
    const mobileAsset = this.app.vault.getAbstractFileByPath(MOBILE_ASSET_PATH);
    if (desktopAsset instanceof TFile) shell.style.setProperty("--cx-background-desktop", `url("${this.app.vault.getResourcePath(desktopAsset)}")`);
    if (mobileAsset instanceof TFile) shell.style.setProperty("--cx-background-mobile", `url("${this.app.vault.getResourcePath(mobileAsset)}")`);
    shell.createDiv({ cls: "cx-background-layer", attr: { "aria-hidden": "true" } });
    return shell.createDiv({ cls: "cx-dashboard-content" });
  }

  renderDailySyncPending(date) {
    const dashboard = this.createDashboardCanvas();
    const card = dashboard.createDiv({ cls: "cx-card cx-daily-sync-pending" });
    card.createEl("h2", { text: `${localISO(date)} Daily 尚未同步` });
    card.createEl("p", { text: "手机不会自动创建第二份 Daily。请先等待 iCloud；如果今天确实还没有文件，再确认在本机创建。" });
    const actions = card.createDiv({ cls: "cx-daily-sync-actions" });
    const retry = actions.createEl("button", { text: "重新检查 iCloud", cls: "cx-button cx-button-primary" });
    retry.addEventListener("click", () => this.renderDashboard());
    const create = actions.createEl("button", { text: "确认在本机创建", cls: "cx-button" });
    create.addEventListener("click", async () => {
      create.disabled = true;
      try {
        await this.ensureDaily(date, { allowCreate: true });
        await this.renderDashboard();
      } finally {
        create.disabled = false;
      }
    });
  }

  async renderDashboard() {
    this.heatmapObserver?.disconnect();
    const now = new Date();
    this.currentDateISO = localISO(now);
    await this.archiveDailyConflicts(now);
    const todayFile = await this.ensureDaily(now);
    if (!(todayFile instanceof TFile)) {
      this.renderDailySyncPending(now);
      return;
    }
    const todayFrontmatter = await freshFrontmatter(this.app, todayFile);
    const pages = [
      ...this.dailyPages().filter((page) => page.file.path !== todayFile.path),
      { file: todayFile, frontmatter: todayFrontmatter },
    ].sort((a, b) => String(a.frontmatter.date).localeCompare(String(b.frontmatter.date)));
    const projects = this.projectPages();
    const taskGroups = await this.collectProjectTasks(projects);
    const activeProjects = projects.filter((project) => project.lifecycle.id === "active");
    const focusTaskGroups = taskGroups.filter((group) => group.project.lifecycle.id === "active" && group.project.frontmatter.focus === true);
    const streaks = this.calculateStreaks(pages);

    const dashboard = this.createDashboardCanvas();

    const top = dashboard.createDiv({ cls: "cx-top-grid" });
    const left = top.createDiv({ cls: "cx-top-left" });
    this.renderHero(left, todayFile);
    this.renderKpis(left, todayFile, todayFrontmatter, streaks, voyageLifecycle(pages, now));
    this.renderProjects(top, activeProjects, taskGroups);
    this.renderTasks(top, focusTaskGroups);

    this.renderRoute(dashboard, streaks);

    const primary = dashboard.createDiv({ cls: "cx-primary-grid" });
    this.renderCheckin(primary, todayFile, todayFrontmatter);
    this.renderRadar(primary, todayFrontmatter, pages);
    this.renderCalendar(primary, streaks);

    const secondary = dashboard.createDiv({ cls: "cx-secondary-grid" });
    this.renderHeatmap(secondary, streaks);
    this.renderTrend(secondary, pages);
    dashboard.createDiv({
      cls: "cx-mobile-scroll-spacer",
      attr: { "aria-hidden": "true" },
    });
  }
}

class CastleXHealthView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.currentDateISO = localISO();
    this.stageOverride = null;
    this.renderTimer = null;
    this.writeQueue = Promise.resolve();
    this.textTimers = new Map();
    this.plannedWorkout = "pool";
    this.plannedSlot = 0;
    this.addingWorkout = false;
    this.nightRitualAnimationUntil = 0;
    this.morningRitualAnimationUntil = 0;
    this.renderedDateISO = null;
    this.pendingScrollAnchor = null;
  }

  getViewType() {
    return HEALTH_VIEW_TYPE;
  }

  getDisplayText() {
    return "Health Dashboard";
  }

  getIcon() {
    return "heart-pulse";
  }

  async onOpen() {
    this.contentEl.addClass("castlex-health-view");
    this.registerEvent(this.app.metadataCache.on("changed", () => this.scheduleRender()));
    this.registerEvent(this.app.vault.on("modify", () => this.scheduleRender()));
    this.registerInterval(window.setInterval(() => this.updateClock(), 30000));
    await this.renderDashboard();
  }

  async onClose() {
    if (this.renderTimer) window.clearTimeout(this.renderTimer);
    this.textTimers.forEach((timer) => window.clearTimeout(timer));
    this.textTimers.clear();
  }

  scheduleRender() {
    if (this.renderTimer) window.clearTimeout(this.renderTimer);
    this.renderTimer = window.setTimeout(() => this.renderDashboard(), 260);
  }

  updateClock() {
    const now = new Date();
    if (this.clockEl) {
      this.clockEl.setText(new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now));
    }
    if (this.timerEl?.dataset.startedAt) {
      const started = new Date(this.timerEl.dataset.startedAt);
      const elapsed = Math.max(0, Math.floor((now - started) / 60000));
      this.timerEl.setText(`已进行 ${formatDuration(elapsed)}`);
    }
    const todayISO = localISO(now);
    if (todayISO !== this.currentDateISO) {
      this.currentDateISO = todayISO;
      this.stageOverride = null;
      this.scheduleRender();
      return;
    }
    if (!this.stageOverride && this.renderedStage !== healthStageForTime(now)) this.scheduleRender();
  }

  async openStage(stage) {
    const valid = ["sleep", "morning", "afternoon", "evening"];
    if (!valid.includes(stage)) return;
    this.stageOverride = stage;
    await this.renderDashboard();
  }

  async ensureFolder(path) {
    const normalized = normalizePath(path);
    if (this.app.vault.getAbstractFileByPath(normalized)) return;
    const parts = normalized.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current);
    }
  }

  dailyPath(date = new Date()) {
    return `${DAILY_ROOT}/${date.getFullYear()}/${pad(date.getMonth() + 1)}/${localISO(date)}.md`;
  }

  async createDailyContent(date) {
    const iso = localISO(date);
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
    const templatePath = "90_System/Templates/010-Daily-Dashboard.md";
    const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
    if (!(templateFile instanceof TFile)) throw new Error(`Missing Daily template: ${templatePath}`);
    let content = await this.app.vault.cachedRead(templateFile);
    [
      ["{{date:YYYY-MM-DD · dddd}}", `${iso} · ${weekday}`],
      ["{{date:gggg-[W]ww}}", isoWeek(date)],
      ["{{date:YYYY-MM-DD}}", iso],
      ["{{date:YYYY-MM}}", iso.slice(0, 7)],
      ["{{date:dddd}}", weekday],
    ].forEach(([token, value]) => {
      content = content.split(token).join(value);
    });
    return content;
  }

  async ensureDaily(date = new Date(), options = {}) {
    const path = this.dailyPath(date);
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) return existing;
    const allowCreate = options.allowCreate ?? !Platform.isMobile;
    if (!allowCreate) return null;
    const pending = this.plugin.dailyCreationPromises.get(path);
    if (pending) return pending;
    const creation = (async () => {
      await this.ensureFolder(path.split("/").slice(0, -1).join("/"));
      const afterFolder = this.app.vault.getAbstractFileByPath(path);
      if (afterFolder instanceof TFile) return afterFolder;
      return this.app.vault.create(path, await this.createDailyContent(date));
    })();
    this.plugin.dailyCreationPromises.set(path, creation);
    try {
      return await creation;
    } finally {
      this.plugin.dailyCreationPromises.delete(path);
    }
  }

  dailyPages() {
    const pages = this.app.vault.getMarkdownFiles()
      .filter((file) => file.path.startsWith(`${DAILY_ROOT}/`))
      .map((file) => ({ file, frontmatter: this.app.metadataCache.getFileCache(file)?.frontmatter ?? {} }))
      .filter((page) => page.frontmatter.type === "daily" && page.frontmatter.date);
    const byDate = new Map();
    pages.forEach((page) => {
      const iso = isoDateValue(page.frontmatter.date);
      if (!iso) return;
      const canonicalPath = dailyPathFromISO(iso);
      const current = byDate.get(iso);
      const pageIsCanonical = page.file.path === canonicalPath;
      const currentIsCanonical = current?.file.path === canonicalPath;
      if (!current || (pageIsCanonical && !currentIsCanonical) || (!currentIsCanonical && page.file.stat.mtime > current.file.stat.mtime)) {
        byDate.set(iso, page);
      }
    });
    return [...byDate.values()]
      .sort((a, b) => String(a.frontmatter.date).localeCompare(String(b.frontmatter.date)));
  }

  rotationFromHistory(pages, todayISO) {
    const previous = [...pages].reverse().find((page) => {
      const iso = isoDateValue(page.frontmatter.date);
      if (!iso || iso >= todayISO) return false;
      const advanced = page.frontmatter.health_rotation_advanced === true
        && healthRotationSlot(page.frontmatter.health_rotation_slot) !== null;
      const skipped = page.frontmatter.health_rotation_skipped === true
        && healthRotationSlot(page.frontmatter.health_rotation_skipped_slot) !== null;
      return advanced || skipped;
    });
    if (!previous) return { slot: 0, workout: HEALTH_ROTATION[0] };
    const previousSlot = previous.frontmatter.health_rotation_advanced === true
      ? healthRotationSlot(previous.frontmatter.health_rotation_slot)
      : healthRotationSlot(previous.frontmatter.health_rotation_skipped_slot);
    const slot = (previousSlot + 1) % HEALTH_ROTATION.length;
    return { slot, workout: HEALTH_ROTATION[slot] };
  }

  async initializePlannedWorkout(file, frontmatter, pages) {
    const savedSlot = healthRotationSlot(frontmatter.health_planned_rotation_slot);
    if (HEALTH_WORKOUTS[frontmatter.health_planned_workout] && savedSlot !== null) {
      this.plannedWorkout = String(frontmatter.health_planned_workout);
      this.plannedSlot = savedSlot;
      return frontmatter;
    }
    const planned = this.rotationFromHistory(pages, localISO());
    this.plannedWorkout = planned.workout;
    this.plannedSlot = planned.slot;
    await this.app.fileManager.processFrontMatter(file, (next) => {
      if (!HEALTH_WORKOUTS[next.health_planned_workout]) next.health_planned_workout = planned.workout;
      if (healthRotationSlot(next.health_planned_rotation_slot) === null) next.health_planned_rotation_slot = planned.slot;
    });
    return freshFrontmatter(this.app, file);
  }

  async normalizePrimaryWorkout(file, frontmatter) {
    const stored = Array.isArray(frontmatter.health_workout_sessions)
      ? frontmatter.health_workout_sessions
      : [];
    if (!stored.length) return frontmatter;
    const sessions = healthWorkoutSessions(frontmatter);
    const primary = healthPrimarySession(frontmatter, sessions);
    if (!primary) return frontmatter;
    const source = String(primary.source || frontmatter.health_primary_source || (
      primary.workout === this.plannedWorkout && primary.mode === "standard"
        ? "planned"
        : primary.workout === frontmatter.health_recommended_workout
          && primary.mode === frontmatter.health_recommended_mode
          ? "recommended"
          : "manual"
    ));
    const normalizedSessions = sessions.map((session) => ({
      ...session,
      role: String(session.id) === String(primary.id) ? "primary" : "additional",
      source: String(session.id) === String(primary.id)
        ? source
        : "additional",
    }));
    const primaryComplete = ["completed", "rest"].includes(String(frontmatter.health_workout_status || ""))
      && String(frontmatter.health_current_session_role || "") !== "additional";
    const needsUpdate = String(frontmatter.health_primary_session_id || "") !== String(primary.id)
      || String(frontmatter.health_primary_workout || "") !== String(primary.workout)
      || String(frontmatter.health_primary_mode || "") !== String(primary.mode)
      || String(frontmatter.health_primary_source || "") !== source
      || stored.length !== normalizedSessions.length
      || stored.some((session, index) => (
        !normalizedSessions[index]
        || String(session.role || "") !== normalizedSessions[index].role
        || String(session.source || "") !== normalizedSessions[index].source
      ))
      || (primaryComplete && (
        String(frontmatter.health_selected_workout || "") !== String(primary.workout)
        || String(frontmatter.health_selected_mode || "") !== String(primary.mode)
        || String(frontmatter.health_actual_workout || "") !== String(primary.workout)
        || String(frontmatter.health_actual_workout_mode || "") !== String(primary.mode)
        || String(frontmatter.health_workout_type || "") !== String(primary.workout)
        || String(frontmatter.health_workout_mode || "") !== String(primary.mode)
      ));
    if (!needsUpdate) return frontmatter;
    await this.app.fileManager.processFrontMatter(file, (next) => {
      next.health_workout_sessions = normalizedSessions;
      next.health_primary_session_id = String(primary.id);
      next.health_primary_workout = String(primary.workout);
      next.health_primary_mode = String(primary.mode || "standard");
      next.health_primary_source = source;
      if (primaryComplete) {
        next.health_selected_workout = String(primary.workout);
        next.health_selected_mode = String(primary.mode || "standard");
        next.health_actual_workout = String(primary.workout);
        next.health_actual_workout_mode = String(primary.mode || "standard");
        next.health_workout_type = String(primary.workout);
        next.health_workout_mode = String(primary.mode || "standard");
        next.health_manual_override = source === "manual";
        next.health_rotation_advance = String(primary.workout) === this.plannedWorkout;
      }
    });
    return freshFrontmatter(this.app, file);
  }

  async removeLegacyAfternoonBodyChange(file, frontmatter) {
    if (!Object.prototype.hasOwnProperty.call(frontmatter, "health_afternoon_body_change")) return frontmatter;
    await this.app.fileManager.processFrontMatter(file, (next) => {
      delete next.health_afternoon_body_change;
    });
    return freshFrontmatter(this.app, file);
  }

  async updateHealth(file, mutator, notice = "") {
    const write = async () => {
      await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        mutator(frontmatter);
        if (isoDateValue(frontmatter.date) !== localISO()) return;
        const recommendation = healthRecommendation(frontmatter, this.plannedWorkout);
        frontmatter.health_recommended_workout = recommendation.workout;
        frontmatter.health_recommended_mode = recommendation.mode;
        frontmatter.health_recommendation_status = recommendation.status;
        frontmatter.health_recommendation_capacity = recommendation.capacity;
        frontmatter.health_morning_capacity = recommendation.morningCapacity;
        frontmatter.health_afternoon_state = recommendation.afternoonState;
        frontmatter.health_recommendation_completeness = recommendation.completeness;
        frontmatter.health_recommendation_reasons = recommendation.reasons;
        frontmatter.health_recommendation_updated_at = localTimestamp();
      });
      if (notice) new Notice(notice);
    };
    this.writeQueue = this.writeQueue.then(write, write);
    await this.writeQueue;
    await this.renderDashboard();
  }

  queueTextUpdate(file, key, value) {
    const previous = this.textTimers.get(key);
    if (previous) window.clearTimeout(previous);
    const timer = window.setTimeout(() => {
      this.textTimers.delete(key);
      this.updateHealth(file, (frontmatter) => {
        if (value.trim()) frontmatter[key] = value.trim();
        else delete frontmatter[key];
      });
    }, 700);
    this.textTimers.set(key, timer);
  }

  rememberScrollAnchor(field, key) {
    this.pendingScrollAnchor = {
      key,
      top: field.getBoundingClientRect().top,
      expiresAt: Date.now() + 1600,
    };
  }

  scrollAncestors() {
    const ancestors = [];
    let element = this.contentEl;
    while (element) {
      ancestors.push(element);
      element = element.parentElement;
    }
    const scrollingElement = this.contentEl.ownerDocument?.scrollingElement;
    if (scrollingElement && !ancestors.includes(scrollingElement)) ancestors.push(scrollingElement);
    return ancestors;
  }

  captureScrollPosition() {
    if (this.renderedDateISO !== this.currentDateISO) return null;
    const activeField = this.contentEl.ownerDocument?.activeElement?.closest?.("[data-health-key]");
    const activeKey = activeField?.dataset.healthKey;
    const remembered = this.pendingScrollAnchor?.expiresAt > Date.now()
      ? this.pendingScrollAnchor
      : null;
    return {
      positions: this.scrollAncestors().map((element) => ({
        element,
        top: element.scrollTop,
        left: element.scrollLeft,
      })),
      anchor: activeKey
        ? { key: activeKey, top: activeField.getBoundingClientRect().top }
        : remembered,
    };
  }

  restoreScrollPosition(position) {
    if (!position) return;
    const restore = () => {
      position.positions.forEach(({ element, top, left }) => {
        const maximumTop = Math.max(0, element.scrollHeight - element.clientHeight);
        element.scrollTop = Math.min(top, maximumTop);
        element.scrollLeft = left;
      });
      const anchor = position.anchor;
      if (!anchor) return;
      const target = this.contentEl.querySelector(`[data-health-key="${anchor.key}"]`);
      if (!target) return;
      const delta = target.getBoundingClientRect().top - anchor.top;
      if (Math.abs(delta) < 1) return;
      const candidates = position.positions.filter(({ element }) => (
        element.contains(target)
        && element.scrollHeight > element.clientHeight + 1
      ));
      const scroller = candidates.find(({ top }) => top > 0)?.element
        ?? candidates[0]?.element;
      if (scroller) scroller.scrollTop += delta;
    };
    restore();
    window.requestAnimationFrame(() => {
      restore();
      window.requestAnimationFrame(restore);
    });
  }

  createCanvas() {
    this.contentEl.empty();
    this.contentEl.addClass("castlex-health-view");
    const shell = this.contentEl.createDiv({ cls: "cx-shell cx-health-shell" });
    const desktopAsset = this.app.vault.getAbstractFileByPath(HEALTH_DESKTOP_ASSET_PATH);
    const mobileAsset = this.app.vault.getAbstractFileByPath(HEALTH_MOBILE_ASSET_PATH);
    if (desktopAsset instanceof TFile) shell.style.setProperty("--cx-background-desktop", `url("${this.app.vault.getResourcePath(desktopAsset)}")`);
    if (mobileAsset instanceof TFile) shell.style.setProperty("--cx-background-mobile", `url("${this.app.vault.getResourcePath(mobileAsset)}")`);
    shell.createDiv({ cls: "cx-background-layer", attr: { "aria-hidden": "true" } });
    return shell.createDiv({ cls: "cx-health-dashboard-content" });
  }

  renderSyncPending(date) {
    const dashboard = this.createCanvas();
    const card = dashboard.createDiv({ cls: "cx-card cx-daily-sync-pending" });
    card.createEl("h2", { text: `${localISO(date)} Daily 尚未同步` });
    card.createEl("p", { text: "Health Dashboard 不会在手机上自动创建第二份 Daily。请等待 iCloud，或确认在本机创建。" });
    const actions = card.createDiv({ cls: "cx-daily-sync-actions" });
    const home = actions.createEl("button", { text: "返回 CastleX Home", cls: "cx-button" });
    home.addEventListener("click", () => this.plugin.activateView());
    const retry = actions.createEl("button", { text: "重新检查", cls: "cx-button cx-button-primary" });
    retry.addEventListener("click", () => this.renderDashboard());
    const create = actions.createEl("button", { text: "确认在本机创建", cls: "cx-button" });
    create.addEventListener("click", async () => {
      await this.ensureDaily(date, { allowCreate: true });
      await this.renderDashboard();
    });
  }

  renderHeader(parent) {
    const hero = parent.createDiv({ cls: "cx-health-hero cx-glass" });
    const copy = hero.createDiv({ cls: "cx-health-hero-copy" });
    copy.createEl("p", {
      text: new Intl.DateTimeFormat("zh-CN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date()),
      cls: "cx-overline",
    });
    this.clockEl = copy.createDiv({ cls: "cx-health-clock" });
    this.updateClock();
    copy.createEl("p", { text: "我与我的身体并肩作战", cls: "cx-health-signature" });
    const actions = hero.createDiv({ cls: "cx-hero-actions cx-dashboard-hero-actions" });
    const daily = actions.createEl("button", { text: "今日 Daily", cls: "cx-button" });
    daily.addEventListener("click", async () => {
      const file = await this.ensureDaily(new Date(), { allowCreate: true });
      if (file instanceof TFile) await this.app.workspace.getLeaf("tab").openFile(file);
    });
    const mental = actions.createEl("button", { text: "Mental Dashboard", cls: "cx-button" });
    mental.addEventListener("click", () => this.plugin.activateMentalView());
    const home = actions.createEl("button", { text: "CastleX Home", cls: "cx-button cx-button-primary" });
    home.addEventListener("click", () => this.plugin.activateView());
  }

  renderSignal(parent, file, frontmatter, key, label, labelSet) {
    const field = parent.createDiv({ cls: "cx-health-field" });
    field.dataset.healthKey = key;
    field.createDiv({ text: label, cls: "cx-health-field-label" });
    const selected = healthSignal(frontmatter[key]);
    const control = field.createDiv({ cls: "cx-health-signal", attr: { role: "radiogroup", "aria-label": label } });
    for (let value = 1; value <= 5; value += 1) {
      const bar = control.createEl("button", {
        cls: `cx-health-signal-bar${selected !== null && value <= selected ? " is-active" : ""}${value === selected ? " is-selected" : ""}`,
        attr: {
          type: "button",
          role: "radio",
          "aria-checked": String(value === selected),
          "aria-label": `${label}：${labelSet[value - 1]}`,
          title: labelSet[value - 1],
        },
      });
      bar.style.setProperty("--cx-signal-height", `${12 + value * 6}px`);
      bar.addEventListener("click", () => {
        this.rememberScrollAnchor(field, key);
        this.updateHealth(file, (next) => {
          next[key] = value;
        }, `${label}：${labelSet[value - 1]}`);
      });
    }
    field.createDiv({ text: selected ? `${selected}/5 · ${labelSet[selected - 1]}` : "尚未记录", cls: "cx-health-field-value" });
    return field;
  }

  renderChoice(parent, file, frontmatter, key, label, choices) {
    const field = parent.createDiv({ cls: "cx-health-field" });
    field.dataset.healthKey = key;
    field.createDiv({ text: label, cls: "cx-health-field-label" });
    const selected = String(frontmatter[key] ?? "");
    const options = field.createDiv({ cls: "cx-health-choice-grid" });
    choices.forEach(([value, text]) => {
      const button = options.createEl("button", {
        text,
        cls: `cx-health-choice${selected === value ? " is-selected" : ""}`,
        attr: { type: "button", "aria-pressed": String(selected === value) },
      });
      button.addEventListener("click", () => {
        this.rememberScrollAnchor(field, key);
        this.updateHealth(file, (next) => {
          next[key] = value;
        }, `${label}：${text}`);
      });
    });
  }

  renderMultiChoice(parent, file, frontmatter, key, label, choices) {
    const field = parent.createDiv({ cls: "cx-health-field" });
    field.dataset.healthKey = key;
    field.createDiv({ text: label, cls: "cx-health-field-label" });
    const selected = new Set(healthArray(frontmatter[key]));
    const options = field.createDiv({ cls: "cx-health-choice-grid is-multi" });
    choices.forEach(([value, text]) => {
      const button = options.createEl("button", {
        text,
        cls: `cx-health-choice${selected.has(value) ? " is-selected" : ""}`,
        attr: { type: "button", "aria-pressed": String(selected.has(value)) },
      });
      button.addEventListener("click", () => {
        this.rememberScrollAnchor(field, key);
        this.updateHealth(file, (next) => {
          const values = new Set(healthArray(next[key]));
          if (value === "none") {
            values.clear();
            values.add("none");
          } else {
            values.delete("none");
            if (values.has(value)) values.delete(value);
            else values.add(value);
          }
          next[key] = [...values];
        });
      });
    });
    return field;
  }

  renderTextField(parent, file, frontmatter, key, label, placeholder) {
    const field = parent.createDiv({ cls: "cx-health-field" });
    field.dataset.healthKey = key;
    field.createDiv({ text: label, cls: "cx-health-field-label" });
    const input = field.createEl("textarea", {
      cls: "cx-health-textarea",
      attr: { placeholder, rows: "2", "aria-label": label },
    });
    input.value = String(frontmatter[key] ?? "");
    input.addEventListener("input", () => this.queueTextUpdate(file, key, input.value));
  }

  renderEarlyMorningBedtime(parent, file, frontmatter, previousNightRecorded) {
    const now = new Date();
    const targetISO = isoDateValue(frontmatter.date);
    const recordedAt = String(frontmatter.health_early_morning_bedtime_at || "");
    const inLiveWindow = usesHealthScheduleV2(now)
      && now.getHours() < 8
      && targetISO === localISO(now);
    if (!inLiveWindow || (previousNightRecorded && !recordedAt)) return;

    const recordedLabel = recordedAt ? recordedAt.slice(11, 16) : "";
    const ritual = parent.createEl("button", {
      cls: `cx-health-early-sleep-ritual${recordedAt ? " is-recorded" : ""}`,
      attr: {
        type: "button",
        "aria-pressed": String(Boolean(recordedAt)),
        "aria-label": recordedAt
          ? `跨夜入睡已记录 ${recordedLabel}，点击可更新时间`
          : "记录此刻准备跨夜入睡",
      },
    });
    const icon = ritual.createSpan({ cls: "cx-health-early-sleep-icon", attr: { "aria-hidden": "true" } });
    setIcon(icon, "moon-star");
    const copy = ritual.createSpan({ cls: "cx-health-early-sleep-copy" });
    copy.createSpan({
      text: recordedAt ? `跨夜入睡 · ${recordedLabel}` : "跨夜入睡",
      cls: "cx-health-early-sleep-title",
    });
    copy.createSpan({
      text: recordedAt ? "准备入睡时间已保存" : "昨夜尚未记录关灯；如果现在准备休息，可以留下此刻时间",
      cls: "cx-health-early-sleep-note",
    });
    ritual.addEventListener("click", () => {
      const clickTime = new Date();
      if (
        !usesHealthScheduleV2(clickTime)
        || clickTime.getHours() >= 8
        || targetISO !== localISO(clickTime)
      ) {
        new Notice("跨夜入睡只允许在 00:00–07:59 实时记录");
        this.stageOverride = null;
        this.renderDashboard();
        return;
      }
      const timestamp = localTimestamp(clickTime);
      this.updateHealth(file, (next) => {
        next.health_early_morning_bedtime_at = timestamp;
      }, `跨夜入睡 · 已记录 ${timestamp.slice(11, 16)} 准备入睡`);
    });
  }

  renderMorning(parent, file, frontmatter, context = {}) {
    const fields = parent.createDiv({ cls: "cx-health-form-grid" });
    this.renderEarlyMorningBedtime(fields, file, frontmatter, context.previousNightRecorded === true);
    const startedAt = String(frontmatter.health_morning_started_at || "");
    const startedLabel = startedAt ? startedAt.slice(11, 16) : "";
    const ritual = fields.createEl("button", {
      cls: `cx-health-morning-ritual${startedAt ? " is-recorded" : ""}${Date.now() < this.morningRitualAnimationUntil ? " is-activating" : ""}`,
      attr: {
        type: "button",
        "aria-pressed": String(Boolean(startedAt)),
        "aria-label": startedAt ? `已于 ${startedLabel} 迎接晨光，点击可更新时间` : "迎接晨光",
      },
    });
    const horizon = ritual.createSpan({ cls: "cx-health-morning-horizon", attr: { "aria-hidden": "true" } });
    const sun = horizon.createSpan({ cls: "cx-health-morning-sun" });
    setIcon(sun, "sunrise");
    const ritualCopy = ritual.createSpan({ cls: "cx-health-morning-copy" });
    ritualCopy.createSpan({ text: startedAt ? `晨光已至 · ${startedLabel}` : "迎接晨光", cls: "cx-health-morning-title" });
    ritualCopy.createSpan({
      text: startedAt ? "晨间身体觉察已经开启" : "从身体开始，轻轻打开今天",
      cls: "cx-health-morning-note",
    });
    ritual.addEventListener("click", () => {
      const recordedAt = localTimestamp();
      this.morningRitualAnimationUntil = Date.now() + 1400;
      ritual.addClass("is-activating");
      window.setTimeout(() => this.scheduleRender(), 1450);
      this.updateHealth(file, (next) => {
        next.health_morning_started_at = recordedAt;
      }, `晨光已至 · ${recordedAt.slice(11, 16)}`);
    });
    this.renderSignal(fields, file, frontmatter, "health_morning_sleep", "睡眠质量", HEALTH_SIGNAL_LABELS.sleep);
    this.renderSignal(fields, file, frontmatter, "health_morning_recovery", "醒来后的恢复感", HEALTH_SIGNAL_LABELS.recovery);
    this.renderSignal(fields, file, frontmatter, "health_morning_body", "身体可用状态", HEALTH_SIGNAL_LABELS.body);
    this.renderSignal(fields, file, frontmatter, "health_morning_outlook", "面对今天的感觉", HEALTH_SIGNAL_LABELS.outlook);
    this.renderChoice(fields, file, frontmatter, "health_morning_dream", "昨晚的梦境", [
      ["none", "没有印象"], ["dream", "普通梦境"], ["vivid", "明显梦境"], ["nightmare", "噩梦"],
    ]);
    this.renderMultiChoice(fields, file, frontmatter, "health_morning_regions", "身体哪里需要被看见", [
      ["shoulders", "肩颈"], ["upper_back", "上背"], ["lower_back", "下背"], ["arms", "手臂"],
      ["chest", "胸部"], ["legs", "腿部"], ["whole_body", "全身"], ["none", "无明显不适"],
    ]);
    this.renderMultiChoice(fields, file, frontmatter, "health_morning_discomfort", "身体感受", [
      ["none", "没有不适"], ["tightness", "紧绷"], ["soreness", "训练酸痛"],
    ]);
    this.renderChoice(fields, file, frontmatter, "health_morning_need", "今天最需要什么", [
      ["rest", "休息"], ["movement", "活动"], ["quiet", "安静"], ["focus", "专注"], ["connection", "连接"], ["space", "空间"],
    ]);
  }

  renderAfternoon(parent, file, frontmatter) {
    const fields = parent.createDiv({ cls: "cx-health-form-grid" });
    this.renderSignal(fields, file, frontmatter, "health_afternoon_energy_signal", "当前精力", HEALTH_SIGNAL_LABELS.energy);
    this.renderSignal(fields, file, frontmatter, "health_afternoon_calmness", "当前平稳度", HEALTH_SIGNAL_LABELS.calmness);
    this.renderSignal(fields, file, frontmatter, "health_afternoon_clarity", "当前清晰度", HEALTH_SIGNAL_LABELS.clarity);
    this.renderSignal(fields, file, frontmatter, "health_afternoon_body", "身体可用状态", HEALTH_SIGNAL_LABELS.body);
    this.renderChoice(fields, file, frontmatter, "health_afternoon_nap", "今天是否午睡", [
      ["none", "没有"], ["15-30", "15–30 分钟"], ["30-45", "30–45 分钟"], ["45-60", "45–60 分钟"], ["60+", "超过 60 分钟"],
    ]);
    this.renderMultiChoice(fields, file, frontmatter, "health_afternoon_regions", "现在仍有感觉的部位", [
      ["shoulders", "肩颈"], ["upper_back", "上背"], ["lower_back", "下背"], ["arms", "手臂"],
      ["chest", "胸部"], ["legs", "腿部"], ["whole_body", "全身"], ["none", "无明显不适"],
    ]);
    this.renderMultiChoice(fields, file, frontmatter, "health_afternoon_discomfort", "当前身体感受", [
      ["none", "没有不适"], ["tightness", "紧绷"], ["soreness", "训练酸痛"],
    ]);
    this.renderChoice(fields, file, frontmatter, "health_afternoon_preference", "现在身体最想做什么", [
      ["none", "没有特别偏好"], ["pool", "水中慢跑"], ["back", "背部"], ["upper", "上肢"],
      ["legs", "腿部"], ["stretch", "拉伸"], ["rest", "休息"],
    ]);
    this.renderTextField(fields, file, frontmatter, "health_afternoon_challenge", "今天最大的挑战（可选）", "只记录你想留下的内容");
  }

  renderEvening(parent, file, frontmatter) {
    const fields = parent.createDiv({ cls: "cx-health-form-grid" });
    this.renderSignal(fields, file, frontmatter, "health_evening_body", "此刻的身体状态", HEALTH_SIGNAL_LABELS.eveningBody);
    this.renderSignal(fields, file, frontmatter, "health_evening_overall_energy", "今日整体精力", HEALTH_SIGNAL_LABELS.energy);
    this.renderSignal(fields, file, frontmatter, "health_evening_appetite_stability", "今日整体食欲平稳度", HEALTH_SIGNAL_LABELS.appetiteStability);
    if (["active", "completed"].includes(String(frontmatter.health_workout_status || ""))) {
      this.renderSignal(fields, file, frontmatter, "health_evening_post_workout", "运动后的身体状态", HEALTH_SIGNAL_LABELS.postWorkout);
    }
    this.renderTextField(fields, file, frontmatter, "health_evening_body_note", "身体备注（可选）", "例如：肩背更松、腿部偏重、今天需要更多恢复");
  }

  renderNight(parent, file, frontmatter) {
    const fields = parent.createDiv({ cls: "cx-health-night-grid" });
    const bedtimeAt = String(frontmatter.health_night_bedtime_at || "");
    const bedtimeLabel = bedtimeAt ? bedtimeAt.slice(11, 16) : "";
    const ritual = fields.createEl("button", {
      cls: `cx-health-night-ritual${bedtimeAt ? " is-recorded" : ""}${Date.now() < this.nightRitualAnimationUntil ? " is-activating" : ""}`,
      attr: {
        type: "button",
        "aria-pressed": String(Boolean(bedtimeAt)),
        "aria-label": bedtimeAt ? `已记录准备入睡时间 ${bedtimeLabel}，点击可更新时间` : "关灯并记录准备入睡时间",
      },
    });
    const sky = ritual.createDiv({ cls: "cx-health-night-sky", attr: { "aria-hidden": "true" } });
    sky.createSpan({ cls: "cx-health-night-star is-one" });
    sky.createSpan({ cls: "cx-health-night-star is-two" });
    sky.createSpan({ cls: "cx-health-night-star is-three" });
    const moon = sky.createSpan({ cls: "cx-health-night-moon" });
    setIcon(moon, "moon-star");
    const ritualCopy = ritual.createDiv({ cls: "cx-health-night-ritual-copy" });
    ritualCopy.createSpan({ text: bedtimeAt ? `已关灯 · ${bedtimeLabel}` : "关灯 · 准备入睡", cls: "cx-health-night-ritual-title" });
    ritualCopy.createSpan({
      text: bedtimeAt ? "时间已经保存；再次点击可以更新" : "点击记录此刻，让房间慢慢安静下来",
      cls: "cx-health-night-ritual-note",
    });
    ritual.addEventListener("click", () => {
      const now = new Date();
      const targetISO = isoDateValue(frontmatter.date);
      if (
        usesHealthScheduleV2(frontmatter)
        && (targetISO !== localISO(now) || now.getHours() < 22)
      ) {
        new Notice("夜间关灯只允许在 22:00–23:59 实时记录；凌晨请使用早晨的“跨夜入睡”");
        this.stageOverride = null;
        this.renderDashboard();
        return;
      }
      const recordedAt = localTimestamp(now);
      this.nightRitualAnimationUntil = Date.now() + 1400;
      ritual.addClass("is-activating");
      window.setTimeout(() => {
        if (Date.now() >= this.nightRitualAnimationUntil) this.scheduleRender();
      }, 1450);
      this.updateHealth(file, (next) => {
        next.health_night_bedtime_at = recordedAt;
        next.health_night_completed_at = recordedAt;
      }, `晚安 · 已记录 ${recordedAt.slice(11, 16)} 准备入睡`);
    });

    this.renderSignal(fields, file, frontmatter, "health_night_sleepiness", "当前睡意", HEALTH_SIGNAL_LABELS.sleepiness);
    this.renderSignal(fields, file, frontmatter, "health_night_calmness", "精神平稳度", HEALTH_SIGNAL_LABELS.nightCalmness);
    const reasons = this.renderMultiChoice(fields, file, frontmatter, "health_night_awake_reasons", "仍未入睡的原因（可多选）", [
      ["not_sleepy", "还不困"], ["screen", "手机／娱乐"], ["work", "工作／学习"],
      ["social", "社交"], ["late_workout", "晚间运动"], ["physical_discomfort", "身体不适"],
      ["hunger_thirst", "饥饿／口渴"], ["active_mind", "普通思绪活跃"], ["anxiety", "担忧／焦虑"],
      ["panic", "恐惧／恐慌"], ["low_mood", "情绪低落"], ["rumination", "反复想着某件事"],
      ["environment", "环境影响"], ["other", "其他"],
    ]);
    reasons.addClass("cx-health-night-reasons");
  }

  renderCheckin(parent, file, frontmatter, stage, timedStage, context = {}) {
    const card = parent.createDiv({ cls: "cx-card cx-health-checkin-card" });
    this.renderedStage = timedStage;
    const scheduleV2 = usesHealthScheduleV2(frontmatter);
    const stageNames = {
      sleep: "夜间状态",
      morning: "早晨 Check-in",
      afternoon: scheduleV2 ? "白天 Check-in" : "傍晚 Check-in",
      evening: "晚间身体回顾",
    };
    const timestampKeys = {
      sleep: "health_night_completed_at",
      morning: "health_morning_completed_at",
      afternoon: "health_afternoon_completed_at",
      evening: "health_evening_completed_at",
    };
    const header = card.createDiv({ cls: "cx-health-card-header" });
    const title = header.createDiv();
    title.createEl("h2", { text: stageNames[stage] });
    const targetISO = isoDateValue(frontmatter.date) || localISO();
    title.createSpan({
      text: this.stageOverride
        ? `手动选择 · 写入 ${targetISO} Daily`
        : "时间推荐 · 输入后立即保存",
    });
    if (this.stageOverride) {
      const reset = header.createEl("button", { text: "按时间推荐", cls: "cx-button" });
      reset.addEventListener("click", () => {
        this.stageOverride = null;
        this.renderDashboard();
      });
    }

    const tracker = card.createDiv({ cls: "cx-health-stage-tracker" });
    healthStageOrder(frontmatter).forEach((item) => {
      const complete = healthStageComplete(frontmatter, item);
      const button = tracker.createEl("button", {
        cls: `cx-health-stage${item === stage ? " is-active" : ""}${complete ? " is-complete" : ""}`,
        attr: { type: "button", "aria-pressed": String(item === stage) },
      });
      const labels = { sleep: "夜间", morning: "早晨", afternoon: scheduleV2 ? "白天" : "傍晚", evening: "晚间" };
      button.createSpan({ text: labels[item] });
      button.createSpan({ text: complete ? "已记录" : item === timedStage ? "推荐" : "待记录", cls: "cx-health-stage-state" });
      button.addEventListener("click", () => {
        this.stageOverride = item;
        this.renderDashboard();
      });
    });

    const form = card.createDiv({ cls: "cx-health-form" });
    if (stage === "sleep") this.renderNight(form, file, frontmatter);
    else if (stage === "morning") this.renderMorning(form, file, frontmatter, context);
    else if (stage === "afternoon") this.renderAfternoon(form, file, frontmatter);
    else this.renderEvening(form, file, frontmatter);
    const footer = card.createDiv({ cls: "cx-health-form-footer" });
    if (stage === "sleep") {
      footer.createSpan({ text: `夜间记录写入 ${targetISO} 自然日；“关灯”保存准确时间。` });
    } else {
      footer.createSpan({ text: "不必填完；每一项都会单独保存。" });
      const actions = footer.createDiv({ cls: "cx-health-footer-actions" });
      const complete = actions.createEl("button", { text: `完成${stageNames[stage]}`, cls: "cx-button cx-button-primary" });
      complete.addEventListener("click", () => this.updateHealth(file, (next) => {
        next[timestampKeys[stage]] = localTimestamp();
      }, `${stageNames[stage]}已记录`));
    }
  }

  async selectWorkout(file, workoutId, mode, manual) {
    const current = await freshFrontmatter(this.app, file);
    const isAdditional = String(current.health_current_session_role || "") === "additional";
    if (healthPrimarySession(current) && !isAdditional) {
      new Notice("今日主训练已经完成；请使用“再加入一个训练”添加其他项目");
      return;
    }
    await this.updateHealth(file, (frontmatter) => {
      if (!isAdditional) {
        frontmatter.health_selected_workout = workoutId;
        frontmatter.health_selected_mode = mode;
        frontmatter.health_manual_override = manual;
        frontmatter.health_rotation_advance = workoutId === this.plannedWorkout;
      }
      if (frontmatter.health_workout_status === "ready") {
        frontmatter.health_workout_type = workoutId;
        frontmatter.health_workout_mode = mode;
        frontmatter.health_workout_completed_sets = [];
      }
    }, isAdditional
      ? `追加训练调整为：${healthWorkout(workoutId).label} · ${healthModeLabel(mode)}`
      : manual ? `已手动选择：${healthWorkout(workoutId).label}` : `已接受建议：${healthWorkout(workoutId).label}`);
  }

  async skipRotation(file, frontmatter) {
    if (["ready", "active", "completed", "rest"].includes(String(frontmatter.health_workout_status || ""))) {
      new Notice("训练已经开始或保存，不能再跳过本次轮换");
      return;
    }
    if (frontmatter.health_rotation_skipped === true) {
      new Notice("今天已经跳过一次轮换");
      return;
    }
    const skippedSlot = this.plannedSlot;
    const skippedWorkout = this.plannedWorkout;
    const nextSlot = (skippedSlot + 1) % HEALTH_ROTATION.length;
    this.plannedSlot = nextSlot;
    this.plannedWorkout = HEALTH_ROTATION[nextSlot];
    await this.updateHealth(file, (next) => {
      next.health_rotation_skipped = true;
      next.health_rotation_skipped_slot = skippedSlot;
      next.health_rotation_skipped_workout = skippedWorkout;
      next.health_rotation_skipped_at = localTimestamp();
      next.health_planned_rotation_slot = nextSlot;
      next.health_planned_workout = this.plannedWorkout;
      delete next.health_selected_workout;
      delete next.health_selected_mode;
      delete next.health_manual_override;
      delete next.health_rotation_advance;
    }, `已跳过${healthWorkout(skippedWorkout).label}，当前轮换为${healthWorkout(this.plannedWorkout).label}`);
  }

  renderDirection(parent, file, frontmatter, recommendation) {
    const card = parent.createDiv({ cls: "cx-card cx-health-direction-card" });
    const header = card.createDiv({ cls: "cx-health-card-header" });
    const title = header.createDiv();
    title.createEl("h2", { text: "今日身体方向" });
    const statusLabels = {
      planned: "轮换计划",
      provisional: "实时暂定",
      final: usesHealthScheduleV2(frontmatter) ? "白天确认" : "傍晚确认",
    };
    title.createSpan({ text: `${statusLabels[recommendation.status]} · 信息 ${recommendation.completeness}` });
    const primarySession = healthPrimarySession(frontmatter);
    const primaryWorkout = String(primarySession?.workout || frontmatter.health_primary_workout || frontmatter.health_selected_workout || "");
    const primaryMode = String(primarySession?.mode || frontmatter.health_primary_mode || frontmatter.health_selected_mode || "standard");
    const comparison = card.createDiv({ cls: "cx-health-direction-grid" });
    [
      ["原定训练", healthWorkout(this.plannedWorkout).label, "planned"],
      ["当前建议", `${healthWorkout(recommendation.workout).label} · ${recommendation.mode === "light" ? "轻量" : recommendation.mode === "recovery" ? "恢复" : "标准"}`, "recommended"],
      ["我的选择", primaryWorkout
        ? `${healthWorkout(primaryWorkout).label} · ${primaryMode === "light" ? "轻量" : primaryMode === "recovery" ? "恢复" : "标准"}`
        : "尚未确认", "selected"],
    ].forEach(([label, value, state]) => {
      const item = comparison.createDiv({ cls: `cx-health-direction-item is-${state}` });
      item.createSpan({ text: label, cls: "cx-health-direction-label" });
      item.createEl("strong", { text: value });
    });
    const reasons = card.createDiv({ cls: "cx-health-reasons" });
    reasons.createDiv({ text: "为什么", cls: "cx-health-field-label" });
    const list = reasons.createEl("ul");
    recommendation.reasons.slice(0, 4).forEach((reason) => list.createEl("li", { text: reason }));
    card.createDiv({
      text: primarySession
        ? "今日主训练已经完成并锁定。追加项目请在“今日训练”中使用“再加入一个训练”。"
        : "不需要提前确认；点击“开始训练”时会自动采用当时的建议。下面的选择用于手动修改。",
      cls: "cx-health-direction-hint",
    });
    const choices = card.createDiv({ cls: "cx-health-workout-choices" });
    Object.entries(HEALTH_WORKOUTS).forEach(([id, workout]) => {
      const selected = primaryWorkout === id;
      const button = choices.createEl("button", {
        text: workout.label,
        cls: `cx-health-choice${selected ? " is-selected" : ""}`,
        attr: { type: "button", title: `手动选择${workout.label}` },
      });
      button.disabled = Boolean(primarySession);
      button.addEventListener("click", () => this.selectWorkout(
        file,
        id,
        ["stretch", "rest"].includes(id) ? "recovery" : "standard",
        true,
      ));
    });
    this.renderTextField(card, file, frontmatter, "health_override_reason", "手动调整原因（选择休息时建议填写）", "例如：今天只想游泳，或今天决定完全休息");
  }

  async startWorkout(file, frontmatter, recommendation) {
    const sessions = healthWorkoutSessions(frontmatter);
    const isAdditional = String(frontmatter.health_current_session_role || "") === "additional"
      || Boolean(healthPrimarySession(frontmatter, sessions));
    const role = isAdditional ? "additional" : "primary";
    const workoutId = String(isAdditional
      ? frontmatter.health_workout_type
      : frontmatter.health_selected_workout || recommendation.workout);
    const mode = String(isAdditional
      ? frontmatter.health_workout_mode || "standard"
      : frontmatter.health_selected_mode || recommendation.mode);
    if (workoutId === "rest") {
      await this.recordRest(file);
      return;
    }
    const sessionId = `session-${Date.now()}`;
    await this.updateHealth(file, (next) => {
      if (role === "primary") {
        const source = next.health_manual_override === true
          ? "manual"
          : workoutId !== this.plannedWorkout || mode !== "standard" ? "recommended" : "planned";
        next.health_selected_workout = workoutId;
        next.health_selected_mode = mode;
        if (next.health_manual_override !== true) next.health_manual_override = false;
        next.health_rotation_advance = workoutId === this.plannedWorkout;
        next.health_primary_session_id = sessionId;
        next.health_primary_workout = workoutId;
        next.health_primary_mode = mode;
        next.health_primary_source = source;
      }
      next.health_workout_type = workoutId;
      next.health_workout_mode = mode;
      next.health_workout_status = "active";
      next.health_workout_session_id = sessionId;
      next.health_current_session_role = role;
      next.health_workout_started_at = localTimestamp();
      next.health_workout_completed_sets = [];
      delete next.health_workout_completed_at;
    }, `${healthWorkout(workoutId).label}已开始`);
  }

  async prepareAdditionalWorkout(file, workoutId) {
    const mode = healthWorkoutSupportsModes(workoutId) ? "standard" : "recovery";
    this.addingWorkout = false;
    await this.updateHealth(file, (next) => {
      next.health_workout_sessions = healthWorkoutSessions(next);
      next.health_workout_type = workoutId;
      next.health_workout_mode = mode;
      next.health_workout_status = "ready";
      next.health_current_session_role = "additional";
      next.health_workout_completed_sets = [];
      delete next.health_workout_session_id;
      delete next.health_workout_started_at;
      delete next.health_workout_completed_at;
    }, `已选择${healthWorkout(workoutId).label}，点击开始训练后才会计时`);
  }

  async toggleWorkoutSet(file, key, checked) {
    await this.updateHealth(file, (frontmatter) => {
      const values = new Set(healthArray(frontmatter.health_workout_completed_sets));
      if (checked) values.add(key);
      else values.delete(key);
      frontmatter.health_workout_completed_sets = [...values];
    });
  }

  async upsertCompletionSummary(file, frontmatter) {
    const reason = String(frontmatter.health_override_reason || "").trim();
    const sessions = healthWorkoutSessions(frontmatter);
    const details = sessions.map((session) => {
      const completed = healthArray(session.completed_sets).length;
      const total = healthSessionTotalSets(session);
      const minutes = minutesValue(session.minutes);
      return healthWorkoutIsStrength(session.workout)
        ? `${healthWorkout(session.workout).label} · ${healthModeLabel(session.mode)} · ${completed}/${total} 组${minutes !== null ? ` · ${minutes} 分钟` : ""}`
        : `${healthWorkout(session.workout).label} · ${healthModeLabel(session.mode)}${minutes !== null ? ` · ${minutes} 分钟` : ""}`;
    });
    if (!details.length && String(frontmatter.health_workout_status || "") === "rest") {
      details.push(`今日休息${reason ? ` · ${reason}` : ""}`);
    }
    if (!details.length) return;
    const marker = "<!-- castlex-health-completion -->";
    const line = `- 身体照顾 · ${details.join("；")} ${marker}`;
    await this.app.vault.process(file, (content) => {
      const lines = content.split("\n");
      const existing = lines.findIndex((item) => item.includes(marker));
      if (existing >= 0) {
        lines[existing] = line;
        return lines.join("\n");
      }
      const heading = lines.findIndex((item) => item.trim() === "## Completed Today");
      if (heading < 0) return content;
      let insertAt = heading + 1;
      while (insertAt < lines.length && (!lines[insertAt].trim() || lines[insertAt].trim().startsWith("<!--"))) insertAt += 1;
      lines.splice(insertAt, 0, line, "");
      return lines.join("\n");
    });
  }

  async finishWorkout(file) {
    const current = await freshFrontmatter(this.app, file);
    const existingSessions = healthWorkoutSessions(current);
    const started = new Date(current.health_workout_started_at);
    const elapsed = Number.isNaN(started.getTime()) ? null : Math.max(1, Math.round((Date.now() - started.getTime()) / 60000));
    const workoutId = String(current.health_workout_type || current.health_selected_workout || "pool");
    const mode = String(current.health_workout_mode || "standard");
    const sessionId = String(current.health_workout_session_id || `session-${Date.now()}`);
    const role = String(current.health_current_session_role || "") === "additional"
      || (healthPrimarySession(current, existingSessions) && String(current.health_primary_session_id || "") !== sessionId)
      ? "additional"
      : "primary";
    const plannedCounts = healthPlanSetCounts(workoutId, mode);
    const completedAt = localTimestamp();
    const session = {
      id: sessionId,
      workout: workoutId,
      mode,
      role,
      source: role === "primary" ? String(current.health_primary_source || "") : "additional",
      started_at: current.health_workout_started_at || null,
      completed_at: completedAt,
      completed_sets: healthArray(current.health_workout_completed_sets),
      total_sets: healthWorkoutIsStrength(workoutId) ? healthTotalSets(workoutId, mode) : 0,
      planned_working_sets: healthWorkoutIsStrength(workoutId) ? plannedCounts.working : 0,
      planned_warmup_sets: healthWorkoutIsStrength(workoutId) ? plannedCounts.warmup : 0,
      minutes: elapsed,
    };
    await this.updateHealth(file, (frontmatter) => {
      const sessions = healthWorkoutSessions(frontmatter)
        .filter((item) => String(item.id) !== session.id);
      sessions.push(session);
      frontmatter.health_workout_sessions = sessions;
      frontmatter.health_workout_status = "completed";
      frontmatter.health_workout_completed_at = completedAt;
      if (elapsed !== null) {
        const previousMinutes = sessions.slice(0, -1)
          .reduce((total, item) => total + (minutesValue(item.minutes) || 0), 0);
        frontmatter.workout_minutes = previousMinutes + elapsed;
        frontmatter.workout_minutes_origin = "human";
        frontmatter.time_data_reviewed = true;
      }
      if (role === "primary") {
        if (frontmatter.health_rotation_advance === true) {
          frontmatter.health_rotation_slot = this.plannedSlot;
          frontmatter.health_rotation_advanced = true;
        } else if (frontmatter.health_rotation_advanced !== true) {
          delete frontmatter.health_rotation_slot;
          frontmatter.health_rotation_advanced = false;
        }
        frontmatter.health_primary_session_id = session.id;
        frontmatter.health_primary_workout = workoutId;
        frontmatter.health_primary_mode = mode;
        frontmatter.health_selected_workout = workoutId;
        frontmatter.health_selected_mode = mode;
        frontmatter.health_actual_workout = workoutId;
        frontmatter.health_actual_workout_mode = mode;
      }
      const primary = healthPrimarySession(frontmatter, sessions);
      if (primary) {
        frontmatter.health_workout_type = String(primary.workout);
        frontmatter.health_workout_mode = String(primary.mode || "standard");
        frontmatter.health_selected_workout = String(primary.workout);
        frontmatter.health_selected_mode = String(primary.mode || "standard");
        frontmatter.health_actual_workout = String(primary.workout);
        frontmatter.health_actual_workout_mode = String(primary.mode || "standard");
        frontmatter.health_manual_override = String(primary.source || frontmatter.health_primary_source || "") === "manual";
      }
      delete frontmatter.health_current_session_role;
    }, "训练已完成");
    await this.upsertCompletionSummary(file, await freshFrontmatter(this.app, file));
    await this.renderDashboard();
  }

  async recordRest(file) {
    await this.updateHealth(file, (frontmatter) => {
      const source = frontmatter.health_manual_override === true ? "manual" : "recommended";
      frontmatter.health_selected_workout = "rest";
      frontmatter.health_selected_mode = "recovery";
      frontmatter.health_workout_type = "rest";
      frontmatter.health_actual_workout = "rest";
      frontmatter.health_actual_workout_mode = "recovery";
      frontmatter.health_primary_workout = "rest";
      frontmatter.health_primary_mode = "recovery";
      frontmatter.health_primary_source = source;
      frontmatter.health_workout_mode = "recovery";
      frontmatter.health_workout_status = "rest";
      frontmatter.health_workout_completed_at = localTimestamp();
      frontmatter.health_rotation_advanced = false;
      frontmatter.workout_minutes = 0;
      frontmatter.workout_minutes_origin = "human";
      frontmatter.time_data_reviewed = true;
      delete frontmatter.health_current_session_role;
    }, "今日已记录为休息");
    await this.upsertCompletionSummary(file, await freshFrontmatter(this.app, file));
    await this.renderDashboard();
  }

  renderWorkoutPreview(parent, workoutId, mode) {
    const template = healthWorkout(workoutId);
    const plan = healthWorkoutPlan(workoutId, mode);
    if (!plan.exercises.length) {
      const empty = parent.createDiv({ cls: "cx-health-workout-empty" });
      empty.createEl("strong", { text: plan.summary || template.purpose });
      if (plan.accessory) empty.createSpan({ text: plan.accessory });
      return;
    }
    const list = parent.createDiv({ cls: "cx-health-preview-list" });
    plan.exercises.forEach((exercise) => {
      const row = list.createDiv({ cls: "cx-health-preview-row" });
      const copy = row.createDiv();
      copy.createEl("strong", { text: exercise.label });
      copy.createSpan({ text: exercise.english });
      row.createSpan({ text: `${exercise.warmup ? "热身 1 组 + " : ""}正式 ${exercise.sets} 组 · ${exercise.reps}`, cls: "cx-health-preview-meta" });
    });
  }

  renderActiveWorkout(parent, file, frontmatter) {
    const workoutId = String(frontmatter.health_workout_type);
    const mode = String(frontmatter.health_workout_mode || "standard");
    const template = healthWorkout(workoutId);
    const plan = healthWorkoutPlan(workoutId, mode);
    const completed = new Set(healthArray(frontmatter.health_workout_completed_sets));
    const completedCounts = healthCompletedSetCounts([...completed]);
    const plannedCounts = healthPlanSetCounts(workoutId, mode);
    const total = healthTotalSets(workoutId, mode);
    const progress = total ? completed.size / total * 100 : 0;
    const header = parent.createDiv({ cls: "cx-health-workout-progress-header" });
    header.createEl("strong", { text: healthWorkoutIsStrength(workoutId) ? `已完成 ${completed.size} / ${total} 组` : `${template.label}进行中` });
    this.timerEl = header.createSpan({ text: "已进行 0m", cls: "cx-health-workout-timer" });
    this.timerEl.dataset.startedAt = String(frontmatter.health_workout_started_at || "");
    this.updateClock();
    if (healthWorkoutIsStrength(workoutId)) {
      parent.createDiv({
        text: `正式 ${completedCounts.working} / ${plannedCounts.working} · 热身 ${completedCounts.warmup} / ${plannedCounts.warmup} · ${healthModeLabel(mode)} ${mode === "light" ? "保留约 4–5 次余力" : "保留约 2–3 次余力"}`,
        cls: "cx-health-set-breakdown",
      });
    }
    const track = parent.createDiv({ cls: "cx-health-progress-track is-large" });
    const fill = track.createSpan({ cls: "cx-health-progress-fill" });
    fill.style.width = `${progress}%`;

    if (healthWorkoutIsStrength(workoutId)) {
      const exercises = parent.createDiv({ cls: "cx-health-exercise-list" });
      plan.exercises.forEach((exercise) => {
        const card = exercises.createDiv({ cls: "cx-health-exercise" });
        const exerciseHeader = card.createDiv({ cls: "cx-health-exercise-header" });
        const copy = exerciseHeader.createDiv();
        copy.createEl("strong", { text: exercise.label });
        copy.createSpan({ text: `${exercise.english} · ${exercise.reps}` });
        const setRows = card.createDiv({ cls: "cx-health-set-list" });
        const rows = [];
        if (exercise.warmup) rows.push(["warmup", "热身组"]);
        for (let index = 1; index <= exercise.sets; index += 1) rows.push([`set_${index}`, `第 ${index} 组`]);
        rows.forEach(([setId, label]) => {
          const key = `${exercise.id}:${setId}`;
          const row = setRows.createEl("label", { cls: `cx-health-set${completed.has(key) ? " is-complete" : ""}` });
          const checkbox = row.createEl("input", { attr: { type: "checkbox" } });
          checkbox.checked = completed.has(key);
          row.createSpan({ text: label, cls: "cx-health-set-label" });
          checkbox.addEventListener("change", () => this.toggleWorkoutSet(file, key, checkbox.checked));
        });
      });
    } else {
      const empty = parent.createDiv({ cls: "cx-health-workout-empty" });
      empty.createEl("strong", { text: plan.summary || template.purpose });
      if (plan.accessory) empty.createSpan({ text: plan.accessory });
      empty.createSpan({ text: "使用开始与结束时间记录，不设置分段 checkbox。" });
    }
    const actions = parent.createDiv({ cls: "cx-health-workout-actions" });
    const finish = actions.createEl("button", { text: "完成训练", cls: "cx-button cx-button-primary" });
    finish.addEventListener("click", () => this.finishWorkout(file));
  }

  renderSessionHistory(parent, sessions) {
    if (!sessions.length) return;
    const section = parent.createDiv({ cls: "cx-health-session-history" });
    section.createDiv({ text: `今日已完成 · ${sessions.length} 项`, cls: "cx-health-field-label" });
    const list = section.createDiv({ cls: "cx-health-session-list" });
    sessions.forEach((session) => {
      const item = list.createDiv({ cls: "cx-health-session-item" });
      const header = item.createDiv({ cls: "cx-health-session-header" });
      header.createEl("strong", {
        text: `${session.role === "primary" ? "主训练" : "追加"} · ${healthWorkout(session.workout).label} · ${healthModeLabel(session.mode)}`,
      });
      const completedAt = String(session.completed_at || "");
      header.createSpan({ text: completedAt ? completedAt.slice(11, 16) : "" });
      const completed = healthArray(session.completed_sets).length;
      const completedCounts = healthCompletedSetCounts(session.completed_sets);
      const plannedCounts = healthSessionSetCounts(session);
      const total = healthSessionTotalSets(session);
      const minutes = minutesValue(session.minutes);
      item.createSpan({
        text: healthWorkoutIsStrength(session.workout)
          ? `${completed} / ${total} 组 · 正式 ${completedCounts.working}/${plannedCounts.working} · 热身 ${completedCounts.warmup}/${plannedCounts.warmup}${minutes !== null ? ` · ${minutes} 分钟` : ""}`
          : `${minutes !== null ? `${minutes} 分钟` : "已完成"}`,
        cls: "cx-health-session-meta",
      });
      if (healthWorkoutIsStrength(session.workout)) {
        const track = item.createDiv({ cls: "cx-health-progress-track" });
        const fill = track.createSpan({ cls: "cx-health-progress-fill" });
        fill.style.width = `${total ? completed / total * 100 : 0}%`;
      }
    });
  }

  renderAdditionalWorkoutPicker(parent, file) {
    const picker = parent.createDiv({ cls: "cx-health-add-workout" });
    picker.createDiv({ text: "选择追加训练", cls: "cx-health-field-label" });
    picker.createSpan({ text: "会计入今日总时长，但不会改变已经完成的主训练和“我的选择”。" });
    const choices = picker.createDiv({ cls: "cx-health-workout-choices" });
    ["pool", "back", "upper", "legs", "stretch"].forEach((id) => {
      const button = choices.createEl("button", {
        text: healthWorkout(id).label,
        cls: "cx-health-choice",
        attr: { type: "button" },
      });
      button.addEventListener("click", () => this.prepareAdditionalWorkout(file, id));
    });
  }

  renderWorkoutModeSelector(parent, file, workoutId, mode) {
    if (!healthWorkoutSupportsModes(workoutId)) return;
    const selector = parent.createDiv({ cls: "cx-health-mode-selector" });
    selector.createSpan({ text: "训练模式", cls: "cx-health-field-label" });
    const choices = selector.createDiv({ cls: "cx-health-mode-choices" });
    ["standard", "light"].forEach((nextMode) => {
      const button = choices.createEl("button", {
        cls: `cx-health-mode-choice${mode === nextMode ? " is-selected" : ""}`,
        attr: { type: "button", "aria-pressed": String(mode === nextMode) },
      });
      button.createEl("strong", { text: nextMode === "standard" ? "Standard" : "Light" });
      button.addEventListener("click", () => this.selectWorkout(file, workoutId, nextMode, true));
    });
  }

  renderWorkout(parent, file, frontmatter, recommendation) {
    const card = parent.createDiv({ cls: "cx-card cx-health-workout-card" });
    const status = String(frontmatter.health_workout_status || "");
    const sessions = healthWorkoutSessions(frontmatter);
    const workoutId = String(frontmatter.health_workout_type || frontmatter.health_selected_workout || recommendation.workout);
    const mode = String(frontmatter.health_workout_mode || frontmatter.health_selected_mode || recommendation.mode);
    const header = card.createDiv({ cls: "cx-health-card-header" });
    const title = header.createDiv();
    title.createEl("h2", { text: status === "active" ? "Workout Mode" : status === "ready" ? "准备训练" : "今日训练" });
    title.createSpan({ text: `${healthWorkout(workoutId).label} · ${mode === "light" ? "轻量模式" : mode === "recovery" ? "恢复模式" : "标准模式"}` });
    if (sessions.length) this.renderSessionHistory(card, sessions);
    if (status === "active") {
      this.renderActiveWorkout(card, file, frontmatter);
      return;
    }
    if (status === "completed" || status === "rest") {
      if (!sessions.length) {
        const complete = card.createDiv({ cls: "cx-health-workout-complete" });
        complete.createEl("strong", { text: "今天选择休整" });
        complete.createSpan({ text: frontmatter.health_workout_completed_at ? `记录于 ${String(frontmatter.health_workout_completed_at).slice(11, 16)}` : "" });
      }
      const actions = card.createDiv({ cls: "cx-health-workout-actions" });
      const add = actions.createEl("button", { text: "再加入一个训练", cls: "cx-button cx-button-primary" });
      add.addEventListener("click", () => {
        this.addingWorkout = !this.addingWorkout;
        this.renderDashboard();
      });
      if (this.addingWorkout) this.renderAdditionalWorkoutPicker(card, file);
      return;
    }
    card.createDiv({ text: healthWorkout(workoutId).purpose, cls: "cx-health-workout-purpose" });
    this.renderWorkoutModeSelector(card, file, workoutId, mode);
    this.renderWorkoutPreview(card, workoutId, mode);
    const actions = card.createDiv({ cls: "cx-health-workout-actions" });
    const start = actions.createEl("button", {
      text: workoutId === "rest" ? "记录今日休息" : "开始训练",
      cls: "cx-button cx-button-primary",
    });
    start.addEventListener("click", () => this.startWorkout(file, frontmatter, recommendation));
  }

  renderTrends(parent, pages) {
    const card = parent.createDiv({ cls: "cx-card cx-health-trend-card" });
    const header = card.createDiv({ cls: "cx-health-card-header" });
    const title = header.createDiv();
    title.createEl("h2", { text: "最近 7 日身体趋势" });
    title.createSpan({ text: "仅使用 Health Dashboard 独立字段" });
    const recent = pages.filter((page) => isoDateValue(page.frontmatter.date) <= localISO()).slice(-7);
    const rows = card.createDiv({ cls: "cx-health-trend-rows" });
    recent.forEach((page) => {
      const fm = page.frontmatter;
      const row = rows.createDiv({ cls: "cx-health-trend-row" });
      row.createSpan({ text: String(isoDateValue(fm.date)).slice(5).replace("-", "/"), cls: "cx-health-trend-date" });
      [
        ["睡眠", healthSignal(fm.health_morning_sleep), 5],
        ["恢复", healthSignal(fm.health_morning_recovery), 5],
        ["精力", healthAfternoonEnergy(fm), 5],
      ].forEach(([label, value, maximum]) => {
        const metric = row.createDiv({ cls: "cx-health-trend-metric" });
        metric.createSpan({ text: label });
        const track = metric.createDiv({ cls: "cx-health-mini-track" });
        const fill = track.createSpan();
        fill.style.width = `${value === null ? 0 : value / maximum * 100}%`;
      });
    });
    if (!recent.length) rows.createDiv({ text: "尚无 Health 数据", cls: "cx-empty" });
  }

  renderRotation(parent, file, frontmatter) {
    const card = parent.createDiv({ cls: "cx-card cx-health-rotation-card" });
    const header = card.createDiv({ cls: "cx-health-card-header" });
    const title = header.createDiv();
    title.createEl("h2", { text: "训练轮换" });
    title.createSpan({ text: "临时改做游泳、拉伸或休息，不推进原定轮换" });
    const alreadySkipped = frontmatter.health_rotation_skipped === true;
    const canSkip = !["ready", "active", "completed", "rest"].includes(String(frontmatter.health_workout_status || ""));
    const skip = header.createEl("button", {
      text: alreadySkipped
        ? `已跳过 ${healthWorkout(frontmatter.health_rotation_skipped_workout).shortLabel}`
        : `跳过当前 ${healthWorkout(this.plannedWorkout).shortLabel}`,
      cls: "cx-button",
      attr: { type: "button" },
    });
    skip.disabled = !canSkip || alreadySkipped;
    skip.addEventListener("click", () => this.skipRotation(file, frontmatter));
    const route = card.createDiv({ cls: "cx-health-rotation-route" });
    const skippedSlot = alreadySkipped ? healthRotationSlot(frontmatter.health_rotation_skipped_slot) : null;
    HEALTH_ROTATION.forEach((id, index) => {
      const item = route.createDiv({
        cls: `cx-health-rotation-node${index === this.plannedSlot ? " is-current" : ""}${index === skippedSlot ? " is-skipped" : ""}`,
      });
      item.createSpan({ text: healthWorkout(id).shortLabel, cls: "cx-health-rotation-name" });
      item.createSpan({
        text: index === this.plannedSlot ? "当前" : index === skippedSlot ? "已跳过" : String(index + 1),
        cls: "cx-health-rotation-index",
      });
    });
  }

  async renderDashboard() {
    const now = new Date();
    this.currentDateISO = localISO(now);
    const timedStage = healthStageForTime(now);
    const stage = this.stageOverride || timedStage;
    const todayFile = await this.ensureDaily(now);
    if (!(todayFile instanceof TFile)) {
      this.renderSyncPending(now);
      return;
    }
    const pages = this.dailyPages();
    let frontmatter = await freshFrontmatter(this.app, todayFile);
    frontmatter = await this.removeLegacyAfternoonBodyChange(todayFile, frontmatter);
    frontmatter = await this.initializePlannedWorkout(todayFile, frontmatter, pages);
    frontmatter = await this.normalizePrimaryWorkout(todayFile, frontmatter);
    const recommendation = healthRecommendation(frontmatter, this.plannedWorkout, now);
    const previousISO = localISO(addDays(now, -1));
    const previousNightRecorded = pages.some((page) => (
      isoDateValue(page.frontmatter.date) === previousISO
      && Boolean(page.frontmatter.health_night_bedtime_at)
    ));
    const scrollPosition = this.captureScrollPosition();
    const dashboard = this.createCanvas();
    this.renderHeader(dashboard);
    const main = dashboard.createDiv({ cls: "cx-health-main-grid" });
    this.renderCheckin(main, todayFile, frontmatter, stage, timedStage, { previousNightRecorded });
    this.renderDirection(main, todayFile, frontmatter, recommendation);
    this.renderWorkout(dashboard, todayFile, frontmatter, recommendation);
    const insights = dashboard.createDiv({ cls: "cx-health-insights-grid" });
    const trendPages = pages
      .filter((page) => isoDateValue(page.frontmatter.date) !== this.currentDateISO);
    trendPages.push({ file: todayFile, frontmatter });
    trendPages.sort((a, b) => String(isoDateValue(a.frontmatter.date)).localeCompare(String(isoDateValue(b.frontmatter.date))));
    this.renderTrends(insights, trendPages);
    this.renderRotation(insights, todayFile, frontmatter);
    dashboard.createDiv({
      cls: "cx-mobile-scroll-spacer",
      attr: { "aria-hidden": "true" },
    });
    this.renderedDateISO = this.currentDateISO;
    this.restoreScrollPosition(scrollPosition);
  }
}

class CastleXMentalView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.currentDateISO = localISO();
    this.targetOverrideISO = null;
    this.renderTimer = null;
    this.writeQueue = Promise.resolve();
    this.suppressRenderUntil = 0;
  }

  getViewType() {
    return MENTAL_VIEW_TYPE;
  }

  getDisplayText() {
    return "Mental Dashboard";
  }

  getIcon() {
    return "cloud-moon";
  }

  async onOpen() {
    this.contentEl.addClass("castlex-mental-view");
    this.registerEvent(this.app.metadataCache.on("changed", () => this.scheduleRender()));
    this.registerEvent(this.app.vault.on("modify", () => this.scheduleRender()));
    this.registerInterval(window.setInterval(() => this.updateClock(), 30000));
    await this.renderDashboard();
  }

  async onClose() {
    if (this.renderTimer) window.clearTimeout(this.renderTimer);
  }

  scheduleRender() {
    if (Date.now() < this.suppressRenderUntil) return;
    if (this.renderTimer) window.clearTimeout(this.renderTimer);
    this.renderTimer = window.setTimeout(() => this.renderDashboard(), 280);
  }

  updateClock() {
    const now = new Date();
    if (this.clockEl) {
      this.clockEl.setText(new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now));
    }
    const todayISO = localISO(now);
    if (todayISO !== this.currentDateISO) {
      this.currentDateISO = todayISO;
      this.scheduleRender();
    }
  }

  async openVoyage(iso = null) {
    this.targetOverrideISO = isoDateValue(iso);
    await this.renderDashboard();
  }

  async ensureFolder(path) {
    const normalized = normalizePath(path);
    if (this.app.vault.getAbstractFileByPath(normalized)) return;
    const parts = normalized.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current);
    }
  }

  dailyPath(date = new Date()) {
    return `${DAILY_ROOT}/${date.getFullYear()}/${pad(date.getMonth() + 1)}/${localISO(date)}.md`;
  }

  async createDailyContent(date) {
    const iso = localISO(date);
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
    const templatePath = "90_System/Templates/010-Daily-Dashboard.md";
    const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
    if (!(templateFile instanceof TFile)) throw new Error(`Missing Daily template: ${templatePath}`);
    let content = await this.app.vault.cachedRead(templateFile);
    [
      ["{{date:YYYY-MM-DD · dddd}}", `${iso} · ${weekday}`],
      ["{{date:gggg-[W]ww}}", isoWeek(date)],
      ["{{date:YYYY-MM-DD}}", iso],
      ["{{date:YYYY-MM}}", iso.slice(0, 7)],
      ["{{date:dddd}}", weekday],
    ].forEach(([token, value]) => {
      content = content.split(token).join(value);
    });
    return content;
  }

  async ensureDaily(date = new Date(), options = {}) {
    const path = this.dailyPath(date);
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) return existing;
    const allowCreate = options.allowCreate ?? !Platform.isMobile;
    if (!allowCreate) return null;
    const pending = this.plugin.dailyCreationPromises.get(path);
    if (pending) return pending;
    const creation = (async () => {
      await this.ensureFolder(path.split("/").slice(0, -1).join("/"));
      const afterFolder = this.app.vault.getAbstractFileByPath(path);
      if (afterFolder instanceof TFile) return afterFolder;
      try {
        return await this.app.vault.create(path, await this.createDailyContent(date));
      } catch (error) {
        const concurrent = this.app.vault.getAbstractFileByPath(path);
        if (concurrent instanceof TFile) return concurrent;
        throw error;
      }
    })();
    this.plugin.dailyCreationPromises.set(path, creation);
    try {
      return await creation;
    } finally {
      this.plugin.dailyCreationPromises.delete(path);
    }
  }

  dailyPages() {
    const pages = this.app.vault.getMarkdownFiles()
      .filter((file) => file.path.startsWith(`${DAILY_ROOT}/`))
      .map((file) => ({ file, frontmatter: this.app.metadataCache.getFileCache(file)?.frontmatter ?? {} }))
      .filter((page) => page.frontmatter.type === "daily" && page.frontmatter.date);
    const byDate = new Map();
    pages.forEach((page) => {
      const iso = isoDateValue(page.frontmatter.date);
      if (!iso) return;
      const canonicalPath = dailyPathFromISO(iso);
      const current = byDate.get(iso);
      const pageCanonical = page.file.path === canonicalPath;
      const currentCanonical = current?.file.path === canonicalPath;
      if (!current || (pageCanonical && !currentCanonical) || (!currentCanonical && page.file.stat.mtime > current.file.stat.mtime)) {
        byDate.set(iso, page);
      }
    });
    return [...byDate.values()].sort((a, b) => String(a.frontmatter.date).localeCompare(String(b.frontmatter.date)));
  }

  async updateMental(file, mutator, notice = "", options = {}) {
    if (options.rerender === false) this.suppressRenderUntil = Date.now() + 1200;
    const write = async () => {
      await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        mutator(frontmatter);
        if (!frontmatter.mental_evening_recorded_at) frontmatter.mental_evening_recorded_at = localTimestamp();
      });
      if (notice) new Notice(notice);
    };
    this.writeQueue = this.writeQueue.then(write, write);
    await this.writeQueue;
    if (options.rerender !== false) await this.renderDashboard();
  }

  createCanvas() {
    this.contentEl.empty();
    this.contentEl.addClass("castlex-mental-view");
    const shell = this.contentEl.createDiv({ cls: "cx-shell cx-mental-shell" });
    const desktopAsset = this.app.vault.getAbstractFileByPath(MENTAL_DESKTOP_ASSET_PATH);
    const mobileAsset = this.app.vault.getAbstractFileByPath(MENTAL_MOBILE_ASSET_PATH);
    if (desktopAsset instanceof TFile) shell.style.setProperty("--cx-background-desktop", `url("${this.app.vault.getResourcePath(desktopAsset)}")`);
    if (mobileAsset instanceof TFile) shell.style.setProperty("--cx-background-mobile", `url("${this.app.vault.getResourcePath(mobileAsset)}")`);
    shell.createDiv({ cls: "cx-background-layer cx-mental-background-layer", attr: { "aria-hidden": "true" } });
    return shell.createDiv({ cls: "cx-mental-dashboard-content" });
  }

  renderSyncPending(date) {
    const dashboard = this.createCanvas();
    const card = dashboard.createDiv({ cls: "cx-card cx-daily-sync-pending" });
    card.createEl("h2", { text: `${localISO(date)} Daily 尚未同步` });
    card.createEl("p", { text: "Mental Dashboard 不会在手机上创建第二份 Daily。请等待 iCloud，或确认在本机创建。" });
    const actions = card.createDiv({ cls: "cx-daily-sync-actions" });
    const home = actions.createEl("button", { text: "返回 CastleX Home", cls: "cx-button" });
    home.addEventListener("click", () => this.plugin.activateView());
    const retry = actions.createEl("button", { text: "重新检查", cls: "cx-button cx-button-primary" });
    retry.addEventListener("click", () => this.renderDashboard());
    const create = actions.createEl("button", { text: "确认在本机创建", cls: "cx-button" });
    create.addEventListener("click", async () => {
      await this.ensureDaily(date, { allowCreate: true });
      await this.renderDashboard();
    });
  }

  renderHeader(parent, targetISO, frontmatter) {
    const hero = parent.createDiv({ cls: "cx-mental-hero cx-glass" });
    const copy = hero.createDiv({ cls: "cx-mental-hero-copy" });
    const targetDate = dateFromISO(targetISO) ?? new Date();
    copy.createEl("p", {
      text: new Intl.DateTimeFormat("zh-CN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      }).format(targetDate),
      cls: "cx-overline cx-mental-date",
    });
    this.clockEl = copy.createDiv({ cls: "cx-mental-clock" });
    this.updateClock();
    const voyageLabel = `${targetDate.getMonth() + 1}月${targetDate.getDate()}日航程`;
    const startedAt = String(frontmatter.voyage_started_at || "");
    const endedAt = String(frontmatter.voyage_ended_at || "");
    if (startedAt) {
      copy.createEl("p", {
        text: endedAt ? voyageLabel : `正在收束 ${voyageLabel}`,
        cls: "cx-mental-voyage-date",
      });
      if (endedAt) {
        copy.createDiv({
          text: `已于 ${endedAt.slice(11, 16)} 结束今日航程`,
          cls: "cx-mental-ended-status",
        });
      }
    }
    copy.createDiv({ text: "用舍由时，行藏在我。", cls: "cx-mental-signature" });
    const actions = hero.createDiv({ cls: "cx-hero-actions cx-dashboard-hero-actions" });
    const daily = actions.createEl("button", { text: "今日 Daily", cls: "cx-button" });
    daily.addEventListener("click", async () => {
      const path = dailyPathFromISO(targetISO);
      const file = path ? this.app.vault.getAbstractFileByPath(path) : null;
      if (file instanceof TFile) await this.app.workspace.getLeaf("tab").openFile(file);
    });
    const health = actions.createEl("button", { text: "Health Dashboard", cls: "cx-button" });
    health.addEventListener("click", () => this.plugin.activateHealthView());
    const home = actions.createEl("button", { text: "CastleX Home", cls: "cx-button cx-button-primary" });
    home.addEventListener("click", () => this.plugin.activateView());
    if (endedAt) {
      hero.addClass("is-ended");
    }
  }

  renderMetric(parent, file, frontmatter, metric) {
    let value = mentalDisplayValue(metric, frontmatter[metric.key]);
    const card = parent.createDiv({ cls: `cx-mental-metric${value !== null ? " is-recorded" : ""}` });
    const heading = card.createDiv({ cls: "cx-mental-metric-heading" });
    const copy = heading.createDiv();
    copy.createEl("strong", { text: metric.label });
    copy.createSpan({ text: metric.hint });
    const star = card.createDiv({
      cls: `cx-mental-star-light${value === null ? " is-unrecorded" : ""}`,
      attr: { role: "group", "aria-label": `${metric.label}尚未记录` },
    });
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    const petals = [];
    const point = (angle, radius) => {
      const radians = angle * Math.PI / 180;
      return `${50 + Math.cos(radians) * radius} ${50 + Math.sin(radians) * radius}`;
    };
    for (let index = 0; index < 5; index += 1) {
      const outerAngle = -90 + index * 72;
      const petal = document.createElementNS(namespace, "path");
      petal.setAttribute(
        "d",
        `M50 50 L${point(outerAngle - 36, 20)} L${point(outerAngle, 43)} L${point(outerAngle + 36, 20)} Z`,
      );
      petal.setAttribute("class", "cx-mental-star-petal");
      petal.setAttribute("role", "button");
      petal.setAttribute("tabindex", "0");
      petal.setAttribute("aria-label", `${metric.label}：${metric.choices[index]}`);
      petal.setAttribute("data-level", String(index + 1));
      svg.appendChild(petal);
      petals.push(petal);
    }
    star.appendChild(svg);
    const valueLabel = card.createSpan({
      text: value === null ? "尚未记录" : metric.choices[value - 1],
      cls: "cx-mental-metric-value",
    });

    const syncVisual = (nextValue) => {
      const recorded = nextValue !== null;
      star.classList.toggle("is-unrecorded", !recorded);
      card.classList.toggle("is-recorded", recorded);
      petals.forEach((petal, index) => {
        petal.classList.toggle("is-lit", recorded && index < nextValue);
        petal.setAttribute("aria-pressed", String(recorded && index + 1 === nextValue));
      });
      valueLabel.setText(recorded ? metric.choices[nextValue - 1] : "尚未记录");
      star.setAttribute("aria-label", recorded
        ? `${metric.label}：${metric.choices[nextValue - 1]}，点亮 ${nextValue} 瓣`
        : `${metric.label}尚未记录`);
    };
    syncVisual(value);

    const commit = (nextValue) => {
      if (value === nextValue) return;
      value = nextValue;
      syncVisual(nextValue);
      this.updateMental(file, (next) => {
        next[metric.key] = mentalStoredValue(metric, nextValue);
      }, `${metric.label}：${metric.choices[nextValue - 1]}`, { rerender: false });
    };
    petals.forEach((petal, index) => {
      const nextValue = index + 1;
      petal.addEventListener("click", () => commit(nextValue));
      petal.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        commit(nextValue);
      });
    });
  }

  renderMetrics(parent, file, frontmatter) {
    const section = parent.createDiv({ cls: "cx-mental-metrics-section cx-glass" });
    const heading = section.createDiv({ cls: "cx-mental-section-heading" });
    heading.createEl("h2", { text: "今夜状态" });
    const metrics = section.createDiv({ cls: "cx-mental-metrics" });
    MENTAL_METRICS.forEach((metric) => this.renderMetric(metrics, file, frontmatter, metric));
  }

  renderWind(parent, file, frontmatter) {
    const section = parent.createDiv({ cls: "cx-mental-context-section cx-glass" });
    const heading = section.createDiv({ cls: "cx-mental-section-heading" });
    heading.createEl("h2", { text: "今日风向" });
    heading.createSpan({ text: "可选记录，不需要为了完整而勉强回答" });
    const rows = section.createDiv({ cls: "cx-mental-wind-rows" });
    [
      {
        key: "mental_evening_stress_source",
        choices: MENTAL_STRESS_SOURCES,
        title: "逆风来源",
        hint: "今天主要是什么增加了心理重量",
        icon: "compass",
        selected: [String(frontmatter.mental_evening_stress_source || "")].filter(Boolean),
        maximum: 1,
      },
      {
        key: "mental_evening_emotions",
        choices: MENTAL_EMOTIONS,
        title: "主要心绪",
        hint: "此刻最接近的感受，最多两项",
        icon: "cloud-moon",
        selected: healthArray(frontmatter.mental_evening_emotions),
        maximum: 2,
      },
      {
        key: "mental_evening_relief_factors",
        choices: MENTAL_RELIEF_FACTORS,
        title: "靠岸帮助",
        hint: "今天什么让我获得了一点空间，最多两项",
        icon: "anchor",
        selected: healthArray(frontmatter.mental_evening_relief_factors),
        maximum: 2,
      },
    ].forEach((row) => {
      const rowEl = rows.createDiv({ cls: "cx-mental-wind-row" });
      const copy = rowEl.createDiv({ cls: "cx-mental-wind-row-copy" });
      const icon = copy.createSpan({ cls: "cx-mental-wind-row-icon" });
      setIcon(icon, row.icon);
      const text = copy.createDiv();
      text.createEl("strong", { text: row.title });
      text.createSpan({ text: row.hint });
      const options = rowEl.createDiv({ cls: "cx-mental-wind-options" });
      const selected = new Set(row.selected);
      const optionButtons = new Map();
      const syncButtons = () => {
        optionButtons.forEach((button, value) => {
          button.classList.toggle("is-selected", selected.has(value));
          button.setAttr("aria-pressed", String(selected.has(value)));
        });
      };
      row.choices.forEach(([value, label]) => {
        const button = options.createEl("button", {
          text: label,
          cls: `cx-mental-chip${selected.has(value) ? " is-selected" : ""}`,
          attr: { type: "button", "aria-pressed": String(selected.has(value)) },
        });
        optionButtons.set(value, button);
        button.addEventListener("click", () => {
          if (row.maximum === 1) {
            const wasSelected = selected.has(value);
            selected.clear();
            if (!wasSelected) selected.add(value);
            syncButtons();
            const snapshot = wasSelected ? "" : value;
            this.updateMental(file, (next) => {
              if (snapshot) next[row.key] = snapshot;
              else delete next[row.key];
            }, "", { rerender: false });
            return;
          }
          if (!selected.has(value) && selected.size >= row.maximum) {
            new Notice(`${row.title}最多选择 ${row.maximum} 项`);
            return;
          }
          if (selected.has(value)) selected.delete(value);
          else {
            if (value === "none") selected.clear();
            else selected.delete("none");
            selected.add(value);
          }
          syncButtons();
          const snapshot = [...selected];
          this.updateMental(file, (next) => {
            next[row.key] = snapshot;
          }, "", { rerender: false });
        });
      });
    });
  }

  renderClosure(parent, file, frontmatter) {
    const selected = String(frontmatter.mental_evening_closure || "");
    const card = parent.createDiv({ cls: `cx-mental-closure-card cx-glass${selected ? ` is-${selected}` : ""}` });
    card.createEl("h2", { text: "今天要如何安放" });
    card.createEl("p", { text: "这不是评价，只是为今天选择一个暂时的位置。" });
    const choices = card.createDiv({ cls: "cx-mental-closure-grid" });
    const buttons = [];
    MENTAL_CLOSURES.forEach(([value, label, metaphor, iconType]) => {
      const button = choices.createEl("button", {
        cls: `cx-mental-closure-choice is-${value}${selected === value ? " is-selected" : ""}`,
        attr: { type: "button", "aria-pressed": String(selected === value) },
      });
      const icon = button.createSpan({ cls: `cx-mental-closure-icon is-${iconType}`, attr: { "aria-hidden": "true" } });
      if (iconType === "files") {
        icon.createSpan({ cls: "cx-mental-static-paper is-back" });
        icon.createSpan({ cls: "cx-mental-static-paper is-front" });
      } else if (iconType === "envelope") {
        icon.createSpan({ cls: "cx-mental-static-envelope-paper" });
        icon.createSpan({ cls: "cx-mental-static-envelope-body" });
        icon.createSpan({ cls: "cx-mental-static-envelope-flap" });
      } else {
        setIcon(icon, "plane");
      }
      const copy = button.createSpan({ cls: "cx-mental-closure-choice-copy" });
      copy.createEl("strong", { text: label });
      copy.createSpan({ text: metaphor });
      buttons.push([button, value]);
      button.addEventListener("click", () => {
        card.classList.remove("is-active", "is-shelved", "is-released");
        card.addClass(`is-${value}`);
        buttons.forEach(([candidate, candidateValue]) => {
          candidate.classList.toggle("is-selected", candidateValue === value);
          candidate.setAttr("aria-pressed", String(candidateValue === value));
        });
        this.updateMental(file, (next) => {
          next.mental_evening_closure = value;
        }, "", { rerender: false });
      });
    });
    return card;
  }

  async finishVoyage(file) {
    const endedAt = localTimestamp();
    await this.updateMental(file, (frontmatter) => {
      if (!frontmatter.voyage_ended_at) frontmatter.voyage_ended_at = endedAt;
      if (!frontmatter.mental_evening_completed_at) frontmatter.mental_evening_completed_at = endedAt;
    }, "今日航程已结束");
  }

  renderFinish(parent, file, frontmatter) {
    const card = parent.createDiv({ cls: `cx-mental-finish-card cx-glass${frontmatter.voyage_ended_at ? " is-ended" : ""}` });
    if (frontmatter.voyage_ended_at) {
      const icon = card.createSpan({ cls: "cx-mental-finish-icon" });
      setIcon(icon, "book-check");
      card.createEl("h2", { text: "今日航程已结束" });
      card.createEl("p", { text: "日志已经合上。接下来只需要照顾自己，然后准备休息。" });
      const healthStage = healthPostVoyageStage(new Date());
      const health = card.createEl("button", {
        text: healthStage === "morning" ? "前往早晨状态" : "前往夜间状态",
        cls: "cx-button cx-button-primary",
      });
      health.addEventListener("click", () => this.plugin.activateHealthView(healthStage));
      return;
    }
    card.createEl("h2", { text: "结束今日航程" });
    card.createEl("p", {
      text: frontmatter.voyage_started_at
        ? "按住一秒，让今天的工作航程停在这里。"
        : "今天没有记录起航时间；仍然可以收束今天。",
    });
    const button = card.createEl("button", {
      cls: "cx-mental-finish-button",
      attr: { type: "button", "aria-label": "按住一秒结束今日航程" },
    });
    const icon = button.createSpan();
    setIcon(icon, "book-marked");
    button.createSpan({ text: "按住 · 结束今日航程" });
    let timer = null;
    let finished = false;
    const cancel = () => {
      if (timer) window.clearTimeout(timer);
      timer = null;
      button.removeClass("is-holding");
    };
    const begin = () => {
      if (timer || finished) return;
      button.addClass("is-holding");
      timer = window.setTimeout(async () => {
        timer = null;
        finished = true;
        button.removeClass("is-holding");
        await this.finishVoyage(file);
      }, 900);
    };
    button.addEventListener("pointerdown", begin);
    button.addEventListener("pointerup", cancel);
    button.addEventListener("pointerleave", cancel);
    button.addEventListener("pointercancel", cancel);
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.finishVoyage(file);
      }
    });
  }

  renderAmbiguous(parent, lifecycle) {
    const card = parent.createDiv({ cls: "cx-card cx-mental-target-card" });
    card.createEl("h2", { text: "请选择要收束的航程" });
    card.createEl("p", { text: "最近24小时内有多个未结束航程。CastleX 不会自动猜测目标日期。" });
    const choices = card.createDiv({ cls: "cx-mental-target-choices" });
    lifecycle.recentOpen.forEach((page) => {
      const iso = isoDateValue(page.frontmatter.date);
      const button = choices.createEl("button", { text: `${iso} · ${String(page.frontmatter.voyage_started_at).slice(11, 16)} 起航`, cls: "cx-button" });
      button.addEventListener("click", () => {
        this.targetOverrideISO = iso;
        this.renderDashboard();
      });
    });
  }

  async renderDashboard() {
    const now = new Date();
    this.currentDateISO = localISO(now);
    let pages = this.dailyPages();
    let lifecycle = voyageLifecycle(pages, now);
    if (!this.targetOverrideISO && lifecycle.ambiguous) {
      const dashboard = this.createCanvas();
      this.renderAmbiguous(dashboard, lifecycle);
      return;
    }
    let targetPage = this.targetOverrideISO
      ? pages.find((page) => isoDateValue(page.frontmatter.date) === this.targetOverrideISO)
      : lifecycle.active || lifecycle.latestEnded || lifecycle.today;
    if (!targetPage) {
      const todayFile = await this.ensureDaily(now);
      if (!(todayFile instanceof TFile)) {
        this.renderSyncPending(now);
        return;
      }
      targetPage = { file: todayFile, frontmatter: await freshFrontmatter(this.app, todayFile) };
      pages = [...pages, targetPage];
      lifecycle = voyageLifecycle(pages, now);
    } else {
      targetPage = { file: targetPage.file, frontmatter: await freshFrontmatter(this.app, targetPage.file) };
    }
    const targetISO = isoDateValue(targetPage.frontmatter.date) || this.currentDateISO;
    const dashboard = this.createCanvas();
    this.renderHeader(dashboard, targetISO, targetPage.frontmatter);
    this.renderMetrics(dashboard, targetPage.file, targetPage.frontmatter);
    this.renderWind(dashboard, targetPage.file, targetPage.frontmatter);
    this.renderClosure(dashboard, targetPage.file, targetPage.frontmatter);
    this.renderFinish(dashboard, targetPage.file, targetPage.frontmatter);
    dashboard.createDiv({ cls: "cx-mobile-scroll-spacer", attr: { "aria-hidden": "true" } });
  }
}

module.exports = class CastleXDashboardPlugin extends Plugin {
  async onload() {
    this.mobileHomeButton = null;
    this.dailyCreationPromises = new Map();
    this.pluginData = await this.loadData() ?? {};
    this.pluginData.leetcodeTimers = this.pluginData.leetcodeTimers && typeof this.pluginData.leetcodeTimers === "object"
      ? this.pluginData.leetcodeTimers
      : {};
    this.leetcodeDataWriteQueue = Promise.resolve();
    this.registerView(VIEW_TYPE, (leaf) => new CastleXHomeView(leaf, this));
    this.registerView(HEALTH_VIEW_TYPE, (leaf) => new CastleXHealthView(leaf, this));
    this.registerView(MENTAL_VIEW_TYPE, (leaf) => new CastleXMentalView(leaf, this));
    this.registerMarkdownCodeBlockProcessor("castlex-status", (_source, element, context) => {
      const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
      if (file instanceof TFile) context.addChild(new DailyStatusChild(element, this.app, file));
    });
    this.registerMarkdownCodeBlockProcessor("castlex-navigation", (_source, element, context) => {
      const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
      if (file instanceof TFile) context.addChild(new DailyStatusChild(element, this.app, file));
    });
    this.registerMarkdownCodeBlockProcessor("castlex-time-rings", (_source, element, context) => {
      const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
      if (file instanceof TFile) context.addChild(new DailyTimeRingsChild(element, this.app, file));
    });
    this.registerMarkdownCodeBlockProcessor("castlex-weekly-snapshot", (_source, element, context) => {
      const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
      if (file instanceof TFile) context.addChild(new WeeklySnapshotChild(element, this.app, file));
    });
    this.registerMarkdownCodeBlockProcessor("castlex-weekly-analytics", (source, element, context) => {
      const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
      if (!(file instanceof TFile)) return;
      let config = {};
      try {
        config = parseYaml(source) ?? {};
      } catch (_error) {
        config = {};
      }
      context.addChild(new WeeklyAnalyticsChild(element, this.app, file, config));
    });
    this.registerMarkdownCodeBlockProcessor("castlex-health-summary", (_source, element, context) => {
      const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
      if (file instanceof TFile) context.addChild(new DailyHealthSummaryChild(element, this.app, file));
    });
    this.registerMarkdownCodeBlockProcessor("castlex-mental-summary", (_source, element, context) => {
      const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
      if (file instanceof TFile) context.addChild(new DailyMentalSummaryChild(element, this.app, file));
    });
    this.registerMarkdownCodeBlockProcessor("castlex-leetcode-tracker", (source, element, context) => {
      const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
      if (!(file instanceof TFile)) return;
      let config = {};
      try {
        config = parseYaml(source) ?? {};
      } catch (error) {
        element.createDiv({ cls: "cx-lc-error", text: `Invalid LeetCode Tracker configuration: ${error.message || error}` });
        return;
      }
      context.addChild(new LeetCodeTrackerChild(element, this, file, config));
    });
    this.addRibbonIcon("ship-wheel", "Open CastleX Home", () => this.activateView());
    this.addRibbonIcon("heart-pulse", "Open Health Dashboard", () => this.activateHealthView());
    this.addRibbonIcon("cloud-moon", "Open Mental Dashboard", () => this.activateMentalView());
    this.addCommand({ id: "open-home", name: "Open CastleX Home", callback: () => this.activateView() });
    this.addCommand({ id: "open-health-dashboard", name: "Open Health Dashboard", callback: () => this.activateHealthView() });
    this.addCommand({ id: "open-mental-dashboard", name: "Open Mental Dashboard", callback: () => this.activateMentalView() });
    this.app.workspace.onLayoutReady(() => {
      this.activateView();
      this.setupMobileHomeButton();
    });
  }

  getLeetcodeTimer(key) {
    return this.pluginData?.leetcodeTimers?.[key] ?? null;
  }

  async setLeetcodeTimer(key, timer) {
    const write = async () => {
      if (!this.pluginData.leetcodeTimers || typeof this.pluginData.leetcodeTimers !== "object") {
        this.pluginData.leetcodeTimers = {};
      }
      if (timer) this.pluginData.leetcodeTimers[key] = timer;
      else delete this.pluginData.leetcodeTimers[key];
      await this.saveData(this.pluginData);
    };
    this.leetcodeDataWriteQueue = this.leetcodeDataWriteQueue.then(write, write);
    return this.leetcodeDataWriteQueue;
  }

  setupMobileHomeButton() {
    if (!Platform.isMobile || this.mobileHomeButton) return;
    const button = this.app.workspace.containerEl.createEl("button", {
      cls: "cx-mobile-home-button",
      attr: { type: "button", "aria-label": "返回 CastleX Dashboard" },
    });
    setIcon(button, "ship-wheel");
    this.mobileHomeButton = button;
    this.registerDomEvent(button, "click", () => this.activateView());
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => this.updateMobileHomeButton(leaf)));
    this.updateMobileHomeButton(this.app.workspace.getMostRecentLeaf?.() ?? this.app.workspace.activeLeaf);
  }

  updateMobileHomeButton(leaf) {
    const onDashboard = leaf?.view?.getViewType?.() === VIEW_TYPE;
    this.mobileHomeButton?.classList.toggle("is-hidden", onDashboard);
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }

  async activateHealthView(stage = null) {
    let leaf = this.app.workspace.getLeavesOfType(HEALTH_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: HEALTH_VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    if (stage && typeof leaf.view?.openStage === "function") await leaf.view.openStage(stage);
  }

  async activateMentalView(targetISO = null) {
    let leaf = this.app.workspace.getLeavesOfType(MENTAL_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: MENTAL_VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    if (typeof leaf.view?.openVoyage === "function") await leaf.view.openVoyage(targetISO);
  }

  onunload() {
    this.mobileHomeButton?.remove();
    this.mobileHomeButton = null;
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(HEALTH_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(MENTAL_VIEW_TYPE);
  }
};
