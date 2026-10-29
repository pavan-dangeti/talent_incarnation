"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { profiles, users } from "@/db/schema";
import { parseProfileForm } from "@/lib/profile";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  return session.user.id;
}

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

// Deleting the user row cascades to accounts, sessions and the profile.
export async function deleteAccount() {
  const userId = await requireUserId();
  await db().delete(users).where(eq(users.id, userId));
  await signOut({ redirectTo: "/" });
}
