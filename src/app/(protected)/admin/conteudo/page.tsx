"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/useAuth'
import { createSupabaseClient } from '@/lib/supabase'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle } from 'lucide-react'

const supabase = createSupabaseClient()

const formSchema = z.object({
  saudacao: z.string().min(1, 'Saudação é obrigatória'),
  mensagem_consentimento: z.string().min(1, 'Mensagem de consentimento é obrigatória'),
  texto_encerramento: z.string().min(1, 'Texto de encerramento é obrigatório'),
})

type FormValues = z.infer<typeof formSchema>

const nichos = [
  { value: 'construcao', label: 'Construção' },
  { value: 'gastronomia', label: 'Gastronomia' },
  { value: 'medico', label: 'Médico' },
  { value: 'petshop', label: 'Petshop' },
]

export default function AdminConteudo() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [selectedNicho, setSelectedNicho] = useState<string>('construcao')

  const { data: conteudo, isLoading } = useQuery({
    queryKey: ['conteudo', selectedNicho],
    queryFn: async () => {
      const { data } = await supabase
        .from('conteudo_agentes')
        .select('*')
        .eq('nicho', selectedNicho)
        .single()
      return data
    },
    enabled: !!selectedNicho,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      saudacao: conteudo?.saudacao ?? '',
      mensagem_consentimento: conteudo?.mensagem_consentimento ?? '',
      texto_encerramento: conteudo?.texto_encerramento ?? '',
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase.from('conteudo_agentes').upsert({
        nicho: selectedNicho,
        ...values,
        updated_at: new Date().toISOString(),
        updated_by: session?.user?.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conteudo', selectedNicho] })
    },
  })

  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(values)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Conteúdo dos Agentes</h1>
        <select
          value={selectedNicho}
          onChange={e => setSelectedNicho(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
        >
          {nichos.map(n => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="saudacao">Saudação</Label>
          <Textarea
            id="saudacao"
            rows={4}
            {...register('saudacao')}
            className={errors.saudacao ? 'border-red-500' : ''}
          />
          {errors.saudacao && (
            <p className="text-xs text-red-500">{errors.saudacao.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mensagem_consentimento">Mensagem de Consentimento LGPD</Label>
          <Textarea
            id="mensagem_consentimento"
            rows={4}
            {...register('mensagem_consentimento')}
            className={errors.mensagem_consentimento ? 'border-red-500' : ''}
          />
          {errors.mensagem_consentimento && (
            <p className="text-xs text-red-500">{errors.mensagem_consentimento.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="texto_encerramento">Texto de Encerramento</Label>
          <Textarea
            id="texto_encerramento"
            rows={4}
            {...register('texto_encerramento')}
            className={errors.texto_encerramento ? 'border-red-500' : ''}
          />
          {errors.texto_encerramento && (
            <p className="text-xs text-red-500">{errors.texto_encerramento.message}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={!isDirty || saveMutation.isPending}
          >
            {saveMutation.isSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Salvo
              </>
            ) : saveMutation.isPending ? (
              'Salvando...'
            ) : (
              'Salvar'
            )}
          </Button>
          {saveMutation.isError && (
            <p className="text-sm text-red-500">Erro ao salvar. Tente novamente.</p>
          )}
        </div>
      </form>
    </div>
  )
}
