import { requireAuth } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { QueryRunnerForm } from "@/components/query-runner-form"

export default async function QueriesPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <h1 className="font-bold text-3xl text-balance">Queries</h1>
            <p className="mt-2 text-muted-foreground text-pretty">
              Execute consultas Steampipe e Tailpipe por flows fixos do n8n com atalhos de queries seguras.
            </p>
          </div>

          <QueryRunnerForm />
        </div>
      </main>
    </div>
  )
}
