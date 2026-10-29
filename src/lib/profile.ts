import { z } from "zod";

export const EDUCATION_LEVELS = [
  "high-school",
  "undergraduate",
  "postgraduate",
  "working-professional",
  "other",
] as const;

export const profileInput = z.object({
  educationLevel: z.enum(EDUCATION_LEVELS).nullable(),
  targetRole: z.string().trim().max(80).nullable(),
  interests: z.array(z.string().trim().min(1).max(40)).max(10),
});

export type ProfileInput = z.infer<typeof profileInput>;

// Turns raw form fields into a ProfileInput: blanks become null, interests are
// comma-separated and de-duplicated case-insensitively.
export function parseProfileForm(form: FormData) {
  const text = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" && v.trim() !== "" ? v : null;
  };
  const seen = new Set<string>();
  const interests = (text("interests") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => {
      const key = s.toLowerCase();
      if (!s || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return profileInput.safeParse({
    educationLevel: text("educationLevel"),
    targetRole: text("targetRole"),
    interests,
  });
}
