import { NextRequest, NextResponse } from "next/server"
import { verifyServerUser } from "@/lib/server-users"
import { getDefaultRouteForUser } from "@/lib/permissions"
import { setSession } from "@/lib/auth"

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

  // Grava o cookie de sessão COMO JWT ASSINADO (coerente com lib/auth getSession).
  await setSession({ id: user.id, email: user.email, name: user.name, groups: user.groups })

  return NextResponse.json({ ok: true, redirect: getDefaultRouteForUser(user) })
}
