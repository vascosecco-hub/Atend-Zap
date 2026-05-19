"use client";

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { Users, MessageSquareText, Shield, ChevronRight, Activity } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, isLoading, isAdmin } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!session) router.push('/login')
  }, [isLoading, session, router])

  if (isLoading || !session) return null

  const navItems = [
    { href: '/admin/matriz', icon: Shield, label: 'Matriz de Permissão' },
    { href: '/admin/conteudo', icon: MessageSquareText, label: 'Conteúdo dos Agentes' },
    { href: '/admin/usuarios', icon: Users, label: 'Usuários' },
    { href: '/admin/logs', icon: Activity, label: 'Logs de Acesso' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* sidebar */}
      <aside className="w-64 border-r border-border/40 flex flex-col">
        <div className="p-6 border-b border-border/40">
          <span className="font-display text-lg font-semibold">Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Link>
          ))}
        </nav>
      </aside>

      {/* main */}
      <main className="flex-1">
        <header className="flex items-center gap-2 border-b border-border/40 px-6 py-4">
          <span className="text-sm text-muted-foreground">Admin</span>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
