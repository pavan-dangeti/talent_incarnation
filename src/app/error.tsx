"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-muted">
        The page could not be loaded. This is usually temporary. Your saved answers and results
        are not affected.
      </p>
      <button onClick={reset} className="btn btn-primary mt-6">
        Try again
      </button>
    </main>
  );
}
