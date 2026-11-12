// Starts the built app and checks what a signed-out visitor receives from every
// protected page: the full response body, not just the status. Run after
// `npm run build`. Exits non-zero on any failure.
//
//   anonymous            must be a real redirect to "/" with no page body
//   invalid session      the cookie cannot be validated without rendering, so
//                        the page shell may be sent; it must contain nothing
//                        beyond the shell and a redirect, and no protected text
import { spawn } from "node:child_process";

const PORT = 3999;
const BASE = `http://localhost:${PORT}`;
const PROTECTED = ["/assessment", "/assessment/00000000-0000-4000-8000-000000000000", "/chat", "/profile"];

// Text that only ever appears in signed-in content, in HTML or in the React payload.
const FORBIDDEN = [
  "Signed in as", "Education level", "Target role", "Delete account", "Delete my account",
  "Sign out", "Your results", "You have not completed", "Clear conversation", "Your question",
  "No messages yet", "Question 1 of", "Submit answer", "Your result", "Review your answers",
  "adaptive", "curated careers dataset",
];
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/;
// The only visible text the shell may contain.
const ALLOWED_TEXT = [
  /^Talent Incarnation$/, /· Talent Incarnation$/, /^Skip to content$/, /^Loading…$/,
  /^Something went wrong$/, /^The page could not be loaded\./, /^Try again$/,
];

const env = {
  ...process.env,
  PORT: String(PORT),
  // Dummy values so sign-in counts as configured. Nothing here is a real secret.
  AUTH_SECRET: "check-signed-out-dummy-secret",
  AUTH_GOOGLE_ID: "dummy",
  AUTH_GOOGLE_SECRET: "dummy",
  AUTH_TRUST_HOST: "true",
  DATABASE_URL: process.env.DATABASE_URL ?? "postgres://user:pass@localhost:5432/none",
};
const server = spawn("npx", ["next", "start"], { env, stdio: "ignore" });

const failures = [];
const fail = (msg) => failures.push(msg);

function visibleText(html) {
  const stripped = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
  return [...stripped.matchAll(/>([^<>]+)</g)].map((m) => m[1].trim()).filter(Boolean);
}

try {
  for (let i = 0; ; i++) {
    try {
      await fetch(BASE, { redirect: "manual" });
      break;
    } catch {
      if (i > 60) throw new Error("server did not start");
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  for (const path of PROTECTED) {
    const anon = await fetch(BASE + path, { redirect: "manual" });
    const anonBody = await anon.text();
    if (anon.status !== 307) fail(`${path} anonymous: status ${anon.status}, expected 307`);
    if (new URL(anon.headers.get("location") ?? "x:", BASE).pathname !== "/") fail(`${path} anonymous: redirects to ${anon.headers.get("location")}`);
    if (anonBody.length > 200) fail(`${path} anonymous: unexpected body of ${anonBody.length} bytes`);

    for (const cookie of ["authjs.session-token", "__Secure-authjs.session-token"]) {
      const res = await fetch(BASE + path, { redirect: "manual", headers: { cookie: `${cookie}=not-a-real-session` } });
      const body = await res.text();
      const label = `${path} invalid ${cookie}`;
      for (const text of FORBIDDEN) if (body.includes(text)) fail(`${label}: body contains "${text}"`);
      if (EMAIL.test(body)) fail(`${label}: body contains an email address`);
      for (const text of visibleText(body)) {
        if (!ALLOWED_TEXT.some((re) => re.test(text))) fail(`${label}: unexpected visible text "${text.slice(0, 60)}"`);
      }
      if (res.status === 200 && !body.includes("NEXT_REDIRECT") && !body.includes("Something went wrong")) {
        fail(`${label}: 200 response with neither a redirect nor an error page`);
      }
      console.log(`${label}: ${res.status}, ${body.length} bytes, visible text: ${JSON.stringify(visibleText(body))}`);
    }
    console.log(`${path} anonymous: ${anon.status} -> ${anon.headers.get("location")}, ${anonBody.length} bytes`);
  }

  // The public page must still be reachable.
  const home = await fetch(BASE, { redirect: "manual" });
  if (home.status !== 200) fail(`/ anonymous: status ${home.status}, expected 200`);
} finally {
  server.kill();
}

if (failures.length) {
  console.error(`\nFAILED: ${failures.length} problem(s)\n` + failures.map((f) => "  - " + f).join("\n"));
  process.exit(1);
}
console.log("\nOK: signed-out requests receive no protected content.");
