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
