import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { logoutAction } from "@/app/actions/auth"
import type { User } from "@/lib/auth"
import { permissions, userHasPermission } from "@/lib/permissions"

interface NavbarProps {
  user: User
}

export function Navbar({ user }: NavbarProps) {
  const navItems = [
    { href: "/dashboard", label: "Dashboard", permission: permissions.dashboardView },
    { href: "/dashboard/tools", label: "Ferramentas", permission: permissions.toolsView },
    { href: "/dashboard/history", label: "Histórico", permission: permissions.history },
    { href: "/dashboard/queries", label: "Queries", permission: permissions.queries },
    { href: "/dashboard/webhooks", label: "Webhooks", permission: permissions.webhooks },
    { href: "/dashboard/admin/users", label: "Usuários", permission: permissions.manageUsers },
  ].filter((item) => userHasPermission(user, item.permission))

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-bold text-primary-foreground text-sm">SH</span>
            </div>
            <span className="font-semibold text-lg">Service Hub</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <span className="font-semibold text-primary text-sm">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="hidden md:inline">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col gap-1 p-2">
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-muted-foreground text-xs">{user.email}</p>
                <p className="text-muted-foreground text-xs">{user.groups.join(", ")}</p>
              </div>
              <DropdownMenuItem asChild>
                <form action={logoutAction}>
                  <button type="submit" className="flex w-full items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
