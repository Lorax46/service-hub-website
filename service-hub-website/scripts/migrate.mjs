// scripts/migrate.mjs — aplica TODAS as migrations SQL de migrations/ em ordem alfabética.
// Idempotente: os SQLs usam IF NOT EXISTS / ON CONFLICT DO NOTHING.
// Uso: node scripts/migrate.mjs   (requer DATABASE_URL no ambiente)
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "migrations");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não definida — abortando migrate.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  console.log(`Migrations encontradas: ${files.length}`);
  for (const f of files) {
    const sql = await readFile(join(migrationsDir, f), "utf-8");
    console.log(`→ aplicando ${f}`);
    await pool.query(sql);
  }
  console.log("MIGRAÇÕES OK");
} catch (e) {
  console.error("ERRO NA MIGRAÇÃO:", e.message);
  process.exit(1);
} finally {
  await pool.end();
}
