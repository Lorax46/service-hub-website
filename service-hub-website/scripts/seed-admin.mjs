// Seed do usuario admin inicial. Uso: node scripts/seed-admin.mjs
// Carrega .env.local automaticamente (via load-env.mjs).
// Env: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME, DATABASE_URL
import bcrypt from "bcryptjs"
import { Pool } from "pg"
import { loadEnv } from "./load-env.mjs"

await loadEnv()

const email = process.env.SEED_ADMIN_EMAIL || "admin@servicehub.com"
const password = process.env.SEED_ADMIN_PASSWORD || "admin123"
const name = process.env.SEED_ADMIN_NAME || "Administrador"

if (!process.env.DATABASE_URL) {
  console.error("Defina DATABASE_URL")
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const hash = await bcrypt.hash(password, 12)
const q = "INSERT INTO users (email, password_hash, name, groups, is_active) VALUES ($1,$2,$3,$4,true) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, groups = EXCLUDED.groups, is_active = true RETURNING id, email"
const { rows } = await pool.query(q, [email.toLowerCase(), hash, name, ["admin"]])
console.log("Admin garantido:", rows[0])
await pool.end()
