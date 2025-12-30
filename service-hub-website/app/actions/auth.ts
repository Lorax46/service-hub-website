"use server"

import { setSession, clearSession } from "@/lib/auth"
import { redirect } from "next/navigation"

// Simple demo - In production, use bcrypt and database
const DEMO_USERS = [{ id: "1", email: "admin@servicehub.com", password: "demo123", name: "Admin User" }]

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // In production: query database and verify bcrypt hash
  const user = DEMO_USERS.find((u) => u.email === email && u.password === password)

  if (!user) {
    return { error: "Credenciais inválidas" }
  }

  await setSession({ id: user.id, email: user.email, name: user.name })
  redirect("/dashboard")
}

export async function registerAction(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // In production: hash password with bcrypt, store in database
  const newUser = {
    id: Math.random().toString(36).substring(7),
    email,
    name,
  }

  await setSession(newUser)
  redirect("/dashboard")
}

export async function logoutAction() {
  await clearSession()
  redirect("/login")
}
