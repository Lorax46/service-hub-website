"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { processDocumentAction } from "@/app/actions/tools"

export function DocumentProcessorForm() {
  const [file, setFile] = useState<File | null>(null)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || !webhookUrl) return

    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("webhookUrl", webhookUrl)

    try {
      const response = await processDocumentAction(formData)
      setResult(response)

      if (response.success) {
        setFile(null)
        const form = e.target as HTMLFormElement
        form.reset()
      }
    } catch (error) {
      setResult({ success: false, message: "Erro ao processar documento" })
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
          <p className="text-muted-foreground text-xs">Cole a URL do webhook configurado no seu n8n</p>
        </div>

        <div className="space-y-2">
          <Label>Arquivo</Label>
          <div className="flex flex-col gap-4">
            {!file ? (
              <label
                htmlFor="file-upload"
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 transition-colors hover:border-muted-foreground/50 hover:bg-muted/50"
              >
                <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                <p className="mb-1 font-medium text-sm">Clique para fazer upload</p>
                <p className="text-muted-foreground text-xs">PDF, DOC, DOCX, XLS, XLSX (máx. 10MB)</p>
                <Input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-background">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-muted-foreground text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div
            className={`flex items-start gap-3 rounded-lg border p-4 ${
              result.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <p className="text-sm">{result.message}</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={!file || !webhookUrl || loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            "Processar Documento"
          )}
        </Button>
      </form>
    </Card>
  )
}
