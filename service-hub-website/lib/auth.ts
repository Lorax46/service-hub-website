import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export interface User {
  id: string
  email: string
  name: string
}

// Simulated user session - In production, connect to your database
export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")

  if (!sessionCookie) {
    return null
  }

  try {
    // In production, validate session token against database
    const session = JSON.parse(sessionCookie.value)
    return session.user
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

export async function setSession(user: User) {
  const cookieStore = await cookies()
  cookieStore.set("session", JSON.stringify({ user }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}
