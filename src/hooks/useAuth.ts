"use client";
import { createSupabaseClient } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { User } from '@/lib/types'

const supabase = createSupabaseClient()

export function useAuth() {
  const queryClient = useQueryClient()

  // Check current session
  const { data: session, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession()
      return data.session
    },
  })

  // Get current user profile
  const { data: user } = useQuery({
    queryKey: ['user', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null
      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      return data as User | null
    },
    enabled: !!session?.user?.id,
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })

  return {
    session,
    user,
    isLoading,
    isAdmin: user?.role === 'administrador',
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
  }
}

export async function logAccess(acao: string, registroId?: string) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

  await supabase.rpc('log_acesso', {
    p_user_id: session.user.id,
    p_acao: acao,
    p_registro_id: registroId ?? null,
  })
}
