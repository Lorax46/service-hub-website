"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2, Database, Loader2, RefreshCw, Search, TerminalSquare } from "lucide-react"

import { executeN8nFlowAction, executeQueryAction } from "@/app/actions/tools"
import type { N8nFlowId } from "@/lib/n8n-flows"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type QueryResult = {
  success: boolean
  message: string
  data?: unknown
}

type QueryTool = {
  id: N8nFlowId
  title: string
  description: string
  icon: typeof Database
  defaultSql: string
  updateFlowId?: N8nFlowId
  presets: Array<{
    label: string
    sql: string
  }>
}

const queryTools: QueryTool[] = [
  {
    id: "steampipeQuery",
    title: "Steampipe",
    description: "Execute consultas SQL de leitura no Steampipe.",
    icon: Database,
    updateFlowId: "steampipeUpdateDatabase",
    defaultSql: "",
    presets: [
      {
        label: "Buckets",
        sql: "select name, region, account_id\nfrom aws_s3_bucket\nlimit 25;",
      },
      {
        label: "Instâncias",
        sql: "select instance_id, instance_type, region, state\nfrom aws_ec2_instance\nlimit 25;",
      },
      {
        label: "IAM MFA",
        sql: "select name, mfa_enabled, password_enabled\nfrom aws_iam_user\nlimit 25;",
      },
    ],
  },
  {
    id: "tailpipeQuery",
    title: "Tailpipe",
    description: "Execute consultas SQL de leitura no Tailpipe.",
    icon: TerminalSquare,
    defaultSql: "select *\nfrom logs\nlimit 25;",
    presets: [
      {
        label: "Logs",
        sql: "select *\nfrom logs\nlimit 25;",
      },
      {
        label: "Erros",
        sql: "select *\nfrom logs\nwhere level = 'error'\nlimit 25;",
      },
      {
        label: "Última hora",
        sql: "select *\nfrom logs\nwhere timestamp >= now() - interval '1 hour'\nlimit 25;",
      },
    ],
  },
]

export function QueryRunnerForm() {
  const [sqlByTool, setSqlByTool] = useState<Record<N8nFlowId, string>>(() =>
    queryTools.reduce(
      (values, tool) => ({
        ...values,
        [tool.id]: tool.defaultSql,
      }),
      {} as Record<N8nFlowId, string>,
    ),
  )
  const [loadingAction, setLoadingAction] = useState<N8nFlowId | null>(null)
  const [results, setResults] = useState<Partial<Record<N8nFlowId, QueryResult>>>({})

  const handleRunQuery = async (toolId: N8nFlowId) => {
    setLoadingAction(toolId)
    setResults((currentResults) => ({ ...currentResults, [toolId]: undefined }))

    try {
      const response = await executeQueryAction(toolId, sqlByTool[toolId] || "")
      setResults((currentResults) => ({ ...currentResults, [toolId]: response }))
    } catch (error) {
      setResults((currentResults) => ({
        ...currentResults,
        [toolId]: {
          success: false,
          message: error instanceof Error ? error.message : "Erro ao executar query",
        },
      }))
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRunFlow = async (flowId: N8nFlowId) => {
    setLoadingAction(flowId)
    setResults((currentResults) => ({ ...currentResults, [flowId]: undefined }))

    try {
      const response = await executeN8nFlowAction(flowId)
      setResults((currentResults) => ({ ...currentResults, [flowId]: response }))
    } catch (error) {
      setResults((currentResults) => ({
        ...currentResults,
        [flowId]: {
          success: false,
          message: error instanceof Error ? error.message : "Erro ao executar flow no n8n",
        },
      }))
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6">
      {queryTools.map((tool) => {
        const Icon = tool.icon
        const result = results[tool.id]
        const updateResult = tool.updateFlowId ? results[tool.updateFlowId] : null
        const isQueryLoading = loadingAction === tool.id
        const isUpdateLoading = loadingAction === tool.updateFlowId

        return (
          <Card key={tool.id} className="w-full min-w-0 gap-5 overflow-hidden p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-lg">{tool.title}</h2>
                  <p className="mt-1 text-muted-foreground text-sm text-pretty">{tool.description}</p>
                </div>
              </div>

              {tool.updateFlowId && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto min-h-9 w-full whitespace-normal text-center sm:w-auto"
                  disabled={loadingAction !== null}
                  onClick={() => handleRunFlow(tool.updateFlowId!)}
                >
                  {isUpdateLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Update database Steampipe
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_160px]">
              <Textarea
                value={sqlByTool[tool.id] || ""}
                onChange={(event) =>
                  setSqlByTool((currentSql) => ({
                    ...currentSql,
                    [tool.id]: event.target.value,
                  }))
                }
                className="min-h-56 max-w-full resize-y overflow-auto font-mono text-sm"
                spellCheck={false}
              />

              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                {tool.presets.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    className="h-auto min-h-9 whitespace-normal text-center"
                    disabled={loadingAction !== null}
                    onClick={() =>
                      setSqlByTool((currentSql) => ({
                        ...currentSql,
                        [tool.id]: preset.sql,
                      }))
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              className="w-full sm:w-fit"
              disabled={loadingAction !== null}
              onClick={() => handleRunQuery(tool.id)}
            >
              {isQueryLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Executar query
                </>
              )}
            </Button>

            {[result, updateResult].filter(Boolean).map((currentResult, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 ${
                  currentResult?.success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                    : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  {currentResult?.success ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0" />
                  )}
                  <p className="font-medium text-sm">{currentResult?.message}</p>
                </div>

                {currentResult?.data !== undefined && currentResult.data !== null && (
                  <pre className="mt-3 max-h-80 max-w-full overflow-auto rounded bg-background/50 p-3 font-mono text-xs">
                    {JSON.stringify(currentResult.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </Card>
        )
      })}
    </div>
  )
}
