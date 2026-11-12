// Passage retrieval for the chatbot: BM25 over the curated careers dataset.
// ponytail: in-process lexical ranking is enough for ~70 passages and scores
// well on evals/chat-eval.json (see results/retrieval-eval.json). Move to
// embeddings + pgvector when the corpus grows or paraphrase recall drops.
import { PASSAGES, type Passage } from "@/careers/dataset";

const STOPWORDS = new Set(
  "a an and are as at be by can do does for from how i in is it me my of on or should so than that the their them then there these they this to was we what when where which who why will with would you your about into need needs want".split(
    " ",
  ),
);

// Query-side expansions for common abbreviations and synonyms.
const SYNONYMS: Record<string, string[]> = {
  ml: ["machine", "learning"],
  ai: ["machine", "learning"],
  llm: ["language", "model"],
  llms: ["language", "model"],
  sre: ["site", "reliability"],
  tester: ["qa", "test"],
  testers: ["qa", "test"],
  begin: ["start"],
  beginner: ["start"],
  become: ["start"],
  learn: ["start"],
  study: ["start"],
  difference: ["compare", "emphasis"],
  versus: ["or"],
  vs: ["or"],
  interpret: ["result", "estimate"],
  career: ["role"],
  careers: ["role"],
  job: ["role"],
  jobs: ["role"],
};

function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("es") && !word.endsWith("ses")) return word.slice(0, -1);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

export function tokenize(text: string, expand = false): string[] {
  const out: string[] = [];
  for (const raw of text.toLowerCase().split(/[^a-z0-9/]+/)) {
    for (const word of raw.split("/")) {
      if (!word || STOPWORDS.has(word)) continue;
      out.push(stem(word));
      if (expand) for (const syn of SYNONYMS[word] ?? []) out.push(stem(syn));
    }
  }
  return out;
}

const K1 = 1.4;
const B = 0.6;

const TITLE_WEIGHT = 2;

// Title and body are separate fields. Words from a passage's own title are left
// out of its body, so every section of a role gets the same credit for the role
// being named and sections compete only on what they actually say.
const docs = PASSAGES.map((p) => {
  const title = new Set(tokenize(p.title));
  const tokens = tokenize(`${p.section} ${p.text}`).filter((t) => !title.has(t));
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return { passage: p, title, tf, length: tokens.length };
});
const avgLength = docs.reduce((s, d) => s + d.length, 0) / docs.length;

function inverseDocumentFrequency(field: (d: (typeof docs)[number]) => Iterable<string>) {
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(field(d))) df.set(t, (df.get(t) ?? 0) + 1);
  return (t: string) => {
    const n = df.get(t) ?? 0;
    return Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
  };
}
const bodyIdf = inverseDocumentFrequency((d) => d.tf.keys());
const titleIdf = inverseDocumentFrequency((d) => d.title);

export const TOP_K = 4;
/** Below this best score the question is treated as outside the dataset. */
export const MIN_SCORE = 3;

export type Retrieved = { passage: Passage; score: number };

export function retrieve(query: string, k = TOP_K): Retrieved[] {
  const terms = [...new Set(tokenize(query, true))];
  const scored = docs
    .map((d) => {
      let score = 0;
      for (const t of terms) {
        if (d.title.has(t)) score += TITLE_WEIGHT * titleIdf(t);
        const f = d.tf.get(t);
        if (!f) continue;
        score += (bodyIdf(t) * f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.length) / avgLength));
      }
      return { passage: d.passage, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.passage.id.localeCompare(b.passage.id));
  if (scored.length === 0 || scored[0].score < MIN_SCORE) return [];
  return scored.slice(0, k);
}
