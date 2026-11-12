import Link from "next/link";
import { getSession } from "@/lib/session";

export async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Talent Incarnation
        </Link>
        {session?.user && (
          <nav aria-label="Main" className="flex items-center gap-1 text-sm">
            <Link href="/assessment" className="rounded-md px-3 py-2 hover:bg-accent-soft">
              Assessments
            </Link>
            <Link href="/chat" className="rounded-md px-3 py-2 hover:bg-accent-soft">
              Chat
            </Link>
            <Link href="/profile" className="rounded-md px-3 py-2 hover:bg-accent-soft">
              Profile
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
