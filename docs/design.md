# Talent Incarnation: Design

Status: draft for review. Nothing here is implemented unless stated.

## 1. Problem

Students and early-career people in India often choose a career path with little signal about their own skills and little access to personalised advice. Generic career sites list roles but do not measure the person, and a plain LLM chatbot gives confident advice that is not grounded in the person's data or in any checkable source.

Talent Incarnation closes that loop: **measure skills, ground advice in the measurement and a curated dataset, and turn the gap to a target role into a concrete roadmap.**

## 2. Users

- **Student / early-career learner** (primary): wants to know where they stand and what to learn next.
- **Returning user**: tracks progress across assessments over time.
- **Operator** (the maintainer): needs to ship safely, observe errors and cost, and measure chatbot quality.

Out of scope for v2.0.0: employers, recruiters, payments, mobile apps, multi-language UI, admin CMS.

## 3. Architecture

Single Next.js (App Router, TypeScript) application on Vercel. No separate backend service.

```
Browser ── Next.js UI (React Server + Client Components)
              │
              ├─ Route Handlers / Server Actions  (validate input with zod, check session, rate limit)
              │       ├─ Auth.js ── Google OAuth
              │       ├─ Assessment engine  (pure TS module, no I/O, unit-testable)
              │       ├─ Gap/roadmap engine (pure TS module)
              │       └─ Chat service ── retrieval ── Gemini API
              │
              └─ Postgres (+ pgvector)  ── Drizzle ORM + SQL migrations
```

Choices (each can be challenged before Phase 1):

| Concern | Choice | Reason |
|---|---|---|
| Framework | Latest stable Next.js, React, TypeScript strict | Already the stack; Phase 0 upgrades it |
| Auth | Auth.js v5 (`next-auth@beta`, still a beta tag on npm) with Google provider, database sessions | Required Google sign-in; v4 is stable but older. Revisit when v5 ships a stable tag |
| Database | Neon Postgres (separate project), pgvector for embeddings | One store for relational data and vectors; no extra vector service |
| ORM / migrations | Drizzle with checked-in SQL migrations | Typed queries, reviewable migrations |
| Validation | zod at every trust boundary | Single source for request types |
| LLM | Gemini API through the official Google GenAI SDK, model names in env vars | Google Solution Challenge context; models change, so nothing is hard-coded |
| Rate limiting | Per-user and per-IP limiter backed by Postgres or a Marketplace Redis | Protects Gemini quota and cost |
| Tests | Vitest (unit, API), Playwright (e2e, axe accessibility), Lighthouse CI | Phase 5 |
| CI | GitHub Actions: lint, typecheck, test, build | Phase 0 |
| Errors / monitoring | Sentry (or equivalent) plus Vercel logs | Phase 6 |

Assessment and roadmap logic stay as pure functions so they can be tested without a database or network.

## 4. Data model

Postgres. All tables have `id` (uuid) and `created_at`. Auth.js tables (`account`, `session`, `verification_token`) follow the library's schema and are omitted here. Migrations are incremental: Phase 1 creates only the auth tables and `profile`; each later phase adds the tables it uses.

| Table | Key columns | Notes |
|---|---|---|
| `users` | email (unique), name, image | Auth.js user |
| `profiles` | user_id (unique FK), education_level, target_role_id, interests[] | 1:1 with user; user-editable |
| `domains` | slug, name | e.g. software, data, design; seeded |
| `skills` | slug, name, domain_id | |
| (question bank) | id, domain, topic, difficulty (1–5), prompt, options, correct, explanation | Not a table: versioned TypeScript data in `src/assessment/bank`, original content, validated by tests. Answers reference the stable question id |
| `assessment` | user_id, domain, status, started_at, completed_at, theta, se, score, level | One attempt; the result is written once on completion, so history is preserved. Check constraints on domain and status; a partial unique index allows one unfinished attempt per user and domain |
| `assessment_answer` | assessment_id, position, question_id, choice, is_correct, answered_at | Ordered log. Primary key (assessment_id, position) and unique (assessment_id, question_id) make double submits a no-op |
| `roles` | slug, title, summary, source_urls[] | Curated careers dataset |
| `role_skills` | role_id, skill_id, required_level, weight | Defines the target profile |
| `role_chunks` | role_id, content, embedding vector, source_url, chunk_index | RAG corpus |
| `chat_threads` / `chat_messages` | user_id, role (user/assistant), content, citations (jsonb), model, tokens | Retained so evals and abuse review are possible |
| `roadmaps` | user_id, role_id, generated_from_score_ids[], items (jsonb) | Versioned, deterministic output |
| `rate_limits` | key, window_start, count | If Postgres-backed |

Rules: every user-owned row is accessed only through queries scoped by `user_id` from the session. Account deletion cascades.

## 5. Assessment engine (Phase 2, built)

- **Question bank:** 90 original questions, 30 per domain and 6 at each difficulty level 1–5, each with four options, a correct answer, a topic and an explanation. Kept as code rather than database rows so that content changes are reviewed in pull requests and checked by tests (unique ids and prompts, coverage per level, answer positions balanced). No content copied from other platforms.
- **Model:** three-parameter logistic IRT with fixed discrimination and a 0.25 guessing floor for four options. Difficulty levels map to logits −2..2. Ability is estimated by EAP (posterior mean on a grid with a normal prior), which stays finite when every answer is right or wrong.
- **Adaptive selection:** the next question is the unseen one with the most Fisher information at the current estimate; ties go to the least-covered topic, then to a pick seeded by the assessment id. Selection is therefore deterministic, and the server recomputes the expected question on every request instead of storing it.
- **Length:** fixed at 15 questions. A stop-at-target-precision rule was simulated and never triggered earlier with a 30-question bank, so it was removed.
- **Scoring:** the score (0–100) is the expected share of the whole bank the person knows at the estimated ability, shown with a range of one standard error either side. Levels are one-logit bands on the ability scale. Results include a per-topic breakdown and a review of every question with its explanation.
- **Server rules** (`src/assessment/service.ts`, tested against in-process Postgres): every query is scoped by the session user; an unanswered question is sent without its answer or explanation; only the expected next question is accepted, once; replays, stale forms and concurrent double submits are ignored.
- **Verification:** unit tests for estimation, selection, termination and monotonicity; service tests for the rules above; `npm run simulate` writes `results/assessment-simulation.json`.
- **Known limits:** difficulty levels are author-assigned and uncalibrated. The simulation tests the algorithm under its own model, not real-world validity. The bank is in a public repository, so this is a self-assessment tool, not a proctored exam.

