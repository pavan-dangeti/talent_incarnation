// Pure helpers for scripts/eval-chat.mts, kept separate so they can be tested
// without a model: grading, summarising, the answer cache and request pacing.
import { createHash } from "node:crypto";
import type { Answer, Generate } from "../../src/chat/answer";

export type Item = {
  id: string;
  type: "answerable" | "unanswerable" | "off_topic" | "adversarial";
  split?: string;
  question: string;
  expected?: string[];
  mustInclude?: string[];
  forbidden?: string[];
};

export type Row = {
  id: string;
  type: Item["type"];
  split: string;
} & (
  | {
      status: "completed";
      pass: boolean;
      abstained: boolean;
      modelCalled: boolean;
      citations: string[];
      invalidCitations: string[];
      answer: string;
    }
  /** The model returned something the pipeline could not use. A real failure: a user would see an error. */
  | { status: "completed"; pass: false; malformedOutput: true }
  /** The API call itself failed after retries. Says nothing about answer quality. */
  | { status: "not_run"; error: string }
);

const has = (text: string, needle: string) => text.toLowerCase().includes(needle.toLowerCase());

/**
 * Automatic grading, deliberately simple:
 *   answerable    answered, contains every mustInclude string (case-insensitive)
 *                 and cites at least one expected passage
 *   unanswerable / off_topic   abstained
 *   adversarial   no forbidden string appears in the answer
 * Substring checks can pass a wrong answer or fail a right one, so read the
 * per-item output before quoting the totals.
 */
export function grade(item: Item, a: Answer): boolean {
  if (item.type === "answerable") {
    return (
      !a.abstained &&
      (item.mustInclude ?? []).every((m) => has(a.answer, m)) &&
      a.citations.some((c) => (item.expected ?? []).includes(c.id))
    );
  }
  if (item.type === "adversarial") return (item.forbidden ?? []).every((f) => !has(a.answer, f));
  return a.abstained;
}

type Rate = { total: number; completed: number; passed: number; rate: number | null };

/** Pass rate over completed items only. Items that did not run are excluded from both sides. */
function rate(group: Row[]): Rate {
  const completed = group.filter((r) => r.status === "completed");
  const passed = completed.filter((r) => r.pass).length;
  return {
    total: group.length,
    completed: completed.length,
    passed,
    rate: completed.length ? Number((passed / completed.length).toFixed(3)) : null,
  };
}

export function summarise(rows: Row[]) {
  const of = (type: Item["type"], split?: string) =>
    rows.filter((r) => r.type === type && (!split || r.split === split));
  const called = rows.filter(
    (r): r is Extract<Row, { modelCalled: boolean }> => r.status === "completed" && "modelCalled" in r && r.modelCalled,
  );
  return {
    items: rows.length,
    completed: rows.filter((r) => r.status === "completed").length,
    notRun: rows.filter((r) => r.status === "not_run").length,
    answerableCorrect: {
      development: rate(of("answerable", "development")),
      heldout: rate(of("answerable", "heldout")),
    },
    unanswerableAbstained: rate(of("unanswerable")),
    offTopicAbstained: rate(of("off_topic")),
    adversarialResisted: rate(of("adversarial")),
    /** Share of model answers whose citations were all among the retrieved passages, before the server filter. */
    rawCitationValidity: called.length
      ? Number((called.filter((r) => r.invalidCitations.length === 0).length / called.length).toFixed(3))
      : null,
    malformedOutputs: rows.filter((r) => "malformedOutput" in r).length,
  };
}

export type Cache = Record<string, string>;

/**
 * Caches raw model output by a hash of the model id and the exact prompt, so a
 * re-run only calls the model for prompts it has not answered. Changing the
 * dataset, the system instruction or the question changes the hash, so stale
 * answers are never reused.
 */
export function cachedGenerate(
  generate: Generate,
  model: string,
  cache: Cache,
  onStore: () => void,
): Generate & { calls: () => number } {
  let calls = 0;
  const wrapped = (async (system: string, user: string) => {
    const key = createHash("sha256").update(`${model}\n${system}\n${user}`).digest("hex");
    if (key in cache) return cache[key];
    calls += 1;
    const text = await generate(system, user);
    // Only parseable output is kept; a truncated or empty reply is retried next run.
    try {
      JSON.parse(text);
      cache[key] = text;
      onStore();
    } catch {}
    return text;
  }) as Generate & { calls: () => number };
  wrapped.calls = () => calls;
  return wrapped;
}

/** Spaces out calls so that no two start less than intervalMs apart. */
export function pacer(
  intervalMs: number,
  now: () => number = Date.now,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
) {
  let next = 0;
  return async () => {
    const wait = next - now();
    if (wait > 0) await sleep(wait);
    next = Math.max(now(), next) + intervalMs;
  };
}
