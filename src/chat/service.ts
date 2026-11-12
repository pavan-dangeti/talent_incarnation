// Chat persistence, rate limiting and user context. Every query is scoped by user id.
import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
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
const { assessments, chatMessages, chatUsage, profiles } = schema;

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

const HOUR = 60 * 60 * 1000;

/**
 * Counts this attempt and reports whether it is within the limits. The
 * increment is a single atomic upsert, so simultaneous requests cannot slip
 * past the hourly limit, and the counter lives outside chat_message, so
 * clearing the conversation does not reset it. Windows are clock hours: a user
 * can send up to twice the hourly limit across an hour boundary.
 */
async function withinLimits(db: Db, userId: string, now: Date): Promise<boolean> {
  const windowStart = new Date(Math.floor(now.getTime() / HOUR) * HOUR);
  const [{ count }] = await db
    .insert(chatUsage)
    .values({ userId, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [chatUsage.userId, chatUsage.windowStart],
      set: { count: sql`${chatUsage.count} + 1` },
    })
    .returning({ count: chatUsage.count });
  if (count > HOURLY_LIMIT) return false;

  // Aligned down to a window boundary, so the window that straddles the
  // 24-hour mark is counted in full rather than dropped.
  const dayAgo = new Date(windowStart.getTime() - 24 * HOUR);
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${chatUsage.count}), 0)::int` })
    .from(chatUsage)
    .where(and(eq(chatUsage.userId, userId), gte(chatUsage.windowStart, dayAgo)));
  // Old windows are no longer needed for any check.
  await db.delete(chatUsage).where(and(eq(chatUsage.userId, userId), lt(chatUsage.windowStart, dayAgo)));
  return total <= DAILY_LIMIT;
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

  if (!(await withinLimits(db, userId, now))) return "rate_limited";

  const history: Turn[] = (await listMessages(db, userId, HISTORY_TURNS)).map((m) => ({
    role: m.role,
    content: m.content,
  }));
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

/** Deletes the visible conversation. Usage counters are deliberately left alone. */
export async function clearMessages(db: Db, userId: string): Promise<void> {
  await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
}
