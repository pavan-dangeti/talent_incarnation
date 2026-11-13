import { describe, expect, it, vi } from "vitest";
import {
  DailyQuotaError,
  PATIENT_RETRY,
  QUICK_RETRY,
  backoffMs,
  classifyError,
  withRetry,
} from "../src/chat/retry";

// Error shapes as the SDK raises them: an HTTP status plus the server's JSON body in the message.
const apiError = (status: number, body: object) =>
  Object.assign(new Error(JSON.stringify({ error: { code: status, ...body } })), { status, name: "ApiError" });
const quota = (quotaId: string, retryDelay?: string) =>
  apiError(429, {
    status: "RESOURCE_EXHAUSTED",
    details: [
      { "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [{ quotaId }] },
      ...(retryDelay ? [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay }] : []),
    ],
  });
const perMinute = (retryDelay?: string) => quota("GenerateRequestsPerMinutePerProjectPerModel-FreeTier", retryDelay);
const perDay = () => quota("GenerateRequestsPerDayPerProjectPerModel-FreeTier", "40000s");
const unavailable = () => apiError(503, { status: "UNAVAILABLE", message: "The model is overloaded due to high demand." });
const timeout = () => new DOMException("The operation was aborted due to timeout", "TimeoutError");

/** Runs withRetry against a scripted sequence of outcomes, recording the waits. */
async function run(outcomes: unknown[], policy = PATIENT_RETRY, random = () => 1) {
  const waits: number[] = [];
  const call = vi.fn(async () => {
    const next = outcomes.shift();
    if (next instanceof Error || next instanceof DOMException) throw next;
    return next;
  });
  const result: { value?: unknown; error?: unknown } = await withRetry(call, policy, {
    sleep: async (ms) => void waits.push(ms),
    random,
  }).then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );
  return { ...result, waits, calls: call.mock.calls.length };
}

describe("classifyError", () => {
  it("separates per-minute limits, daily quota, overload, timeouts and everything else", () => {
    expect(classifyError(perMinute("23s"))).toEqual({ kind: "retryable", reason: "rate_limit", retryAfterMs: 23_000 });
    expect(classifyError(perMinute("1.5s")).retryAfterMs).toBe(1500);
    expect(classifyError(perMinute())).toEqual({ kind: "retryable", reason: "rate_limit", retryAfterMs: undefined });
    expect(classifyError(perDay())).toEqual({ kind: "daily_quota", reason: "daily_quota" });
    expect(classifyError(unavailable())).toMatchObject({ kind: "retryable", reason: "unavailable" });
    expect(classifyError(timeout())).toEqual({ kind: "retryable", reason: "timeout" });
    expect(classifyError(apiError(400, { status: "INVALID_ARGUMENT" }))).toEqual({ kind: "fatal", reason: "other" });
    expect(classifyError(apiError(403, { status: "PERMISSION_DENIED" })).kind).toBe("fatal");
    expect(classifyError(new Error("boom")).kind).toBe("fatal");
    expect(classifyError("a string").kind).toBe("fatal");
  });
});

describe("backoff", () => {
  it("doubles each time, stays within half-to-full of the step, and is capped", () => {
    const p = { ...PATIENT_RETRY, baseDelayMs: 1000, maxDelayMs: 5000 };
    expect([1, 2, 3, 4, 5].map((n) => backoffMs(p, n, () => 1))).toEqual([1000, 2000, 4000, 5000, 5000]);
    expect([1, 2, 3, 4].map((n) => backoffMs(p, n, () => 0))).toEqual([500, 1000, 2000, 2500]);
    for (let i = 0; i < 50; i++) {
      const ms = backoffMs(p, 2, Math.random);
      expect(ms).toBeGreaterThanOrEqual(1000);
      expect(ms).toBeLessThanOrEqual(2000);
    }
  });
});

describe("withRetry", () => {
  it("returns the first success without waiting", async () => {
    expect(await run(["ok"])).toMatchObject({ value: "ok", waits: [], calls: 1 });
  });

  it("retries rate limits, overload and timeouts with growing waits, then succeeds", async () => {
    const r = await run([perMinute(), unavailable(), timeout(), "ok"]);
    expect(r).toMatchObject({ value: "ok", calls: 4, waits: [2000, 4000, 8000] });
  });

  it("waits at least as long as the server asks, even beyond the cap, in the patient policy", async () => {
    const r = await run([perMinute("75s"), "ok"]);
    expect(r).toMatchObject({ value: "ok", waits: [75_000] });
    // A shorter server delay does not shorten the backoff.
    expect((await run([perMinute("0.5s"), "ok"])).waits).toEqual([2000]);
  });

  it("gives up after the configured number of attempts and rethrows the last error", async () => {
    const errors = Array.from({ length: PATIENT_RETRY.attempts }, unavailable);
    const last = errors.at(-1);
    const r = await run([...errors, "never reached"]);
    expect(r.calls).toBe(PATIENT_RETRY.attempts);
    expect(r.waits).toHaveLength(PATIENT_RETRY.attempts - 1);
    expect(r.error).toBe(last);
  });

  it("stops immediately on a daily quota error", async () => {
    const r = await run([perDay(), "never reached"]);
    expect(r.error).toBeInstanceOf(DailyQuotaError);
    expect(r).toMatchObject({ calls: 1, waits: [] });
  });

  it("does not retry errors that retrying cannot fix", async () => {
    const bad = apiError(400, { status: "INVALID_ARGUMENT" });
    expect(await run([bad, "never reached"])).toMatchObject({ error: bad, calls: 1, waits: [] });
  });
});

describe("the production policy", () => {
  it("gives a 503 or a per-minute 429 exactly one quick retry", async () => {
    for (const first of [unavailable(), perMinute(), perMinute("1s")]) {
      const r = await run([first, "ok"], QUICK_RETRY);
      expect(r).toMatchObject({ value: "ok", calls: 2 });
      expect(r.waits[0]).toBeLessThanOrEqual(QUICK_RETRY.maxDelayMs);
    }
    const second = unavailable();
    expect(await run([unavailable(), second, "never reached"], QUICK_RETRY)).toMatchObject({ error: second, calls: 2 });
  });

  it("fails straight away when the server asks for a wait too long to hide from a user", async () => {
    const limited = perMinute("23s");
    expect(await run([limited, "never reached"], QUICK_RETRY)).toMatchObject({ error: limited, calls: 1, waits: [] });
  });

  it("does not retry timeouts or daily quota", async () => {
    const t = timeout();
    expect(await run([t, "never reached"], QUICK_RETRY)).toMatchObject({ error: t, calls: 1 });
    expect((await run([perDay(), "never reached"], QUICK_RETRY)).error).toBeInstanceOf(DailyQuotaError);
  });
});
