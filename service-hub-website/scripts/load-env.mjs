// Carrega variáveis de .env.local / .env (estilo dotenv minimalista, sem dependências).
// Lê apenas atribuições simples KEY=VALUE, ignora comentários e linhas vazias.
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

export async function loadEnv() {
  const here = dirname(fileURLToPath(import.meta.url))
  for (const file of [".env.local", ".env"]) {
    const path = join(here, "..", file)
    try {
      const text = await readFile(path, "utf-8")
      for (const raw of text.split("\n")) {
        const line = raw.trim()
        if (!line || line.startsWith("#")) continue
        const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
        if (!m) continue
        let value = m[2].trim()
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        if (process.env[m[1]] === undefined) process.env[m[1]] = value
      }
    } catch {
      // arquivo ausente — ignora
    }
  }
}
