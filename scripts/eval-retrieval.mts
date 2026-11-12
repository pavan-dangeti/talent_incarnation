// Measures retrieval on evals/chat-eval.json without calling any model.
// Writes results/retrieval-eval.json. Deterministic.
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PASSAGES } from "../src/careers/dataset";
import { MIN_SCORE, TOP_K, retrieve } from "../src/chat/retrieval";

type Item = { id: string; type: string; split?: string; question: string; expected?: string[] };
const { items } = JSON.parse(readFileSync("evals/chat-eval.json", "utf8")) as { items: Item[] };

const known = new Set(PASSAGES.map((p) => p.id));
for (const it of items) for (const e of it.expected ?? []) if (!known.has(e)) throw new Error(`${it.id}: unknown passage ${e}`);

const round = (x: number) => Number(x.toFixed(3));
function measure(group: Item[]) {
  const misses: { id: string; question: string; retrieved: string[] }[] = [];
  let hits = 0, top1 = 0, rr = 0;
  for (const it of group) {
    const ids = retrieve(it.question).map((r) => r.passage.id);
    const rank = ids.findIndex((id) => it.expected!.includes(id));
    if (rank >= 0) { hits += 1; rr += 1 / (rank + 1); if (rank === 0) top1 += 1; }
    else misses.push({ id: it.id, question: it.question, retrieved: ids });
  }
  return {
    total: group.length,
    hitAtK: round(hits / group.length),
    hitAt1: round(top1 / group.length),
    meanReciprocalRank: round(rr / group.length),
    misses,
  };
}
const answerable = items.filter((i) => i.type === "answerable");
const development = measure(answerable.filter((i) => i.split !== "heldout"));
const heldout = measure(answerable.filter((i) => i.split === "heldout"));

const gate = (type: string) => {
  const group = items.filter((i) => i.type === type);
  const rejected = group.filter((i) => retrieve(i.question).length === 0);
  return { total: group.length, rejectedBeforeModel: rejected.length, passedToModel: group.filter((i) => !rejected.includes(i)).map((i) => i.id) };
};

const result = {
  description:
    "BM25 retrieval over the curated careers dataset, measured on evals/chat-eval.json. A hit means at least one expected passage is in the top k. Retrieval was tuned on the development split only; the heldout split is the number to trust. The gate rows show how many non-answerable questions retrieval alone rejects; the rest rely on the model abstaining.",
  baseCommit: execSync("git rev-parse --short HEAD").toString().trim(),
  generatedOn: new Date().toISOString().slice(0, 10),
  config: { passages: PASSAGES.length, topK: TOP_K, minScore: MIN_SCORE },
  development,
  heldout,
  offTopic: gate("off_topic"),
  unanswerable: gate("unanswerable"),
};

mkdirSync("results", { recursive: true });
writeFileSync("results/retrieval-eval.json", JSON.stringify(result, null, 2) + "\n");
for (const [name, r] of Object.entries({ development, heldout })) {
  console.log(`${name}: hit@${TOP_K} ${r.hitAtK}, hit@1 ${r.hitAt1}, MRR ${r.meanReciprocalRank} (${r.total} questions)`);
  if (name === "development") for (const m of r.misses) console.log("  MISS", m.id, m.question, "->", m.retrieved.join(", "));
}
console.log(`off-topic rejected before the model: ${result.offTopic.rejectedBeforeModel}/${result.offTopic.total}; unanswerable: ${result.unanswerable.rejectedBeforeModel}/${result.unanswerable.total}`);
