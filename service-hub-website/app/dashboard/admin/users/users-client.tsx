"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  CheckCircle2,
  Clock,
  UserPlus,
  Users,
  Trash2,
  RefreshCw,
  KeyRound,
} from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  createUserAction,
  updateUserAction,
  setPasswordAction,
  deleteUserAction,
  createGroupAction,
  deleteGroupAction,
} from "@/app/actions/users"
import type { User } from "@/lib/auth"

type UserRow = {
  id: string
  email: string
  name: string
  groups: string[]
  status: "active" | "invited" | "inactive"
  isActive: boolean
  lastLogin: string | null
}

type GroupRow = {
  id: string
  name: string
  description: string
  members: { id: string; name: string; email: string }[]
}

// --------------------------------------------------------------------------
// Helpers de UI
// --------------------------------------------------------------------------

function StatusBadge({ status, isActive }: { status: UserRow["status"]; isActive: boolean }) {
  if (!isActive || status === "inactive") {
    return <Badge variant="destructive">Inativo</Badge>
  }
  if (status === "invited") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" /> Convidado
      </Badge>
    )
  }
  return (
    <Badge variant="default" className="gap-1">
      <CheckCircle2 className="h-3 w-3" /> Ativo
    </Badge>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return "nunca"
  try {
    return new Date(iso).toLocaleString("pt-BR")
  } catch {
    return iso
  }
}

function SubmitButton({
  children,
  variant = "default",
  size = "sm",
}: {
  children: React.ReactNode
  variant?: "default" | "outline" | "destructive" | "secondary"
  size?: "sm" | "default" | "icon"
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending}>
      {pending ? "…" : children}
    </Button>
  )
}

// --------------------------------------------------------------------------
// ABA 1 — USUÁRIOS
// --------------------------------------------------------------------------

function CreateUserForm({ groups, onDone }: { groups: GroupRow[]; onDone: () => void }) {
  const [state, formAction] = useActionState(createUserAction, null)
  const [selected, setSelected] = useState<string[]>(["user"])

  if (state?.success) {
    onDone()
    return <p className="text-sm text-emerald-600">Usuário convidado com sucesso!</p>
  }

  const toggle = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]))
  }

  return (
    <form
      action={(fd: FormData) => {
        fd.set("groups", selected.join(","))
        formAction(fd)
      }}
      className="grid gap-4 md:grid-cols-2"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" placeholder="Nome completo" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="usuario@empresa.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha temporária</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="mínimo 6 caracteres"
          required
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label>Grupos</Label>
        {groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum grupo cadastrado ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {groups.map((g) => (
              <label key={g.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selected.includes(g.name)}
                  onCheckedChange={() => toggle(g.name)}
                />
                {g.name}
              </label>
            ))}
          </div>
        )}
      </div>
      {state && !state.success && (
        <p className="text-destructive text-sm md:col-span-2">{state.message}</p>
      )}
      <div className="md:col-span-2">
        <SubmitButton>
          <UserPlus className="mr-2 h-4 w-4" /> Criar usuário (convite)
        </SubmitButton>
      </div>
    </form>
  )
}

