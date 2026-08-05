import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth"
import { permissions } from "@/lib/permissions"
import { createGroup, deleteGroup, updateGroup } from "@/lib/server-users"

export async function POST(request: Request) {
  try {
    await requirePermission(permissions.manageUsers)
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const name = String(formData.get("name") || "").trim().toLowerCase()
  const description = String(formData.get("description") || "").trim()

  if (!name) {
    return NextResponse.json(
      { error: "O nome do grupo é obrigatório." },
      { status: 400 },
    )
  }

  try {
    const group = await createGroup(name, description)
    return NextResponse.json(group, { status: 201 })
  } catch (e: any) {
    if (String(e?.message || "").includes("groups_name_key")) {
      return NextResponse.json(
        { error: "Já existe um grupo com este nome." },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: "Erro ao criar grupo." },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    await requirePermission(permissions.manageUsers)
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const id = String(formData.get("id") || "").trim()
  const name = String(formData.get("name") || "").trim().toLowerCase()
  const description = String(formData.get("description") || "").trim()

  if (!id || !name) {
    return NextResponse.json(
      { error: "ID e nome são obrigatórios." },
      { status: 400 },
    )
  }

  try {
    const group = await updateGroup(id, { name, description })
    return NextResponse.json(group)
  } catch (e: any) {
    if (String(e?.message || "").includes("groups_name_key")) {
      return NextResponse.json(
        { error: "Já existe um grupo com este nome." },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: "Erro ao atualizar grupo." },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    await requirePermission(permissions.manageUsers)
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 })
  }

  try {
    await deleteGroup(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao excluir grupo." },
      { status: 500 },
    )
  }
}
