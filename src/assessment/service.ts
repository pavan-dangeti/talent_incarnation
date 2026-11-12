// Assessment persistence and rules. Every function takes the database and the
// session's user id, and every query is scoped by that user id.
import { and, asc, desc, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "@/db/schema";
import { BANK } from "./bank";
import {
  TEST_LENGTH,
  progress,
  score,
  topicBreakdown,
  type Estimate,
  type Score,
  type TopicResult,
} from "./engine";
import type { Domain, Question } from "./types";

type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
const { assessments, assessmentAnswers } = schema;

/** A question as the client may see it before answering: no answer, no explanation. */
export type PublicQuestion = Pick<Question, "id" | "topic" | "prompt" | "options">;

export type Reviewed = {
  question: Question;
  choice: number;
  correct: boolean;
};

export type AssessmentView = {
  id: string;
  domain: Domain;
  answeredCount: number;
  totalQuestions: number;
  /** Answered questions in order, with correct answers and explanations. */
  answered: Reviewed[];
} & (
  | { status: "in_progress"; next: PublicQuestion }
  | { status: "completed"; result: Score; topics: TopicResult[]; completedAt: Date }
);

export async function startAssessment(db: Db, userId: string, domain: Domain): Promise<string> {
  const existing = () =>
    db
      .select({ id: assessments.id })
      .from(assessments)
      .where(
        and(
          eq(assessments.userId, userId),
          eq(assessments.domain, domain),
          eq(assessments.status, "in_progress"),
        ),
      );
  const [open] = await existing();
  if (open) return open.id;

  // The partial unique index turns a concurrent second start into a no-op.
  const [created] = await db
    .insert(assessments)
    .values({ userId, domain })
    .onConflictDoNothing()
    .returning({ id: assessments.id });
  return created?.id ?? (await existing())[0].id;
}

async function load(db: Db, userId: string, id: string) {
  // Independent queries, run together. The answers are only returned if the
  // ownership check on the assessment row passes.
  const [[assessment], answers] = await Promise.all([
    db
      .select()
      .from(assessments)
      .where(and(eq(assessments.id, id), eq(assessments.userId, userId))),
    db
      .select()
      .from(assessmentAnswers)
      .where(eq(assessmentAnswers.assessmentId, id))
      .orderBy(asc(assessmentAnswers.position)),
  ]);
  if (!assessment) return null;
  return { assessment, answers };
}

/** Returns null when the assessment does not exist or belongs to someone else. */
export async function getAssessment(db: Db, userId: string, id: string): Promise<AssessmentView | null> {
  const loaded = await load(db, userId, id);
  if (!loaded) return null;
  const { assessment, answers } = loaded;
  const domain = assessment.domain as Domain;
  const bank = BANK[domain];
  const byId = new Map(bank.map((q) => [q.id, q]));
  const responses = answers.map((a) => ({ questionId: a.questionId, correct: a.isCorrect }));
  const p = progress(bank, responses, assessment.id);

  const base = {
    id: assessment.id,
    domain,
    answeredCount: answers.length,
    totalQuestions: Math.min(TEST_LENGTH, bank.length),
    answered: answers.map((a) => ({
      question: byId.get(a.questionId)!,
      choice: a.choice,
      correct: a.isCorrect,
    })),
  };

  if (!p.done) {
    const { id: qid, topic, prompt, options } = p.next!;
    return { ...base, status: "in_progress", next: { id: qid, topic, prompt, options } };
  }

  const result = score(bank, p.estimate);
  let completedAt = assessment.completedAt;
  if (assessment.status !== "completed") {
    // Repairs an attempt whose last answer was saved but never finalised.
    completedAt = await finalise(db, id, p.estimate, result);
  }
  return {
    ...base,
    status: "completed",
    result,
    topics: topicBreakdown(bank, responses),
    completedAt: completedAt!,
  };
}

async function finalise(db: Db, id: string, estimate: Estimate, result: Score): Promise<Date> {
  const completedAt = new Date();
  await db
    .update(assessments)
    .set({
      status: "completed",
      completedAt,
      theta: estimate.theta,
      se: estimate.se,
      score: result.score,
      level: result.level,
    })
    .where(and(eq(assessments.id, id), eq(assessments.status, "in_progress")));
  return completedAt;
}

export type SubmitOutcome = "recorded" | "ignored" | "not_found";

/**
 * Records an answer to the question the server expects next. Anything else
 * (an old form, a replay, a guessed question id, a finished attempt) is
 * ignored, so a client cannot choose which question to answer or answer twice.
 */
export async function submitAnswer(
  db: Db,
  userId: string,
  id: string,
  questionId: string,
  choice: number,
): Promise<SubmitOutcome> {
  const view = await getAssessment(db, userId, id);
  if (!view) return "not_found";
  if (view.status !== "in_progress" || view.next.id !== questionId) return "ignored";

  const question = BANK[view.domain].find((q) => q.id === questionId)!;
  const inserted = await db
    .insert(assessmentAnswers)
    .values({
      assessmentId: id,
      position: view.answeredCount,
      questionId,
      choice,
      isCorrect: choice === question.correct,
    })
    .onConflictDoNothing()
    .returning({ position: assessmentAnswers.position });
  if (inserted.length === 0) return "ignored";

  // The last answer completes the attempt: score it from what is already loaded.
  if (view.answeredCount + 1 >= view.totalQuestions) {
    const bank = BANK[view.domain];
    const responses = [
      ...view.answered.map((a) => ({ questionId: a.question.id, correct: a.correct })),
      { questionId, correct: choice === question.correct },
    ];
    const { estimate } = progress(bank, responses, id);
    await finalise(db, id, estimate, score(bank, estimate));
  }
  return "recorded";
}

export async function listAssessments(db: Db, userId: string) {
  return db
    .select({
      id: assessments.id,
      domain: assessments.domain,
      status: assessments.status,
      startedAt: assessments.startedAt,
      completedAt: assessments.completedAt,
      score: assessments.score,
      level: assessments.level,
    })
    .from(assessments)
    .where(eq(assessments.userId, userId))
    .orderBy(desc(assessments.startedAt));
}
