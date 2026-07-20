import bcrypt from "bcryptjs"
import { query } from "@/lib/db"

export type ServerUser = {
  id: string
  email: string
  name: string
  groups: string[]
  isActive: boolean
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizeGroups(groups: unknown, fallback: string[]): string[] {
  if (!Array.isArray(groups)) return fallback
  const normalized = groups
    .filter((g): g is string => typeof g === "string")
    .map((g) => g.trim().toLowerCase())
    .filter(Boolean)
  return normalized.length > 0 ? normalized : fallback
}

export async function getUserByEmail(email: string): Promise<ServerUser | null> {
  const { rows } = await query<{
    id: string
    email: string
    name: string
    groups: string[]
    is_active: boolean
    password_hash: string
  }>("SELECT id, email, name, groups, is_active, password_hash FROM users WHERE email = $1", [normalizeEmail(email)])
  if (rows.length === 0) return null
  const r = rows[0]
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    groups: r.groups || [],
    isActive: r.is_active,
  }
}

export async function verifyServerUser(email: string, password: string): Promise<ServerUser | null> {
  const { rows } = await query<{ id: string; email: string; name: string; groups: string[]; is_active: boolean; password_hash: string }>(
    "SELECT id, email, name, groups, is_active, password_hash FROM users WHERE email = $1",
    [normalizeEmail(email)],
  )
  if (rows.length === 0) return null
  const r = rows[0]
  if (!r.is_active) return null
  const ok = await bcrypt.compare(password, r.password_hash)
  if (!ok) return null
  return { id: r.id, email: r.email, name: r.name, groups: r.groups || [], isActive: r.is_active }
}

export async function createUser(input: {
  email: string
  password: string
  name: string
  groups: string[]
}): Promise<ServerUser> {
  const hash = await bcrypt.hash(input.password, 12)
  const { rows } = await query<{ id: string; email: string; name: string; groups: string[]; is_active: boolean }>(
    "INSERT INTO users (email, password_hash, name, groups, is_active) VALUES ($1,$2,$3,$4,true) RETURNING id, email, name, groups, is_active",
    [normalizeEmail(input.email), hash, input.name, normalizeGroups(input.groups, ["user"])],
  )
  const r = rows[0]
  return { id: r.id, email: r.email, name: r.name, groups: r.groups || [], isActive: r.is_active }
}

export async function listUsers(): Promise<ServerUser[]> {
  const { rows } = await query<{ id: string; email: string; name: string; groups: string[]; is_active: boolean }>(
    "SELECT id, email, name, groups, is_active FROM users ORDER BY created_at ASC",
  )
  return rows.map((r) => ({ id: r.id, email: r.email, name: r.name, groups: r.groups || [], isActive: r.is_active }))
}

export async function updateUser(id: string, input: { name?: string; groups?: string[]; isActive?: boolean }): Promise<void> {
  const sets: string[] = []
  const params: unknown[] = []
  let i = 1
  if (input.name !== undefined) { sets.push("name = $" + i); params.push(input.name); i++ }
  if (input.groups !== undefined) { sets.push("groups = $" + i); params.push(normalizeGroups(input.groups, ["user"])); i++ }
  if (input.isActive !== undefined) { sets.push("is_active = $" + i); params.push(input.isActive); i++ }
  if (sets.length === 0) return
  sets.push("updated_at = NOW()")
  params.push(id)
  await query("UPDATE users SET " + sets.join(", ") + " WHERE id = $" + i, params)
}

export async function setUserPassword(id: string, password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 12)
  await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hash, id])
}

export async function deleteUser(id: string): Promise<void> {
  await query("DELETE FROM users WHERE id = $1", [id])
}

export async function countUsers(): Promise<number> {
  const { rows } = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users")
  return parseInt(rows[0]?.count || "0", 10)
}
