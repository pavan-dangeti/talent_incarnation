export const DOMAINS = ["software", "data-ai", "ui-ux"] as const;
export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_LABELS: Record<Domain, string> = {
  software: "Software Engineering",
  "data-ai": "Data & AI",
  "ui-ux": "UI/UX Design",
};

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type Question = {
  /** Stable id, e.g. "sw-012". Stored with answers, so never reuse or renumber. */
  id: string;
  domain: Domain;
  topic: string;
  difficulty: Difficulty;
  prompt: string;
  /** Exactly four options. */
  options: readonly [string, string, string, string];
  /** Index into `options`. Never sent to the client before the answer is recorded. */
  correct: 0 | 1 | 2 | 3;
  explanation: string;
};

/** One recorded response, in the order it was given. */
export type Response = { questionId: string; correct: boolean };
