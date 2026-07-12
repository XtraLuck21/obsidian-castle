const {
  ItemView,
  MarkdownRenderChild,
  Notice,
  Plugin,
  TFile,
  normalizePath,
  setIcon,
} = require("obsidian");

const VIEW_TYPE = "castlex-home";
const DAILY_ROOT = "10_Journal/Daily";
const PROJECT_ROOT = "30_Projects";
const ASSET_PATH = "90_System/Assets/night-voyage-modern.png";
const REQUIRED = [
  "sleep_quality",
  "physical_state",
  "stress",
  "energy",
  "agency",
  "appetite_stability",
];
const METRICS = [
  { key: "sleep_quality", label: "睡眠质量", hint: "Sleep quality" },
  { key: "physical_state", label: "身体状态", hint: "Physical state" },
  { key: "appetite_stability", label: "食欲稳定", hint: "Appetite stability" },
  { key: "energy", label: "精力", hint: "Energy" },
  { key: "stress", label: "压力", hint: "Stress · 1 low / 5 high" },
  { key: "agency", label: "行动感", hint: "Agency / ability to start" },
];
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
    key: "personal_enrichment_minutes",
    originKey: "personal_enrichment_minutes_origin",
    label: "Personal Enrichment",
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

function minutesValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
}

function timeLevel(value, metric) {
  const minutes = minutesValue(value);
  if (minutes === null) return null;
  if (minutes === 0) return 0;
  return Math.min(4, Math.ceil(minutes / metric.unit));
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
  if (metric.unit === 60) return "≤1h · ≤2h · ≤3h · >3h";
  return "≤30m · ≤60m · ≤90m · >90m";
}

function completion(frontmatter) {
  return REQUIRED.filter((key) => rating(frontmatter?.[key]) !== null).length;
}

