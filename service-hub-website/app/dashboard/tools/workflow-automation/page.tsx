import { requirePermission } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { WorkflowAutomationForm } from "@/components/workflow-automation-form"
import { permissions, userHasPermission } from "@/lib/permissions"
import Link from "next/link"
import { Settings } from "lucide-react"

export default async function WorkflowAutomationPage() {
  const user = await requirePermission(permissions.workflowAutomation)
  const canManage = userHasPermission(user, permissions.manageUsers)

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-3xl items-start justify-between gap-4">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h1 className="font-bold text-3xl text-balance">Automação de Workflows</h1>
            <p className="mt-2 text-muted-foreground text-pretty">
              Execute os flows configurados no n8n sem alterar URLs manualmente.
            </p>
          </div>
          {canManage && (
            <Link
              href="/dashboard/tools/workflow-automation/settings"
              className="mt-2 inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              <Settings className="h-4 w-4" /> Configurar n8n
            </Link>
          )}
        </div>

        <div className="mx-auto w-full max-w-3xl">
          <WorkflowAutomationForm />
        </div>
      </main>
    </div>
  )
}
