"use client"

import { useState } from "react"
import { AlertCircle, Box, CheckCircle2, Cloud, Globe2, Loader2, Server } from "lucide-react"

import { executeN8nFlowAction } from "@/app/actions/tools"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type CloudProvider = "aws" | "azure" | "gcp" | "oci"

type ProviderOption = {
  id: CloudProvider
  name: string
  description: string
  icon: typeof Cloud
  color: string
}

type ProviderResult = {
  success: boolean
  message: string
  data?: unknown
}

const providers: ProviderOption[] = [
  {
    id: "aws",
    name: "AWS",
    description: "Criar relatórios para ambientes Amazon Web Services.",
    icon: Cloud,
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    id: "azure",
    name: "Azure",
    description: "Criar relatórios para ambientes Microsoft Azure.",
    icon: Server,
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "gcp",
    name: "GCP",
    description: "Criar relatórios para ambientes Google Cloud Platform.",
    icon: Globe2,
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    id: "oci",
    name: "OCI",
    description: "Criar relatórios para ambientes Oracle Cloud Infrastructure.",
    icon: Box,
    color: "bg-red-500/10 text-red-600",
  },
]

export function CreateReportsCloudForm() {
  const [loadingProvider, setLoadingProvider] = useState<CloudProvider | null>(null)
  const [result, setResult] = useState<ProviderResult | null>(null)

  const handleCreateReport = async (provider: CloudProvider) => {
    setLoadingProvider(provider)
    setResult(null)

    try {
      const response = await executeN8nFlowAction("createReports", {
        provider,
        cloudProvider: provider,
      })
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao criar relatório",
      })
    } finally {
      setLoadingProvider(null)
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {providers.map((provider) => {
          const Icon = provider.icon
          const isLoading = loadingProvider === provider.id

          return (
            <Card key={provider.id} className="min-w-0 gap-4 p-4 sm:p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${provider.color}`}>
                <Icon className="h-6 w-6" />
              </div>

              <div>
                <h2 className="font-semibold text-xl">{provider.name}</h2>
                <p className="mt-2 text-muted-foreground text-sm text-pretty">{provider.description}</p>
              </div>

              <Button
                type="button"
                className="mt-auto w-full"
                disabled={loadingProvider !== null}
                onClick={() => handleCreateReport(provider.id)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar relatório"
                )}
              </Button>
            </Card>
          )
        })}
      </div>

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
    </div>
  )
}
