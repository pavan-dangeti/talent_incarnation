// Applies drizzle/ migrations to DATABASE_URL (env var or .env.local) over a
// normal Postgres connection, prints what it applied, and verifies the tables.
// Exits non-zero on any failure. The connection string is never printed.
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // no .env.local; fall through to the check below
  }
}
const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("DATABASE_URL is not set (environment or .env.local).");
  process.exit(1);
}

// pg already treats sslmode=require as verify-full; say so to silence its warning.
const url = raw.replace("sslmode=require", "sslmode=verify-full");

const REQUIRED_TABLES = ["user", "account", "session", "verification_token", "profile"];
const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));
const pool = new pg.Pool({ connectionString: url, max: 1 });

async function appliedCount() {
  const exists = await pool.query(
    "select to_regclass('drizzle.__drizzle_migrations') as t",
  );
  if (!exists.rows[0].t) return 0;
  const r = await pool.query("select count(*)::int as n from drizzle.__drizzle_migrations");
  return r.rows[0].n;
}

try {
  const before = await appliedCount();
  await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
  const after = await appliedCount();

  const applied = journal.entries.slice(before, after).map((e) => e.tag);
  console.log(
    applied.length
      ? `Applied ${applied.length} migration(s): ${applied.join(", ")}`
      : "No pending migrations; database is up to date.",
  );

  const found = await pool.query(
    "select table_name from information_schema.tables where table_schema = 'public'",
  );
  const have = new Set(found.rows.map((r) => r.table_name));
  const missing = REQUIRED_TABLES.filter((t) => !have.has(t));
  if (missing.length) throw new Error(`Missing tables after migrating: ${missing.join(", ")}`);
  console.log(`Verified tables: ${REQUIRED_TABLES.join(", ")}`);
} catch (err) {
  console.error(`Migration failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
