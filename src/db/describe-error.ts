type Chained = {
  name?: string;
  message?: string;
  code?: string;
  cause?: unknown;
  sourceError?: unknown;
};

// Flattens an error chain into readable lines. NeonDbError hides the real
// network error in `sourceError`, so follow that before `cause`.
export function describeError(err: unknown): string[] {
  const lines: string[] = [];
  let e: unknown = err;
  for (let i = 0; e && i < 6; i++) {
    const x = e as Chained;
    lines.push(`${x.name ?? "Error"}${x.code ? ` [${x.code}]` : ""}: ${x.message ?? String(e)}`);
    e = x.sourceError ?? x.cause;
  }
  return lines;
}
