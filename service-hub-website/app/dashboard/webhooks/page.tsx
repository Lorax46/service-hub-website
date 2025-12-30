import { requireAuth } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ExternalLink, Power } from "lucide-react"

export default async function WebhooksPage() {
  const user = await requireAuth()

  // Demo webhooks - in production, fetch from database
  const webhooks = [
    {
      id: "1",
      name: "PDF Converter",
      url: "https://n8n.example.com/webhook/pdf-convert",
      description: "Converte documentos para PDF",
      isActive: true,
    },
    {
      id: "2",
      name: "Data Processor",
      url: "https://n8n.example.com/webhook/data-process",
      description: "Processa e valida dados de planilhas",
      isActive: true,
    },
    {
      id: "3",
      name: "Email Notification",
      url: "https://n8n.example.com/webhook/email-notify",
      description: "Envia notificações por email",
      isActive: false,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Webhooks</h1>
            <p className="mt-2 text-muted-foreground">Gerencie suas integrações com n8n</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Webhook
          </Button>
        </div>

        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{webhook.name}</h3>
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                        webhook.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      <Power className="h-3 w-3" />
                      {webhook.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p className="mb-3 text-muted-foreground text-sm">{webhook.description}</p>
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <code className="rounded bg-muted px-2 py-1">{webhook.url}</code>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
                    Testar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
