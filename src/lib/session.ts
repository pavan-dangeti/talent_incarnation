import { cache } from "react";
import { redirect } from "next/navigation";
import { auth, authConfigured } from "@/auth";

/** The current session, looked up once per request however many components ask. */
export const getSession = cache(async () => (authConfigured ? auth() : null));

/** The signed-in user's id; sends everyone else to the landing page. */
export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) redirect("/");
  return session.user.id;
}
