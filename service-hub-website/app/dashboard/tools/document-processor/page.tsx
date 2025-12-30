import { requireAuth } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { DocumentProcessorForm } from "@/components/document-processor-form"

export default async function DocumentProcessorPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="font-bold text-3xl text-balance">Processador de Documentos</h1>
            <p className="mt-2 text-muted-foreground text-pretty">
              Faça upload de seus documentos e processe-os através do n8n
            </p>
          </div>

          <DocumentProcessorForm />
        </div>
      </main>
    </div>
  )
}
