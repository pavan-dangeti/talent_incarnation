import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getAssessment, type AssessmentView, type Reviewed } from "@/assessment/service";
import { DOMAIN_LABELS } from "@/assessment/types";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/db";
import { requireUserId } from "@/lib/session";
import { answer } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assessment · Talent Incarnation" };

const LETTERS = ["A", "B", "C", "D"];

export default async function AssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const userId = await requireUserId();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const view = await getAssessment(db(), userId, id.data);
  if (!view) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm font-medium text-accent">{DOMAIN_LABELS[view.domain]}</p>
      {view.status === "in_progress" ? (
        <InProgress view={view} missingChoice={(await searchParams).error === "choose"} />
      ) : (
        <Results view={view} />
      )}
    </main>
  );
}

function InProgress({
  view,
  missingChoice,
}: {
  view: Extract<AssessmentView, { status: "in_progress" }>;
  missingChoice: boolean;
}) {
  const number = view.answeredCount + 1;
  const previous = view.answered.at(-1);

  return (
    <>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        Question {number} of {view.totalQuestions}
      </h1>
      <div
        role="progressbar"
        aria-label="Assessment progress"
        aria-valuemin={0}
        aria-valuemax={view.totalQuestions}
        aria-valuenow={view.answeredCount}
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${(view.answeredCount / view.totalQuestions) * 100}%` }}
        />
      </div>

      {previous && (
        <section aria-label="Previous answer" role="status" className="card mt-6 text-sm">
          <p className={`font-semibold ${previous.correct ? "text-success" : "text-danger"}`}>
            {previous.correct ? "✓ Correct" : "✗ Not quite"}
          </p>
          {!previous.correct && (
            <p className="mt-1">
              The answer was: <strong>{previous.question.options[previous.question.correct]}</strong>
            </p>
          )}
          <p className="mt-1 text-muted">{previous.question.explanation}</p>
        </section>
      )}

      <form action={answer} className="mt-6">
        <input type="hidden" name="assessmentId" value={view.id} />
        <input type="hidden" name="questionId" value={view.next.id} />
        <fieldset>
          <legend className="text-lg font-medium">{view.next.prompt}</legend>
          <p className="mt-1 text-sm text-muted">{view.next.topic}</p>
          {missingChoice && (
            <p role="alert" className="mt-3 text-sm font-medium text-danger">
              Choose an answer to continue.
            </p>
          )}
          <div className="mt-4 flex flex-col gap-3">
            {view.next.options.map((option, i) => (
              <label
                key={i}
                className="card flex cursor-pointer items-start gap-3 py-4 has-checked:border-accent has-checked:bg-accent-soft"
              >
                <input type="radio" name="choice" value={i} required className="mt-1 size-4 accent-(--accent)" />
                <span>
                  <span className="font-semibold">{LETTERS[i]}.</span> {option}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-6">
          <SubmitButton pendingLabel="Saving…">
            {number === view.totalQuestions ? "Submit and see results" : "Submit answer"}
          </SubmitButton>
        </div>
      </form>
    </>
  );
}

function Results({ view }: { view: Extract<AssessmentView, { status: "completed" }> }) {
  const { result, topics } = view;
  const correct = view.answered.filter((a) => a.correct).length;

  return (
    <>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your result</h1>

      <section aria-label="Score" className="card mt-6">
        <p className="text-5xl font-semibold tracking-tight">
          {result.score}
          <span className="text-2xl text-muted">/100</span>
        </p>
        <p className="mt-2 text-lg font-medium">{result.level}</p>
        <p className="mt-3 text-sm text-muted">
          You answered {correct} of {view.answeredCount} questions correctly. Because harder questions
          count for more, the score estimates how much of the whole question bank you would know, not
          the share you got right. With {view.answeredCount} questions the estimate is approximate: your
          score is likely between {result.range[0]} and {result.range[1]}.
        </p>
      </section>

      <h2 className="mt-10 text-xl font-semibold">By topic</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {topics.map((t) => (
          <li key={t.topic}>
            <div className="flex justify-between text-sm">
              <span>{t.topic}</span>
              <span className="text-muted">
                {t.correct} of {t.total} correct
              </span>
            </div>
            <meter
              className="mt-1 h-2 w-full"
              value={t.correct}
              max={t.total}
              aria-label={`${t.topic}: ${t.correct} of ${t.total} correct`}
            />
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-semibold">Review your answers</h2>
      <ol className="mt-4 flex flex-col gap-3">
        {view.answered.map((a, i) => (
          <ReviewItem key={a.question.id} item={a} number={i + 1} />
        ))}
      </ol>

      <Link href="/assessment" className="btn mt-10">
        Back to assessments
      </Link>
    </>
  );
}

function ReviewItem({ item, number }: { item: Reviewed; number: number }) {
  const { question, choice, correct } = item;
  return (
    <li className="card">
      <details>
        <summary className="cursor-pointer font-medium">
          <span className={correct ? "text-success" : "text-danger"}>
            {correct ? "✓" : "✗"}
            <span className="sr-only">{correct ? "Correct" : "Incorrect"}</span>
          </span>{" "}
          {number}. {question.prompt}
        </summary>
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {question.options.map((option, i) => (
            <li key={i} className={i === question.correct ? "font-semibold text-success" : ""}>
              {LETTERS[i]}. {option}
              {i === question.correct && " (correct answer)"}
              {i === choice && i !== question.correct && " (your answer)"}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">{question.explanation}</p>
      </details>
    </li>
  );
}
