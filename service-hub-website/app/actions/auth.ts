"use server"

import { redirect } from "next/navigation"

import { clearSession, setSession } from "@/lib/auth"
import { getDefaultRouteForUser } from "@/lib/permissions"
import { verifyServerUser } from "@/lib/server-users"

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "")
  const password = String(formData.get("password") || "")

  const user = await verifyServerUser(email, password)

  if (!user) {
    return { error: "Email ou senha inválidos" }
  }

  await setSession({ id: user.id, email: user.email, name: user.name, groups: user.groups })
  redirect(getDefaultRouteForUser(user))
}

export async function logoutAction() {
  await clearSession()
  redirect("/login")
}
