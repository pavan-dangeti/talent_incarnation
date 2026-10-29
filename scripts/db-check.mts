// Runs queries through the app's own driver (src/db) and prints the real error
// when the app cannot reach the database. Never prints the connection string.
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { sql } from "drizzle-orm";
import dns from "node:dns/promises";
import { db } from "../src/db";
import { describeError } from "../src/db/describe-error";
import { accounts, sessions, users, verificationTokens } from "../src/db/schema";

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {}
}

// neon-http talks to https://api.<region>.<provider>.neon.tech, derived from the URL host.
async function dnsHint() {
  if (!process.env.DATABASE_URL) return;
  const host = new URL(process.env.DATABASE_URL).hostname;
  const hosts = [host, host.replace(/^[^.]+/, "api")];
  const public_ = new dns.Resolver();
  public_.setServers(["1.1.1.1", "8.8.8.8"]);
  const ok = async (f: () => Promise<unknown>) => f().then(() => true, () => false);
  for (const h of hosts) {
    const system = await ok(() => dns.lookup(h));
    const pub = await ok(() => public_.resolve4(h));
    if (!system && pub) {
      console.error(
        `\nDNS: your system resolver cannot resolve a Neon host the app needs, but 1.1.1.1/8.8.8.8 can.` +
          `\nFix: set your network's DNS servers to 1.1.1.1 and 8.8.8.8 (or use a different network), then retry.`,
      );
      return;
    }
  }
}

try {
  const one = await db().execute(sql`select 1 as ok`);
  console.log("select 1 ->", JSON.stringify(one.rows));
  const n = await db().execute(sql`select count(*)::int as users from "user"`);
  console.log('select count(*) from "user" ->', JSON.stringify(n.rows));

  // The exact call Auth.js makes on Google sign-in (same tables as src/auth.ts).
  const adapter = DrizzleAdapter(db(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  });
  const found = await adapter.getUserByAccount!({ provider: "google", providerAccountId: "db-check" });
  console.log("adapter.getUserByAccount ->", found ?? "null (no such account, as expected)");
} catch (err) {
  console.error(describeError(err).join("\n  caused by "));
  await dnsHint();
  process.exitCode = 1;
}
