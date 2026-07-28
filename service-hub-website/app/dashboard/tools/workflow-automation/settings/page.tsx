import { requirePermission } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { N8nConfigForm } from "@/components/n8n-config-form"
import { permissions } from "@/lib/permissions"
import { getN8nConfig } from "@/lib/n8n-config"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function N8nConfigPage() {
  const user = await requirePermission(permissions.manageUsers)
  const config = await getN8nConfig()

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <Link
            href="/dashboard/tools/workflow-automation"
            className="mb-6 inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>

          <h1 className="font-bold text-3xl text-balance">Configuração do n8n</h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Defina a conexão global com o n8n (URL base + apikey) e aponte cada workflow para o webhook
            correspondente. Os paths vêm do banco; se em branco, usa o padrão do código.
          </p>

          <div className="mt-8 rounded-lg border p-6">
            <N8nConfigForm
              initialBaseUrl={config?.baseUrl ?? ""}
              hasApiKey={Boolean(config?.apiKey)}
              initialFlowPaths={config?.flowPaths ?? {}}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
