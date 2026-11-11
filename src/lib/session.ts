import { redirect } from "next/navigation";
import { auth, authConfigured } from "@/auth";

/** The signed-in user's id; sends everyone else to the landing page. */
export async function requireUserId(): Promise<string> {
  if (!authConfigured) redirect("/");
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  return session.user.id;
}
