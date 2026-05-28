"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createSupabaseClient } from '@/lib/supabase'
import { type Lembrete, type TipoLembrete } from '@/lib/types'
import { toast } from 'sonner'
import { format } from 'date-fns'

const supabase = createSupabaseClient()

interface CreateLembreteInput {
  atendimento_id: string
  tipo_envio: TipoLembrete
  mensagem: string
  data_hora_agendada: string
}

export function useLembretes(atendimentoId?: string) {
  const queryClient = useQueryClient()

  const { data: lembretes, isLoading, refetch } = useQuery({
    queryKey: ['lembretes', atendimentoId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('lembretes')
        .select('*')
        .order('data_hora_agendada', { ascending: true })

      if (atendimentoId) {
        query = query.eq('atendimento_id', atendimentoId)
      }

      const { data } = await query
      return (data as Lembrete[]) ?? []
    },
    enabled: true,
  })

  const createMutation = useMutation({
    mutationFn: async (input: CreateLembreteInput) => {
      console.log('Criando lembrete com:', input)
      const { data, error } = await supabase
        .from('lembretes')
        .insert(input)
        .select()

      console.log('Resultado insert:', { data, error })

      if (error) {
        throw new Error(error.message)
      }
      return data as Lembrete[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembretes'] })
      toast.success('Lembrete criado com sucesso')
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Lembrete['status'] }) => {
      const update: Partial<Lembrete> = { status }
      if (status === 'enviado' || status === 'concluido') {
        update.enviado_em = new Date().toISOString()
      }

      const { error } = await supabase
        .from('lembretes')
        .update(update)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lembretes'] })
    },
    onError: () => {
      toast.error('Erro ao atualizar lembrete')
    },
  })

  return {
    lembretes,
    isLoading,
    refetch,
    createLembrete: createMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}

// Hook para verificar lembretes pendentes e mostrar alarms
export function useAlarmCheck(session: { user?: { id?: string } } | null) {
  async function checkAlarms() {
    if (!session?.user?.id) return

    // Buscar lembretes pendentes diretamente do banco
    const { data: pendentes } = await supabase
      .from('lembretes')
      .select('*')
      .eq('tipo_envio', 'interno')
      .eq('status', 'pendente')
      .lte('data_hora_agendada', new Date().toISOString())

    if (!pendentes?.length) return

    for (const lembrete of pendentes) {
      // Buscar dados do atendimento
      const { data: atendimento } = await supabase
        .from('atendimentos')
        .select('nome, telefone')
        .eq('id', lembrete.atendimento_id)
        .single()

      const tipoIcon = lembrete.tipo_envio === 'interno' ? '🔔' : lembrete.tipo_envio === 'whatsapp' ? '💬' : '✉️'
      const tipoLabel = lembrete.tipo_envio === 'interno' ? 'Int' : lembrete.tipo_envio === 'whatsapp' ? 'WA' : 'Email'
      const dataHoraFormatada = format(new Date(lembrete.data_hora_agendada), "dd/MM/yyyy HH:mm")

      toast.warning(
        `🔔 LEMBRETE ${tipoIcon} [${tipoLabel}] - ${dataHoraFormatada}`,
        {
          description: `${lembrete.mensagem}\n\nCliente: ${atendimento?.nome ?? 'N/A'} - ${atendimento?.telefone ?? 'N/A'}`,
          duration: 0,
          action: {
            label: '✅ Concluir',
            onClick: async () => {
              await supabase.from('lembretes').update({ status: 'concluido', enviado_em: new Date().toISOString() }).eq('id', lembrete.id)
              toast.success('Lembrete concluído')
            },
          },
          cancel: {
            label: '❌ Cancelar',
            onClick: async () => {
              await supabase.from('lembretes').update({ status: 'cancelado' }).eq('id', lembrete.id)
            },
          },
        }
      )
    }
  }

  return { checkAlarms }
}