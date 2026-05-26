"use client";

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuth, logAccess } from '@/hooks/useAuth'
import { createSupabaseClient } from '@/lib/supabase'
import { type Atendimento, type Nicho, type StatusAtendimento } from '@/lib/types'
import { format, parseISO, startOfDay, endOfDay, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Clock, CheckCircle, Package, Search, Filter, Download } from 'lucide-react'
import { toast } from 'sonner'

const supabase = createSupabaseClient()

interface Filters {
  nicho?: string
  status?: string
  search?: string
  dataInicio?: string
  dataFim?: string
}

const nichos: Nicho[] = ['construcao', 'gastronomia', 'medico', 'petshop']
const statusOptions: StatusAtendimento[] = ['pendente', 'encerrado', 'transferido']
const statusEntregaOptions = ['agendado', 'confirmado', 'em_rota', 'entregue', 'cancelado'] as const

export default function CRMDashboard() {
  const router = useRouter()
  const { session, user, isLoading } = useAuth()
  const [filters, setFilters] = useState<Filters>({})

  useEffect(() => {
    if (isLoading) return
    if (!session) {
      router.push('/login')
    } else {
      logAccess('visualizou_crm')
    }
  }, [isLoading, session, router])

  // Buscar lembretes do dia (hoje e amanhã) e mostrar toast
  useEffect(() => {
    if (!session) return

    const buscarLembretes = async () => {
      const hoje = startOfDay(new Date())
      const amanha = endOfDay(addDays(new Date(), 1))

      const { data: lembretes } = await supabase
        .from('atendimentos')
        .select('id, nome, telefone, lembrete, lembrete_data, nicho')
        .not('lembrete', 'is', null)
        .not('lembrete_data', 'is', null)
        .gte('lembrete_data', hoje.toISOString())
        .lte('lembrete_data', amanha.toISOString())
        .eq('status', 'encerrado')

      if (lembretes && lembretes.length > 0) {
        lembretes.forEach((lembrete) => {
          toast.info(`📌 LIGAR AGORA: ${lembrete.nome ?? 'Cliente'} - ${lembrete.lembrete}`, {
            description: lembrete.telefone ? `Tel: ${lembrete.telefone}` : undefined,
            duration: 10000,
          })
        })
      }
    }

    buscarLembretes()
  }, [session])

  const { data: atendimentos, isLoading: isLoadingAtendimentos } = useQuery({
    queryKey: ['atendimentos', filters],
    queryFn: async () => {
      let query = supabase
        .from('atendimentos')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.nicho && filters.nicho !== 'all') {
        query = query.eq('nicho', filters.nicho)
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.search) {
        query = query.or(`nome.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`)
      }
      if (filters.dataInicio) {
        query = query.gte('data_agendamento', filters.dataInicio)
      }
      if (filters.dataFim) {
        query = query.lte('data_agendamento', filters.dataFim)
      }

      const { data } = await query
      return (data as Atendimento[]) ?? []
    },
  })

  const stats = {
    total: atendimentos?.length ?? 0,
    pendente: atendimentos?.filter((a) => a.status === 'pendente').length ?? 0,
    agendado: atendimentos?.filter((a) => a.status_entrega === 'agendado').length ?? 0,
    entregue: atendimentos?.filter((a) => a.status_entrega === 'entregue').length ?? 0,
  }

  function handleExport() {
    if (!atendimentos) return
    logAccess('exportou_csv')
    const csv = [
      ['Nome', 'Telefone', 'NichO', 'Status', 'Data', 'Hora', 'Endereço'].join(','),
      ...atendimentos.map((a) =>
        [
          a.nome,
          a.telefone,
          a.nicho,
          a.status,
          a.data_agendamento,
          a.hora_agendamento,
          a.endereco_entrega,
        ]
          .map((v) => `"${(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `atendimentos_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  const statusLabel: Record<StatusAtendimento | 'agendado' | 'entregue', string> = {
    pendente: 'Pendente',
    encerrado: 'Encerrado',
    transferido: 'Transferido',
    agendado: 'Agendado',
    entregue: 'Entregue',
  }

  const statusColor: Record<string, string> = {
    pendente: 'text-yellow-400',
    encerrado: 'text-green-400',
    transferido: 'text-blue-400',
    agendado: 'text-orange-400',
    entregue: 'text-green-400',
  }

  const nichoLabel: Record<Nicho, string> = {
    construcao: 'Materiais',
    gastronomia: 'Gastronomia',
    medico: 'Médico',
    petshop: 'PetShop',
  }

  return (
    <div className="min-h-screen">
      {/* header */}
      <header className="flex items-center justify-between border-b border-border/40 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            Atend<span className="text-primary">Zap</span>
          </span>
          <span className="ml-3 text-sm text-muted-foreground">/ CRM</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{session?.user?.email}</span>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!atendimentos?.length}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">atendimentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.pendente}</div>
              <p className="text-xs text-muted-foreground">aguardando ação</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Agendados</CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.agendado}</div>
              <p className="text-xs text-muted-foreground">com data marcada</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.entregue}</div>
              <p className="text-xs text-muted-foreground">entregue e finalizado</p>
            </CardContent>
          </Card>
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/40 bg-[var(--gradient-card)] p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              className="pl-9"
              value={filters.search ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
          <Select
            value={filters.nicho ?? 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, nicho: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="NichO" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Nichos</SelectItem>
              {nichos.map((n) => (
                <SelectItem key={n} value={n}>{nichoLabel[n] ?? n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>{statusLabel[s] ?? s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="w-[150px]"
              value={filters.dataInicio ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, dataInicio: e.target.value || undefined }))}
            />
            <span className="text-muted-foreground">até</span>
            <Input
              type="date"
              className="w-[150px]"
              value={filters.dataFim ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, dataFim: e.target.value || undefined }))}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({})}
          >
            <Filter className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        </div>

        {/* table */}
        <div className="rounded-xl border border-border/40 bg-[var(--gradient-card)] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Carregando atendimentos...
            </div>
          ) : atendimentos?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Package className="h-10 w-10 opacity-40" />
              <p>Nenhum atendimento encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Nome</TableHead>
                  <TableHead className="text-muted-foreground">Telefone</TableHead>
                  <TableHead className="text-muted-foreground">NichO</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Data</TableHead>
                  <TableHead className="text-muted-foreground">Hora</TableHead>
                  <TableHead className="text-muted-foreground">Endereço</TableHead>
                  <TableHead className="text-muted-foreground">Produtos</TableHead>
                  <TableHead className="text-muted-foreground">Resumo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atendimentos?.map((at) => (
                  <TableRow key={at.id} className="border-border/40">
                     <TableCell className="font-medium">{at.nome ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{at.telefone ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{nichoLabel[at.nicho] ?? at.nicho ?? '—'}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${statusColor[at.status ?? ''] ?? 'text-muted-foreground'}`}>
                        {statusLabel[at.status ?? ''] ?? at.status ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(at.data_agendamento)}</TableCell>
                    <TableCell className="text-muted-foreground">{at.hora_agendamento ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">
                      {at.endereco_entrega ? `${at.endereco_entrega}${at.numero_endereco ? `, ${at.numero_endereco}` : ''}` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[150px]">
    <span className="block break-words whitespace-normal">{at.produtos_citados ?? '—'}</span>
  </TableCell>
  <TableCell className="text-muted-foreground text-xs max-w-[200px]">
  <span className="block break-words whitespace-normal">{at.resumo_conversa ?? '—'}</span>
  </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  )
}