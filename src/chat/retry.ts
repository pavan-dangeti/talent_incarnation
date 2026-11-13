// Classifies model API errors and retries the transient ones. Shared by the
// production chat path (one quick retry) and the evaluation script (patient
// retries). No dependency on the SDK: it reads the HTTP status and the error
// body that the SDK puts in the message.

export type ErrorKind =
  /** Per-minute rate limit, 503 or timeout: worth retrying. */
  | "retryable"
  /** Daily quota exhausted: retrying today cannot succeed. */
  | "daily_quota"
  /** Anything else (bad request, bad key, unknown): retrying will not help. */
  | "fatal";

export type Classified = {
  kind: ErrorKind;
  reason: "rate_limit" | "unavailable" | "timeout" | "daily_quota" | "other";
  /** The server's requested wait, when it sent one (google.rpc.RetryInfo). */
  retryAfterMs?: number;
};

export function classifyError(err: unknown): Classified {
  const e = err as { status?: number; name?: string; message?: string } | null;
  const message = typeof e?.message === "string" ? e.message : String(err);
  const retry = /"retryDelay"\s*:\s*"([\d.]+)s"/.exec(message);
  const retryAfterMs = retry ? Math.ceil(Number(retry[1]) * 1000) : undefined;

  if (e?.status === 429) {
    // The quota id names its window, for example
    // GenerateRequestsPerDayPerProjectPerModel-FreeTier.
    if (/PerDay|per[ _-]?day|daily/i.test(message)) return { kind: "daily_quota", reason: "daily_quota" };
    return { kind: "retryable", reason: "rate_limit", retryAfterMs };
  }
  if (e?.status === 503) return { kind: "retryable", reason: "unavailable", retryAfterMs };
  if (e?.name === "TimeoutError" || e?.name === "AbortError") return { kind: "retryable", reason: "timeout" };
  return { kind: "fatal", reason: "other" };
}

export class DailyQuotaError extends Error {
  constructor(cause: unknown) {
    super("The model's daily request quota is exhausted.", { cause });
    this.name = "DailyQuotaError";
  }
}

export type RetryPolicy = {
  /** Total attempts, including the first. */
  attempts: number;
  /** Backoff before the first retry; doubles on each further retry. */
  baseDelayMs: number;
  /** Upper bound on any single wait. */
  maxDelayMs: number;
  /** Which transient reasons to retry. */
  retryOn: readonly Classified["reason"][];
  /**
   * What to do when the server asks for a longer wait than maxDelayMs:
   * "give_up" fails immediately (a shorter wait would only fail again),
   * "wait" honours the server's delay in full.
   */
  whenServerDelayExceedsMax: "give_up" | "wait";
};

/** Production: one quick retry for a 503 or a per-minute 429, never a long wait. */
export const QUICK_RETRY: RetryPolicy = {
  attempts: 2,
  baseDelayMs: 400,
  maxDelayMs: 2_000,
  retryOn: ["rate_limit", "unavailable"],
  whenServerDelayExceedsMax: "give_up",
};

/** Evaluation: patient, and always waits as long as the server asks. */
export const PATIENT_RETRY: RetryPolicy = {
  attempts: 6,
  baseDelayMs: 2_000,
  maxDelayMs: 60_000,
  retryOn: ["rate_limit", "unavailable", "timeout"],
  whenServerDelayExceedsMax: "wait",
};

export type RetryHooks = {
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  onRetry?: (info: { attempt: number; waitMs: number; reason: Classified["reason"] }) => void;
};

/**
 * Exponential backoff with jitter: the nth retry waits a random time between
 * half and all of baseDelayMs * 2^(n-1), capped at maxDelayMs, and never less
 * than the server's requested delay.
 */
export function backoffMs(policy: RetryPolicy, retryNumber: number, random: () => number): number {
  const ceiling = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** (retryNumber - 1));
  return Math.round(ceiling / 2 + random() * (ceiling / 2));
}

export async function withRetry<T>(
  run: () => Promise<T>,
  policy: RetryPolicy,
  hooks: RetryHooks = {},
): Promise<T> {
  const sleep = hooks.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const random = hooks.random ?? Math.random;

  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (err) {
      const c = classifyError(err);
      if (c.kind === "daily_quota") throw new DailyQuotaError(err);
      if (c.kind !== "retryable" || !policy.retryOn.includes(c.reason) || attempt >= policy.attempts) throw err;

      let waitMs = backoffMs(policy, attempt, random);
      if (c.retryAfterMs !== undefined && c.retryAfterMs > waitMs) {
        if (c.retryAfterMs > policy.maxDelayMs && policy.whenServerDelayExceedsMax === "give_up") throw err;
        waitMs = c.retryAfterMs;
      }
      hooks.onRetry?.({ attempt, waitMs, reason: c.reason });
      await sleep(waitMs);
    }
  }
}
