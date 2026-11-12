// Runs evals/chat-eval.json through the real pipeline and model, and writes
// results/chat-eval.json. Needs GEMINI_API_KEY and GEMINI_CHAT_MODEL (from the
// environment or .env.local). Makes one model call per question that passes
// retrieval, so it costs a small amount of quota.
//
// Grading is automatic and deliberately simple:
//   answerable   correct = answered, contains every mustInclude string
//                (case-insensitive) and cites at least one expected passage
//   unanswerable / off_topic   pass = abstained
//   adversarial  pass = no forbidden string appears in the answer
// Substring checks can pass a wrong answer or fail a right one, so read the
// per-item output before quoting the totals.
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

if (!process.env.GEMINI_API_KEY) {
  try {
    process.loadEnvFile(".env.local");
  } catch {}
}
if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_CHAT_MODEL) {
  console.error("Set GEMINI_API_KEY and GEMINI_CHAT_MODEL (environment or .env.local) to run this evaluation.");
  process.exit(1);
}

// Imported after the environment is loaded because the client reads it at import time.
const { answerQuestion } = await import("../src/chat/answer");
const { geminiGenerate } = await import("../src/chat/gemini");

type Item = {
  id: string;
  type: "answerable" | "unanswerable" | "off_topic" | "adversarial";
  split?: string;
  question: string;
  expected?: string[];
  mustInclude?: string[];
  forbidden?: string[];
};
const { items } = JSON.parse(readFileSync("evals/chat-eval.json", "utf8")) as { items: Item[] };
const context = { targetRole: null, educationLevel: null, results: [] };
const has = (text: string, needle: string) => text.toLowerCase().includes(needle.toLowerCase());

const rows = [];
for (const item of items) {
  try {
    const a = await answerQuestion(item.question, context, [], geminiGenerate);
    const cited = a.citations.map((c) => c.id);
    let pass: boolean;
    if (item.type === "answerable") {
      pass =
        !a.abstained &&
        (item.mustInclude ?? []).every((m) => has(a.answer, m)) &&
        cited.some((id) => item.expected!.includes(id));
    } else if (item.type === "adversarial") {
      pass = (item.forbidden ?? []).every((f) => !has(a.answer, f));
    } else {
      pass = a.abstained;
    }
    rows.push({ id: item.id, type: item.type, split: item.split ?? "development", pass, abstained: a.abstained, modelCalled: a.modelCalled, citations: cited, invalidCitations: a.invalidCitations, answer: a.answer });
    console.log(pass ? "PASS" : "FAIL", item.id, item.type);
  } catch (err) {
    rows.push({ id: item.id, type: item.type, split: item.split ?? "development", pass: false, error: err instanceof Error ? err.message : String(err) });
    console.log("ERROR", item.id, err instanceof Error ? err.message : err);
  }
  await new Promise((r) => setTimeout(r, 500));
}

const rate = (group: typeof rows) => ({
  total: group.length,
  passed: group.filter((r) => r.pass).length,
  rate: group.length ? Number((group.filter((r) => r.pass).length / group.length).toFixed(3)) : null,
});
const of = (type: string, split?: string) => rows.filter((r) => r.type === type && (!split || r.split === split));
const called = rows.filter((r) => "modelCalled" in r && r.modelCalled);

const result = {
  description:
    "End-to-end chatbot evaluation with a live model on evals/chat-eval.json. See scripts/eval-chat.mts for the grading rules and their limits.",
  model: process.env.GEMINI_CHAT_MODEL,
  baseCommit: execSync("git rev-parse --short HEAD").toString().trim(),
  generatedOn: new Date().toISOString().slice(0, 10),
  summary: {
    answerableCorrect: { development: rate(of("answerable", "development")), heldout: rate(of("answerable", "heldout")) },
    unanswerableAbstained: rate(of("unanswerable")),
    offTopicAbstained: rate(of("off_topic")),
    adversarialResisted: rate(of("adversarial")),
    // Share of model answers whose citations were all among the retrieved passages, before the server filter.
    rawCitationValidity: called.length
      ? Number((called.filter((r) => "invalidCitations" in r && r.invalidCitations!.length === 0).length / called.length).toFixed(3))
      : null,
    errors: rows.filter((r) => "error" in r).length,
  },
  items: rows,
};
mkdirSync("results", { recursive: true });
writeFileSync("results/chat-eval.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result.summary, null, 2));
