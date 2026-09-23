import { readFile } from "node:fs/promises";
import { readdirSync } from "node:fs";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL belum diatur.");

const sql = postgres(databaseUrl, { max: 1 });
try {
  const files = readdirSync(new URL("../db/migrations/", import.meta.url)).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    const migration = await readFile(new URL(`../db/migrations/${file}`, import.meta.url), "utf8");
    await sql.unsafe(migration);
    console.log(`Applied ${file}`);
  }
} finally { await sql.end(); }
