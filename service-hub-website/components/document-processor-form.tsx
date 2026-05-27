"use client"

import { useState } from "react"
import { AlertCircle, BarChart3, CheckCircle2, Download, FileCheck2, Loader2, Send } from "lucide-react"

import { executeN8nFlowAction, shareDataDriftFileAction } from "@/app/actions/tools"
import type { N8nFlowId } from "@/lib/n8n-flows"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type FlowResult = {
  success: boolean
  message: string
  data?: unknown
}

type FlowBlock = {
  id: N8nFlowId
  title: string
  description: string
  actionLabel: string
  loadingLabel: string
  icon: typeof FileCheck2
}

type DriftMode = "monthly" | "periodic" | "point"

type DriftConfig = {
  mode: DriftMode
  startYear: string
  startMonth: string
  endYear: string
  endMonth: string
  oldUrl: string
  newUrl: string
}

const flowBlocks: FlowBlock[] = [
  {
    id: "createReports",
    title: "Criar relatórios",
    description: "Executa o flow fixo no n8n para criação de relatórios.",
    actionLabel: "Criar relatórios",
    loadingLabel: "Criando...",
    icon: FileCheck2,
  },
  {
    id: "sendReports",
    title: "Enviar relatórios",
    description: "Executa o envio e exibe o retorno de validação enviado pelo n8n.",
    actionLabel: "Enviar relatórios",
    loadingLabel: "Enviando...",
    icon: Send,
  },
  {
    id: "generateDataDrift",
    title: "Gerar drift de dados",
    description: "Executa o flow de drift e disponibiliza o resultado retornado.",
    actionLabel: "Gerar drift",
    loadingLabel: "Gerando...",
    icon: BarChart3,
  },
]

const driftModeOptions: Array<{
  id: DriftMode
  label: string
}> = [
  { id: "monthly", label: "Drift mensal" },
  { id: "periodic", label: "Drift periódico" },
  { id: "point", label: "Drift pontual" },
]

const initialDriftConfig: DriftConfig = {
  mode: "monthly",
  startYear: "",
  startMonth: "",
  endYear: "",
  endMonth: "",
  oldUrl: "",
  newUrl: "",
}

