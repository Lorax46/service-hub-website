import bcrypt from "bcryptjs"
import { query, getClient } from "@/lib/db"

export type UserStatus = "active" | "invited" | "inactive"

export type ServerUser = {
  id: string
  email: string
  name: string
  groups: string[]
  status: UserStatus
  isActive: boolean
  lastLogin: string | null
  createdAt: string
}

export type Group = {
  id: string
  name: string
  description: string
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

/**
 * Sincroniza users.groups (fonte usada para permissões) com as memberships
 * atuais na tabela user_group_memberships. Mantém as duas sempre coerentes.
 */
async function syncUserGroups(userId: string) {
  await query(
    `UPDATE users u SET groups = COALESCE(
       (SELECT array_agg(gr.name ORDER BY gr.name) FROM user_group_memberships m
        JOIN groups gr ON gr.id = m.group_id WHERE m.user_id = u.id),
       '{}'::text[]
     ) WHERE u.id = $1`,
    [userId],
  )
}

export async function getUserByEmail(email: string): Promise<ServerUser | null> {
  const { rows } = await query<{
    id: string
    email: string
    name: string
    groups: string[]
    status: UserStatus
    is_active: boolean
    last_login: string | null
    created_at: string
  }>(
    "SELECT id, email, name, groups, status, is_active, last_login, created_at FROM users WHERE email = $1",
    [normalizeEmail(email)],
  )
  if (rows.length === 0) return null
  const r = rows[0]
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    groups: r.groups || [],
    status: r.status,
    isActive: r.is_active,
    lastLogin: r.last_login,
    createdAt: r.created_at,
  }
}

export async function verifyServerUser(email: string, password: string): Promise<ServerUser | null> {
  const { rows } = await query<{
    id: string
    email: string
    name: string
    groups: string[]
    status: UserStatus
    is_active: boolean
    password_hash: string
    last_login: string | null
    created_at: string
  }>(
    "SELECT id, email, name, groups, status, is_active, password_hash, last_login, created_at FROM users WHERE email = $1",
    [normalizeEmail(email)],
  )
  if (rows.length === 0) return null
  const r = rows[0]
  // Usuário inativo (desativado) não loga de forma alguma.
  if (!r.is_active) return null
  const ok = await bcrypt.compare(password, r.password_hash)
  if (!ok) return null

  // Primeiro login de um convite (ou primeiro login absoluto): promove
  // 'invited' -> 'active' e grava last_login. Logins seguintes só atualizam last_login.
  const justActivated = r.status === "invited" || r.last_login === null
  const nowIso = new Date().toISOString()
  if (justActivated) {
    await query(
      "UPDATE users SET status = 'active', last_login = NOW(), updated_at = NOW() WHERE id = $1",
      [r.id],
    )
  } else {
    await query("UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1", [r.id])
  }

  return {
    id: r.id,
    email: r.email,
    name: r.name,
    groups: r.groups || [],
    status: "active",
    isActive: r.is_active,
    lastLogin: nowIso,
    createdAt: r.created_at,
  }
}

export async function createUser(input: {
  email: string
  password: string
  name: string
  groups: string[]
}): Promise<ServerUser> {
  const hash = await bcrypt.hash(input.password, 12)
  const client = await getClient()
  try {
    await client.query("BEGIN")
    const { rows } = await client.query<{
      id: string
      email: string
      name: string
      status: UserStatus
      is_active: boolean
      created_at: string
    }>(
      "INSERT INTO users (email, password_hash, name, groups, is_active, status) VALUES ($1,$2,$3,$4,true,'invited') RETURNING id, email, name, status, is_active, created_at",
      [normalizeEmail(input.email), hash, input.name, normalizeGroups(input.groups, ["user"])],
    )
    const user = rows[0]
    // Resolve os IDs dos grupos informados e cria memberships.
    const groupNames = normalizeGroups(input.groups, ["user"])
    if (groupNames.length > 0) {
      const { rows: grp } = await client.query<{ id: string }>(
        "SELECT id FROM groups WHERE name = ANY($1)",
        [groupNames],
      )
      for (const g of grp) {
        await client.query(
          "INSERT INTO user_group_memberships (user_id, group_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
          [user.id, g.id],
        )
      }
    }
    await client.query("COMMIT")
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      groups: groupNames,
      status: user.status,
      isActive: user.is_active,
      lastLogin: null,
      createdAt: user.created_at,
    }
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  } finally {
    client.release()
  }
}

