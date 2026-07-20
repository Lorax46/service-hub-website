import { requirePermission } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { ActiveWebhooksStatus } from "./active-webhooks-status"
import { permissions } from "@/lib/permissions"

export default async function WebhooksPage() {
  const user = await requirePermission(permissions.webhooks)

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-bold text-3xl">Webhooks</h1>
            <p className="mt-2 text-muted-foreground">Gerencie suas integrações com n8n</p>
          </div>
        </div>

        <Card className="mx-auto max-w-6xl overflow-hidden p-6">
          <ActiveWebhooksStatus />
        </Card>
      </main>
    </div>
  )
}
