"use client"

import { useState, useActionState } from "react"
import { saveN8nConfigAction, type N8nConfigState } from "@/app/actions/n8n-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { n8nFlows } from "@/lib/n8n-flows"

export function N8nConfigForm({
  initialBaseUrl,
  hasApiKey,
  initialFlowPaths,
}: {
  initialBaseUrl: string
  hasApiKey: boolean
  initialFlowPaths: Record<string, string>
}) {
  const [show, setShow] = useState(false)
  const [state, formAction, pending] = useActionState<N8nConfigState | null, FormData>(
    saveN8nConfigAction,
    null,
  )

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="baseUrl">URL base do n8n</Label>
        <Input
          id="baseUrl"
          name="baseUrl"
          type="url"
          required
          defaultValue={initialBaseUrl}
          placeholder="https://n8n.exemplo.com"
        />
        <p className="text-muted-foreground text-xs">
          Endereço da instância n8n. Os webhooks serão montados como{" "}
          <code>{"<URL base>/<path do flow>"}</code>.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">Apikey do n8n</Label>
        <div className="flex items-center gap-2">
          <Input
            id="apiKey"
            name="apiKey"
            type={show ? "text" : "password"}
            placeholder={hasApiKey ? "Deixe em branco para manter a atual" : "Cole a apikey do n8n"}
            autoComplete="off"
          />
          <Button type="button" variant="outline" onClick={() => setShow((s) => !s)} className="shrink-0">
            {show ? "Ocultar" : "Mostrar"}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Enviada nos headers <code>X-API-KEY</code> e <code>Authorization: Bearer</code>. Armazenada
          criptografada. {hasApiKey && "Já existe uma apikey salva."}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Webhooks por flow</Label>
          <p className="text-muted-foreground text-xs">
            Caminho relativo de cada workflow no n8n. Deixe em branco para usar o padrão do código.
          </p>
        </div>
        {Object.values(n8nFlows).map((flow) => (
          <div key={flow.id} className="space-y-1">
            <Label htmlFor={`path-${flow.id}`} className="text-sm">
              {flow.name}
            </Label>
            <Input
              id={`path-${flow.id}`}
              name={`path:${flow.id}`}
              defaultValue={initialFlowPaths[flow.id] ?? flow.path}
              placeholder={flow.path}
            />
            <p className="text-muted-foreground text-xs">
              padrão: <code>{flow.path}</code>
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar configuração"}
        </Button>
        {state && (
          <span className={state.success ? "text-emerald-600 text-sm" : "text-destructive text-sm"}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  )
}