export async function listUsers(): Promise<ServerUser[]> {
  const { rows } = await query<{
    id: string
    email: string
    name: string
    groups: string[]
    status: UserStatus
    is_active: boolean
    last_login: string | null
    created_at: string
  }>(
    "SELECT id, email, name, groups, status, is_active, last_login, created_at FROM users ORDER BY created_at ASC",
  )
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    groups: r.groups || [],
    status: r.status,
    isActive: r.is_active,
    lastLogin: r.last_login,
    createdAt: r.created_at,
  }))
}

export async function updateUser(
  id: string,
  input: { name?: string; groups?: string[]; isActive?: boolean },
): Promise<void> {
  const client = await getClient()
  try {
    await client.query("BEGIN")

    // is_active controla o status derivado:
    //   inativo      -> 'inactive'
    //   ativo + já logou (status active ou last_login) -> 'active'
    //   ativo + nunca logou                       -> 'invited'
    if (input.isActive !== undefined) {
      const { rows: cur } = await client.query<{ last_login: string | null; status: UserStatus }>(
        "SELECT last_login, status FROM users WHERE id = $1",
        [id],
      )
      const current = cur[0]
      const newStatus: UserStatus = !input.isActive
        ? "inactive"
        : current?.status === "active" || current?.last_login
          ? "active"
          : "invited"
      await client.query(
        "UPDATE users SET is_active = $1, status = $2, updated_at = NOW() WHERE id = $3",
        [input.isActive, newStatus, id],
      )
    }

    if (input.name !== undefined) {
      await client.query("UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2", [
        input.name,
        id,
      ])
    }

    if (input.groups !== undefined) {
      const groupNames = normalizeGroups(input.groups, ["user"])
      await client.query("DELETE FROM user_group_memberships WHERE user_id = $1", [id])
      if (groupNames.length > 0) {
        const { rows: grp } = await client.query<{ id: string }>(
          "SELECT id FROM groups WHERE name = ANY($1)",
          [groupNames],
        )
        for (const g of grp) {
          await client.query(
            "INSERT INTO user_group_memberships (user_id, group_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
            [id, g.id],
          )
        }
      }
      await syncUserGroups(id)
    }

    await client.query("COMMIT")
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  } finally {
    client.release()
  }
}

export async function setUserPassword(id: string, password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 12)
  await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
    hash,
    id,
  ])
}

export async function deleteUser(id: string): Promise<void> {
  // memberships caem em cascata (ON DELETE CASCADE)
  await query("DELETE FROM users WHERE id = $1", [id])
}

export async function countUsers(): Promise<number> {
  const { rows } = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users")
  return parseInt(rows[0]?.count || "0", 10)
}

// ---------------------------------------------------------------------------
// Grupos (catálogo compartilhado)
// ---------------------------------------------------------------------------

export async function listGroups(): Promise<Group[]> {
  const { rows } = await query<Group>("SELECT id, name, description FROM groups ORDER BY name")
  return rows
}

export async function getGroupMembers(
  groupId: string,
): Promise<{ id: string; name: string; email: string }[]> {
  const { rows } = await query<{ id: string; name: string; email: string }>(
    `SELECT u.id, u.name, u.email FROM user_group_memberships m
     JOIN users u ON u.id = m.user_id
     WHERE m.group_id = $1 ORDER BY u.name`,
    [groupId],
  )
  return rows
}

export async function createGroup(name: string, description: string): Promise<Group> {
  const { rows } = await query<Group>(
    "INSERT INTO groups (name, description) VALUES ($1,$2) RETURNING id, name, description",
    [name.trim().toLowerCase(), description.trim()],
  )
  return rows[0]
}

export async function deleteGroup(id: string): Promise<void> {
  // memberships caem em cascata
  await query("DELETE FROM groups WHERE id = $1", [id])
}