function stripTaskSyntax(text) {
  return text
    .replace(/\s+[📅⏳🛫✅] ?\d{4}-\d{2}-\d{2}/g, "")
    .replace(/\s+🔁.*$/g, "")
    .trim();
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

function renderReadonlyStatus(app, file, container) {
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const wrap = container.createDiv({ cls: "cx-daily-status" });
  METRICS.forEach((metric) => {
    const item = wrap.createDiv({ cls: "cx-daily-status-item" });
    const svg = createSvgElement(item, "svg", { viewBox: "0 0 104 65", class: "cx-daily-status-svg" });
    const selected = rating(frontmatter[metric.key]);
    for (let index = 0; index < 5; index += 1) {
      const value = index + 1;
      createSvgElement(svg, "path", {
        d: miniGaugePath(index),
        class: `cx-daily-status-segment${selected !== null && value <= selected ? " is-active" : ""}${value === selected ? " is-selected" : ""}`,
      });
    }
    const valueText = createSvgElement(svg, "text", { x: 52, y: 48, class: "cx-daily-status-value", "text-anchor": "middle" });
    valueText.textContent = selected ?? "—";
    item.createDiv({ text: metric.label, cls: "cx-daily-status-label" });
  });
}

class DailyStatusChild extends MarkdownRenderChild {
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
  }

  render() {
    this.containerEl.empty();
    renderReadonlyStatus(this.app, this.file, this.containerEl);
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
  }

  frontmatter() {
    return this.app.metadataCache.getFileCache(this.file)?.frontmatter ?? {};
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

  async confirmAIValues() {
    const write = async () => {
      await this.app.fileManager.processFrontMatter(this.file, (frontmatter) => {
        frontmatter.time_data_reviewed = true;
      });
      new Notice("AI time values marked as reviewed");
    };
    this.writeQueue = this.writeQueue.then(write, write);
    await this.writeQueue;
  }

  render() {
    this.containerEl.empty();
    const frontmatter = this.frontmatter();
    const values = TIME_METRICS.map((metric) => minutesValue(frontmatter[metric.key]));
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
        meta.createSpan({ text: origin === "ai" ? "AI" : "Human", cls: `cx-time-origin is-${origin}` });
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
    if (hasAI && frontmatter.time_data_reviewed !== true) {
      const review = wrap.createDiv({ cls: "cx-time-review" });
      review.createSpan({ text: "AI-filled time values are awaiting review." });
      const confirm = review.createEl("button", { text: "Confirm values", cls: "cx-time-confirm" });
      confirm.addEventListener("click", () => this.confirmAIValues());
    }
  }
}

class CastleXHomeView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.heatmapMode = "project";
    this.trendMode = "energy";
    this.calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    this.renderTimer = null;
    this.heatmapObserver = null;
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
    if (!this.clockEl) return;
    this.clockEl.setText(new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date()));
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

  async ensureDaily(date = new Date()) {
    const path = this.dailyPath(date);
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) return existing;
    await this.ensureFolder(path.split("/").slice(0, -1).join("/"));
    const content = await this.createDailyContent(date);
    return this.app.vault.create(path, content);
  }

  frontmatter(file) {
    return this.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  }

  dailyPages() {
    return this.app.vault.getMarkdownFiles()
      .filter((file) => file.path.startsWith(`${DAILY_ROOT}/`))
      .map((file) => ({ file, frontmatter: this.frontmatter(file) }))
      .filter((page) => page.frontmatter.type === "daily" && page.frontmatter.date)
      .sort((a, b) => String(a.frontmatter.date).localeCompare(String(b.frontmatter.date)));
  }

  projectPages() {
    return this.app.vault.getMarkdownFiles()
      .filter((file) => file.path.startsWith(`${PROJECT_ROOT}/`))
      .map((file) => ({ file, frontmatter: this.frontmatter(file) }))
      .filter((page) => page.frontmatter.type === "project" && page.frontmatter.status === "active")
      .sort((a, b) => Number(b.frontmatter.progress ?? 0) - Number(a.frontmatter.progress ?? 0));
  }

  async collectProjectTasks(projects) {
    const tasks = [];
    await Promise.all(projects.map(async ({ file }) => {
      const content = await this.app.vault.cachedRead(file);
      content.split("\n").forEach((line, lineNumber) => {
        const open = line.match(/^\s*- \[ \] (.+)$/);
        if (!open) return;
        const due = open[1].match(/📅 ?(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
        tasks.push({ file, line, lineNumber, text: stripTaskSyntax(open[1]), due });
      });
    }));
    tasks.sort((a, b) => {
      if (a.due && b.due) return a.due.localeCompare(b.due);
      if (a.due) return -1;
      if (b.due) return 1;
      return a.file.path.localeCompare(b.file.path);
    });
    return tasks;
  }

  calculateStreaks(pages) {
    const byDate = new Map(pages.map((page) => [String(page.frontmatter.date).slice(0, 10), page]));
    const todayISO = localISO();
    const yesterdayISO = localISO(addDays(new Date(), -1));
    const completeAt = (iso) => completion(byDate.get(iso)?.frontmatter) === REQUIRED.length;
    const streakAt = (iso) => {
      let cursor = dateFromISO(iso);
      let count = 0;
      while (cursor && completeAt(localISO(cursor))) {
        count += 1;
        cursor = addDays(cursor, -1);
      }
      return count;
    };
    const active = completeAt(todayISO) ? streakAt(todayISO) : streakAt(yesterdayISO);
    let longest = 0;
    let running = 0;
    let previous = null;
    for (const page of pages) {
      const iso = String(page.frontmatter.date).slice(0, 10);
      const contiguous = previous && localISO(addDays(dateFromISO(previous), 1)) === iso;
      running = completion(page.frontmatter) === REQUIRED.length ? (contiguous ? running + 1 : 1) : 0;
      longest = Math.max(longest, running);
      previous = iso;
    }
    return { active, longest, byDate };
  }

  async setRating(file, key, value) {
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter[key] = Number(value);
    });
    new Notice(`${METRICS.find((metric) => metric.key === key)?.label ?? key}: ${value}/5`);
    await this.renderDashboard();
  }

  async completeTask(task) {
    const today = localISO();
    await this.app.vault.process(task.file, (content) => {
      const lines = content.split("\n");
      if (lines[task.lineNumber] === task.line) {
        lines[task.lineNumber] = task.line.replace("- [ ]", "- [x]") + ` ✅ ${today}`;
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
    const actions = hero.createDiv({ cls: "cx-hero-actions" });
    const today = actions.createEl("button", { text: "打开今日 Daily", cls: "cx-button cx-button-primary" });
    today.addEventListener("click", () => this.openFile(todayFile));
    const refresh = actions.createEl("button", { text: "刷新", cls: "cx-button" });
    refresh.addEventListener("click", () => this.renderDashboard());
  }

  renderKpis(parent, todayFrontmatter, streaks) {
    const grid = parent.createDiv({ cls: "cx-kpi-grid" });
    const timeEntries = TIME_METRICS.map((metric) => ({
      metric,
      minutes: minutesValue(todayFrontmatter[metric.key]),
    }));
    const recorded = timeEntries.filter((entry) => entry.minutes !== null);
    const totalMinutes = recorded.reduce((sum, entry) => sum + entry.minutes, 0);
    const dominant = recorded
      .filter((entry) => entry.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)[0] ?? null;
    const timeKpi = !recorded.length
      ? { value: "—", label: "今日投入", detail: "尚未记录时间分配" }
      : {
        value: formatDuration(totalMinutes),
        label: "今日投入",
        detail: dominant ? `${dominant.metric.label} · ${formatDuration(dominant.minutes)}` : "今日无已记录投入",
      };
    [
      timeKpi,
      { value: streaks.active, label: "连续航行", detail: `最长 ${streaks.longest} 天` },
    ].forEach((item) => {
      const card = grid.createDiv({ cls: "cx-kpi cx-glass" });
      card.createDiv({ text: String(item.value), cls: "cx-kpi-value" });
      card.createDiv({ text: item.label, cls: "cx-kpi-label" });
      card.createDiv({ text: item.detail, cls: "cx-kpi-detail" });
    });
  }

  renderProjects(parent, projects) {
    const card = this.createCard(parent, `Active Projects · ${projects.length}`, "status: active");
    card.addClass("cx-project-card");
    const list = card.createDiv({ cls: "cx-project-list" });
    if (!projects.length) {
      list.createDiv({ text: "尚无 Active Project", cls: "cx-empty" });
      return;
    }
    projects.slice(0, 6).forEach((project) => {
      const progress = clamp(Number(project.frontmatter.progress ?? 0), 0, 100);
      const item = list.createDiv({ cls: "cx-project" });
      const line = item.createDiv({ cls: "cx-project-line" });
      const link = line.createEl("button", { text: project.file.basename, cls: "cx-text-link" });
      link.addEventListener("click", () => this.openFile(project.file));
      line.createSpan({ text: `${progress}%` });
      const track = item.createDiv({ cls: "cx-progress-track" });
      const bar = track.createSpan({ cls: "cx-progress-bar" });
      bar.style.width = `${progress}%`;
    });
  }

  renderTasks(parent, tasks) {
    const card = this.createCard(parent, `Project Tasks · ${tasks.length}`, "仅显示 active projects");
    card.addClass("cx-task-card");
    const list = card.createDiv({ cls: "cx-task-list" });
    if (!tasks.length) {
      list.createDiv({ text: "当前没有 Project Task", cls: "cx-empty" });
      return;
    }
    tasks.slice(0, 7).forEach((task) => {
      const row = list.createDiv({ cls: "cx-task" });
      const check = row.createEl("button", { cls: "cx-task-check", attr: { "aria-label": "完成任务" } });
      setIcon(check, "circle");
      check.addEventListener("click", () => this.completeTask(task));
      const content = row.createDiv({ cls: "cx-task-content" });
      const link = content.createEl("button", { text: task.text || "Untitled task", cls: "cx-text-link" });
      link.addEventListener("click", () => this.openFile(task.file));
      content.createEl("small", { text: task.due ? `Due ${task.due}` : task.file.basename });
    });
  }

  renderRoute(shell, streaks) {
    const route = shell.createDiv({ cls: "cx-route cx-glass" });
    route.createDiv({ text: "最近 14 天", cls: "cx-route-label" });
    const track = route.createDiv({ cls: "cx-route-track" });
    let voyageDays = 0;
    for (let offset = -13; offset <= 0; offset += 1) {
      const date = addDays(new Date(), offset);
      const iso = localISO(date);
      const count = completion(streaks.byDate.get(iso)?.frontmatter);
      if (count === REQUIRED.length) voyageDays += 1;
      const day = track.createDiv({ cls: `cx-route-day cx-level-${count}${offset === 0 ? " is-today" : ""}` });
      day.createSpan({ cls: "cx-route-node" });
      day.createSpan({ text: new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(date), cls: "cx-route-weekday" });
      day.setAttr("aria-label", `${iso}: ${count}/6`);
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
    const card = this.createCard(parent, "Today’s Check-in", "点击扇形区间写入今日 YAML");
    card.addClass("cx-checkin-card");
    const body = card.createDiv({ cls: "cx-checkin-grid" });
    METRICS.forEach((metric) => {
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
    const card = this.createCard(parent, "状态 Radar", "压力转换为平稳度；面积越大代表可用状态越好");
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
    const completePages = pages.filter((page) => completion(page.frontmatter) === REQUIRED.length).slice(-7);
    const recent = completePages.map((page) => this.radarValues(page.frontmatter));
    const averages = Array.from({ length: 6 }, (_, index) => {
      const values = recent.map((row) => row[index]).filter((value) => value > 0);
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    });
    if (completePages.length >= 3) {
      this.createSvg(svg, "polygon", { points: this.polygonPoints(averages, centerX, centerY, radius), class: "cx-radar-average" });
    }
    this.createSvg(svg, "polygon", { points: this.polygonPoints(this.radarValues(todayFrontmatter), centerX, centerY, radius), class: "cx-radar-today" });
    ["睡眠", "身体", "食欲", "行动感", "平稳", "精力"].forEach((label, index) => {
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
      const cell = grid.createDiv({ cls: "cx-calendar-cell" });
      const state = !page ? " is-uncreated" : count === REQUIRED.length ? " is-complete" : count > 0 ? " is-partial" : " has-note";
      const button = cell.createEl("button", {
        text: String(day),
        cls: `cx-calendar-day${state}${iso === localISO() ? " is-today" : ""}`,
        attr: { "aria-label": `${iso}: ${page ? `${count}/6 recorded` : "create Daily Note"}`, title: `${iso}: ${page ? `${count}/6 recorded` : "click to create"}` },
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

  trendSeries(pages, key) {
    const byDate = new Map(pages.map((page) => [String(page.frontmatter.date).slice(0, 10), page.frontmatter]));
    return Array.from({ length: 14 }, (_, index) => {
      const date = addDays(new Date(), index - 13);
      return { date, iso: localISO(date), value: rating(byDate.get(localISO(date))?.[key]) };
    });
  }

  renderTrend(parent, pages) {
    const label = this.trendMode === "energy" ? "Energy" : "Sleep Quality";
    const card = this.createCard(parent, `14-day ${label}`, "缺失数据保持断点，不按 0 计算");
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
      this.createSvg(svg, "circle", { cx: x, cy: y, r: 4.5, class: "cx-trend-point" });
    });
    flush();
    [0, 6, 13].forEach((index) => {
      const text = this.createSvg(svg, "text", { x: xAt(index), y: 202, class: "cx-trend-date", "text-anchor": "middle" });
      text.textContent = `${pad(series[index].date.getMonth() + 1)}/${pad(series[index].date.getDate())}`;
    });
    const summary = card.createDiv({ cls: "cx-trend-summary" });
    summary.createSpan({ text: average === null ? "14 天暂无数据" : `14 天平均 ${average.toFixed(2)}` });
    summary.createSpan({ text: `${values.length}/14 days recorded` });
  }

  async renderDashboard() {
    this.heatmapObserver?.disconnect();
    const todayFile = await this.ensureDaily();
    const pages = this.dailyPages();
    const todayFrontmatter = this.frontmatter(todayFile);
    const projects = this.projectPages();
    const tasks = await this.collectProjectTasks(projects);
    const streaks = this.calculateStreaks(pages);

    this.contentEl.empty();
    this.contentEl.addClass("castlex-home-view");
    const shell = this.contentEl.createDiv({ cls: "cx-shell" });
    const asset = this.app.vault.getAbstractFileByPath(ASSET_PATH);
    if (asset instanceof TFile) shell.style.setProperty("--cx-background", `url("${this.app.vault.getResourcePath(asset)}")`);

    const top = shell.createDiv({ cls: "cx-top-grid" });
    const left = top.createDiv({ cls: "cx-top-left" });
    this.renderHero(left, todayFile);
    this.renderKpis(left, todayFrontmatter, streaks);
    this.renderProjects(top, projects);
    this.renderTasks(top, tasks);

    this.renderRoute(shell, streaks);

    const primary = shell.createDiv({ cls: "cx-primary-grid" });
    this.renderCheckin(primary, todayFile, todayFrontmatter);
    this.renderRadar(primary, todayFrontmatter, pages);
    this.renderCalendar(primary, streaks);

    const secondary = shell.createDiv({ cls: "cx-secondary-grid" });
    this.renderHeatmap(secondary, streaks);
    this.renderTrend(secondary, pages);
  }
}

module.exports = class CastleXDashboardPlugin extends Plugin {
  async onload() {
    this.registerView(VIEW_TYPE, (leaf) => new CastleXHomeView(leaf, this));
    this.registerMarkdownCodeBlockProcessor("castlex-status", (_source, element, context) => {
      const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
      if (file instanceof TFile) context.addChild(new DailyStatusChild(element, this.app, file));
    });
    this.registerMarkdownCodeBlockProcessor("castlex-time-rings", (_source, element, context) => {
      const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
      if (file instanceof TFile) context.addChild(new DailyTimeRingsChild(element, this.app, file));
    });
    this.addRibbonIcon("ship-wheel", "Open CastleX Home", () => this.activateView());
    this.addCommand({ id: "open-home", name: "Open CastleX Home", callback: () => this.activateView() });
    this.app.workspace.onLayoutReady(() => this.activateView());
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }
};
