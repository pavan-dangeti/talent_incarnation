import Link from "next/link";
import { TEST_LENGTH } from "@/assessment/engine";
import { listAssessments } from "@/assessment/service";
import { DOMAINS, DOMAIN_LABELS, type Domain } from "@/assessment/types";
import { db } from "@/db";
import { requireUserId } from "@/lib/session";
import { start } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assessments · Talent Incarnation" };

const BLURB: Record<Domain, string> = {
  software: "Programming, data structures, web and APIs, databases, testing and systems.",
  "data-ai": "Statistics, data handling, machine learning, model evaluation and LLMs.",
  "ui-ux": "Design fundamentals, usability, research, accessibility and design systems.",
};

const dateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export default async function AssessmentsPage() {
  const userId = await requireUserId();
  const attempts = await listAssessments(db(), userId);
  const open = new Map(attempts.filter((a) => a.status === "in_progress").map((a) => [a.domain, a.id]));
  const completed = attempts.filter((a) => a.status === "completed");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Assessments</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Each assessment has {TEST_LENGTH} multiple-choice questions and adapts to your answers.
        There is no time limit, and you can leave and resume later.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {DOMAINS.map((domain) => (
          <li key={domain} className="card flex flex-col">
            <h2 className="font-semibold">{DOMAIN_LABELS[domain]}</h2>
            <p className="mt-2 flex-1 text-sm text-muted">{BLURB[domain]}</p>
            <form action={start} className="mt-4">
              <input type="hidden" name="domain" value={domain} />
              <button className="btn btn-primary w-full">
                {open.has(domain) ? "Resume" : "Start"}
                <span className="sr-only"> {DOMAIN_LABELS[domain]} assessment</span>
              </button>
            </form>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-xl font-semibold">Your results</h2>
      {completed.length === 0 ? (
        <p className="mt-2 text-muted">You have not completed an assessment yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
          {completed.map((a) => (
            <li key={a.id}>
              <Link
                href={`/assessment/${a.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-accent-soft"
              >
                <span>
                  <span className="font-medium">{DOMAIN_LABELS[a.domain as Domain]}</span>
                  <span className="ml-2 text-sm text-muted">
                    {a.completedAt ? dateFormat.format(a.completedAt) : ""}
                  </span>
                </span>
                <span className="text-sm">
                  <span className="font-semibold">{a.score}/100</span> · {a.level}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
