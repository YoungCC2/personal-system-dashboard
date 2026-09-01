import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const contentUrl = new URL("../data/content.json", import.meta.url);
const systemRoot = new URL("../../", import.meta.url);

async function markdownCount(relativeDirectory) {
  const names = await readdir(new URL(relativeDirectory, systemRoot));
  return names.filter((name) => name.endsWith(".md")).length;
}

test("content data includes freshness metadata and latest weekly reports", async () => {
  const content = JSON.parse(await readFile(contentUrl, "utf8"));

  assert.match(content.generatedAt, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  assert.match(content.generatedAtIso, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(content.latestReportDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(content.latestDailyDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(["current", "recent", "stale"].includes(content.freshness.status));
  assert.ok(content.calendar.isoWeek >= 1 && content.calendar.isoWeek <= 53);

  const latestEducationWeekly = content.documents.find((item) => item.type === "education" && item.kind === "weekly");
  const latestGrowthWeekly = content.documents.find((item) => item.type === "growth" && item.kind === "weekly");
  assert.ok(latestEducationWeekly?.path.startsWith("education/weekly/"));
  assert.ok(latestGrowthWeekly?.path.startsWith("growth/weekly/"));
  assert.equal(content.latestReportDate, [latestEducationWeekly.date, latestGrowthWeekly.date].sort().reverse()[0]);
});

test("publishes every external inbox document and keeps private practice files out", async () => {
  const content = JSON.parse(await readFile(contentUrl, "utf8"));
  const daily = content.documents.filter((item) => item.kind === "daily");
  const educationDaily = daily.filter((item) => item.type === "education");
  const growthDaily = daily.filter((item) => item.type === "growth");

  assert.equal(educationDaily.length, await markdownCount("education/inbox/"));
  assert.equal(growthDaily.length, await markdownCount("growth/inbox/"));
  assert.equal(content.metrics.educationDaily, educationDaily.length);
  assert.equal(content.metrics.growthDaily, growthDaily.length);
  assert.ok(educationDaily.some((item) => item.date === content.latestDailyDate));
  assert.ok(growthDaily.some((item) => item.date === content.latestDailyDate));
  assert.ok(daily.every((item) => Number.isInteger(item.signalCount) || item.signalCount === null));
  assert.ok(content.documents.every((item) => !item.path.startsWith("growth/daily/")));
});

test("document ids are unique and document kinds match their paths", async () => {
  const content = JSON.parse(await readFile(contentUrl, "utf8"));
  const ids = content.documents.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);

  for (const item of content.documents) {
    if (item.kind === "daily") assert.match(item.path, /^(education|growth)\/inbox\//);
    if (item.kind === "weekly") assert.match(item.path, /^(education|growth)\/weekly\//);
    if (item.kind === "decision") assert.equal(item.path, "decisions.md");
  }
});

test("negative action-card sections are not counted as action cards", async () => {
  const content = JSON.parse(await readFile(contentUrl, "utf8"));
  const education = content.documents.find((item) => item.path === "education/weekly/2026-W34.md");
  const growth = content.documents.find((item) => item.path === "growth/weekly/2026-W34.md");

  assert.equal(education.actionCard, false);
  assert.equal(growth.actionCard, false);
  assert.equal(content.metrics.practiceRecords, await markdownCount("growth/daily/"));
});
