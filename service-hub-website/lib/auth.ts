import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { type Permission, userHasPermission } from "@/lib/permissions"
import { getUserByEmail, type ServerUser } from "@/lib/server-users"

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

  try {
    const session = JSON.parse(sessionCookie.value)
    const user = session.user

    if (
      typeof user !== "object" ||
      user === null ||
      typeof user.id !== "string" ||
      typeof user.email !== "string" ||
      typeof user.name !== "string"
    ) {
      return null
    }

    const sessionGroups = Array.isArray(user.groups)
      ? user.groups.filter((g: unknown): g is string => typeof g === "string")
      : []

    // Revalida contra o banco para pegar grupos atuais
    const dbUser: ServerUser | null = await getUserByEmail(user.email)
    if (!dbUser || !dbUser.isActive) {
      return null
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      groups: sessionGroups.length > 0 ? sessionGroups : dbUser.groups || [],
    }
  } catch {
    return null
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
  cookieStore.set("session", JSON.stringify({ user }), {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}
