import Link from "next/link";
import { Suspense } from "react";
import { getSession } from "@/lib/session";

const NAV = [
  { href: "/assessment", label: "Assessments" },
  { href: "/chat", label: "Chat" },
  { href: "/profile", label: "Profile" },
];

async function Nav() {
  const session = await getSession();
  if (!session?.user) return null;
  return (
    <nav aria-label="Main" className="flex items-center gap-1 text-sm">
      {NAV.map((item) => (
        <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 hover:bg-accent-soft">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// The navigation waits for the session inside its own Suspense boundary, so the
// rest of the page shell is sent without waiting for that database lookup.
export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex min-h-14 max-w-4xl items-center justify-between gap-4 px-4 py-2">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Talent Incarnation
        </Link>
        <Suspense fallback={null}>
          <Nav />
        </Suspense>
      </div>
    </header>
  );
}
