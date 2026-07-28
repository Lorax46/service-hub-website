import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth"
import { permissions } from "@/lib/permissions"
import { listUsers } from "@/lib/server-users"

export async function GET() {
  try {
    await requirePermission(permissions.manageUsers)
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const users = listUsers()
  return NextResponse.json(await users)
}
