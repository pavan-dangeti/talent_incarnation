<div align="center">

# 🌟 Talent Incarnation

**AI-Enhanced Skill Discovery & Career Guidance Platform**

*Google Solution Challenge 2025 — National Top 100 · selected for the on-campus round, Chandigarh*

[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</div>

> **Status: rebuild in progress.** The repository currently contains the Next.js starter plus an early MVP shell. Everything marked *Planned* below is **not built yet**. The design is in [docs/design.md](docs/design.md).

## What is Talent Incarnation?

A career guidance platform that aims to help students and early-career people:

- measure their skills with an adaptive assessment,
- get career advice from a chatbot grounded in their results and a curated careers dataset, with citations,
- see the gap to a target role and follow a learning roadmap.

## Features

| Feature | Status |
|---|---|
| Landing page | Minimal (sign-in entry point) |
| Google sign-in, editable profile, account deletion | Built in Phase 1; not yet verified against a live Google client and Neon database (needs your credentials) |
| Skill assessment: 15 adaptive questions per attempt, a score with an uncertainty range, topic breakdown and an explanation for every answer. Original bank of 90 questions (30 each for software engineering, data/AI and UI/UX design) | Built in Phase 2; full flow checked locally in a browser against the dev database |
| Career chatbot (Gemini): answers only from a curated careers dataset (13 roles, 69 passages) and your results, cites the passages it used, abstains when it has no support, with per-user rate limits | Built in Phase 3. Retrieval, citation checking, guardrails and rate limits are tested. **Not yet run against a live model**: it needs `GEMINI_API_KEY` and `GEMINI_CHAT_MODEL`, so answer quality is unmeasured |
| Skill-gap analysis and learning roadmap for a target role | Planned (Phase 4) |
| Automated tests, accessibility and Lighthouse checks | Planned (Phase 5) |
| Security review, monitoring, error tracking | Planned (Phase 6) |

## Measured results

Every number here comes from a committed file under `results/`.

**Assessment engine** ([results/assessment-simulation.json](results/assessment-simulation.json), reproduce with `npm run simulate`)

10,000 synthetic learners per domain (2,000 at each of five ability levels) took the 15-question test, answering according to the engine's own response model.

| | Adaptive selection | Random questions, same length |
|---|---|---|
| Error in estimated ability (RMSE, logits) | 0.675 | 0.74 |
| Estimates within one level (1 logit) of the truth | 86.7% | 82.6% |

What this does and does not show: the engine recovers a known ability better than random question selection, and its estimates rise with true ability. Estimates are pulled towards the middle for the weakest and strongest learners (bias of about 0.4 logits at the extremes). It is a check of the algorithm, not a validation against real learners: the difficulty level of each question was assigned by the author and has not been calibrated on real response data.

**Chatbot retrieval** ([results/retrieval-eval.json](results/retrieval-eval.json), reproduce with `npm run eval:retrieval`)

Whether the right passage is found for a question, measured on [evals/chat-eval.json](evals/chat-eval.json) without calling any model.

| | Development questions (26) | Held-out questions (12) |
|---|---|---|
| An expected passage is in the top 4 | 96.2% | 100% |
| An expected passage is ranked first | 80.8% | 66.7% |

Retrieval was tuned on the development questions only; the held-out questions were written before tuning and never used for it. Both sets are small and were written by the same person who wrote the dataset, so treat these as a sanity check, not a benchmark. Retrieval alone rejects all 4 off-topic questions but none of the 8 career questions the dataset cannot answer; those depend on the model abstaining.

**Chatbot answers:** not measured yet. `npm run eval:chat` runs the same 56 questions (answerable, unanswerable, off-topic and adversarial) through the live model and writes `results/chat-eval.json`. Until that file is committed, no claim is made about answer accuracy, abstention or resistance to prompt injection.

**Production latency** ([results/latency-before.json](results/latency-before.json), [results/latency-after.json](results/latency-after.json), reproduce with `npm run latency -- <label> --cold`)

Server time to first byte on production, excluding connection and TLS setup: median of 5 requests per row, measured with curl from one machine in India. "Before" had functions in `iad1` (US East) with the database in Singapore; "after" has them in `sin1` (Singapore), next to the database.

| Request | Path | Before (`iad1`) | After (`sin1`) | Change |
|---|---|---|---|---|
| No database call (anonymous) | `/` | 336 ms | 204 ms | −39% |
| No database call (anonymous) | `/assessment` | 302 ms | 203 ms | −33% |
| No database call (anonymous) | `/profile` | 320 ms | 193 ms | −40% |
| One database lookup (invalid session cookie) | `/` | 537 ms | 207 ms | −61% |
| One database lookup (invalid session cookie) | `/assessment` | 540 ms | 199 ms | −63% |
| One database lookup (invalid session cookie) | `/profile` | 565 ms | 203 ms | −64% |

How to read this:

- These are signed-out requests, so they show the function and at most one database round trip, not a full signed-in page.
- The `/` rows are the like-for-like comparison: that page waits for the session lookup in both versions. There the lookup added about 200 ms before (336 to 537 ms) and about 3 ms after (204 to 207 ms).
- The `/assessment` and `/profile` rows are not like for like. Before, they answered with a redirect after the session check. In the "after" run they streamed a loading skeleton, so the first byte no longer waited for the database at all. Those rows show how soon the browser gets something to display, not how long the database took.
- Everything was measured from one machine on one connection, 5 requests per row. Treat differences of a few milliseconds as noise.

Query counts per request were also cut (for example 5 to 3 when submitting an answer) and are pinned by `tests/query-budget.test.ts`; their effect on signed-in pages has not been measured on production.

**Cold start, reported separately.** The first request after 6 idle minutes:

| First path requested after idle | Before | After |
|---|---|---|
| `/` | 2,572 ms | 1,934 ms |

The following requests were back to normal. This delay is the Neon free tier suspending the database when idle and waking it on the next query, together with the serverless function's own cold start (the measurement does not separate the two). It is a hosting-tier limit, not something the application code controls, and nothing in this repository removes it.

## Tech stack

| Technology | Status |
|---|---|
| Next.js (App Router), TypeScript, Tailwind CSS, Vercel | In use |
| Auth.js (v5 beta) with Google sign-in, database sessions | In use (Phase 1) |
| Neon Postgres with Drizzle migrations | In use (Phase 1); pgvector arrives with Phase 3 |
| Gemini API for generation, with BM25 retrieval in-process | Built (Phase 3), awaiting a key |

## Getting started

Requires Node.js 22+.

```bash
git clone https://github.com/pavan-dangeti/talent_incarnation.git
cd talent_incarnation
npm install
npm run dev   # http://localhost:3000
```

### Environment variables

Secrets are read from environment variables and are never committed. Copy the template and fill in your own values:

```bash
cp .env.example .env.local
```

Without them the app still builds and runs, but shows "Sign-in is not configured". Without `GEMINI_API_KEY` and `GEMINI_CHAT_MODEL` the chat page shows "Chat is not configured".

**Google OAuth client** (Phase 1)
1. In [Google Cloud Console](https://console.cloud.google.com/), create or pick a project, then go to APIs & Services → OAuth consent screen and configure it.
2. Credentials → Create credentials → OAuth client ID → Web application.
3. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` and the same path on your deployed domain.
4. Put the client ID and secret in `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`. Generate `AUTH_SECRET` with `openssl rand -base64 32`.

**Neon database** (Phase 1)
1. Create a separate Neon project for this app.
2. Copy the connection string into `DATABASE_URL`.
3. Apply the migrations: `npm run db:migrate` (reads `DATABASE_URL` from the environment or `.env.local`, prints what it applied, verifies the tables, and exits non-zero on failure). After changing `src/db/schema.ts`, run `npm run db:generate` and commit the new SQL in `drizzle/`. `npm run db:check` tests the connection through the app's own driver.

**Gemini API key** (Phase 3)
1. Create a key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Put it in `GEMINI_API_KEY`, and set `GEMINI_CHAT_MODEL` to a current model id from the [model list](https://ai.google.dev/gemini-api/docs/models). No model id is hard-coded.
3. Run `npm run eval:chat` and commit `results/chat-eval.json` to measure answer quality.
   - Requests are paced at one every 5 seconds by default (`npm run eval:chat -- --interval-ms 8000` to change it), and per-minute rate limits, 503s and timeouts are retried with backoff.
   - Completed answers are cached in `.cache/` (not committed), so running the command again only calls the model for items that are still missing. A daily quota error stops further calls; run it again after the quota resets.
   - An item whose API call failed is reported as "not run", never as a wrong answer, and the results file is only written when all 56 items have completed.

On Vercel, add the same names under Project → Settings → Environment Variables. Do not paste keys into issues, PRs or chats.

## Roadmap

The phase plan, data model, threat model and Gemini design are in [docs/design.md](docs/design.md#9-phase-plan). Ideas beyond v2.0.0: resume builder, interview preparation, mentor matching.

## License

MIT. See [LICENSE](./LICENSE).
