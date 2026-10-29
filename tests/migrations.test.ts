import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "../src/db/schema";

// Applies the checked-in SQL migrations to an empty in-process Postgres.
describe("migrations", () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "./drizzle" });
  });
  afterAll(() => client.close());

  it("apply from scratch and enforce one profile per user", async () => {
    const [user] = await db.insert(schema.users).values({ email: "a@example.com" }).returning();
    await db.insert(schema.profiles).values({ userId: user.id, interests: ["ml"] });
    await expect(
      db.insert(schema.profiles).values({ userId: user.id }),
    ).rejects.toThrow();
  });

  it("deleting a user cascades to profile, account and session", async () => {
    const [user] = await db.insert(schema.users).values({ email: "b@example.com" }).returning();
    await db.insert(schema.profiles).values({ userId: user.id });
    await db.insert(schema.accounts).values({
      userId: user.id, type: "oidc", provider: "google", providerAccountId: "g-1",
    });
    await db.insert(schema.sessions).values({
      sessionToken: "t-1", userId: user.id, expires: new Date(Date.now() + 1000),
    });

    await db.delete(schema.users).where(eq(schema.users.id, user.id));

    for (const table of [schema.profiles, schema.accounts, schema.sessions]) {
      expect(await db.select().from(table).where(eq(table.userId, user.id))).toHaveLength(0);
    }
  });

  it("rejects duplicate emails", async () => {
    await db.insert(schema.users).values({ email: "c@example.com" });
    await expect(db.insert(schema.users).values({ email: "c@example.com" })).rejects.toThrow();
  });
});
