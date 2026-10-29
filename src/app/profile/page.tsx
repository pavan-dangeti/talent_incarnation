import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth, authConfigured, signOut } from "@/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { EDUCATION_LEVELS } from "@/lib/profile";
import { deleteAccount, saveProfile } from "./actions";

export const dynamic = "force-dynamic";
export const metadata ={ title: "Your profile · Talent Incarnation" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  if (!authConfigured) redirect("/");
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [profile] = await db()
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id));
  const { saved, error } = await searchParams;

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Your profile</h1>
      <p className="mt-1 text-sm opacity-70">Signed in as {session.user.email}</p>

      {saved && <p role="status" className="mt-4 text-green-700 dark:text-green-400">Profile saved.</p>}
      {error && <p role="alert" className="mt-4 text-red-700 dark:text-red-400">Some fields were invalid. Please check them and try again.</p>}

      <form action={saveProfile} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          Education level
          <select
            name="educationLevel"
            defaultValue={profile?.educationLevel ?? ""}
            className="rounded border border-current/30 bg-transparent p-2"
          >
            <option value="">Not specified</option>
            {EDUCATION_LEVELS.map((l) => (
              <option key={l} value={l}>{l.replace("-", " ")}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Target role
          <input
            name="targetRole"
            maxLength={80}
            defaultValue={profile?.targetRole ?? ""}
            className="rounded border border-current/30 bg-transparent p-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          Interests (comma-separated, up to 10)
          <input
            name="interests"
            defaultValue={profile?.interests.join(", ") ?? ""}
            className="rounded border border-current/30 bg-transparent p-2"
          />
        </label>
        <button className="self-start rounded bg-foreground px-4 py-2 text-background">Save</button>
      </form>

      <hr className="my-8 border-current/20" />
      <div className="flex gap-3">
        <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
          <button className="rounded border border-current/30 px-4 py-2">Sign out</button>
        </form>
        <form action={deleteAccount}>
          <button className="rounded border border-red-600 px-4 py-2 text-red-700 dark:text-red-400">
            Delete my account
          </button>
        </form>
      </div>
    </main>
  );
}
