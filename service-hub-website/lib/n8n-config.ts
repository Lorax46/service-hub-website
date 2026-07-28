import { query } from "./db"
import { decryptString } from "./encryption"
import { getN8nFlow, type N8nFlowId } from "./n8n-flows"

export interface N8nConfig {
  baseUrl: string
  apiKey: string | null
  /** Overrides de path por flowId. Ausente => usa o default de lib/n8n-flows.ts. */
  flowPaths: Record<string, string>
}

/** Lê a configuração global do n8n (singleton id=1). Retorna null se não configurada. */
export async function getN8nConfig(): Promise<N8nConfig | null> {
  const { rows } = await query(
    "SELECT base_url, api_key_encrypted, api_key_nonce, flow_paths FROM n8n_config WHERE id = 1",
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

  const flowPaths: Record<string, string> =
    row.flow_paths && typeof row.flow_paths === "object" ? (row.flow_paths as Record<string, string>) : {}

  return { baseUrl: row.base_url, apiKey, flowPaths }
}

/**
 * Resolve o path de um flow: override salvo no banco, ou o default de lib/n8n-flows.ts.
 * Retorna null se o flow não existir.
 */
export function resolveFlowPath(flowId: string, flowPaths: Record<string, string> = {}): string | null {
  const flow = getN8nFlow(flowId as N8nFlowId)
  if (!flow) return null
  const override = flowPaths[flowId]
  const path = (override && override.trim()) || flow.path
  return path ? path.replace(/^\/+/, "") : null
}

/** Monta a URL final de um flow: baseUrl + path resolvido. */
export function buildFlowUrl(baseUrl: string, flowId: string, flowPaths: Record<string, string> = {}): string | null {
  const path = resolveFlowPath(flowId, flowPaths)
  if (!path) return null
  const base = baseUrl.replace(/\/+$/, "")
  return `${base}/${path}`
}
