import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let instance: ReturnType<typeof create> | undefined;

function create(url: string) {
  return drizzle(neon(url), { schema });
}

// Lazy so builds and tests that never touch the database need no DATABASE_URL.
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return (instance ??= create(url));
}
