import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to migrate Supabase");

const client = postgres(databaseUrl, { ssl: "require", max: 1 });
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder: path.resolve("drizzle-pg") });

  const seedPath = path.resolve("drizzle-pg/catalog-seed.sql");
  const seed = await fs.readFile(seedPath, "utf8");
  const statements = seed
    .replace(/^--.*$/gm, "")
    .split(/;\s*(?=INSERT|SELECT|$)/i)
    .map((statement) => statement.trim())
    .filter((statement) => statement && !statement.startsWith("--"));

  for (const statement of statements) {
    await client.unsafe(statement);
  }

  console.log("[Supabase] migrations and idempotent catalog seed applied");
} finally {
  await client.end({ timeout: 5 });
}
