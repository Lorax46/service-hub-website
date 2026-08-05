import { NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth"
import { permissions } from "@/lib/permissions"
import { createUser, deleteUser, updateUser } from "@/lib/server-users"

export async function POST(request: Request) {
  try {
    await requirePermission(permissions.manageUsers)
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const groupsRaw = String(formData.get("groups") || "")
  const groups = groupsRaw
    .split(",")
    .map((g) => g.trim().toLowerCase())
    .filter(Boolean)

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "Nome, email e senha são obrigatórios." },
      { status: 400 },
    )
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter ao menos 6 caracteres." },
      { status: 400 },
    )
  }

  try {
    const user = await createUser({ email, password, name, groups })
    return NextResponse.json(user, { status: 201 })
  } catch (e: any) {
    if (String(e?.message || "").includes("users_email_key")) {
      return NextResponse.json(
        { error: "Já existe um usuário com este email." },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: "Erro ao criar usuário." }, { status: 500 })
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
  const name = String(formData.get("name") || "").trim()
  const groupsRaw = String(formData.get("groups") || "")
  const groups = groupsRaw
    .split(",")
    .map((g) => g.trim().toLowerCase())
    .filter(Boolean)
  const isActiveRaw = String(formData.get("isActive") || "true")
  const isActive = isActiveRaw === "true" || isActiveRaw === "on"

  if (!id) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 })
  }

  try {
    await updateUser(id, { name, groups, isActive })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao atualizar usuário." },
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
    await deleteUser(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao excluir usuário." },
      { status: 500 },
    )
  }
}
