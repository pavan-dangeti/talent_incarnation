import { eq } from "drizzle-orm";
import { signOut } from "@/auth";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { EDUCATION_LEVELS } from "@/lib/profile";
import { getSession, requireUserId } from "@/lib/session";
import { deleteAccount, saveProfile } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your profile · Talent Incarnation" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const userId = await requireUserId();
  const session = await getSession();
  const [profile] = await db().select().from(profiles).where(eq(profiles.userId, userId));
  const { saved, error } = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
      <p className="mt-2 text-muted">Signed in as {session?.user?.email}</p>

      {saved && (
        <p role="status" className="mt-4 font-medium text-success">
          Profile saved.
        </p>
      )}
      {error === "invalid" && (
        <p role="alert" className="mt-4 font-medium text-danger">
          Some fields were invalid. Please check them and try again.
        </p>
      )}
      {error === "confirm" && (
        <p role="alert" className="mt-4 font-medium text-danger">
          Tick the confirmation box to delete your account.
        </p>
      )}

      <form action={saveProfile} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-medium">
          Education level
          <select name="educationLevel" defaultValue={profile?.educationLevel ?? ""} className="field font-normal">
            <option value="">Not specified</option>
            {EDUCATION_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l.replace("-", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-medium">
          Target role
          <input
            name="targetRole"
            maxLength={80}
            defaultValue={profile?.targetRole ?? ""}
            className="field font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 font-medium">
          Interests (comma-separated, up to 10)
          <input name="interests" defaultValue={profile?.interests.join(", ") ?? ""} className="field font-normal" />
        </label>
        <div>
          <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
        </div>
      </form>

      <hr className="my-10 border-border" />

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button className="btn">Sign out</button>
      </form>

      <section aria-labelledby="delete-heading" className="card mt-10 border-danger">
        <h2 id="delete-heading" className="font-semibold">
          Delete account
        </h2>
        <p className="mt-1 text-sm text-muted">
          This permanently deletes your profile, assessment results and chat history. It cannot be
          undone.
        </p>
        <form action={deleteAccount} className="mt-4 flex flex-col gap-3">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="confirm" required className="mt-1 size-4" />
            I understand that my data will be permanently deleted.
          </label>
          <div>
            <button className="btn border-danger text-danger">Delete my account</button>
          </div>
        </form>
      </section>
    </main>
  );
}
