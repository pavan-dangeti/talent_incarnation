<div align="center">

# 🌟 Talent Incarnation

**AI-Enhanced Skill Discovery & Career Guidance Platform**

*Google Solution Challenge 2025 — National Top 100 · selected for the on-campus round, Chandigarh*

[![MVP Deployment](https://img.shields.io/badge/🌐_MVP_Deployment-talent--incarnation.vercel.app-6366f1?style=for-the-badge)](https://talent-incarnation.vercel.app)
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
| Landing page | Starter template only |
| Google sign-in and user profiles | Planned (Phase 1) |
| Skill assessment: adaptive difficulty, explained scoring, original question bank for software engineering, data/AI and UI/UX design | Planned (Phase 2) |
| Gemini career chatbot grounded in your results and a curated careers dataset, with citations | Planned (Phase 3) |
| Skill-gap analysis and learning roadmap for a target role | Planned (Phase 4) |
| Automated tests, accessibility and Lighthouse checks | Planned (Phase 5) |
| Security review, monitoring, error tracking | Planned (Phase 6) |

## Measured results

None yet. Numbers will be added here only when they come from a committed result file under `results/`.

## Tech stack

| Technology | Status |
|---|---|
| Next.js (App Router), TypeScript, Tailwind CSS, Vercel | In use |
| Auth.js with Google sign-in | Planned |
| Neon Postgres (pgvector) with Drizzle migrations | Planned |
| Gemini API (embeddings and generation) | Planned |

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

Nothing in the current starter reads these yet; they are needed from Phase 1 (auth, database) and Phase 3 (Gemini).

**Google OAuth client** (Phase 1)
1. In [Google Cloud Console](https://console.cloud.google.com/), create or pick a project, then go to APIs & Services → OAuth consent screen and configure it.
2. Credentials → Create credentials → OAuth client ID → Web application.
3. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` and the same path on your deployed domain.
4. Put the client ID and secret in `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`. Generate `AUTH_SECRET` with `openssl rand -base64 32`.

**Neon database** (Phase 1)
1. Create a separate Neon project for this app.
2. Copy the connection string into `DATABASE_URL`.

**Gemini API key** (Phase 3)
1. Create a key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Put it in `GEMINI_API_KEY`.

On Vercel, add the same names under Project → Settings → Environment Variables. Do not paste keys into issues, PRs or chats.

## Roadmap

The phase plan, data model, threat model and Gemini design are in [docs/design.md](docs/design.md#9-phase-plan). Ideas beyond v2.0.0: resume builder, interview preparation, mentor matching.

## License

MIT. See [LICENSE](./LICENSE).
