"use server"

import { requireAuth, type User } from "@/lib/auth"
import { appendHistoryEntry } from "@/lib/history"
import { getN8nFlow, type N8nFlowId } from "@/lib/n8n-flows"
import { flowPermissions, permissions, userHasPermission, type Permission } from "@/lib/permissions"
import { sendToWebhook } from "@/lib/webhook-client"

function getLoggedUserPayload(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  }
}

function withLoggedUserPayload(payload: Record<string, unknown>, user: User) {
  const loggedUser = getLoggedUserPayload(user)

  return {
    ...payload,
    user: loggedUser,
    userId: loggedUser.id,
    userName: loggedUser.name,
    userEmail: loggedUser.email,
  }
}

function appendLoggedUserToFormData(formData: FormData, user: User) {
  const loggedUser = getLoggedUserPayload(user)

  formData.set("user", JSON.stringify(loggedUser))
  formData.set("userId", loggedUser.id)
  formData.set("userName", loggedUser.name)
  formData.set("userEmail", loggedUser.email)
}

function createDownloadFilename(base: string) {
  return `${base
    .trim()
    .replace(/[^a-zA-Z0-9-_\.]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)}-${Date.now()}.json`
}

function denyPermission(permission: Permission) {
  return {
    success: false,
    message: `Você não tem permissão para executar ${permission}.`,
  }
}

function assertUserPermission(user: User, permission: Permission) {
  return userHasPermission(user, permission) ? null : denyPermission(permission)
}

export async function processDocumentAction(formData: FormData) {
  const user = await requireAuth()
  const permissionError = assertUserPermission(user, permissions.reportsView)

  if (permissionError) {
    return permissionError
  }

  const file = formData.get("file") as File
  const webhookUrl = formData.get("webhookUrl") as string

  if (!file || !webhookUrl) {
    return { success: false, message: "Arquivo e URL do webhook são obrigatórios" }
  }

  appendLoggedUserToFormData(formData, user)

  // Send file to n8n webhook
  const result = await sendToWebhook({ id: "doc-processor", name: "Document Processor", url: webhookUrl }, formData)

  await appendHistoryEntry({
    userId: user.id,
    type: "document",
    title: `Processamento de ${file.name}`,
    description: "Documento enviado ao n8n",
    webhook: "Document Processor",
    request: {
      fileName: file.name,
      webhookUrl,
    },
    responseSummary: result.data ?? { error: result.error },
    status: result.success ? "completed" : "failed",
    error: result.success ? undefined : result.error,
    downloadFilename: createDownloadFilename(`document-${file.name}`),
  })

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
  const user = await requireAuth()
  const permissionError = assertUserPermission(user, permissions.workflowAutomation)

  if (permissionError) {
    return permissionError
  }

  if (!webhookUrl) {
    return { success: false, message: "URL do webhook é obrigatória" }
  }

  const result = await sendToWebhook(
    { id: "workflow", name: "Workflow Automation", url: webhookUrl },
    withLoggedUserPayload(payload || {}, user),
  )

  await appendHistoryEntry({
    userId: user.id,
    type: "workflow",
    title: "Workflow Automation",
    description: "Execução de workflow genérico",
    webhook: "Workflow Automation",
    request: payload || {},
    responseSummary: result.data ?? { error: result.error },
    status: result.success ? "completed" : "failed",
    error: result.success ? undefined : result.error,
    downloadFilename: createDownloadFilename("workflow-automation"),
  })

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

export async function getActiveWebhooksStatus() {
  const user = await requireAuth()
  const permissionError = assertUserPermission(user, permissions.webhooks)

  if (permissionError) {
    return { success: false, error: permissionError.message }
  }

  const webhookUrl = process.env.N8N_ACTIVE_WEBHOOKS_URL || "https://n8n.example.com/webhook/active-webhooks-status"

  if (!webhookUrl) {
    return { success: false, error: "Webhook de status não configurado" }
  }

  const result = await sendToWebhook(
    { id: "active-webhooks-status", name: "Active Webhooks Status", url: webhookUrl },
    withLoggedUserPayload(
      {
        action: "checkStatus",
        requestedAt: new Date().toISOString(),
      },
      user,
    ),
  )

  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }

  return {
    success: false,
    error: result.error || "Erro ao consultar status dos webhooks",
  }
}

