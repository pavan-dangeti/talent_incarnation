import Link from "next/link";
import { auth, authConfigured, signIn } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = authConfigured ? await auth() : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">Talent Incarnation</h1>
      <p className="opacity-80">
        AI-assisted career guidance. This is a rebuild in progress: sign-in and
        profiles are available; assessments and the career chatbot are not built yet.
      </p>
      {!authConfigured ? (
        <p role="status" className="text-sm opacity-70">
          Sign-in is not configured on this deployment.
        </p>
      ) : session?.user ? (
        <Link href="/profile" className="self-start rounded bg-foreground px-4 py-2 text-background">
          Go to your profile
        </Link>
      ) : (
        <form action={async () => { "use server"; await signIn("google", { redirectTo: "/profile" }); }}>
          <button className="rounded bg-foreground px-4 py-2 text-background">
            Sign in with Google
          </button>
        </form>
      )}
    </main>
  );
}
