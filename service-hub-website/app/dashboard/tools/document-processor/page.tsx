import { requirePermission } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { DocumentProcessorForm } from "@/components/document-processor-form"
import { permissions } from "@/lib/permissions"

export default async function DocumentProcessorPage() {
  const user = await requirePermission(permissions.reportsView)

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h1 className="font-bold text-3xl text-balance">Relatórios e Drift de Dados</h1>
            <p className="mt-2 text-muted-foreground text-pretty">
              Execute flows fixos do n8n sem expor os webhooks para o usuário.
            </p>
          </div>

          <DocumentProcessorForm />
        </div>
      </main>
    </div>
  )
}
