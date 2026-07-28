import { query } from "./db"
import { decryptString } from "./encryption"
import { getN8nFlow, type N8nFlowId } from "./n8n-flows"

export interface N8nConfig {
  baseUrl: string
  apiKey: string | null
}

/** Lê a configuração global do n8n (singleton id=1). Retorna null se não configurada. */
export async function getN8nConfig(): Promise<N8nConfig | null> {
  const { rows } = await query(
    "SELECT base_url, api_key_encrypted, api_key_nonce FROM n8n_config WHERE id = 1",
  )
  const row = rows[0]
  if (!row) return null

  let apiKey: string | null = null
  if (row.api_key_encrypted && row.api_key_nonce) {
    try {
      apiKey = decryptString(row.api_key_encrypted, row.api_key_nonce)
    } catch {
      apiKey = null
    }
  }

  return { baseUrl: row.base_url, apiKey }
}

/** Monta a URL final de um flow: baseUrl + path (do n8n-flows.ts). */
export function buildFlowUrl(baseUrl: string, flowId: string): string | null {
  const flow = getN8nFlow(flowId as N8nFlowId)
  if (!flow || !flow.path) return null
  const base = baseUrl.replace(/\/+$/, "")
  const path = flow.path.replace(/^\/+/, "")
  return `${base}/${path}`
}