function UserCard({
  user,
  groups,
  onChanged,
}: {
  user: UserRow
  groups: GroupRow[]
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editState, editAction] = useActionState(updateUserAction, null)
  const [pwState, pwAction] = useActionState(setPasswordAction, null)
  const [delState, delAction] = useActionState(deleteUserAction, null)

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{user.name}</p>
            <StatusBadge status={user.status} isActive={user.isActive} />
          </div>
          <p className="text-muted-foreground text-sm">{user.email}</p>
          <p className="text-muted-foreground text-xs">
            Grupos: {user.groups.join(", ") || "—"} · Último login: {formatDate(user.lastLogin)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form
            action={(fd: FormData) => {
              fd.set("id", user.id)
              pwAction(fd)
            }}
            className="flex items-end gap-2"
          >
            <Input
              name="password"
              type="password"
              placeholder="nova senha"
              className="h-9 w-32"
              required
              minLength={6}
            />
            <SubmitButton variant="outline">
              <KeyRound className="mr-1 h-4 w-4" /> Senha
            </SubmitButton>
          </form>

          <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
            <RefreshCw className="mr-1 h-4 w-4" /> Editar
          </Button>

          <form
            action={(fd: FormData) => {
              fd.set("id", user.id)
              delAction(fd)
            }}
          >
            <SubmitButton variant="destructive">
              <Trash2 className="mr-1 h-4 w-4" /> Excluir
            </SubmitButton>
          </form>
        </div>
      </div>

      {pwState?.success && <p className="mt-2 text-emerald-600 text-xs">{pwState.message}</p>}
      {pwState && !pwState.success && <p className="mt-2 text-destructive text-xs">{pwState.message}</p>}
      {delState?.success && <p className="mt-2 text-emerald-600 text-xs">{delState.message}</p>}
      {delState && !delState.success && <p className="mt-2 text-destructive text-xs">{delState.message}</p>}

      {editing && (
        <form
          action={(fd: FormData) => {
            fd.set("id", user.id)
            editAction(fd)
          }}
          className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor={`name-${user.id}`}>Nome</Label>
            <Input id={`name-${user.id}`} name="name" defaultValue={user.name} required />
          </div>
          <div className="space-y-2">
            <Label>Grupos</Label>
            <div className="flex flex-wrap gap-3">
              {groups.map((g) => (
                <label key={g.id} className="flex items-center gap-2 text-sm">
                  <Checkbox name="groups" value={g.name} defaultChecked={user.groups.includes(g.name)} />
                  {g.name}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              name="isActive"
              defaultValue={user.isActive ? "true" : "false"}
              className="h-9 rounded border bg-background px-2"
            >
              <option value="true">Ativo / Convidado</option>
              <option value="false">Inativo</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <SubmitButton variant="outline" onClick={() => { setEditing(false); onChanged() }}>
              Salvar
            </SubmitButton>
            <Button variant="ghost" size="sm" type="button" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
          {editState?.success && (
            <p className="text-emerald-600 text-xs md:col-span-2">{editState.message}</p>
          )}
          {editState && !editState.success && (
            <p className="text-destructive text-xs md:col-span-2">{editState.message}</p>
          )}
        </form>
      )}
    </div>
  )
}

// --------------------------------------------------------------------------
// ABA 2 — GRUPOS
// --------------------------------------------------------------------------

function CreateGroupForm({ onDone }: { onDone: () => void }) {
  const [state, formAction] = useActionState(createGroupAction, null)
  if (state?.success) {
    onDone()
    return <p className="text-sm text-emerald-600">Grupo criado!</p>
  }
  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="gname">Nome do grupo</Label>
        <Input id="gname" name="name" placeholder="ex.: reports, queries" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gdesc">Descrição</Label>
        <Input id="gdesc" name="description" placeholder="Opcional" />
      </div>
      {state && !state.success && (
        <p className="text-destructive text-sm md:col-span-2">{state.message}</p>
      )}
      <div className="md:col-span-2">
        <SubmitButton>
          <Users className="mr-2 h-4 w-4" /> Criar grupo
        </SubmitButton>
      </div>
    </form>
  )
}

function GroupCard({ group, onChanged }: { group: GroupRow; onChanged: () => void }) {
  const [delState, delAction] = useActionState(deleteGroupAction, null)
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{group.name}</p>
          <p className="text-muted-foreground text-sm">{group.description || "—"}</p>
          <p className="text-muted-foreground text-xs mt-1">{group.members.length} membro(s)</p>
          {group.members.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {group.members.map((m) => (
                <Badge key={m.id} variant="outline">
                  {m.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <form
          action={(fd: FormData) => {
            fd.set("id", group.id)
            delAction(fd)
          }}
        >
          <SubmitButton variant="destructive">
            <Trash2 className="mr-1 h-4 w-4" /> Excluir
          </SubmitButton>
        </form>
      </div>
      {delState?.success && <p className="mt-2 text-emerald-600 text-xs">{delState.message}</p>}
      {delState && !delState.success && <p className="mt-2 text-destructive text-xs">{delState.message}</p>}
    </div>
  )
}

// --------------------------------------------------------------------------
// PÁGINA
// --------------------------------------------------------------------------

export default function AdminUsersClient({
  user,
  initialUsers,
  initialGroups,
}: {
  user: User
  initialUsers: UserRow[]
  initialGroups: GroupRow[]
}) {
  const [users, setUsers] = useState(initialUsers)
  const [groups, setGroups] = useState(initialGroups)
  const [, startRefresh] = useTransition()

  const refresh = () => {
    startRefresh(async () => {
      try {
        const [resU, resG] = await Promise.all([
          fetch("/api/admin/users/list"),
          fetch("/api/admin/groups/list"),
        ])
        if (resU.ok) setUsers(await resU.json())
        if (resG.ok) setGroups(await resG.json())
      } catch {
        // falha de rede no refresh — mantém o estado atual
      }
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-2">
          <h1 className="font-bold text-3xl">Gerenciar Usuários e Grupos</h1>
          <p className="text-muted-foreground">
            Crie usuários por convite — eles aparecem como <strong>Convidado</strong> até o primeiro
            login. Gerencie os grupos na aba ao lado.
          </p>
        </div>

        <Tabs defaultValue="users" className="mx-auto mt-6 max-w-5xl">
          <TabsList>
            <TabsTrigger value="users">
              <UserPlus className="mr-2 h-4 w-4" /> Usuários ({users.length})
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Users className="mr-2 h-4 w-4" /> Grupos ({groups.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card className="p-6">
              <h2 className="mb-4 font-semibold text-xl">Novo usuário (convite)</h2>
              <CreateUserForm groups={groups} onDone={refresh} />
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 font-semibold text-xl">Usuários ({users.length})</h2>
              <div className="space-y-4">
                {users.map((u) => (
                  <UserCard key={u.id} user={u} groups={groups} onChanged={refresh} />
                ))}
                {users.length === 0 && (
                  <p className="text-muted-foreground">Nenhum usuário cadastrado.</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            <Card className="p-6">
              <h2 className="mb-4 font-semibold text-xl">Novo grupo</h2>
              <CreateGroupForm onDone={refresh} />
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 font-semibold text-xl">Grupos ({groups.length})</h2>
              <div className="space-y-4">
                {groups.map((g) => (
                  <GroupCard key={g.id} group={g} onChanged={refresh} />
                ))}
                {groups.length === 0 && (
                  <p className="text-muted-foreground">Nenhum grupo cadastrado.</p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
