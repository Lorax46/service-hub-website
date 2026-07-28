// Configuração dos flows n8n.
// A URL base e a apikey são globais (salvas em n8n_config, ver lib/n8n-config.ts).
// Cada flow define apenas o `path` relativo; a URL final é baseUrl + path.
export const n8nFlows = {
  createReports: {
    id: "createReports",
    name: "Criar relatórios",
    path: "webhook/criar-relatorios",
    successMessage: "Flow de criação de relatórios executado com sucesso.",
  },
  sendReports: {
    id: "sendReports",
    name: "Enviar relatórios",
    path: "webhook/a9cfc4d5-7771-462d-b09f-ad40849f0ff1",
    successMessage: "Flow de envio de relatórios executado. Validação retornada pelo n8n.",
  },
  generateDataDrift: {
    id: "generateDataDrift",
    name: "Gerar drift de dados",
    path: "webhook/a9cfc4d5-7771-462d-b09f-ad40849f0ff1",
    successMessage: "Flow de drift de dados executado. Resultado disponibilizado pelo n8n.",
  },
  steampipeQuery: {
    id: "steampipeQuery",
    name: "Steampipe query",
    path: "webhook/a9cfc4d5-7771-462d-b09f-ad40849f0ff1",
    successMessage: "Consulta enviada ao Steampipe pelo n8n.",
  },
  steampipeUpdateDatabase: {
    id: "steampipeUpdateDatabase",
    name: "Update database Steampipe",
    path: "webhook/a9cfc4d5-7771-462d-b09f-ad40849f0ff1",
    successMessage: "Atualização do database Steampipe iniciada pelo n8n.",
  },
  tailpipeQuery: {
    id: "tailpipeQuery",
    name: "Tailpipe query",
    path: "webhook/tailpipe-query",
    successMessage: "Consulta enviada ao Tailpipe pelo n8n.",
  },
} as const

export type N8nFlowId = keyof typeof n8nFlows

export function getN8nFlow(flowId: string) {
  return n8nFlows[flowId as N8nFlowId]
}
