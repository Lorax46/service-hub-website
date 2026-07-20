import { getActiveWebhooksStatus } from "@/app/actions/tools"
import { requirePermission } from "@/lib/auth"
import { permissions } from "@/lib/permissions"

export async function GET() {
  await requirePermission(permissions.webhooks)
  const result = await getActiveWebhooksStatus()

  if (!result.success) {
    return new Response(JSON.stringify({ success: false, error: result.error || "Erro ao consultar status dos webhooks" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify({ success: true, webhooks: result.data ?? [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
