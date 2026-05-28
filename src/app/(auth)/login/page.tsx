"use client";

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { HardHat, MessageCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export default function Login() {
  const router = useRouter()
  const { login, isLoggingIn } = useAuth()

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      await login(values)
      router.push('/crm')
    } catch (error) {
      form.setError('root', { message: 'Email ou senha incorretos' })
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
      {/* branding */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: '#000', border: '2px solid #2E8B57' }}>
          <MessageCircle className="h-5 w-5" style={{ color: '#2E8B57' }} />
        </div>
        <span className="font-display text-lg font-semibold tracking-tight">
          Atend<span style={{ color: '#2E8B57' }}>Zap</span>
        </span>
      </div>

      {/* login card */}
      <div className="w-full max-w-sm rounded-2xl p-8" style={{ backgroundColor: '#696969', boxShadow: '4px 4px 0 #444, -1px -1px 0 #888' }}>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: '#000', border: '2px solid #2E8B57' }}>
            <HardHat className="h-6 w-6" style={{ color: '#2E8B57' }} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold" style={{ color: '#FFFAF0' }}>Acessar CRM</h1>
          <p className="mt-2 text-sm" style={{ color: '#A9A9A9' }}>Entre com suas credenciais</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFAF0' }}>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="seu@email.com" {...field} style={{ backgroundColor: '#A9A9A9', color: '#FFFAF0' }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: '#FFFAF0' }}>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} style={{ backgroundColor: '#A9A9A9', color: '#FFFAF0' }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}
            <Button type="submit" className="w-full btn-3d" disabled={isLoggingIn}>
              {isLoggingIn ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  )
}