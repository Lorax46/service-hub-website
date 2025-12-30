"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react"
import { executeWorkflowAction } from "@/app/actions/tools"

export function WorkflowAutomationForm() {
  const [webhookUrl, setWebhookUrl] = useState("")
  const [jsonData, setJsonData] = useState('{\n  "example": "data"\n}')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!webhookUrl) return

    setLoading(true)
    setResult(null)

    try {
      const payload = JSON.parse(jsonData)
      const response = await executeWorkflowAction(webhookUrl, payload)
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao executar workflow",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="webhook">URL do Webhook n8n</Label>
          <Input
            id="webhook"
            type="url"
            placeholder="https://seu-n8n.com/webhook/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            required
          />
          <p className="text-muted-foreground text-xs">URL do webhook do workflow que você quer executar</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="json-data">Dados (JSON)</Label>
          <Textarea
            id="json-data"
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            className="font-mono text-sm"
            rows={10}
            placeholder='{\n  "key": "value"\n}'
          />
          <p className="text-muted-foreground text-xs">Dados que serão enviados para o webhook em formato JSON</p>
        </div>

        {result && (
          <div
            className={`rounded-lg border p-4 ${
              result.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
            }`}
          >
            <div className="mb-2 flex items-start gap-3">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              <p className="font-medium text-sm">{result.message}</p>
            </div>
            {result.data && (
              <pre className="mt-3 overflow-auto rounded bg-background/50 p-3 font-mono text-xs">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={!webhookUrl || loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Executar Workflow
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}
