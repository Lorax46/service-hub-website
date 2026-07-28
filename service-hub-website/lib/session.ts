// =====================================================================
// Session tokens — JWT assinado (HS256) com jose.
// Substitui o cookie de sessao em texto claro (JSON puro) por um token
// criptograficamente assinado. Sem a assinatura correta, getSession()
// rejeita o cookie. A revogacao "na hora" de um usuario ainda e coberta
// por lib/auth.ts, que revalida is_active no banco a cada request.
// =====================================================================
import { SignJWT, jwtVerify } from "jose"
import type { User } from "@/lib/auth"

const ALG = "HS256"
const SESSION_TTL_SECONDS = 60 * 60 * 2 // 2 horas

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET ausente ou muito curto. Defina uma string aleatoria " +
        "(>=16 chars) no .env.local. Em producao, gere com: " +
        "openssl rand -base64 48",
    )
  }
  return new TextEncoder().encode(secret)
}

export interface SessionPayload {
  id: string
  email: string
  name: string
  groups: string[]
}

export async function signSession(user: User): Promise<string> {
  const payload: SessionPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    groups: user.groups,
  }
  const secretKey = getSecretKey()
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setIssuer("service-hub")
    .setAudience("service-hub")
    .sign(secretKey)
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const secretKey = getSecretKey()
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: [ALG],
      issuer: "service-hub",
      audience: "service-hub",
    })
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      !Array.isArray(payload.groups)
    ) {
      return null
    }
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      groups: payload.groups.filter((g): g is string => typeof g === "string"),
    }
  } catch {
    // token ausente, expirado ou assinatura invalida
    return null
  }
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_SECONDS
