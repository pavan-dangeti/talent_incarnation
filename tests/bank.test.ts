import { describe, expect, it } from "vitest";
import { BANK } from "../src/assessment/bank";
import { DOMAINS } from "../src/assessment/types";

const all = DOMAINS.flatMap((d) => BANK[d]);

describe("question bank", () => {
  it("has unique ids and unique prompts", () => {
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
    expect(new Set(all.map((q) => q.prompt)).size).toBe(all.length);
  });

  it.each(DOMAINS)("%s: every difficulty level has at least 6 questions", (domain) => {
    for (const level of [1, 2, 3, 4, 5]) {
      expect(BANK[domain].filter((q) => q.difficulty === level).length).toBeGreaterThanOrEqual(6);
    }
  });

  it("every question is well-formed", () => {
    for (const q of all) {
      expect(BANK[q.domain]).toContain(q);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size, `${q.id} has duplicate options`).toBe(4);
      expect([0, 1, 2, 3]).toContain(q.correct);
      expect(q.prompt.trim().length).toBeGreaterThan(10);
      expect(q.explanation.trim().length).toBeGreaterThan(20);
      expect(q.topic.trim()).not.toBe("");
    }
  });

  it("does not give the answer away by position", () => {
    // Each answer slot should be used roughly equally within a domain.
    for (const domain of DOMAINS) {
      for (const slot of [0, 1, 2, 3]) {
        const share = BANK[domain].filter((q) => q.correct === slot).length / BANK[domain].length;
        expect(share, `${domain} slot ${slot}`).toBeGreaterThan(0.15);
        expect(share, `${domain} slot ${slot}`).toBeLessThan(0.35);
      }
    }
  });
});
