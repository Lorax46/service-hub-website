import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth"
import { permissions } from "@/lib/permissions"
import { addGroupMember, removeGroupMember } from "@/lib/server-users"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission(permissions.manageUsers)
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params
  const formData = await request.formData()
  const userId = String(formData.get("userId") || "").trim()

  if (!userId) {
    return NextResponse.json(
      { error: "ID do usuário é obrigatório." },
      { status: 400 },
    )
  }

  try {
    await addGroupMember(id, userId)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erro ao adicionar membro." },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission(permissions.manageUsers)
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json(
      { error: "ID do usuário é obrigatório." },
      { status: 400 },
    )
  }

  try {
    await removeGroupMember(id, userId)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erro ao remover membro." },
      { status: 500 },
    )
  }
}
