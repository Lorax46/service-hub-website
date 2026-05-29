import { requireAuth } from "@/lib/auth"
import { getHistoryForUser } from "@/lib/history"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { FileText, CheckCircle2, Loader2, XCircle, Download } from "lucide-react"

export default async function HistoryPage() {
  const user = await requireAuth()
  const history = await getHistoryForUser(user.id)

  const formatDate = (date: Date) => {
    const now = Date.now()
    const diff = now - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return "agora"
    if (minutes < 60) return `há ${minutes}min`
    if (hours < 24) return `há ${hours}h`
    return date.toLocaleDateString("pt-BR")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído"
      case "processing":
        return "Processando"
      case "failed":
        return "Falhou"
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-6xl">
          <h1 className="font-bold text-3xl">Histórico</h1>
          <p className="mt-2 text-muted-foreground">Acompanhe todos os processamentos realizados</p>
        </div>

        <Card className="mx-auto max-w-6xl overflow-hidden">
          <div className="divide-y">
            {history.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                Nenhum item de histórico encontrado ainda.
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border px-2 py-1 text-xs font-medium uppercase tracking-[0.1em] text-slate-500">
                            {item.type}
                          </span>
                          <h3 className="font-semibold">{item.title}</h3>
                        </div>
                        <p className="mt-1 text-muted-foreground text-sm">{item.description}</p>
                        <p className="mt-1 text-muted-foreground text-sm">{item.webhook}</p>
                        {item.status === "failed" && item.error && (
                          <p className="mt-1 text-red-600 text-sm">{item.error}</p>
                        )}
                        <p className="mt-2 text-muted-foreground text-xs">
                          Iniciado {formatDate(new Date(item.createdAt))}
                          {item.completedAt && ` • Concluído ${formatDate(new Date(item.completedAt))}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 sm:items-end">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="text-sm">{getStatusText(item.status)}</span>
                      </div>
                      <a
                        href={`/dashboard/history/${item.id}/download`}
                        className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
