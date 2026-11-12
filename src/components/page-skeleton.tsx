/** Placeholder shown instantly on navigation while a page's data loads. */
export function PageSkeleton({ width = "max-w-2xl", blocks = 3 }: { width?: string; blocks?: number }) {
  return (
    <main className={`mx-auto ${width} px-4 py-10`} role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="h-9 w-56 animate-pulse rounded-lg bg-border" />
      <div className="mt-4 h-4 w-full max-w-md animate-pulse rounded bg-border" />
      <div className="mt-8 flex flex-col gap-4">
        {Array.from({ length: blocks }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
    </main>
  );
}
