import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { type Permission, userHasPermission } from "@/lib/permissions"
import { getUserByEmail, type ServerUser } from "@/lib/server-users"
import { signSession, verifySession, SESSION_MAX_AGE_SECONDS } from "@/lib/session"

export interface User {
  id: string
  email: string
  name: string
  groups: string[]
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")

  if (!sessionCookie) {
    return null
  }

  // Valida a ASSINATURA do token antes de confiar no payload.
  // Substitui a leitura de JSON em texto claro (vulneravel a forja).
  const payload = await verifySession(sessionCookie.value)
  if (!payload) {
    return null
  }

  // Revalida contra o banco para pegar grupos/estado atuais e permitir
  // revogacao imediata (is_active=false expulsa o usuario no proximo request).
  const dbUser: ServerUser | null = await getUserByEmail(payload.email)
  if (!dbUser || !dbUser.isActive) {
    return null
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    groups: payload.groups.length > 0 ? payload.groups : dbUser.groups || [],
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  return user
}

export async function requirePermission(permission: Permission): Promise<User> {
  const user = await requireAuth()

  if (!userHasPermission(user, permission)) {
    notFound()
  }

  return user
}

export async function setSession(user: User) {
  const cookieStore = await cookies()
  const secureCookies = process.env.SECURE_COOKIES === "true"
  const token = await signSession(user)
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}
