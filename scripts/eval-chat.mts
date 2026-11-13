// Runs evals/chat-eval.json through the real pipeline and model.
//
//   npm run eval:chat [-- --interval-ms 5000]
//
// Needs GEMINI_API_KEY and GEMINI_CHAT_MODEL (environment or .env.local).
//
// - Requests are paced (default one every 5 seconds; --interval-ms or
//   EVAL_INTERVAL_MS) to stay under a per-minute limit.
// - Per-minute 429s, 503s and timeouts are retried with exponential backoff
//   and jitter, waiting at least as long as the server asks.
// - A per-day 429 stops all further model calls; items that need none still complete.
// - Every completed model answer is cached in .cache/ (gitignored), so a
//   re-run only calls the model for items that are still missing.
// - An item whose API call failed is "not run", never a failure.
//   results/chat-eval.json is written only when every item completed.
//
// Exit codes: 0 all items completed and the file was written; 2 some items
// were not run (nothing written); 1 configuration error.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cachedGenerate, grade, pacer, summarise, type Cache, type Item, type Row } from "./lib/chat-eval";

if (!process.env.GEMINI_API_KEY) {
  try {
    process.loadEnvFile(".env.local");
  } catch {}
}
const model = process.env.GEMINI_CHAT_MODEL;
if (!process.env.GEMINI_API_KEY || !model) {
  console.error("Set GEMINI_API_KEY and GEMINI_CHAT_MODEL (environment or .env.local) to run this evaluation.");
  process.exit(1);
}

const flag = process.argv.indexOf("--interval-ms");
const intervalMs = Number(flag >= 0 ? process.argv[flag + 1] : (process.env.EVAL_INTERVAL_MS ?? 5000));
if (!Number.isFinite(intervalMs) || intervalMs < 0) {
  console.error("--interval-ms must be a non-negative number of milliseconds.");
  process.exit(1);
}

// Imported after the environment is loaded because the client reads it at import time.
const { ModelOutputError, answerQuestion } = await import("../src/chat/answer");
const { geminiGenerateOnce } = await import("../src/chat/gemini");
const { DailyQuotaError, PATIENT_RETRY, classifyError, withRetry } = await import("../src/chat/retry");

const { items } = JSON.parse(readFileSync("evals/chat-eval.json", "utf8")) as { items: Item[] };
const context = { targetRole: null, educationLevel: null, results: [] };

const CACHE_DIR = ".cache/chat-eval";
const cacheFile = `${CACHE_DIR}/${model.replace(/[^A-Za-z0-9._-]/g, "_")}.json`;
mkdirSync(CACHE_DIR, { recursive: true });
const cache: Cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : {};
const cachedAtStart = Object.keys(cache).length;

const pace = pacer(intervalMs);
let dailyQuotaExhausted = false;
let requestsSent = 0;
const generate = cachedGenerate(
  async (system, user) => {
    // Once the daily quota is gone, fail without calling the API. Items that are
    // cached or need no model call still complete, so the remaining count is exact.
    if (dailyQuotaExhausted) throw new DailyQuotaError("daily quota exhausted earlier in this run");
    await pace();
    return withRetry(() => (requestsSent += 1, geminiGenerateOnce(system, user)), PATIENT_RETRY, {
      onRetry: ({ attempt, waitMs, reason }) =>
        console.log(`      ${reason}: waiting ${(waitMs / 1000).toFixed(1)} s before attempt ${attempt + 1}`),
    });
  },
  model,
  cache,
  () => writeFileSync(cacheFile, JSON.stringify(cache, null, 2) + "\n"),
);

console.log(`model ${model}, one request every ${intervalMs} ms, ${cachedAtStart} cached answer(s)`);
const rows: Row[] = [];
for (const item of items) {
  const base = { id: item.id, type: item.type, split: item.split ?? "development" };
  try {
    const a = await answerQuestion(item.question, context, [], generate);
    const pass = grade(item, a);
    rows.push({
      ...base,
      status: "completed",
      pass,
      abstained: a.abstained,
      modelCalled: a.modelCalled,
      citations: a.citations.map((c) => c.id),
      invalidCitations: a.invalidCitations,
      answer: a.answer,
    });
    console.log(pass ? "PASS   " : "FAIL   ", item.id, item.type);
  } catch (err) {
    if (err instanceof ModelOutputError) {
      rows.push({ ...base, status: "completed", pass: false, malformedOutput: true });
      console.log("FAIL   ", item.id, item.type, "(model output could not be parsed)");
    } else if (err instanceof DailyQuotaError) {
      if (!dailyQuotaExhausted) console.log("        the daily request quota is exhausted; no further model calls will be made");
      dailyQuotaExhausted = true;
      rows.push({ ...base, status: "not_run", error: "daily quota exhausted" });
      console.log("NOT RUN", item.id, item.type, "(daily quota)");
    } else {
      const reason = classifyError(err).reason;
      rows.push({ ...base, status: "not_run", error: reason === "other" ? String((err as Error)?.message ?? err).slice(0, 200) : reason });
      console.log("NOT RUN", item.id, item.type, `(${reason} after retries)`);
    }
  }
}

const summary = summarise(rows);
console.log(JSON.stringify(summary, null, 2));
console.log(`requests sent to the model this run (retries included): ${requestsSent}; answers now cached: ${Object.keys(cache).length} (${cacheFile})`);

if (summary.notRun > 0) {
  console.error(
    `\n${summary.notRun} items not run` +
      (dailyQuotaExhausted ? " (the daily request quota is exhausted; run again after it resets)" : "") +
      `. results/chat-eval.json was NOT written. Completed answers are cached, so running this command again only calls the model for the ${summary.notRun} remaining.`,
  );
  process.exit(2);
}

mkdirSync("results", { recursive: true });
writeFileSync(
  "results/chat-eval.json",
  JSON.stringify(
    {
      description:
        "End-to-end chatbot evaluation with a live model on evals/chat-eval.json. Every item completed. Grading rules and their limits are in scripts/lib/chat-eval.ts.",
      model,
      generatedOn: new Date().toISOString().slice(0, 10),
      baseCommit: execSync("git rev-parse --short HEAD").toString().trim(),
      pacing: {
        intervalMs,
        retryAttempts: PATIENT_RETRY.attempts,
        retryBaseDelayMs: PATIENT_RETRY.baseDelayMs,
        retryMaxDelayMs: PATIENT_RETRY.maxDelayMs,
        retriedOn: PATIENT_RETRY.retryOn,
      },
      summary,
      items: rows,
    },
    null,
    2,
  ) + "\n",
);
console.log("\nAll items completed. Wrote results/chat-eval.json");
