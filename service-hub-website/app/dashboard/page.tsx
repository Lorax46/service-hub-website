import { requireAuth } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Zap, Clock, Activity, ArrowRight, Database } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-6xl space-y-2">
          <h1 className="font-bold text-3xl text-balance">Bem-vindo, {user.name}</h1>
          <p className="text-muted-foreground text-pretty">
            Gerencie suas automações e processe arquivos com facilidade
          </p>
        </div>

        <div className="mx-auto mb-8 grid max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Processamentos</p>
                <p className="mt-1 font-bold text-2xl">24</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Webhooks Ativos</p>
                <p className="mt-1 font-bold text-2xl">3</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Arquivos Hoje</p>
                <p className="mt-1 font-bold text-2xl">12</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Tempo Médio</p>
                <p className="mt-1 font-bold text-2xl">2.3s</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-xl">Ferramentas Disponíveis</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/tools">
                  Ver todas <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-3">
              <Link href="/dashboard/tools/document-processor">
                <Card className="p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Processador de Documentos</h3>
                      <p className="text-muted-foreground text-sm">Converta e processe PDFs, Word, Excel e mais</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/dashboard/tools/workflow-automation">
                <Card className="p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Zap className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Automação de Workflows</h3>
                      <p className="text-muted-foreground text-sm">Execute automações personalizadas via n8n</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/dashboard/queries">
                <Card className="p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Queries</h3>
                      <p className="text-muted-foreground text-sm">Execute consultas Steampipe e Tailpipe por flows fixos no n8n</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-xl">Atividade Recente</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/history">
                  Ver histórico <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              {[
                { name: "relatorio.pdf", status: "completed", time: "há 5 minutos" },
                { name: "dados.xlsx", status: "completed", time: "há 15 minutos" },
                { name: "documento.docx", status: "processing", time: "há 1 hora" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-muted-foreground text-xs">{item.time}</p>
                    </div>
                  </div>
                  <span className={`text-xs ${item.status === "completed" ? "text-emerald-600" : "text-orange-600"}`}>
                    {item.status === "completed" ? "Concluído" : "Processando"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
