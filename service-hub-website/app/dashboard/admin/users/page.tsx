import { requirePermission } from "@/lib/auth"
import { permissions } from "@/lib/permissions"
import { listUsers } from "@/lib/server-users"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createUserAction,
  deleteUserAction,
  setPasswordAction,
  updateUserAction,
} from "@/app/actions/users"

export default async function AdminUsersPage() {
  await requirePermission(permissions.manageUsers)
  const users = await listUsers()

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={await requirePermission(permissions.manageUsers)} />

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-2">
          <h1 className="font-bold text-3xl">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            Crie, edite e remova usuários. Os grupos controlam as permissões (ex.: admin, reports, queries).
          </p>
        </div>

        {/* Criar */}
        <Card className="mx-auto mt-6 max-w-5xl p-6">
          <h2 className="mb-4 font-semibold text-xl">Novo usuário</h2>
          <form
            action={createUserAction}
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
              <Input id="password" name="password" type="password" placeholder="mínimo 6 caracteres" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groups">Grupos (separados por vírgula)</Label>
              <Input id="groups" name="groups" placeholder="user, reports" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Criar usuário</Button>
            </div>
          </form>
        </Card>

        {/* Lista */}
        <Card className="mx-auto mt-6 max-w-5xl p-6">
          <h2 className="mb-4 font-semibold text-xl">Usuários ({users.length})</h2>
          <div className="space-y-4">
            {users.map((u) => (
              <div key={u.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-muted-foreground text-sm">{u.email}</p>
                    <p className="text-muted-foreground text-xs">
                      Grupos: {u.groups.join(", ") || "—"} · {u.isActive ? "Ativo" : "Inativo"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* Redefinir senha */}
                    <form action={setPasswordAction} className="flex items-end gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <Input
                        name="password"
                        type="password"
                        placeholder="nova senha"
                        className="h-9 w-36"
                        required
                      />
                      <Button type="submit" variant="outline" size="sm">
                        Senha
                      </Button>
                    </form>
                    {/* Editar ativo/grupos */}
                    <form action={updateUserAction} className="flex items-end gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <Input name="name" defaultValue={u.name} className="h-9 w-40" />
                      <Input name="groups" defaultValue={u.groups.join(", ")} className="h-9 w-40" />
                      <select name="isActive" defaultValue={u.isActive ? "true" : "false"} className="h-9 rounded border bg-background px-2">
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                      <Button type="submit" variant="outline" size="sm">
                        Salvar
                      </Button>
                    </form>
                    {/* Excluir */}
                    <form action={deleteUserAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        Excluir
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-muted-foreground">Nenhum usuário cadastrado.</p>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
