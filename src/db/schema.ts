import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// Auth.js tables, following @auth/drizzle-adapter's expected shape.
export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const profiles = pgTable("profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  educationLevel: text("education_level"),
  targetRole: text("target_role"),
  interests: text("interests").array().notNull().default([]),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// One attempt at one domain. The question bank lives in code (src/assessment/bank),
// so answers reference questions by their stable string id.
export const assessments = pgTable(
  "assessment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    status: text("status").notNull().default("in_progress"),
    startedAt: timestamp("started_at", { mode: "date" }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { mode: "date" }),
    // Final estimate, written once on completion.
    theta: real("theta"),
    se: real("se"),
    score: integer("score"),
    level: text("level"),
  },
  (t) => [
    check("assessment_domain_check", sql`${t.domain} in ('software', 'data-ai', 'ui-ux')`),
    check("assessment_status_check", sql`${t.status} in ('in_progress', 'completed')`),
    // At most one unfinished attempt per user and domain; starting again resumes it.
    uniqueIndex("assessment_one_in_progress")
      .on(t.userId, t.domain)
      .where(sql`${t.status} = 'in_progress'`),
  ],
);

export const assessmentAnswers = pgTable(
  "assessment_answer",
  {
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    questionId: text("question_id").notNull(),
    choice: smallint("choice").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    answeredAt: timestamp("answered_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    // The keys make double submits and concurrent answers a no-op instead of a second row.
    primaryKey({ columns: [t.assessmentId, t.position] }),
    unique("assessment_answer_question_once").on(t.assessmentId, t.questionId),
    check("assessment_answer_choice_check", sql`${t.choice} between 0 and 3`),
  ],
);
