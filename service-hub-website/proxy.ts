import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const session = request.cookies.get("session")
  const isAuthPage = request.nextUrl.pathname === "/login"
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard")

  // Redirect to login if accessing dashboard without session
  if (isDashboard && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect to dashboard if accessing login with active session
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
