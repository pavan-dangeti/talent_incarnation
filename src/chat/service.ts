// Chat persistence, rate limiting and user context. Every query is scoped by user id.
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { PASSAGE_BY_ID, type Passage } from "@/careers/dataset";
import * as schema from "@/db/schema";
import {
  MAX_QUESTION_LENGTH,
  answerQuestion,
  type Generate,
  type Turn,
  type UserContext,
} from "./answer";

type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
const { assessments, chatMessages, profiles } = schema;

export const HOURLY_LIMIT = 20;
export const DAILY_LIMIT = 60;
const HISTORY_TURNS = 4;
export const MODEL_ERROR_ANSWER =
  "Something went wrong while generating an answer. Please try again in a moment.";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Passage[];
  abstained: boolean;
  createdAt: Date;
};

export async function listMessages(db: Db, userId: string, limit = 50): Promise<ChatMessage[]> {
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.createdAt), asc(chatMessages.role))
    .limit(limit);
  return rows.reverse().map((r) => ({
    id: r.id,
    role: r.role as "user" | "assistant",
    content: r.content,
    // A passage removed from the dataset later simply drops out of old messages.
    citations: r.citations.flatMap((id) => PASSAGE_BY_ID.get(id) ?? []),
    abstained: r.abstained,
    createdAt: r.createdAt,
  }));
}

async function userContext(db: Db, userId: string): Promise<UserContext> {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  const completed = await db
    .select({ domain: assessments.domain, score: assessments.score, level: assessments.level })
    .from(assessments)
    .where(and(eq(assessments.userId, userId), eq(assessments.status, "completed")))
    .orderBy(asc(assessments.completedAt));
  // Later rows overwrite earlier ones, leaving the latest result per domain.
  const latest = new Map(completed.map((a) => [a.domain, a]));
  return {
    targetRole: profile?.targetRole ?? null,
    educationLevel: profile?.educationLevel ?? null,
    results: [...latest.values()].map((a) => ({ domain: a.domain, score: a.score!, level: a.level! })),
  };
}

async function sentSince(db: Db, userId: string, since: Date): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(chatMessages)
    .where(
      and(eq(chatMessages.userId, userId), eq(chatMessages.role, "user"), gte(chatMessages.createdAt, since)),
    );
  return row.n;
}

export type SendOutcome = "answered" | "empty" | "too_long" | "rate_limited" | "model_error";

export async function sendMessage(
  db: Db,
  userId: string,
  text: string,
  generate: Generate,
  now = new Date(),
): Promise<SendOutcome> {
  const question = text.trim();
  if (!question) return "empty";
  if (question.length > MAX_QUESTION_LENGTH) return "too_long";

  // ponytail: count-then-insert lets two simultaneous requests both pass at the
  // boundary, so a user can exceed the limit by a message or two. Use an atomic
  // counter row if the limits ever need to be exact.
  const hour = await sentSince(db, userId, new Date(now.getTime() - 60 * 60 * 1000));
  const day = await sentSince(db, userId, new Date(now.getTime() - 24 * 60 * 60 * 1000));
  if (hour >= HOURLY_LIMIT || day >= DAILY_LIMIT) return "rate_limited";

  const history: Turn[] = (await listMessages(db, userId, HISTORY_TURNS)).map((m) => ({
    role: m.role,
    content: m.content,
  }));
  // Stored before the model call, so failed attempts still count towards the limit.
  await db.insert(chatMessages).values({ userId, role: "user", content: question, createdAt: now });
  // Both rows are stamped from the application clock: mixing it with the
  // database clock could sort a reply before its question.
  const started = Date.now();
  const repliedAt = () => new Date(now.getTime() + Math.max(1, Date.now() - started));

  try {
    const result = await answerQuestion(question, await userContext(db, userId), history, generate);
    await db.insert(chatMessages).values({
      userId,
      role: "assistant",
      content: result.answer,
      citations: result.citations.map((p) => p.id),
      abstained: result.abstained,
      createdAt: repliedAt(),
    });
    return "answered";
  } catch (err) {
    console.error("chat: model call failed:", err instanceof Error ? err.message : err);
    await db
      .insert(chatMessages)
      .values({
        userId,
        role: "assistant",
        content: MODEL_ERROR_ANSWER,
        abstained: true,
        createdAt: repliedAt(),
      });
    return "model_error";
  }
}

export async function clearMessages(db: Db, userId: string): Promise<void> {
  await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
}