## 6. Gemini usage

Gemini is used in exactly two places, both behind server-side routes. The API key lives only in server environment variables.

1. **Embeddings** for the curated careers corpus and for user queries (retrieval).
2. **Generation** for the career chatbot, with streaming responses.

Chat request flow:
1. Authenticate, validate, rate limit.
2. Load the user's latest completed `assessment` results and profile.
3. Retrieve the top-k `role_chunks` for the query.
4. Build a prompt with a fixed system instruction, the user's results, and the retrieved passages as clearly delimited data.
5. Call Gemini with a structured response (answer plus the passage ids it used).
6. Server checks that every citation id was in the retrieved set, and drops or rejects uncited factual claims; the UI shows citations.
7. Store the exchange.

Guardrails: scope limited to careers and learning; refuse to invent salaries, company-specific facts or guarantees not in the retrieved text, and say so; no medical, legal or financial advice; maximum input length; safety settings enabled.

**Evaluation (Phase 3):** a committed eval set of questions with reference answers and expected source passages, covering in-scope questions, questions with no answer in the corpus (must abstain), and adversarial prompts. Metrics: retrieval hit rate, citation validity, answer correctness (rubric-graded, with the grading method documented), abstention rate on unanswerable items, injection resistance. Output is a JSON file in `results/` with model name, date and commit. Only those numbers may appear in the README.

## 7. Threat model

Assets: user identities and profiles, assessment history, chat history, the Gemini API key and quota, the question bank answers.

| Threat | Mitigation |
|---|---|
| Account takeover / session theft | Google OAuth only, Auth.js secure cookies (httpOnly, SameSite), CSRF protection, HTTPS |
| Broken access control (reading another user's data) | Every query scoped by session `user_id`; tests that attempt cross-user access |
| Prompt injection via user text or retrieved content | Retrieved and user text passed as delimited data; citation validation; no tools or actions exposed to the model; output rendered as text, never as HTML |
| Cost abuse / quota exhaustion | Per-user and per-IP rate limits, input and output token caps, daily spend alert |
| Answer leakage (cheating the assessment) | The answer and explanation are never sent to the client before the answer is recorded, and only the server-chosen question is accepted. The bank itself is public in this repository, so results are for self-assessment and must not be treated as proctored |
| Injection (SQL, XSS) | Parameterised Drizzle queries, zod validation, React escaping, CSP header |
| Secret leakage | Env vars only, `.env*` ignored, secret scanning in CI and GitHub push protection |
| Dependency vulnerabilities | Dependabot, `npm audit` in CI |
| Hallucinated advice | Grounding, citations, abstention behaviour, measured eval, visible disclaimer |
| Privacy | Collect only email, name, image, and what the user enters; deletion endpoint; no third-party trackers |

Phase 6 walks the OWASP Top 10 against the finished app and records findings in `docs/security-review.md`.

## 8. Working rules

- One branch and one PR per phase; CI must pass; the owner approves each merge.
- Commits are authored and committed as Pavan Sai Kumar Dangeti `<186297608+pavan-dangeti@users.noreply.github.com>`, with no co-author or AI attribution lines. Existing history is never rewritten and dates are real.
- No secrets in the repo; `.env.example` lists names only.
- Every number in the README comes from a committed file in `results/`.
- No content or branding copied from other platforms.

## 9. Phase plan

| Phase | Scope | Done when |
|---|---|---|
| 0 | CI (lint, typecheck, tests), fix failing Vercel deployments, upgrade Next.js and dependencies | CI green on PR; Vercel deploy succeeds |
| 1 | Google sign-in, profiles, DB schema and migrations | Sign in/out works locally and on preview; migrations apply from scratch |
| 2 | Assessment engine, original question bank, adaptive selection, scoring with explanations | Unit tests and convergence simulation pass; results file committed |
| 3 | Gemini RAG chatbot with citations, guardrails, rate limits, eval set | Eval run committed with measured metrics |
| 4 | Skill-gap analysis and learning roadmap for a target role | Deterministic output covered by tests |
| 5 | Unit, API, Playwright e2e, accessibility, Lighthouse | All suites in CI; Lighthouse results committed |
| 6 | OWASP review, secret scanning, monitoring, error tracking, ruleset on main | Review doc committed; ruleset active |
| 7 | Demo video, screenshots, CHANGELOG, v2.0.0 release, README with measured results only | Tag `v2.0.0` and release notes published |

## 10. Decisions (owner-confirmed)

1. Database: Neon Postgres, in a separate Neon project for this app.
2. Question-bank domains: software engineering, data/AI, UI/UX design. All content original.
3. Credentials: the owner supplies the Google OAuth client and Gemini key as environment variables. Setup is documented in the README and `.env.example`; keys are never pasted into chat or committed.
4. Repository: `pavan-dangeti/talent_incarnation` (renamed from `saikumar1626`). Earlier commits carry the old username and are left as they are.
