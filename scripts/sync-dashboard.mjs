import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const webRoot = process.cwd();
const dataPath = "data/content.json";
const publish = process.argv.includes("--publish");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: webRoot,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });
  if (result.status !== 0 && !options.allowFailure) {
    const detail = result.stderr?.trim() || result.stdout?.trim() || `${command} exited with ${result.status}`;
    throw new Error(detail);
  }
  return result;
}

run(process.execPath, [path.join(webRoot, "scripts", "generate-content.mjs")]);

const diff = run("git", ["diff", "--quiet", "HEAD", "--", dataPath], { allowFailure: true, capture: true });
if (diff.status === 0) {
  console.log("Dashboard content is already current; nothing to publish.");
  process.exit(0);
}
if (diff.status !== 1) {
  throw new Error(diff.stderr?.trim() || "Unable to inspect dashboard content changes.");
}

if (!publish) {
  console.log(`Updated ${dataPath}. Run npm run sync:dashboard -- --publish to commit and push it.`);
  process.exit(0);
}

const branch = run("git", ["branch", "--show-current"], { capture: true }).stdout.trim();
if (branch !== "main") {
  throw new Error(`Dashboard publishing requires the main branch; current branch is ${branch || "detached HEAD"}.`);
}

run("git", ["add", "--", dataPath]);
const staged = run("git", ["diff", "--cached", "--quiet", "--", dataPath], { allowFailure: true, capture: true });
if (staged.status === 0) {
  console.log("No staged dashboard content change; nothing to publish.");
  process.exit(0);
}
if (staged.status !== 1) {
  throw new Error(staged.stderr?.trim() || "Unable to validate staged dashboard content.");
}

const stamp = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Shanghai",
}).format(new Date());
run("git", ["commit", "-m", `Update dashboard content ${stamp}`, "--", dataPath]);
run("git", ["push", "origin", "main"]);
console.log("Dashboard content committed and pushed; GitHub Pages deployment will start automatically.");
