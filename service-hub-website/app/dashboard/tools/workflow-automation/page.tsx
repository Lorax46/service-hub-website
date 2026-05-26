import { requireAuth } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { WorkflowAutomationForm } from "@/components/workflow-automation-form"

export default async function WorkflowAutomationPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h1 className="font-bold text-3xl text-balance">Automação de Workflows</h1>
            <p className="mt-2 text-muted-foreground text-pretty">
              Execute os flows configurados no n8n sem alterar URLs manualmente.
            </p>
          </div>

          <WorkflowAutomationForm />
        </div>
      </main>
    </div>
  )
}
