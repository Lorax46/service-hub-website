import { Pool } from "pg"

let pool: Pool | null = null

export function getDb(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL não definida. Defina a variável de ambiente com a string de conexão do Postgres.",
      )
    }
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })

    pool.on("error", (err) => {
      console.error("Erro inesperado no pool Postgres:", err.message)
    })
  }
  return pool
}

export async function query<T = any>(
  text: string,
  params?: unknown[],
): Promise<{ rows: T[]; rowCount: number | null }> {
  const db = getDb()
  const result = await db.query(text, params)
  return { rows: result.rows as T[], rowCount: result.rowCount }
}

export async function getClient() {
  return getDb().connect()
}
