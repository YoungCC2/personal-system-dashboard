import fs from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const output = path.join(webRoot, "data", "content.json");

function files(relativeDir) {
  const dir = path.join(root, relativeDir);
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith(".md")).sort().reverse() : [];
}

function firstMeaningful(body) {
  return body.split("\n").map((line) => line.trim()).find((line) => line && !line.startsWith("#") && !line.startsWith(">") && line !== "---" && !line.startsWith("|") && !line.startsWith("- **来源"))?.replace(/^[-*]\s*/, "").replace(/\*\*/g, "").slice(0, 130) || "暂无摘要";
}

function parse(relativePath, type) {
  const full = path.join(root, relativePath);
  const body = fs.readFileSync(full, "utf8");
  const title = body.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(relativePath, ".md");
  const date = body.match(/(?:生成日期|生成时间|复盘日期)[：:]\s*(\d{4}-\d{2}-\d{2})/)?.[1] || relativePath.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || "";
  const period = title.match(/[（(]([^）)]+)[）)]/)?.[1] || date;
  return { id: relativePath.replaceAll("/", "-"), type, title, date, period, excerpt: firstMeaningful(body), body, path: relativePath, actionCard: /行动卡/.test(body) && !/本周无新增行动卡/.test(body) };
}

const documents = [
  ...files("education/weekly").map((name) => parse(`education/weekly/${name}`, "education")),
  ...files("growth/weekly").map((name) => parse(`growth/weekly/${name}`, "growth")),
  parse("decisions.md", "decision"),
].sort((a, b) => (b.date || b.path).localeCompare(a.date || a.path));

const metrics = {
  educationWeekly: files("education/weekly").length,
  growthWeekly: files("growth/weekly").length,
  actionCards: documents.filter((item) => item.actionCard).length,
  practiceRecords: files("growth/daily").length,
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ generatedAt: new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Shanghai" }).format(new Date()), metrics, documents }, null, 2));
console.log(`Generated ${documents.length} documents.`);
