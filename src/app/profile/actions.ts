"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { db } from "@/db";
import { profiles, users } from "@/db/schema";
import { parseProfileForm } from "@/lib/profile";
import { requireUserId } from "@/lib/session";

export async function saveProfile(form: FormData) {
  const userId = await requireUserId();
  const parsed = parseProfileForm(form);
  if (!parsed.success) redirect("/profile?error=invalid");

  const values = { ...parsed.data, updatedAt: new Date() };
  await db()
    .insert(profiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: profiles.userId, set: values });
  redirect("/profile?saved=1");
}

// Deleting the user row cascades to accounts, sessions, the profile,
// assessments and chat messages. The confirmation is checked on the server
// too, because the form's `required` attribute is only a browser hint.
export async function deleteAccount(form: FormData) {
  const userId = await requireUserId();
  if (form.get("confirm") !== "on") redirect("/profile?error=confirm");
  await db().delete(users).where(eq(users.id, userId));
  await signOut({ redirectTo: "/" });
}
