import { beforeAll, describe, expect, it } from "vitest";
import { BANK } from "../src/assessment/bank";
import { TEST_LENGTH } from "../src/assessment/engine";
import { getAssessment, listAssessments, startAssessment, submitAnswer } from "../src/assessment/service";
import { listMessages, sendMessage } from "../src/chat/service";
import * as schema from "../src/db/schema";
import { createTestDb } from "./test-db";

// Every query is a network round trip to the database in production, so the
// number of queries per request is a latency budget. These tests pin it.
let queries = 0;
const db = createTestDb({ logger: { logQuery: () => void (queries += 1) } });
let userId: string;

async function count(run: () => Promise<unknown>) {
  queries = 0;
  await run();
  return queries;
}

beforeAll(async () => {
  [{ id: userId }] = await db.insert(schema.users).values({ email: "q@example.com" }).returning();
});

describe("database queries per request (excluding the one session lookup)", () => {
  it("stays within budget", async () => {
    const counts: Record<string, number> = {};
    counts["assessment list page"] = await count(() => listAssessments(db, userId));
    let id = "";
    counts["start assessment"] = await count(async () => { id = await startAssessment(db, userId, "software"); });
    counts["question page"] = await count(() => getAssessment(db, userId, id));
    const next = async () => {
      const v = await getAssessment(db, userId, id);
      if (v?.status !== "in_progress") throw new Error("not in progress");
      return v.next.id;
    };
    let q = await next();
    counts["submit answer (mid-test)"] = await count(() => submitAnswer(db, userId, id, q, BANK.software.find((x) => x.id === q)!.correct));
    for (let i = 1; i < TEST_LENGTH - 1; i++) { q = await next(); await submitAnswer(db, userId, id, q, 0); }
    q = await next();
    counts["submit answer (last question)"] = await count(() => submitAnswer(db, userId, id, q, 0));
    counts["results page"] = await count(() => getAssessment(db, userId, id));
    counts["chat page"] = await count(() => listMessages(db, userId));
    counts["send chat message"] = await count(() =>
      sendMessage(db, userId, "What does a data analyst do?", async () =>
        JSON.stringify({ answer: "x", citations: ["data-analyst#work"], abstained: false })),
    );
    // Before the latency work these were 1, 2, 2, 5, 6, 2, 1 and 8.
    expect(counts).toEqual({
      "assessment list page": 1,
      "start assessment": 2,
      "question page": 2, // run in parallel
      "submit answer (mid-test)": 3, // two reads in parallel, then one insert
      "submit answer (last question)": 4,
      "results page": 2, // run in parallel
      "chat page": 1,
      "send chat message": 7, // four sequential steps; the rest run in parallel
    });
  });
});
