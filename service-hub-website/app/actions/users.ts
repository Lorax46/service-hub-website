"use server"

import { redirect } from "next/navigation"

import { requirePermission, type User } from "@/lib/auth"
import { permissions } from "@/lib/permissions"
import {
  createUser,
  deleteUser,
  listUsers,
  setUserPassword,
  updateUser,
} from "@/lib/server-users"

function normalizeGroups(formData: FormData): string[] {
  const value = String(formData.get("groups") || "")
  return value
    .split(",")
    .map((g) => g.trim().toLowerCase())
    .filter(Boolean)
}

export async function listUsersAction(): Promise<
  { id: string; email: string; name: string; groups: string[]; isActive: boolean }[]
> {
  await requirePermission(permissions.manageUsers)
  return listUsers()
}

export async function createUserAction(formData: FormData) {
  await requirePermission(permissions.manageUsers)
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")
  const name = String(formData.get("name") || "").trim()
  const groups = normalizeGroups(formData)

  if (!email || !password || !name) {
    return { success: false, message: "Nome, email e senha são obrigatórios." }
  }
  if (password.length < 6) {
    return { success: false, message: "A senha deve ter ao menos 6 caracteres." }
  }

  try {
    await createUser({ email, password, name, groups })
    return { success: true, message: "Usuário criado com sucesso." }
  } catch (e: any) {
    if (String(e?.message || "").includes("users_email_key")) {
      return { success: false, message: "Já existe um usuário com este email." }
    }
    return { success: false, message: "Erro ao criar usuário." }
  }
}

export async function updateUserAction(formData: FormData) {
  await requirePermission(permissions.manageUsers)
  const id = String(formData.get("id") || "")
  const name = String(formData.get("name") || "").trim()
  const groups = normalizeGroups(formData)
  const isActiveRaw = String(formData.get("isActive") || "true")
  const isActive = isActiveRaw === "true" || isActiveRaw === "on"

  if (!id) return { success: false, message: "ID inválido." }

  await updateUser(id, { name, groups, isActive })
  return { success: true, message: "Usuário atualizado." }
}

export async function setPasswordAction(formData: FormData) {
  await requirePermission(permissions.manageUsers)
  const id = String(formData.get("id") || "")
  const password = String(formData.get("password") || "")
  if (!id || password.length < 6) {
    return { success: false, message: "Senha deve ter ao menos 6 caracteres." }
  }
  await setUserPassword(id, password)
  return { success: true, message: "Senha redefinida." }
}

export async function deleteUserAction(formData: FormData) {
  await requirePermission(permissions.manageUsers)
  const id = String(formData.get("id") || "")
  const current = (await requirePermission(permissions.manageUsers)) as User
  if (id === current.id) {
    return { success: false, message: "Você não pode excluir a si mesmo." }
  }
  if (!id) return { success: false, message: "ID inválido." }
  await deleteUser(id)
  return { success: true, message: "Usuário excluído." }
}