export async function executeN8nFlowAction(flowId: N8nFlowId, payload: Record<string, unknown> = {}) {
  const user = await requireAuth()

  const flow = getN8nFlow(flowId)

  if (!flow) {
    return { success: false, message: "Flow n8n não encontrado" }
  }

  const requiredPermission = flowPermissions[flow.id]
  const permissionError = requiredPermission ? assertUserPermission(user, requiredPermission) : null

  if (permissionError) {
    return permissionError
  }

  const result = await sendToWebhook(
    {
      id: flow.id,
      name: flow.name,
      url: flow.url,
    },
    withLoggedUserPayload(
      {
        flowId: flow.id,
        ...payload,
        requestedAt: new Date().toISOString(),
      },
      user,
    ),
  )

  await appendHistoryEntry({
    userId: user.id,
    type: flow.id.toLowerCase().includes("query") ? "query" : "workflow",
    title: flow.name,
    description: `Execução de fluxo n8n ${flow.name}`,
    webhook: flow.name,
    flowId: flow.id,
    request: {
      ...payload,
      flowId: flow.id,
    },
    responseSummary: result.data ?? { error: result.error },
    status: result.success ? "completed" : "failed",
    error: result.success ? undefined : result.error,
    downloadFilename: createDownloadFilename(flow.id),
  })

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

export async function requestSendReportsAuthorizationAction() {
  return executeN8nFlowAction("sendReports", {
    action: "requestAuthorization",
    step: "review",
  })
}

export async function confirmSendReportsAction(payload: Record<string, unknown> = {}) {
  return executeN8nFlowAction("sendReports", {
    action: "confirmPayload",
    step: "confirm",
    approved: true,
    ...payload,
  })
}

export async function shareDataDriftFileAction(payload: Record<string, unknown> = {}) {
  const user = await requireAuth()
  const permissionError = assertUserPermission(user, permissions.dataDrift)

  if (permissionError) {
    return permissionError
  }

  const flow = getN8nFlow("generateDataDrift")

  if (!flow) {
    return { success: false, message: "Flow n8n não encontrado" }
  }

  const result = await sendToWebhook(
    {
      id: flow.id,
      name: flow.name,
      url: flow.url,
    },
    withLoggedUserPayload(
      {
        flowId: flow.id,
        action: "shareGoogleSheet",
        ...payload,
        email: user.email,
        requestedAt: new Date().toISOString(),
      },
      user,
    ),
  )

  if (result.success) {
    await appendHistoryEntry({
      userId: user.id,
      type: "workflow",
      title: flow.name,
      description: "Solicitação de arquivo via n8n",
      webhook: flow.name,
      flowId: flow.id,
      request: {
        flowId: flow.id,
        action: "shareGoogleSheet",
        email: user.email,
        ...payload,
      },
      responseSummary: result.data ?? { error: result.error },
      status: result.success ? "completed" : "failed",
      downloadFilename: createDownloadFilename(flow.id),
    })

    return {
      success: true,
      message: `Arquivo solicitado. O n8n deve compartilhar a planilha com ${user.email}.`,
      data: result.data,
    }
  }

  await appendHistoryEntry({
    userId: user.id,
    type: "workflow",
    title: flow.name,
    description: "Solicitação de arquivo via n8n",
    webhook: flow.name,
    flowId: flow.id,
    request: {
      flowId: flow.id,
      action: "shareGoogleSheet",
      email: user.email,
      ...payload,
    },
    responseSummary: { error: result.error },
    status: "failed",
    error: result.error,
    downloadFilename: createDownloadFilename(flow.id),
  })

  return {
    success: false,
    message: result.error || `Erro ao solicitar arquivo em ${flow.name}`,
  }
}

const readOnlySqlPattern = /^(select|with|show|describe|explain)\b/i
const blockedSqlPattern =
  /\b(alter|attach|call|copy|create|delete|detach|drop|execute|grant|insert|merge|revoke|truncate|update|vacuum)\b/i

function validateReadOnlySql(sql: string) {
  const normalizedSql = sql.trim()

  if (!normalizedSql) {
    return "Informe uma consulta SQL."
  }

  if (!readOnlySqlPattern.test(normalizedSql)) {
    return "A consulta deve ser somente leitura e iniciar com SELECT, WITH, SHOW, DESCRIBE ou EXPLAIN."
  }

  if (blockedSqlPattern.test(normalizedSql)) {
    return "A consulta contém comandos bloqueados para execução segura."
  }

  if (normalizedSql.replace(/;$/, "").includes(";")) {
    return "Execute apenas uma consulta por vez."
  }

  return null
}

export async function executeQueryAction(flowId: N8nFlowId, sql: string) {
  const user = await requireAuth()
  const permissionError = assertUserPermission(user, permissions.queries)

  if (permissionError) {
    return permissionError
  }

  const flow = getN8nFlow(flowId)

  if (!flow) {
    return { success: false, message: "Flow n8n não encontrado" }
  }

  if (!flow.id.toLowerCase().includes("steampipe") && !flow.id.toLowerCase().includes("tailpipe")) {
    return { success: false, message: "Flow inválido para execução de query" }
  }

  const validationError = validateReadOnlySql(sql)

  if (validationError) {
    return { success: false, message: validationError }
  }

  const result = await sendToWebhook(
    {
      id: flow.id,
      name: flow.name,
      url: flow.url,
    },
    withLoggedUserPayload(
      {
        flowId: flow.id,
        sql: sql.trim(),
        requestedAt: new Date().toISOString(),
      },
      user,
    ),
  )

  await appendHistoryEntry({
    userId: user.id,
    type: "query",
    title: flow.name,
    description: "Consulta SQL executada via n8n",
    webhook: flow.name,
    flowId: flow.id,
    request: {
      flowId: flow.id,
      sql: sql.trim(),
    },
    responseSummary: result.data ?? { error: result.error },
    status: result.success ? "completed" : "failed",
    error: result.success ? undefined : result.error,
    downloadFilename: createDownloadFilename(`${flow.id}-query`),
  })

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
