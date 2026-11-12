import { MAX_QUESTION_LENGTH } from "@/chat/answer";
import { chatConfigured } from "@/chat/gemini";
import { DAILY_LIMIT, HOURLY_LIMIT, listMessages } from "@/chat/service";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/db";
import { requireUserId } from "@/lib/session";
import { clear, send } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Career chat · Talent Incarnation" };

const ERRORS: Record<string, string> = {
  empty: "Type a question first.",
  too_long: `Questions can be at most ${MAX_QUESTION_LENGTH} characters.`,
  rate_limited: `You have reached the limit of ${HOURLY_LIMIT} questions per hour or ${DAILY_LIMIT} per day. Please try again later.`,
};

const SUGGESTIONS = [
  "What does a data analyst do day to day?",
  "Should I choose UX or UI design?",
  "How do I get started as a backend developer?",
];

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const userId = await requireUserId();
  const messages = await listMessages(db(), userId);
  const error = ERRORS[(await searchParams).error ?? ""];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Career chat</h1>
      <p className="mt-2 text-muted">
        Answers come only from this project&apos;s curated careers dataset and your assessment
        results, and each one lists the passages it used. It does not know salaries, job openings
        or anything outside that dataset, and it can be wrong: check the sources.
      </p>

      {!chatConfigured && (
        <p role="status" className="card mt-6 text-sm">
          Chat is not configured on this deployment.
        </p>
      )}

      <ol className="mt-8 flex flex-col gap-4" aria-label="Conversation">
        {messages.length === 0 && (
          <li className="text-sm text-muted">
            No messages yet. You could ask, for example:
            <ul className="mt-2 list-disc pl-5">
              {SUGGESTIONS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </li>
        )}
        {messages.map((m, i) => (
          <li
            key={m.id}
            id={i === messages.length - 1 ? "latest" : undefined}
            className={m.role === "user" ? "card ml-8 bg-accent-soft" : "card mr-8"}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {m.role === "user" ? "You" : "Assistant"}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
            {m.citations.length > 0 && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium text-accent">
                  Sources ({m.citations.length})
                </summary>
                <ul className="mt-2 flex flex-col gap-2">
                  {m.citations.map((c) => (
                    <li key={c.id}>
                      <span className="font-medium">
                        {c.title} · {c.section}
                      </span>
                      <span className="block text-muted">{c.text}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ol>

      <form action={send} className="mt-8">
        <label htmlFor="question" className="font-medium">
          Your question
        </label>
        {error && (
          <p role="alert" className="mt-1 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <textarea
          id="question"
          name="question"
          required
          maxLength={MAX_QUESTION_LENGTH}
          rows={3}
          disabled={!chatConfigured}
          className="field mt-2 w-full"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <SubmitButton disabled={!chatConfigured} pendingLabel="Thinking…">
            Ask
          </SubmitButton>
          <span className="text-xs text-muted">Up to {MAX_QUESTION_LENGTH} characters</span>
        </div>
      </form>

      {messages.length > 0 && (
        <form action={clear} className="mt-10">
          <button className="text-sm text-muted underline">Clear conversation</button>
        </form>
      )}
    </main>
  );
}
