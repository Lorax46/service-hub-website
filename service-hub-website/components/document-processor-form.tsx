"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, ArrowRight, BarChart3, Check, CheckCircle2, FileCheck2, Loader2, Send } from "lucide-react"

import {
  confirmSendReportsAction,
  executeN8nFlowAction,
  requestSendReportsAuthorizationAction,
  shareDataDriftFileAction,
} from "@/app/actions/tools"
import type { N8nFlowId } from "@/lib/n8n-flows"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type FlowResult = {
  success: boolean
  message: string
  data?: unknown
}

type EditableReportRow = Record<string, string>

type SendReportsReview = {
  rows: EditableReportRow[]
  columns: string[]
  metadata: Record<string, unknown>
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
  const [confirmingSendReports, setConfirmingSendReports] = useState(false)
  const [sharingDriftFile, setSharingDriftFile] = useState(false)
  const [results, setResults] = useState<Partial<Record<N8nFlowId, FlowResult>>>({})
  const [sendReportsReview, setSendReportsReview] = useState<SendReportsReview | null>(null)
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

  const toEditableRows = (rows: unknown): EditableReportRow[] => {
    if (!Array.isArray(rows)) {
      return []
    }

    return rows
      .map((row) => {
        if (typeof row !== "object" || row === null || Array.isArray(row)) {
          return null
        }

        const jsonRow = getRecordValue(row, "json")

        if (typeof jsonRow === "object" && jsonRow !== null && !Array.isArray(jsonRow)) {
          return jsonRow as Record<string, unknown>
        }

        return row as Record<string, unknown>
      })
      .filter((row): row is Record<string, unknown> => row !== null)
      .map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            value === null || value === undefined
              ? ""
              : typeof value === "object"
                ? JSON.stringify(value)
                : String(value),
          ]),
        ),
      )
  }

  const getRecordValue = (value: unknown, key: string) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return undefined
    }

    return (value as Record<string, unknown>)[key]
  }

  const extractSendReportsReview = (data: unknown): SendReportsReview | null => {
    const dataJson = getRecordValue(data, "json")
    const responseData = dataJson ?? data

    const possibleRows =
      (Array.isArray(responseData) && responseData) ||
      getRecordValue(responseData, "rows") ||
      getRecordValue(responseData, "table") ||
      getRecordValue(responseData, "items") ||
      getRecordValue(responseData, "reports") ||
      getRecordValue(getRecordValue(responseData, "data"), "rows") ||
      getRecordValue(getRecordValue(responseData, "data"), "table") ||
      getRecordValue(getRecordValue(responseData, "data"), "items") ||
      getRecordValue(getRecordValue(responseData, "data"), "reports") ||
      getRecordValue(responseData, "data")

    const rows = toEditableRows(possibleRows)

    if (rows.length === 0) {
      return null
    }

    const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
    const metadata =
      typeof responseData === "object" && responseData !== null && !Array.isArray(responseData)
        ? { ...(responseData as Record<string, unknown>) }
        : {}

    delete metadata.rows
    delete metadata.table
    delete metadata.items
    delete metadata.reports
    delete metadata.data

    return { rows, columns, metadata }
  }

  const updateSendReportCell = (rowIndex: number, column: string, value: string) => {
    setSendReportsReview((currentReview) => {
      if (!currentReview) {
        return currentReview
      }

      return {
        ...currentReview,
        rows: currentReview.rows.map((row, currentIndex) =>
          currentIndex === rowIndex ? { ...row, [column]: value } : row,
        ),
      }
    })
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
      const response =
        flowId === "sendReports"
          ? await requestSendReportsAuthorizationAction()
          : await executeN8nFlowAction(flowId, flowId === "generateDataDrift" ? getDriftPayload() : {})

      if (flowId === "sendReports") {
        setSendReportsReview(response.success ? extractSendReportsReview(response.data) : null)
      }

      setResults((currentResults) => ({ ...currentResults, [flowId]: response }))
    } catch (error) {
      if (flowId === "sendReports") {
        setSendReportsReview(null)
      }

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

  const handleConfirmSendReports = async () => {
    if (!sendReportsReview) {
      return
    }

    setConfirmingSendReports(true)
    setResults((currentResults) => ({ ...currentResults, sendReports: undefined }))

    try {
      const response = await confirmSendReportsAction({
        reports: sendReportsReview.rows,
        editedRows: sendReportsReview.rows,
        metadata: sendReportsReview.metadata,
      })

      setResults((currentResults) => ({ ...currentResults, sendReports: response }))

      if (response.success) {
        setSendReportsReview(null)
      }
    } catch (error) {
      setResults((currentResults) => ({
        ...currentResults,
        sendReports: {
          success: false,
          message: error instanceof Error ? error.message : "Erro ao confirmar envio de relatórios",
        },
      }))
    } finally {
      setConfirmingSendReports(false)
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
        const isSendReports = flow.id === "sendReports"

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

              {flow.id === "createReports" ? (
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/dashboard/tools/document-processor/create-reports">
                    {flow.actionLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  disabled={loadingFlow !== null || confirmingSendReports}
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
              )}
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

            {isSendReports && sendReportsReview && (
              <div className="grid gap-4 rounded-lg border bg-muted/30 p-4">
                <div className="overflow-x-auto rounded-md border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {sendReportsReview.columns.map((column) => (
                          <TableHead key={column} className="min-w-40 whitespace-nowrap">
                            {column}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sendReportsReview.rows.map((row, rowIndex) => (
                        <TableRow key={`${rowIndex}-${sendReportsReview.columns.join("-")}`}>
                          {sendReportsReview.columns.map((column) => (
                            <TableCell key={column} className="min-w-40">
                              <Input
                                value={row[column] ?? ""}
                                disabled={loadingFlow !== null || confirmingSendReports}
                                onChange={(event) => updateSendReportCell(rowIndex, column, event.target.value)}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loadingFlow !== null || confirmingSendReports}
                    onClick={() => handleRunFlow("sendReports")}
                  >
                    Buscar novamente
                  </Button>
                  <Button
                    type="button"
                    disabled={loadingFlow !== null || confirmingSendReports}
                    onClick={handleConfirmSendReports}
                  >
                    {confirmingSendReports ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Confirmar e continuar
                      </>
                    )}
                  </Button>
                </div>
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

                {result.data !== undefined && result.data !== null && (!isSendReports || !sendReportsReview) && (
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
