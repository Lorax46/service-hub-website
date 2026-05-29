import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { requireAuth } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { CreateReportsCloudForm } from "@/components/create-reports-cloud-form"

export default async function CreateReportsPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href="/dashboard/tools/document-processor">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <h1 className="font-bold text-3xl text-balance">Criar Relatórios</h1>
            <p className="mt-2 text-muted-foreground text-pretty">
              Escolha o provedor cloud para executar o flow de criação de relatórios no n8n.
            </p>
          </div>

          <CreateReportsCloudForm />
        </div>
      </main>
    </div>
  )
}
