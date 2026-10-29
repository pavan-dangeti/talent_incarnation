import { describe, expect, it } from "vitest";
import { parseProfileForm } from "../src/lib/profile";

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

describe("parseProfileForm", () => {
  it("accepts a full profile and de-duplicates interests", () => {
    const r = parseProfileForm(
      form({ educationLevel: "undergraduate", targetRole: " Data Analyst ", interests: "ml, SQL, Ml, , sql" }),
    );
    expect(r.success && r.data).toEqual({
      educationLevel: "undergraduate",
      targetRole: "Data Analyst",
      interests: ["ml", "SQL"],
    });
  });

  it("turns blank fields into nulls and an empty list", () => {
    const r = parseProfileForm(form({ educationLevel: "", targetRole: "  ", interests: "" }));
    expect(r.success && r.data).toEqual({ educationLevel: null, targetRole: null, interests: [] });
  });

  it("rejects unknown education levels, long roles and too many interests", () => {
    expect(parseProfileForm(form({ educationLevel: "wizard" })).success).toBe(false);
    expect(parseProfileForm(form({ targetRole: "x".repeat(81) })).success).toBe(false);
    const many = Array.from({ length: 11 }, (_, i) => `i${i}`).join(",");
    expect(parseProfileForm(form({ interests: many })).success).toBe(false);
  });
});
