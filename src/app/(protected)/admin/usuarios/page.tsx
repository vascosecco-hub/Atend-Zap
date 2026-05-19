"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { createSupabaseClient } from '@/lib/supabase'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const supabase = createSupabaseClient()

export default function AdminUsuarios() {
  const { session, isLoading, isAdmin } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isLoading) return
    if (!session || !isAdmin) router.push('/admin')
  }, [isLoading, session, isAdmin, router])

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      return data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, perfil }: { id: string; perfil: 'admin' | 'usuario' }) => {
      const { error } = await supabase.from('users').update({ perfil }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const handlePerfilChange = (id: string, perfil: 'admin' | 'usuario') => {
    updateMutation.mutate({ id, perfil })
  }

  if (isLoading || usersLoading) {
    return <div className="text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Usuários</h1>
      <div className="rounded-xl border border-border/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Perfil</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Criado em</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground" />
            </tr>
          </thead>
          <tbody>
            {users?.map(user => (
              <tr
                key={user.id}
                className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors"
              >
                <td className="px-4 py-3 text-foreground">{user.email}</td>
                <td className="px-4 py-3 text-foreground">{user.nome ?? '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.perfil}
                    onChange={e =>
                      handlePerfilChange(user.id, e.target.value as 'admin' | 'usuario')
                    }
                    className="border border-border rounded-lg px-2 py-1 text-sm bg-background text-foreground"
                  >
                    <option value="admin">Admin</option>
                    <option value="usuario">Usuário</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('pt-BR')
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {updateMutation.isPending && updateMutation.variables?.id === user.id && (
                    <span className="text-xs text-muted-foreground">Salvando...</span>
                  )}
                </td>
              </tr>
            ))}
            {users?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {updateMutation.isError && (
        <p className="mt-3 text-sm text-red-500">Erro ao atualizar perfil. Tente novamente.</p>
      )}
    </div>
  )
}
