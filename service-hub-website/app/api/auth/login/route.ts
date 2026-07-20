import { NextRequest, NextResponse } from "next/server"
import { verifyServerUser } from "@/lib/server-users"
import { getDefaultRouteForUser } from "@/lib/permissions"

export async function POST(request: NextRequest) {
  let email = ""
  let password = ""
  try {
    const body = await request.json()
    email = String(body.email || "")
    password = String(body.password || "")
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 })
  }

  const user = await verifyServerUser(email, password)
  if (!user) {
    return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
  }

  const sessionValue = JSON.stringify({ user })
  const secure = process.env.SECURE_COOKIES === "true"
  const response = NextResponse.json({ ok: true, redirect: getDefaultRouteForUser(user) })
  response.cookies.set("session", sessionValue, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
  return response
}
