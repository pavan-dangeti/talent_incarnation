"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { startAssessment, submitAnswer } from "@/assessment/service";
import { DOMAINS } from "@/assessment/types";
import { db } from "@/db";
import { requireUserId } from "@/lib/session";

const startInput = z.object({ domain: z.enum(DOMAINS) });

export async function start(form: FormData) {
  const userId = await requireUserId();
  const parsed = startInput.safeParse({ domain: form.get("domain") });
  if (!parsed.success) redirect("/assessment");
  const id = await startAssessment(db(), userId, parsed.data.domain);
  redirect(`/assessment/${id}`);
}

const answerInput = z.object({
  assessmentId: z.uuid(),
  questionId: z.string().min(1).max(20),
  choice: z.coerce.number().int().min(0).max(3),
});

export async function answer(form: FormData) {
  const userId = await requireUserId();
  const parsed = answerInput.safeParse({
    assessmentId: form.get("assessmentId"),
    questionId: form.get("questionId"),
    choice: form.get("choice") ?? undefined,
  });
  if (!parsed.success) {
    // Most likely no option was selected; send them back to the same question.
    const id = z.uuid().safeParse(form.get("assessmentId"));
    redirect(id.success ? `/assessment/${id.data}?error=choose` : "/assessment");
  }
  const { assessmentId, questionId, choice } = parsed.data;
  const outcome = await submitAnswer(db(), userId, assessmentId, questionId, choice);
  redirect(outcome === "not_found" ? "/assessment" : `/assessment/${assessmentId}`);
}
