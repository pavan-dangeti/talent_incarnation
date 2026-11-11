import Link from "next/link";
import { auth, authConfigured, signIn } from "@/auth";
import { TEST_LENGTH } from "@/assessment/engine";
import { DOMAINS, DOMAIN_LABELS } from "@/assessment/types";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "Measure",
    status: "Available",
    body: `A ${TEST_LENGTH}-question adaptive assessment per domain. Questions get harder or easier as you answer, and every answer comes with an explanation.`,
  },
  {
    title: "Ask",
    status: "Planned",
    body: "A career chatbot grounded in your results and a curated careers dataset, with citations.",
  },
  {
    title: "Plan",
    status: "Planned",
    body: "A skill-gap analysis and learning roadmap for the role you are aiming at.",
  },
];

export default async function Home() {
  const session = authConfigured ? await auth() : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
      <p className="text-sm font-medium text-accent">Career guidance that starts with evidence</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Know where you stand before you choose where to go.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">
        Talent Incarnation measures your skills in {DOMAINS.map((d) => DOMAIN_LABELS[d]).join(", ").replace(/, ([^,]*)$/, " and $1")},
        then explains what the result means.
      </p>

      <div className="mt-8">
        {!authConfigured ? (
          <p role="status" className="text-sm text-muted">
            Sign-in is not configured on this deployment.
          </p>
        ) : session?.user ? (
          <Link href="/assessment" className="btn btn-primary">
            Take an assessment
          </Link>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/assessment" });
            }}
          >
            <button className="btn btn-primary">Sign in with Google</button>
          </form>
        )}
      </div>

      <h2 className="sr-only">How it works</h2>
      <ol className="mt-14 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="card">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">
                {i + 1}. {step.title}
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  step.status === "Available" ? "bg-accent-soft text-accent" : "border border-border text-muted"
                }`}
              >
                {step.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
