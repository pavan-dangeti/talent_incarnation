// Records the test counts from a GitHub Actions CI run in results/test-run.json.
//
//   node scripts/record-test-run.mjs <commit-sha>
//
// Reads the log of the CI workflow run for that commit with the GitHub CLI and
// takes the counts from Vitest's summary lines, so the numbers come from CI,
// not from a local run. Fails if the run did not succeed or a count is missing.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const sha = process.argv[2];
if (!sha) {
  console.error("usage: node scripts/record-test-run.mjs <commit-sha>");
  process.exit(1);
}
const gh = (...args) => execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const [run] = JSON.parse(
  gh("run", "list", "--workflow", "CI", "--commit", sha, "--limit", "1", "--json", "databaseId,conclusion,headSha,url,createdAt"),
);
if (!run) throw new Error(`no CI run found for ${sha}`);
if (run.conclusion !== "success") throw new Error(`CI run ${run.url} concluded "${run.conclusion}", not "success"`);

const log = gh("run", "view", String(run.databaseId), "--log").replace(/\x1b\[[0-9;]*m/g, "");
const count = (label) => {
  const m = new RegExp(`${label}\\s+(.+?)\\s*\\((\\d+)\\)`).exec(log);
  if (!m) throw new Error(`no "${label}" line in the CI log`);
  const n = (word) => Number(new RegExp(`(\\d+) ${word}`).exec(m[1])?.[1] ?? 0);
  return { total: Number(m[2]), passed: n("passed"), failed: n("failed"), skipped: n("skipped") };
};

const result = {
  description:
    "Automated test counts from the CI run (GitHub Actions, workflow CI) for this commit, read from Vitest's summary in the run log. Skipped tests fail the run (see vitest.config.mts).",
  commit: run.headSha,
  ciRun: run.url,
  ranAt: run.createdAt,
  testFiles: count("Test Files"),
  tests: count("Tests"),
};
writeFileSync("results/test-run.json", JSON.stringify(result, null, 2) + "\n");
console.log(`tests ${result.tests.passed}/${result.tests.total} passed in ${result.testFiles.total} files (${run.url})`);
