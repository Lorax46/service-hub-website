import { requireAuth } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { FileText, CheckCircle2, Loader2, XCircle } from "lucide-react"

export default async function HistoryPage() {
  const user = await requireAuth()

  // Demo history - in production, fetch from database
  const history = [
    {
      id: "1",
      fileName: "relatorio-mensal.pdf",
      fileSize: 2.4,
      webhook: "PDF Converter",
      status: "completed",
      createdAt: new Date(Date.now() - 300000),
      completedAt: new Date(Date.now() - 290000),
    },
    {
      id: "2",
      fileName: "dados-clientes.xlsx",
      fileSize: 1.8,
      webhook: "Data Processor",
      status: "completed",
      createdAt: new Date(Date.now() - 900000),
      completedAt: new Date(Date.now() - 870000),
    },
    {
      id: "3",
      fileName: "documento-importante.docx",
      fileSize: 0.9,
      webhook: "PDF Converter",
      status: "processing",
      createdAt: new Date(Date.now() - 60000),
    },
    {
      id: "4",
      fileName: "planilha-quebrada.csv",
      fileSize: 5.2,
      webhook: "Data Processor",
      status: "failed",
      createdAt: new Date(Date.now() - 3600000),
      error: "Formato de arquivo inválido",
    },
  ]

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
            {history.map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{item.fileName}</h3>
                      <p className="mt-1 text-muted-foreground text-sm">
                        {item.fileSize.toFixed(1)} MB • {item.webhook}
                      </p>
                      {item.status === "failed" && item.error && (
                        <p className="mt-1 text-red-600 text-sm">{item.error}</p>
                      )}
                      <p className="mt-2 text-muted-foreground text-xs">
                        Iniciado {formatDate(item.createdAt)}
                        {item.completedAt && ` • Concluído ${formatDate(item.completedAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="text-sm">{getStatusText(item.status)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
