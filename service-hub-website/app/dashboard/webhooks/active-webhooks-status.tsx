"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, Loader2, Power, RefreshCw } from "lucide-react"

type WebhookStatus = {
  id: string
  name: string
  description: string
  url: string
  isActive: boolean
  statusMessage?: string
}

type FetchState = {
  loading: boolean
  error: string | null
  webhooks: WebhookStatus[]
}

export function ActiveWebhooksStatus() {
  const [state, setState] = useState<FetchState>({
    loading: false,
    error: null,
    webhooks: [],
  })

  const fetchStatuses = async () => {
    setState((current) => ({ ...current, loading: true, error: null }))

    try {
      const response = await fetch("/api/webhooks/status", { cache: "no-store" })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Falha ao carregar status dos webhooks")
      }

      const webhooks = Array.isArray(result.webhooks) ? result.webhooks : []
      setState({ loading: false, error: null, webhooks })
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Erro desconhecido", webhooks: [] })
    }
  }

  useEffect(() => {
    fetchStatuses()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-xl">Webhooks Ativos</h2>
          <p className="mt-2 text-muted-foreground text-sm">Verifique o estado dos webhooks ativos no n8n.</p>
        </div>
        <Button onClick={fetchStatuses} disabled={state.loading}>
          {state.loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {state.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4">
        {state.webhooks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-muted-foreground">
            Nenhum webhook disponível para verificação. Clique em refresh para tentar novamente.
          </div>
        ) : (
          state.webhooks.map((webhook) => (
            <div key={webhook.id} className="rounded-lg border p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-lg">{webhook.name}</h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        webhook.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {webhook.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground text-sm">{webhook.description}</p>
                  <p className="mt-2 font-mono text-xs text-slate-600">{webhook.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={webhook.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 transition-colors hover:bg-slate-100"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir
                  </a>
                  <span className="text-sm text-muted-foreground">{webhook.statusMessage ?? ""}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
