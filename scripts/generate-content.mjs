import fs from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const output = path.join(webRoot, "data", "content.json");

function files(relativeDir) {
  const dir = path.join(root, relativeDir);
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith(".md")).sort().reverse() : [];
}

function shanghaiParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).formatToParts(now);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function shanghaiDate(now = new Date()) {
  const parts = shanghaiParts(now);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function isoWeek(dateText) {
  const date = new Date(`${dateText}T12:00:00+08:00`);
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
}

function actionCardStatus(body, kind) {
  if (kind !== "weekly") return false;
  const section = body.match(/(?:^|\n)#{2,3}\s*(?:本周)?行动卡\s*\n([\s\S]*?)(?=\n#{2,3}\s|$)/)?.[1] ?? "";
  if (!section) return false;
  return !/(?:不新增|无新增|没有|未生成|不生成).{0,8}行动卡|行动卡.{0,8}(?:无|0\s*张)/.test(section);
}

function signalCount(body, kind) {
  if (kind !== "daily") return null;
  if (/今日无重大更新/.test(body)) return 0;

  const explicit = body.match(/今日收录\s*\**(\d+)\**\s*条/)
    || body.match(/达标(?:素材|信号)[：:]?\s*\**(\d+)\**\s*条/)
    || body.match(/保留\s*\**(\d+)\**\s*条达标信号/);
  if (explicit) return Number(explicit[1]);

  const numberedSignals = body.match(/^##\s+\d+[.、]\s+/gm);
  return numberedSignals?.length ?? null;
}

function firstMeaningful(body) {
  return body.split("\n").map((line) => line.trim()).find((line) => line && !line.startsWith("#") && !line.startsWith(">") && line !== "---" && !line.startsWith("|") && !line.startsWith("- **来源"))?.replace(/^[-*]\s*/, "").replace(/\*\*/g, "").slice(0, 130) || "暂无摘要";
}

function parse(relativePath, type, kind) {
  const full = path.join(root, relativePath);
  const body = fs.readFileSync(full, "utf8");
  const title = body.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(relativePath, ".md");
  const explicitDate = body.match(/(?:生成日期|生成时间|复盘日期)[：:]\s*(\d{4}-\d{2}-\d{2})/)?.[1]
    || relativePath.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
  const date = explicitDate || (type !== "decision" ? shanghaiDate(fs.statSync(full).mtime) : "");
  const period = body.match(/(?:素材覆盖|采集周期|覆盖周期)[：:]\s*([^\n]+)/)?.[1]?.trim()
    || title.match(/[（(]([^）)]+)[）)]/)?.[1]
    || date;
  return {
    id: relativePath.replaceAll("/", "-"),
    type,
    kind,
    title,
    date,
    period,
    excerpt: firstMeaningful(body),
    body,
    path: relativePath,
    actionCard: actionCardStatus(body, kind),
    signalCount: signalCount(body, kind),
  };
}

const documents = [
  ...files("education/inbox").map((name) => parse(`education/inbox/${name}`, "education", "daily")),
  ...files("growth/inbox").map((name) => parse(`growth/inbox/${name}`, "growth", "daily")),
  ...files("education/weekly").map((name) => parse(`education/weekly/${name}`, "education", "weekly")),
  ...files("growth/weekly").map((name) => parse(`growth/weekly/${name}`, "growth", "weekly")),
  parse("decisions.md", "decision", "decision"),
].sort((a, b) => (b.date || b.path).localeCompare(a.date || a.path));

const dailyDocuments = documents.filter((item) => item.kind === "daily");
const dailyDates = dailyDocuments.map((item) => item.date).filter(Boolean).sort().reverse();
const latestDailyDate = dailyDates[0] || "";
const latestDailyDocuments = dailyDocuments.filter((item) => item.date === latestDailyDate);

const metrics = {
  educationWeekly: files("education/weekly").length,
  growthWeekly: files("growth/weekly").length,
  educationDaily: files("education/inbox").length,
  growthDaily: files("growth/inbox").length,
  latestSignals: latestDailyDocuments.reduce((total, item) => total + (item.signalCount ?? 0), 0),
  actionCards: documents.filter((item) => item.actionCard).length,
  practiceRecords: files("growth/daily").length,
};

const now = new Date();
const nowParts = shanghaiParts(now);
const today = `${nowParts.year}-${nowParts.month}-${nowParts.day}`;
let generatedAt = `${nowParts.year}-${nowParts.month}-${nowParts.day} ${nowParts.hour}:${nowParts.minute}`;
let generatedAtIso = now.toISOString();
const reportDates = documents.filter((item) => item.kind === "weekly" && item.date).map((item) => item.date).sort().reverse();
const latestReportDate = reportDates[0] || "";
const ageDays = latestDailyDate ? Math.floor((new Date(`${today}T12:00:00+08:00`) - new Date(`${latestDailyDate}T12:00:00+08:00`)) / 86400000) : null;
const freshness = ageDays === null || ageDays > 3
  ? { status: "stale", label: "数据需要同步" }
  : ageDays > 1
    ? { status: "recent", label: "数据近期更新" }
    : { status: "current", label: "数据已同步" };

const calendar = {
  isoWeek: isoWeek(today),
  monthLabel: `${Number(nowParts.month)}月`,
  yearLabel: `${nowParts.year}年`,
};

const stableContent = { latestReportDate, latestDailyDate, freshness, calendar, metrics, documents };
if (fs.existsSync(output)) {
  try {
    const previous = JSON.parse(fs.readFileSync(output, "utf8"));
    const previousStable = {
      latestReportDate: previous.latestReportDate,
      latestDailyDate: previous.latestDailyDate,
      freshness: previous.freshness,
      calendar: previous.calendar,
      metrics: previous.metrics,
      documents: previous.documents,
    };
    if (JSON.stringify(previousStable) === JSON.stringify(stableContent)) {
      generatedAt = previous.generatedAt || generatedAt;
      generatedAtIso = previous.generatedAtIso || generatedAtIso;
    }
  } catch {
    // Invalid or legacy output is replaced with a complete current payload.
  }
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ generatedAt, generatedAtIso, ...stableContent }, null, 2));
console.log(`Generated ${documents.length} documents.`);
