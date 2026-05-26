export const n8nFlows = {
  createReports: {
    id: "createReports",
    name: "Criar relatórios",
    url: "urln8n://depois-eu-altero/criar-relatorios",
    successMessage: "Flow de criação de relatórios executado com sucesso.",
  },
  sendReports: {
    id: "sendReports",
    name: "Enviar relatórios",
    url: "urln8n://depois-eu-altero/enviar-relatorios",
    successMessage: "Flow de envio de relatórios executado. Validação retornada pelo n8n.",
  },
  generateDataDrift: {
    id: "generateDataDrift",
    name: "Gerar drift de dados",
    url: "urln8n://depois-eu-altero/gerar-drift-de-dados",
    successMessage: "Flow de drift de dados executado. Resultado disponibilizado pelo n8n.",
  },
  steampipeQuery: {
    id: "steampipeQuery",
    name: "Steampipe query",
    url: "urln8n://depois-eu-altero/steampipe-query",
    successMessage: "Consulta enviada ao Steampipe pelo n8n.",
  },
  steampipeUpdateDatabase: {
    id: "steampipeUpdateDatabase",
    name: "Update database Steampipe",
    url: "urln8n://depois-eu-altero/steampipe-update-database",
    successMessage: "Atualização do database Steampipe iniciada pelo n8n.",
  },
  tailpipeQuery: {
    id: "tailpipeQuery",
    name: "Tailpipe query",
    url: "urln8n://depois-eu-altero/tailpipe-query",
    successMessage: "Consulta enviada ao Tailpipe pelo n8n.",
  },
} as const

export type N8nFlowId = keyof typeof n8nFlows

export function getN8nFlow(flowId: string) {
  return n8nFlows[flowId as N8nFlowId]
}
