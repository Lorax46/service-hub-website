"use server"

import { requireAuth } from "@/lib/auth"
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
