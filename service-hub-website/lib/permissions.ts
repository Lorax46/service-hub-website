import type { N8nFlowId } from "@/lib/n8n-flows"
import type { User } from "@/lib/auth"

export const permissions = {
  dashboardView: "dashboard:view",
  toolsView: "tools:view",
  reportsView: "tools:reports",
  createReports: "tools:create-reports",
  sendReports: "tools:send-reports",
  dataDrift: "tools:data-drift",
  workflowAutomation: "tools:workflow-automation",
  queries: "tools:queries",
  webhooks: "webhooks:view",
  history: "history:view",
  manageUsers: "admin:users",
} as const

export type Permission = (typeof permissions)[keyof typeof permissions]

const defaultGroupPermissions: Record<string, string[]> = {
  admin: ["*"],
}

export const flowPermissions: Partial<Record<N8nFlowId, Permission>> = {
  createReports: permissions.createReports,
  sendReports: permissions.sendReports,
  generateDataDrift: permissions.dataDrift,
  steampipeQuery: permissions.queries,
  steampipeUpdateDatabase: permissions.queries,
  tailpipeQuery: permissions.queries,
}

function normalizeGroup(group: string) {
  return group.trim().toLowerCase()
}

export function getGroupPermissions() {
  if (!process.env.SERVICE_HUB_GROUP_PERMISSIONS) {
    return defaultGroupPermissions
  }

  try {
    const configuredPermissions = JSON.parse(process.env.SERVICE_HUB_GROUP_PERMISSIONS)

    if (typeof configuredPermissions !== "object" || configuredPermissions === null || Array.isArray(configuredPermissions)) {
      return defaultGroupPermissions
    }

    return {
      ...defaultGroupPermissions,
      ...Object.fromEntries(
        Object.entries(configuredPermissions)
          .filter(([, value]) => Array.isArray(value))
          .map(([group, value]) => [
            normalizeGroup(group),
            (value as unknown[]).filter((permission): permission is string => typeof permission === "string"),
          ]),
      ),
    }
  } catch {
    return defaultGroupPermissions
  }
}

export function userHasPermission(user: User, permission: Permission) {
  const groups = user.groups.map(normalizeGroup)

  if (groups.includes("admin")) {
    return true
  }

  const groupPermissions = getGroupPermissions()

  return groups.some((group) => {
    const allowedPermissions = groupPermissions[group] || []
    return allowedPermissions.includes("*") || allowedPermissions.includes(permission)
  })
}

export function userHasAnyPermission(user: User, requiredPermissions: Permission[]) {
  return requiredPermissions.some((permission) => userHasPermission(user, permission))
}

export function getDefaultRouteForUser(user: User) {
  const routes: Array<{ href: string; permission: Permission }> = [
    { href: "/dashboard", permission: permissions.dashboardView },
    { href: "/dashboard/tools", permission: permissions.toolsView },
    { href: "/dashboard/tools/document-processor", permission: permissions.reportsView },
    { href: "/dashboard/queries", permission: permissions.queries },
    { href: "/dashboard/history", permission: permissions.history },
    { href: "/dashboard/webhooks", permission: permissions.webhooks },
  ]

  return routes.find((route) => userHasPermission(user, route.permission))?.href || "/login"
}
