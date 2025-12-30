import { requireAuth } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function ToolsPage() {
  const user = await requireAuth()

  const tools = [
    {
      id: "document-processor",
      name: "Processador de Documentos",
      description:
        "Envie e processe documentos PDF, Word, Excel e outros formatos. Converta, extraia dados e transforme arquivos.",
      icon: FileText,
      color: "bg-primary/10 text-primary",
      features: ["Conversão de PDF", "Extração de texto", "OCR", "Compressão"],
    },
    {
      id: "workflow-automation",
      name: "Automação de Workflows",
      description: "Execute automações personalizadas conectadas ao n8n. Envie dados e receba resultados processados.",
      icon: Zap,
      color: "bg-emerald-500/10 text-emerald-600",
      features: ["Webhooks n8n", "Processamento assíncrono", "Notificações", "Logs detalhados"],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-bold text-3xl text-balance">Ferramentas</h1>
          <p className="mt-2 text-muted-foreground text-pretty">Selecione uma ferramenta para começar a processar</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {tools.map((tool) => (
            <Card key={tool.id} className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${tool.color}`}>
                  <tool.icon className="h-6 w-6" />
                </div>
              </div>

              <h2 className="mb-2 font-semibold text-xl">{tool.name}</h2>
              <p className="mb-4 text-muted-foreground text-sm text-pretty">{tool.description}</p>

              <div className="mb-6 flex flex-wrap gap-2">
                {tool.features.map((feature) => (
                  <span key={feature} className="rounded-full bg-muted px-3 py-1 text-xs">
                    {feature}
                  </span>
                ))}
              </div>

              <Button asChild className="w-full">
                <Link href={`/dashboard/tools/${tool.id}`}>
                  Usar ferramenta <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
