import { describe, expect, it, vi } from "vitest";
import { cachedGenerate, grade, pacer, summarise, type Cache, type Item, type Row } from "../scripts/lib/chat-eval";
import type { Answer, Generate } from "../src/chat/answer";
import { PASSAGE_BY_ID } from "../src/careers/dataset";

const answer = (over: Partial<Answer>): Answer => ({
  answer: "x", citations: [], abstained: false, invalidCitations: [], modelCalled: true, ...over,
});
const completed = (id: string, type: Item["type"], pass: boolean, split = "development"): Row => ({
  id, type, split, status: "completed", pass, abstained: false, modelCalled: true, citations: [], invalidCitations: [], answer: "x",
});
const notRun = (id: string, type: Item["type"], split = "development"): Row => ({ id, type, split, status: "not_run", error: "rate_limit" });

describe("summarise", () => {
  it("never counts an item that did not run as a failure", () => {
    // The reported case: 26 development questions, 17 completed with 15 passing, 9 errored.
    const rows: Row[] = [
      ...Array.from({ length: 15 }, (_, i) => completed(`p${i}`, "answerable", true)),
      ...Array.from({ length: 2 }, (_, i) => completed(`f${i}`, "answerable", false)),
      ...Array.from({ length: 9 }, (_, i) => notRun(`n${i}`, "answerable")),
    ];
    const s = summarise(rows);
    expect(s.answerableCorrect.development).toEqual({ total: 26, completed: 17, passed: 15, rate: 0.882 });
    expect(s).toMatchObject({ items: 26, completed: 17, notRun: 9 });
  });

  it("reports no rate at all for a group where nothing completed", () => {
    const s = summarise([notRun("a", "adversarial"), notRun("b", "adversarial")]);
    expect(s.adversarialResisted).toEqual({ total: 2, completed: 0, passed: 0, rate: null });
    expect(s.rawCitationValidity).toBeNull();
  });

  it("counts unusable model output as a completed failure, separately from API errors", () => {
    const s = summarise([
      completed("a", "answerable", true),
      { id: "b", type: "answerable", split: "development", status: "completed", pass: false, malformedOutput: true },
      notRun("c", "answerable"),
    ]);
    expect(s.answerableCorrect.development).toMatchObject({ completed: 2, passed: 1, rate: 0.5 });
    expect(s).toMatchObject({ malformedOutputs: 1, notRun: 1 });
  });

  it("keeps the held-out split separate", () => {
    const s = summarise([completed("a", "answerable", true), completed("h", "answerable", false, "heldout")]);
    expect(s.answerableCorrect.development.rate).toBe(1);
    expect(s.answerableCorrect.heldout.rate).toBe(0);
  });
});

describe("grade", () => {
  const cite = (id: string) => PASSAGE_BY_ID.get(id)!;
  const item: Item = { id: "a", type: "answerable", question: "q", expected: ["data-analyst#work"], mustInclude: ["SQL"] };

  it("requires the required words and an expected citation for answerable items", () => {
    expect(grade(item, answer({ answer: "They use sql daily.", citations: [cite("data-analyst#work")] }))).toBe(true);
    expect(grade(item, answer({ answer: "They use sql daily.", citations: [cite("ui-designer#work")] }))).toBe(false);
    expect(grade(item, answer({ answer: "They make charts.", citations: [cite("data-analyst#work")] }))).toBe(false);
    expect(grade(item, answer({ answer: "SQL", citations: [cite("data-analyst#work")], abstained: true }))).toBe(false);
  });

  it("requires abstention for unanswerable and off-topic items, and no forbidden text for adversarial ones", () => {
    expect(grade({ id: "u", type: "unanswerable", question: "q" }, answer({ abstained: true }))).toBe(true);
    expect(grade({ id: "o", type: "off_topic", question: "q" }, answer({ abstained: false }))).toBe(false);
    const x: Item = { id: "x", type: "adversarial", question: "q", forbidden: ["PWNED-7391"] };
    expect(grade(x, answer({ answer: "I can't help with that." }))).toBe(true);
    expect(grade(x, answer({ answer: "pwned-7391" }))).toBe(false);
  });
});

describe("cachedGenerate", () => {
  it("calls the model once per distinct prompt and persists each new answer", async () => {
    const cache: Cache = {};
    const model = vi.fn<Generate>(async (_s, user) => JSON.stringify({ echo: user }));
    const store = vi.fn();
    const g = cachedGenerate(model, "model-a", cache, store);
    await g("sys", "q1");
    await g("sys", "q1");
    await g("sys", "q2");
    expect(model).toHaveBeenCalledTimes(2);
    expect(g.calls()).toBe(2);
    expect(store).toHaveBeenCalledTimes(2);

    // A second run with the saved cache makes no calls at all.
    const again = vi.fn<Generate>();
    const g2 = cachedGenerate(again, "model-a", cache, store);
    expect(await g2("sys", "q1")).toBe(JSON.stringify({ echo: "q1" }));
    expect(again).not.toHaveBeenCalled();
  });

  it("does not reuse answers across models or after the prompt changes", async () => {
    const cache: Cache = {};
    const model = vi.fn<Generate>(async () => "{}");
    await cachedGenerate(model, "model-a", cache, () => {})("sys", "q");
    await cachedGenerate(model, "model-b", cache, () => {})("sys", "q");
    await cachedGenerate(model, "model-a", cache, () => {})("sys v2", "q");
    expect(model).toHaveBeenCalledTimes(3);
  });

  it("does not cache failed calls or unparseable output", async () => {
    const cache: Cache = {};
    const outcomes: (string | Error)[] = [new Error("503"), "<html>bad gateway", "{\"ok\":true}"];
    const model = vi.fn<Generate>(async () => {
      const next = outcomes.shift()!;
      if (next instanceof Error) throw next;
      return next;
    });
    const g = cachedGenerate(model, "m", cache, () => {});
    await expect(g("s", "q")).rejects.toThrow("503");
    expect(await g("s", "q")).toBe("<html>bad gateway");
    expect(Object.keys(cache)).toHaveLength(0);
    expect(await g("s", "q")).toBe("{\"ok\":true}");
    expect(Object.keys(cache)).toHaveLength(1);
  });
});

describe("pacer", () => {
  it("lets the first call through and spaces the rest by the interval", async () => {
    let clock = 1000;
    const sleeps: number[] = [];
    const pace = pacer(5000, () => clock, async (ms) => { sleeps.push(ms); clock += ms; });
    await pace();
    await pace();
    clock += 1200; // the request itself took 1.2 s
    await pace();
    clock += 9000; // a slow request: no extra wait is needed afterwards
    await pace();
    expect(sleeps).toEqual([5000, 3800]);
  });
});
