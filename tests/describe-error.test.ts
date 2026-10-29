import { describe, expect, it } from "vitest";
import { describeError } from "../src/db/describe-error";

describe("describeError", () => {
  it("follows NeonDbError.sourceError down to the network error code", () => {
    const network = Object.assign(new Error("getaddrinfo ENOTFOUND api.example"), { code: "ENOTFOUND" });
    const fetchFailed = Object.assign(new TypeError("fetch failed"), { cause: network });
    const neon = Object.assign(new Error("Error connecting to database: TypeError: fetch failed"), {
      name: "NeonDbError",
      sourceError: fetchFailed,
    });
    const top = new Error('Failed query: select 1', { cause: neon });

    expect(describeError(top)).toEqual([
      "Error: Failed query: select 1",
      "NeonDbError: Error connecting to database: TypeError: fetch failed",
      "TypeError: fetch failed",
      "Error [ENOTFOUND]: getaddrinfo ENOTFOUND api.example",
    ]);
  });

  it("handles non-Error values and stops on cycles", () => {
    expect(describeError("boom")).toEqual(["Error: boom"]);
    const a: { message: string; cause?: unknown } = { message: "loop" };
    a.cause = a;
    expect(describeError(a).length).toBeLessThanOrEqual(6);
  });
});
