import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BANK } from "../src/assessment/bank";
import { TEST_LENGTH } from "../src/assessment/engine";
import {
  getAssessment,
  listAssessments,
  startAssessment,
  submitAnswer,
} from "../src/assessment/service";
import * as schema from "../src/db/schema";

const client = new PGlite();
const db = drizzle(client, { schema });
let alice: string;
let bob: string;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" });
  const rows = await db
    .insert(schema.users)
    .values([{ email: "alice@example.com" }, { email: "bob@example.com" }])
    .returning();
  [alice, bob] = rows.map((r) => r.id);
});
afterAll(() => client.close());

const correctChoice = (questionId: string) =>
  BANK.software.find((q) => q.id === questionId)!.correct;

async function inProgress(userId: string, id: string) {
  const view = await getAssessment(db, userId, id);
  if (view?.status !== "in_progress") throw new Error("expected an in-progress assessment");
  return view;
}

describe("assessment service", () => {
  it("resumes the unfinished attempt instead of starting a second one", async () => {
    const first = await startAssessment(db, alice, "software");
    expect(await startAssessment(db, alice, "software")).toBe(first);
    expect(await startAssessment(db, alice, "data-ai")).not.toBe(first);
    const [a, b] = await Promise.all([
      startAssessment(db, bob, "ui-ux"),
      startAssessment(db, bob, "ui-ux"),
    ]);
    expect(a).toBe(b);
  });

  it("never exposes the answer or explanation of an unanswered question", async () => {
    const id = await startAssessment(db, alice, "software");
    const view = await inProgress(alice, id);
    expect(Object.keys(view.next).sort()).toEqual(["id", "options", "prompt", "topic"]);
    expect(JSON.stringify(view)).not.toContain(
      BANK.software.find((q) => q.id === view.next.id)!.explanation,
    );
  });

  it("hides other users' assessments and rejects their submissions", async () => {
    const id = await startAssessment(db, alice, "software");
    const view = await inProgress(alice, id);
    expect(await getAssessment(db, bob, id)).toBeNull();
    expect(await submitAnswer(db, bob, id, view.next.id, 0)).toBe("not_found");
    expect((await inProgress(alice, id)).answeredCount).toBe(0);
  });

  it("accepts only the expected question, once", async () => {
    const id = await startAssessment(db, alice, "software");
    const view = await inProgress(alice, id);
    const other = BANK.software.find((q) => q.id !== view.next.id)!;

    expect(await submitAnswer(db, alice, id, other.id, other.correct)).toBe("ignored");
    expect(await submitAnswer(db, alice, id, view.next.id, correctChoice(view.next.id))).toBe("recorded");
    // Replaying the same form, for example to change a wrong answer, does nothing.
    expect(await submitAnswer(db, alice, id, view.next.id, 0)).toBe("ignored");

    const after = await inProgress(alice, id);
    expect(after.answeredCount).toBe(1);
    expect(after.answered[0].correct).toBe(true);
    expect(after.next.id).not.toBe(view.next.id);
  });

  it("records a concurrent double submit only once", async () => {
    const id = await startAssessment(db, bob, "software");
    const view = await inProgress(bob, id);
    const outcomes = await Promise.all([
      submitAnswer(db, bob, id, view.next.id, 1),
      submitAnswer(db, bob, id, view.next.id, 2),
    ]);
    expect(outcomes.filter((o) => o === "recorded")).toHaveLength(1);
    expect((await inProgress(bob, id)).answeredCount).toBe(1);
  });

  it("completes after the full test, stores the result and then refuses more answers", async () => {
    const id = await startAssessment(db, alice, "software");
    for (;;) {
      const view = await getAssessment(db, alice, id);
      if (view!.status !== "in_progress") break;
      await submitAnswer(db, alice, id, view!.next.id, correctChoice(view!.next.id));
    }
    const done = await getAssessment(db, alice, id);
    if (done?.status !== "completed") throw new Error("expected completion");
    expect(done.answeredCount).toBe(TEST_LENGTH);
    expect(done.result.level).toBe("Advanced");
    expect(done.topics.reduce((s, t) => s + t.total, 0)).toBe(TEST_LENGTH);

    const [row] = await db.select().from(schema.assessments).where(eq(schema.assessments.id, id));
    expect(row.status).toBe("completed");
    expect(row.score).toBe(done.result.score);
    expect(row.completedAt).not.toBeNull();

    expect(await submitAnswer(db, alice, id, "sw-001", 1)).toBe("ignored");
    // A new attempt can now be started for the same domain.
    expect(await startAssessment(db, alice, "software")).not.toBe(id);

    const list = await listAssessments(db, alice);
    expect(list.find((a) => a.id === id)?.score).toBe(done.result.score);
    expect((await listAssessments(db, bob)).some((a) => a.id === id)).toBe(false);
  });

  it("enforces domain, choice and one-open-attempt rules in the database itself", async () => {
    await expect(db.insert(schema.assessments).values({ userId: bob, domain: "cooking" })).rejects.toThrow();
    const id = await startAssessment(db, bob, "data-ai");
    await expect(db.insert(schema.assessments).values({ userId: bob, domain: "data-ai" })).rejects.toThrow();
    await expect(
      db.insert(schema.assessmentAnswers).values({
        assessmentId: id, position: 0, questionId: "da-001", choice: 7, isCorrect: false,
      }),
    ).rejects.toThrow();
  });

  it("deleting a user removes their assessments and answers", async () => {
    const [carol] = await db.insert(schema.users).values({ email: "carol@example.com" }).returning();
    const id = await startAssessment(db, carol.id, "software");
    const view = await inProgress(carol.id, id);
    await submitAnswer(db, carol.id, id, view.next.id, 0);
    await db.delete(schema.users).where(eq(schema.users.id, carol.id));
    expect(await db.select().from(schema.assessmentAnswers).where(eq(schema.assessmentAnswers.assessmentId, id))).toHaveLength(0);
  });
});
