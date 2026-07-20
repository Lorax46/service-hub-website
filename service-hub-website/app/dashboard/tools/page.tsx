import { requirePermission } from "@/lib/auth"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, FileText, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"
import { permissions, userHasPermission, type Permission } from "@/lib/permissions"

export default async function ToolsPage() {
  const user = await requirePermission(permissions.toolsView)

  const tools: Array<{
    id: string
    href: string
    permission: Permission
    name: string
    description: string
    icon: typeof FileText
    color: string
    features: string[]
  }> = [
    {
      id: "document-processor",
      href: "/dashboard/tools/document-processor",
      permission: permissions.reportsView,
      name: "Relatórios e Drift de Dados",
      description:
        "Execute flows fixos para criar relatórios, enviar relatórios e gerar drift de dados.",
      icon: FileText,
      color: "bg-primary/10 text-primary",
      features: ["Criar relatórios", "Enviar relatórios", "Drift de dados", "Retorno n8n"],
    },
    {
      id: "workflow-automation",
      href: "/dashboard/tools/workflow-automation",
      permission: permissions.workflowAutomation,
      name: "Automação de Workflows",
      description: "Execute automações configuradas no n8n sem expor ou editar URLs de webhook.",
      icon: Zap,
      color: "bg-emerald-500/10 text-emerald-600",
      features: ["URLs fixas", "Blocos independentes", "Retorno validado", "Logs detalhados"],
    },
    {
      id: "queries",
      href: "/dashboard/queries",
      permission: permissions.queries,
      name: "Queries",
      description: "Execute consultas SQL de leitura em Steampipe e Tailpipe enviadas para flows fixos no n8n.",
      icon: Database,
      color: "bg-blue-500/10 text-blue-600",
      features: ["SQL read-only", "Steampipe", "Tailpipe", "Retorno n8n"],
    },
  ].filter((tool) => userHasPermission(user, tool.permission))

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <h1 className="font-bold text-3xl text-balance">Ferramentas</h1>
          <p className="mt-2 text-muted-foreground text-pretty">Selecione uma ferramenta para começar a processar</p>
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.id} className="min-w-0 p-4 sm:p-6">
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
                <Link href={tool.href}>
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
