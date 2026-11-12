import { PGlite } from "@electric-sql/pglite";
import type { Logger } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll } from "vitest";
import * as schema from "../src/db/schema";

/**
 * An in-process Postgres with the checked-in migrations applied, for one test
 * file. If it cannot start or migrate, the file fails with an explicit error
 * rather than a bare hook failure, and the run is failed by the reporter in
 * vitest.config.mts because its tests did not execute.
 */
export function createTestDb(options: { logger?: Logger } = {}) {
  const client = new PGlite();
  const db = drizzle(client, { schema, logger: options.logger });

  beforeAll(async () => {
    try {
      await client.waitReady;
      await migrate(db, { migrationsFolder: "./drizzle" });
    } catch (cause) {
      throw new Error(
        "TEST DATABASE UNAVAILABLE: the in-process Postgres could not start or the migrations in ./drizzle could not be applied. No database-backed test in this file ran.",
        { cause },
      );
    }
  }, 60_000);
  afterAll(() => client.close());

  return db;
}
