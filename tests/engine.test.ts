import { describe, expect, it } from "vitest";
import { BANK } from "../src/assessment/bank";
import {
  TEST_LENGTH,
  estimate,
  pCorrect,
  progress,
  score,
  topicBreakdown,
} from "../src/assessment/engine";
import type { Response } from "../src/assessment/types";

const bank = BANK.software;

/** Runs a full session where `answer` decides correctness for each question. */
function run(seed: string, answer: (difficulty: number) => boolean) {
  const responses: Response[] = [];
  for (;;) {
    const p = progress(bank, responses, seed);
    if (p.done) return { responses, ...p };
    responses.push({ questionId: p.next!.id, correct: answer(p.next!.difficulty) });
  }
}

describe("estimate", () => {
  it("starts at the prior mean and stays finite for extreme patterns", () => {
    expect(estimate([]).theta).toBeCloseTo(0, 5);
    const allRight = estimate(Array.from({ length: 12 }, () => ({ b: 2, correct: true })));
    const allWrong = estimate(Array.from({ length: 12 }, () => ({ b: -2, correct: false })));
    expect(allRight.theta).toBeGreaterThan(2);
    expect(allWrong.theta).toBeLessThan(-2);
    expect(Number.isFinite(allRight.theta) && Number.isFinite(allWrong.theta)).toBe(true);
  });

  it("is monotonic: a correct answer never lowers the estimate, a wrong one never raises it", () => {
    const base = [
      { b: 0, correct: true },
      { b: 1, correct: false },
    ];
    for (const b of [-2, -1, 0, 1, 2]) {
      expect(estimate([...base, { b, correct: true }]).theta).toBeGreaterThan(estimate(base).theta);
      expect(estimate([...base, { b, correct: false }]).theta).toBeLessThan(estimate(base).theta);
    }
  });

  it("becomes more certain as evidence accumulates", () => {
    const few = estimate([{ b: 0, correct: true }]);
    const many = estimate(Array.from({ length: 10 }, (_, i) => ({ b: 0, correct: i % 2 === 0 })));
    expect(many.se).toBeLessThan(few.se);
  });

  it("models guessing: even very low ability has about a 25% chance", () => {
    expect(pCorrect(-10, 0)).toBeCloseTo(0.25, 3);
    expect(pCorrect(10, 0)).toBeCloseTo(1, 3);
  });
});

describe("progress", () => {
  it("starts with a mid-difficulty question", () => {
    expect(progress(bank, [], "s").next!.difficulty).toBe(3);
  });

  it("is deterministic for a given seed and varies across seeds", () => {
    const first = (seed: string) => progress(bank, [], seed).next!.id;
    expect(first("seed-a")).toBe(first("seed-a"));
    const firsts = new Set(Array.from({ length: 20 }, (_, i) => first(`seed-${i}`)));
    expect(firsts.size).toBeGreaterThan(1);
  });

  it("never repeats a question and stops at the test length", () => {
    for (const answer of [() => true, () => false, (d: number) => d <= 3]) {
      const { responses } = run("limits", answer);
      expect(new Set(responses.map((r) => r.questionId)).size).toBe(responses.length);
      expect(responses.length).toBe(TEST_LENGTH);
    }
  });

  it("adapts: questions get harder after correct answers and easier after wrong ones", () => {
    const byId = new Map(bank.map((q) => [q.id, q]));
    const mean = (rs: Response[]) =>
      rs.reduce((s, r) => s + byId.get(r.questionId)!.difficulty, 0) / rs.length;
    expect(mean(run("adapt", () => true).responses)).toBeGreaterThan(3.5);
    expect(mean(run("adapt", () => false).responses)).toBeLessThan(2.5);
  });

  it("rejects responses that reference unknown questions", () => {
    expect(() => progress(bank, [{ questionId: "nope", correct: true }], "s")).toThrow();
  });
});

describe("score", () => {
  it("orders ability levels and stays within 0..100", () => {
    const low = score(bank, run("score", () => false).estimate);
    const mid = score(bank, run("score", (d) => d <= 3).estimate);
    const high = score(bank, run("score", () => true).estimate);
    expect(low.score).toBeLessThan(mid.score);
    expect(mid.score).toBeLessThan(high.score);
    expect(low.score).toBeGreaterThanOrEqual(0);
    expect(high.score).toBeLessThanOrEqual(100);
    expect(mid.range[0]).toBeLessThanOrEqual(mid.score);
    expect(mid.range[1]).toBeGreaterThanOrEqual(mid.score);
    expect(low.level).toBe("Beginner");
    expect(high.level).toBe("Advanced");
  });

  it("breaks results down by topic", () => {
    const { responses } = run("topics", (d) => d <= 3);
    const topics = topicBreakdown(bank, responses);
    expect(topics.reduce((s, t) => s + t.total, 0)).toBe(responses.length);
    expect(topics.reduce((s, t) => s + t.correct, 0)).toBe(responses.filter((r) => r.correct).length);
  });
});