export function DocumentProcessorForm() {
  const [loadingFlow, setLoadingFlow] = useState<N8nFlowId | null>(null)
  const [sharingDriftFile, setSharingDriftFile] = useState(false)
  const [results, setResults] = useState<Partial<Record<N8nFlowId, FlowResult>>>({})
  const [driftConfig, setDriftConfig] = useState<DriftConfig>(initialDriftConfig)

  const updateDriftConfig = (updates: Partial<DriftConfig>) => {
    setDriftConfig((currentConfig) => ({ ...currentConfig, ...updates }))
  }

  const getDriftPayload = () => {
    if (driftConfig.mode === "monthly") {
      return {
        driftType: "monthly",
      }
    }

    if (driftConfig.mode === "periodic") {
      return {
        driftType: "periodic",
        startYear: driftConfig.startYear,
        startMonth: driftConfig.startMonth,
        endYear: driftConfig.endYear,
        endMonth: driftConfig.endMonth,
      }
    }

    return {
      driftType: "point",
      oldUrl: driftConfig.oldUrl,
      newUrl: driftConfig.newUrl,
    }
  }

  const validateDriftConfig = () => {
    if (driftConfig.mode === "periodic") {
      if (!driftConfig.startYear || !driftConfig.startMonth || !driftConfig.endYear || !driftConfig.endMonth) {
        return "Preencha ano e mês inicial e final para o drift periódico."
      }
    }

    if (driftConfig.mode === "point") {
      if (!driftConfig.oldUrl || !driftConfig.newUrl) {
        return "Preencha a URL antiga e a URL nova para o drift pontual."
      }
    }

    return null
  }

  const handleRunFlow = async (flowId: N8nFlowId) => {
    const driftValidationError = flowId === "generateDataDrift" ? validateDriftConfig() : null

    if (driftValidationError) {
      setResults((currentResults) => ({
        ...currentResults,
        [flowId]: {
          success: false,
          message: driftValidationError,
        },
      }))
      return
    }

    setLoadingFlow(flowId)
    setResults((currentResults) => ({ ...currentResults, [flowId]: undefined }))

    try {
      const response = await executeN8nFlowAction(flowId, flowId === "generateDataDrift" ? getDriftPayload() : {})
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
      setLoadingFlow(null)
    }
  }

  const handleShareDriftFile = async () => {
    const driftValidationError = validateDriftConfig()

    if (driftValidationError) {
      setResults((currentResults) => ({
        ...currentResults,
        generateDataDrift: {
          success: false,
          message: driftValidationError,
        },
      }))
      return
    }

    setSharingDriftFile(true)

    try {
      const response = await shareDataDriftFileAction(getDriftPayload())
      setResults((currentResults) => ({ ...currentResults, generateDataDrift: response }))
    } catch (error) {
      setResults((currentResults) => ({
        ...currentResults,
        generateDataDrift: {
          success: false,
          message: error instanceof Error ? error.message : "Erro ao solicitar arquivo",
        },
      }))
    } finally {
      setSharingDriftFile(false)
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      {flowBlocks.map((flow) => {
        const Icon = flow.icon
        const result = results[flow.id]
        const isLoading = loadingFlow === flow.id
        const canShareDriftFile = flow.id === "generateDataDrift" && result?.success
        const isDataDrift = flow.id === "generateDataDrift"

        return (
          <Card key={flow.id} className="w-full min-w-0 gap-4 overflow-hidden p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-lg">{flow.title}</h2>
                  <p className="mt-1 text-muted-foreground text-sm text-pretty">{flow.description}</p>
                </div>
              </div>

              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={loadingFlow !== null}
                onClick={() => handleRunFlow(flow.id)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {flow.loadingLabel}
                  </>
                ) : (
                  flow.actionLabel
                )}
              </Button>
            </div>

            {isDataDrift && (
              <div className="grid gap-4 rounded-lg border bg-muted/30 p-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  {driftModeOptions.map((option) => {
                    const isSelected = driftConfig.mode === option.id

                    return (
                      <Button
                        key={option.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className="justify-start"
                        disabled={loadingFlow !== null || sharingDriftFile}
                        onClick={() => updateDriftConfig({ mode: option.id })}
                      >
                        <CheckCircle2 className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-30"}`} />
                        {option.label}
                      </Button>
                    )
                  })}
                </div>

                {driftConfig.mode === "periodic" && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="Ano inicial"
                      value={driftConfig.startYear}
                      onChange={(event) => updateDriftConfig({ startYear: event.target.value })}
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="12"
                      placeholder="Mês inicial"
                      value={driftConfig.startMonth}
                      onChange={(event) => updateDriftConfig({ startMonth: event.target.value })}
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="Ano final"
                      value={driftConfig.endYear}
                      onChange={(event) => updateDriftConfig({ endYear: event.target.value })}
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="12"
                      placeholder="Mês final"
                      value={driftConfig.endMonth}
                      onChange={(event) => updateDriftConfig({ endMonth: event.target.value })}
                    />
                  </div>
                )}

                {driftConfig.mode === "point" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      type="url"
                      placeholder="URL antiga"
                      value={driftConfig.oldUrl}
                      onChange={(event) => updateDriftConfig({ oldUrl: event.target.value })}
                    />
                    <Input
                      type="url"
                      placeholder="URL nova"
                      value={driftConfig.newUrl}
                      onChange={(event) => updateDriftConfig({ newUrl: event.target.value })}
                    />
                  </div>
                )}
              </div>
            )}

            {result && (
              <div
                className={`rounded-lg border p-4 ${
                  result.success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                    : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0" />
                  )}
                  <p className="font-medium text-sm">{result.message}</p>
                </div>

                {result.data !== undefined && result.data !== null && (
                  <pre className="mt-3 max-h-72 max-w-full overflow-auto rounded bg-background/50 p-3 font-mono text-xs">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}

              
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
