"use server"

import { requireAuth } from "@/lib/auth"
import { getN8nFlow, type N8nFlowId } from "@/lib/n8n-flows"
import { sendToWebhook } from "@/lib/webhook-client"

export async function processDocumentAction(formData: FormData) {
  await requireAuth()

  const file = formData.get("file") as File
  const webhookUrl = formData.get("webhookUrl") as string

  if (!file || !webhookUrl) {
    return { success: false, message: "Arquivo e URL do webhook são obrigatórios" }
  }

  // Send file to n8n webhook
  const result = await sendToWebhook({ id: "doc-processor", name: "Document Processor", url: webhookUrl }, formData)

  if (result.success) {
    return {
      success: true,
      message: `Documento ${file.name} processado com sucesso!`,
      data: result.data,
    }
  }

  return {
    success: false,
    message: result.error || "Erro ao processar documento",
  }
}

export async function executeWorkflowAction(webhookUrl: string, payload: any) {
  await requireAuth()

  if (!webhookUrl) {
    return { success: false, message: "URL do webhook é obrigatória" }
  }

  const result = await sendToWebhook({ id: "workflow", name: "Workflow Automation", url: webhookUrl }, payload)

  if (result.success) {
    return {
      success: true,
      message: "Workflow executado com sucesso!",
      data: result.data,
    }
  }

  return {
    success: false,
    message: result.error || "Erro ao executar workflow",
  }
}

export async function executeN8nFlowAction(flowId: N8nFlowId) {
  await requireAuth()

  const flow = getN8nFlow(flowId)

  if (!flow) {
    return { success: false, message: "Flow n8n não encontrado" }
  }

  const result = await sendToWebhook(
    {
      id: flow.id,
      name: flow.name,
      url: flow.url,
    },
    {
      flowId: flow.id,
      requestedAt: new Date().toISOString(),
    },
  )

  if (result.success) {
    return {
      success: true,
      message: flow.successMessage,
      data: result.data,
    }
  }

  return {
    success: false,
    message: result.error || `Erro ao executar ${flow.name}`,
  }
}
