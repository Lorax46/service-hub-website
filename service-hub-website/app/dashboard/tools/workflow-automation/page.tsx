import { requireAuth } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { WorkflowAutomationForm } from "@/components/workflow-automation-form"

export default async function WorkflowAutomationPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="font-bold text-3xl text-balance">Automação de Workflows</h1>
            <p className="mt-2 text-muted-foreground text-pretty">Execute workflows personalizados através do n8n</p>
          </div>

          <WorkflowAutomationForm />
        </div>
      </main>
    </div>
  )
}
