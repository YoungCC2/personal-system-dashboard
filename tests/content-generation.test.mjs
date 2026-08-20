import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentUrl = new URL("../data/content.json", import.meta.url);

test("content data includes freshness metadata and latest weekly reports", async () => {
  const content = JSON.parse(await readFile(contentUrl, "utf8"));

  assert.match(content.generatedAt, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  assert.match(content.generatedAtIso, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(content.latestReportDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(content.latestDailyDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(["current", "recent", "stale"].includes(content.freshness.status));
  assert.ok(content.calendar.isoWeek >= 1 && content.calendar.isoWeek <= 53);
  assert.ok(content.documents.some((item) => item.path === "education/weekly/2026-W34.md"));
  assert.ok(content.documents.some((item) => item.path === "growth/weekly/2026-W34.md"));
  assert.equal(content.documents.find((item) => item.type === "growth").path, "growth/weekly/2026-W34.md");
});

test("negative action-card sections are not counted as action cards", async () => {
  const content = JSON.parse(await readFile(contentUrl, "utf8"));
  const education = content.documents.find((item) => item.path === "education/weekly/2026-W34.md");
  const growth = content.documents.find((item) => item.path === "growth/weekly/2026-W34.md");

  assert.equal(education.actionCard, false);
  assert.equal(growth.actionCard, false);
  assert.equal(content.metrics.practiceRecords, 0);
});
