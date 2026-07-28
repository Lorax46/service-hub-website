import { requirePermission } from "@/lib/auth"
import { permissions } from "@/lib/permissions"
import { getGroupMembers, listGroups, listUsers } from "@/lib/server-users"
import AdminUsersClient from "./users-client"

export default async function AdminUsersPage() {
  const user = await requirePermission(permissions.manageUsers)
  const users = await listUsers()
  const groups = await listGroups()
  const initialGroups = await Promise.all(
    groups.map(async (g) => ({ ...g, members: await getGroupMembers(g.id) })),
  )

  return (
    <AdminUsersClient
      user={user}
      initialUsers={users}
      initialGroups={initialGroups}
    />
  )
}
