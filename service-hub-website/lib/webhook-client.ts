import { getN8nConfig, buildFlowUrl } from "./n8n-config"
import type { N8nFlowId } from "./n8n-flows"

export interface WebhookConfig {
  id: string
  name: string
  url: string
  method?: "POST" | "PUT"
  headers?: Record<string, string>
}

export interface WebhookResponse {
  success: boolean
  data?: any
  error?: string
  statusCode?: number
}

export async function sendToWebhook(
  config: WebhookConfig,
  payload: FormData | Record<string, any>,
): Promise<WebhookResponse> {
  try {
    const isFormData = payload instanceof FormData

    const response = await fetch(config.url, {
      method: config.method || "POST",
      headers: {
        ...(config.headers || {}),
        ...(!isFormData && { "Content-Type": "application/json" }),
      },
      body: isFormData ? payload : JSON.stringify(payload),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Webhook failed with status ${response.status}`,
        statusCode: response.status,
      }
    }

    const data = await response.json().catch(() => null)

    return {
      success: true,
      data,
      statusCode: response.status,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Dispara um flow n8n usando a configuração global salva (baseUrl + apikey).
 * A apikey é enviada nos headers X-API-KEY e Authorization: Bearer.
 * Retorna erro amigável se o n8n não estiver configurado.
 */
export async function sendToN8n(
  flowId: N8nFlowId,
  payload: FormData | Record<string, any>,
): Promise<WebhookResponse> {
  const config = await getN8nConfig()
  if (!config) {
    return {
      success: false,
      error: "Conexão com o n8n não configurada. Defina a URL base e a apikey em /dashboard/tools/workflow-automation/settings.",
    }
  }

  const url = buildFlowUrl(config.baseUrl, flowId)
  if (!url) {
    return { success: false, error: `Flow "${flowId}" não encontrado.` }
  }

  const headers: Record<string, string> = {}
  if (config.apiKey) {
    headers["X-API-KEY"] = config.apiKey
    headers["Authorization"] = `Bearer ${config.apiKey}`
  }

  return sendToWebhook({ id: flowId, name: flowId, url, method: "POST", headers }, payload)
}
