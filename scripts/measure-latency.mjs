// Measures time-to-first-byte against a deployment and writes
// results/latency-<label>.json.
//
//   node scripts/measure-latency.mjs <label> [--base https://...] [--cold]
//
// Each path is requested 5 times on fresh connections with curl. "serverMs" is
// time to first byte minus connection and TLS setup, so it isolates the
// function and its database calls from the network handshake.
//
// Variants:
//   anonymous        no cookie; protected pages redirect without touching the database
//   invalid-session  a made-up session cookie, which forces exactly one database
//                    lookup (it finds nothing) and so includes a database round trip
//   authenticated    only if LATENCY_COOKIE is set to a real session cookie from
//                    your own browser; the value is never printed or saved
//
// --cold waits 6 minutes with no requests, then sends one invalid-session
// request per path, to capture the database waking from idle.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const label = args[0];
if (!label || label.startsWith("--")) {
  console.error("usage: node scripts/measure-latency.mjs <label> [--base URL] [--cold]");
  process.exit(1);
}
const base = args.includes("--base") ? args[args.indexOf("--base") + 1] : "https://talent-incarnation.vercel.app";
const cold = args.includes("--cold");
const PATHS = ["/", "/assessment", "/profile"];
const REPEATS = 5;
const IDLE_MINUTES = 6;

const variants = {
  anonymous: null,
  "invalid-session": "__Secure-authjs.session-token=latency-probe-not-a-real-session",
  ...(process.env.LATENCY_COOKIE ? { authenticated: process.env.LATENCY_COOKIE } : {}),
};

function curl(path, cookie) {
  return execFileSync(
    "curl",
    [
      "-s", "-o", "/dev/null", "-D", "-", "--max-time", "60",
      "-w", "\n%{http_code} %{time_appconnect} %{time_starttransfer}",
      ...(cookie ? ["-H", `Cookie: ${cookie}`] : []),
      base + path,
    ],
    { encoding: "utf8" },
  );
}

function request(path, cookie) {
  // A failed connection (curl exits non-zero) is a network error, not a
  // measurement, so it is retried rather than recorded.
  let out;
  for (let attempt = 1; ; attempt++) {
    try {
      out = curl(path, cookie);
      break;
    } catch (err) {
      if (attempt === 3) throw err;
      execFileSync("sleep", ["2"]);
    }
  }
  const [status, appconnect, starttransfer] = out.trim().split("\n").at(-1).split(" ");
  const vercelId = /x-vercel-id:\s*(\S+)/i.exec(out)?.[1] ?? "";
  const [edge, fn] = vercelId.split("::");
  return {
    status: Number(status),
    ttfbMs: Math.round(Number(starttransfer) * 1000),
    serverMs: Math.round((Number(starttransfer) - Number(appconnect)) * 1000),
    edgeRegion: edge ?? null,
    functionRegion: fn && !fn.includes("-") ? fn : null,
  };
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const warm = [];
for (const [variant, cookie] of Object.entries(variants)) {
  for (const path of PATHS) {
    request(path, cookie); // warm-up, not recorded
    const samples = [];
    for (let i = 0; i < REPEATS; i++) samples.push(request(path, cookie));
    const row = {
      path,
      variant,
      status: samples[0].status,
      functionRegion: samples[0].functionRegion,
      edgeRegion: samples[0].edgeRegion,
      serverMs: { median: median(samples.map((s) => s.serverMs)), min: Math.min(...samples.map((s) => s.serverMs)), max: Math.max(...samples.map((s) => s.serverMs)) },
      ttfbMs: { median: median(samples.map((s) => s.ttfbMs)) },
    };
    warm.push(row);
    console.log(`${variant.padEnd(16)} ${path.padEnd(12)} ${row.status}  server ${row.serverMs.median} ms (min ${row.serverMs.min}, max ${row.serverMs.max})  fn ${row.functionRegion}`);
  }
}

let afterIdle = null;
if (cold) {
  console.log(`waiting ${IDLE_MINUTES} minutes with no requests...`);
  await sleep(IDLE_MINUTES * 60_000);
  afterIdle = PATHS.map((path) => {
    const s = request(path, variants["invalid-session"]);
    console.log(`after idle       ${path.padEnd(12)} ${s.status}  server ${s.serverMs} ms`);
    return { path, variant: "invalid-session", status: s.status, serverMs: s.serverMs, ttfbMs: s.ttfbMs };
  });
}

mkdirSync("results", { recursive: true });
writeFileSync(
  `results/latency-${label}.json`,
  JSON.stringify(
    {
      description:
        "Time to first byte measured with curl from the developer's machine. serverMs excludes connection and TLS setup. The first row after idle includes the function and database waking up; that database cold start is a free-tier behaviour, not application code.",
      base,
      measuredOn: new Date().toISOString(),
      repeats: REPEATS,
      warm,
      afterIdle,
      idleMinutes: cold ? IDLE_MINUTES : null,
    },
    null,
    2,
  ) + "\n",
);
