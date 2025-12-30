"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction, registerAction } from "@/app/actions/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormEvent } from "react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="font-bold text-primary-foreground text-xl">SH</span>
          </div>
          <h1 className="mt-6 font-bold text-3xl text-balance">CloudSec Hub</h1>
          <p className="mt-2 text-muted-foreground text-balance">Hub de serviços do time de CloudSec</p>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Registrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await loginAction(formData);
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" name="password" type="password" placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </form>
              <p className="text-center text-muted-foreground text-xs">Demo: admin@servicehub.com / demo123</p>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await registerAction(formData);
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" type="text" placeholder="Seu nome" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" name="email" type="email" placeholder="seu@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Senha</Label>
                  <Input
                    id="reg-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-muted-foreground text-xs">
          Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade
        </p>
      </div>
    </div>
  )
}

export async function submitForm(formData: FormData): Promise<void> {
  const res = await fetch('/api/submit', { method: 'POST', body: formData });
  const body = await res.json(); // { error?: string }
  if (body?.error) {
    // handle error via state or throw (so the returned Promise rejects)
    throw new Error(body.error);
  }
  // success path — return void
}
