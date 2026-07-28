import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth"
import { permissions } from "@/lib/permissions"
import { getGroupMembers, listGroups } from "@/lib/server-users"

export async function GET() {
  try {
    await requirePermission(permissions.manageUsers)
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const groups = await listGroups()
  const data = await Promise.all(
    groups.map(async (g) => ({ ...g, members: await getGroupMembers(g.id) })),
  )
  return NextResponse.json(data)
}
