// Adaptive assessment engine. Pure functions, no I/O.
//
// Model: three-parameter logistic IRT with fixed discrimination (a = 1) and a
// fixed guessing floor (c = 0.25, four options). Item difficulty b comes from
// the author-assigned level 1..5. Ability is estimated with EAP (posterior
// mean on a grid, normal prior), which stays finite for all-correct and
// all-wrong response patterns where maximum likelihood diverges.
import type { Difficulty, Question, Response } from "./types";

export const GUESS = 0.25;
export const PRIOR_SD = 1.5;
/**
 * Fixed test length. A variable-length rule (stop at a target standard error)
 * was simulated and never triggered before 15 questions with this bank, so it
 * was removed rather than kept as dead code.
 */
export const TEST_LENGTH = 15;

const GRID: readonly number[] = Array.from({ length: 81 }, (_, i) => -4 + i * 0.1);

/** Level 1..5 mapped to logits -2..2. */
export function difficultyToLogit(d: Difficulty): number {
  return d - 3;
}

const logistic = (x: number) => 1 / (1 + Math.exp(-x));

/** Probability of a correct answer, guessing included. */
export function pCorrect(theta: number, b: number): number {
  return GUESS + (1 - GUESS) * logistic(theta - b);
}

export type Estimate = { theta: number; se: number };

/** EAP ability estimate from scored responses. `items` are (difficulty logit, correct) pairs. */
export function estimate(items: readonly { b: number; correct: boolean }[]): Estimate {
  let total = 0;
  let mean = 0;
  const weights = GRID.map((theta) => {
    let logW = -(theta * theta) / (2 * PRIOR_SD * PRIOR_SD);
    for (const { b, correct } of items) {
      const p = pCorrect(theta, b);
      logW += Math.log(correct ? p : 1 - p);
    }
    return Math.exp(logW);
  });
  for (let i = 0; i < GRID.length; i++) {
    total += weights[i];
    mean += weights[i] * GRID[i];
  }
  mean /= total;
  let variance = 0;
  for (let i = 0; i < GRID.length; i++) variance += weights[i] * (GRID[i] - mean) ** 2;
  return { theta: mean, se: Math.sqrt(variance / total) };
}

/** Fisher information of an item at ability theta under the 3PL model. */
export function information(theta: number, b: number): number {
  const p = pCorrect(theta, b);
  const l = logistic(theta - b);
  return ((1 - GUESS) * l * (1 - l)) ** 2 / (p * (1 - p));
}

/** Deterministic PRNG (mulberry32) so a session's question order is reproducible from its id. */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Progress = {
  estimate: Estimate;
  done: boolean;
  /** The question to ask next; null once `done`. */
  next: Question | null;
};

/**
 * Replays the responses so far and decides what happens next. Deterministic in
 * (bank, responses, seed), so the server can recompute the expected question
 * on every request instead of storing it.
 */
export function progress(
  bank: readonly Question[],
  responses: readonly Response[],
  seed: string,
): Progress {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const items = responses.map((r) => {
    const q = byId.get(r.questionId);
    if (!q) throw new Error(`Unknown question id: ${r.questionId}`);
    return { b: difficultyToLogit(q.difficulty), correct: r.correct, topic: q.topic };
  });
  const est = estimate(items);

  const asked = new Set(responses.map((r) => r.questionId));
  const remaining = bank.filter((q) => !asked.has(q.id));
  const n = responses.length;
  const done = remaining.length === 0 || n >= TEST_LENGTH;
  if (done) return { estimate: est, done, next: null };

  // Most informative item at the current estimate; among near-ties prefer the
  // least-covered topic, then a seeded random pick so sessions differ.
  const topicCount = new Map<string, number>();
  for (const it of items) topicCount.set(it.topic, (topicCount.get(it.topic) ?? 0) + 1);
  const scored = remaining.map((q) => ({
    q,
    info: information(est.theta, difficultyToLogit(q.difficulty)),
  }));
  const best = Math.max(...scored.map((s) => s.info));
  const candidates = scored.filter((s) => s.info >= best - 1e-9).map((s) => s.q);
  const minTopic = Math.min(...candidates.map((q) => topicCount.get(q.topic) ?? 0));
  const pool = candidates.filter((q) => (topicCount.get(q.topic) ?? 0) === minTopic);

  const rand = seededRandom(`${seed}:${n}`);
  return { estimate: est, done, next: pool[Math.floor(rand() * pool.length)] };
}

export const LEVELS = ["Beginner", "Developing", "Proficient", "Advanced"] as const;
export type Level = (typeof LEVELS)[number];

export type Score = {
  /** 0..100: expected share of the whole bank this person knows (guessing excluded). */
  score: number;
  level: Level;
  /** Scores one standard error below and above the estimate. */
  range: [number, number];
};

export function score(bank: readonly Question[], est: Estimate): Score {
  const at = (theta: number) =>
    Math.round(
      (bank.reduce((sum, q) => sum + logistic(theta - difficultyToLogit(q.difficulty)), 0) /
        bank.length) *
        100,
    );
  const s = at(est.theta);
  // Bands are one logit wide on the ability scale, centred on the bank's middle difficulty.
  const level: Level =
    est.theta < -1 ? "Beginner" : est.theta < 0 ? "Developing" : est.theta < 1 ? "Proficient" : "Advanced";
  return { score: s, level, range: [at(est.theta - est.se), at(est.theta + est.se)] };
}

export type TopicResult = { topic: string; correct: number; total: number };

export function topicBreakdown(
  bank: readonly Question[],
  responses: readonly Response[],
): TopicResult[] {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const out = new Map<string, TopicResult>();
  for (const r of responses) {
    const topic = byId.get(r.questionId)?.topic;
    if (!topic) continue;
    const t = out.get(topic) ?? { topic, correct: 0, total: 0 };
    t.total += 1;
    if (r.correct) t.correct += 1;
    out.set(topic, t);
  }
  return [...out.values()].sort((a, b) => a.topic.localeCompare(b.topic));
}
