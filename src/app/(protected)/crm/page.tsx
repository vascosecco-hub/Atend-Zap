"use client";

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuth, logAccess } from '@/hooks/useAuth'
import { useLembretes, useAlarmCheck } from '@/hooks/useLembretes'
import { createSupabaseClient } from '@/lib/supabase'
import { type Atendimento, type Nicho, type StatusAtendimento, type TipoLembrete, type Lembrete } from '@/lib/types'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MessageCircle, Clock, CheckCircle, Package, Search, Filter, Download, TrendingUp, Home, Users, Bell, BellRing } from 'lucide-react'
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
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null)
  const [showLembreteModal, setShowLembreteModal] = useState(false)
  const [editingLembrete, setEditingLembrete] = useState<Lembrete | null>(null)
  const [lembreteTipo, setLembreteTipo] = useState<TipoLembrete>('interno')
  const [lembreteData, setLembreteData] = useState('')
  const [lembreteHora, setLembreteHora] = useState('')
  const [lembreteMensagem, setLembreteMensagem] = useState('')

  const { lembretes, createLembrete, updateStatus, isCreating } = useLembretes(selectedAtendimento?.id)
  const { checkAlarms } = useAlarmCheck(session ?? null)

  // Verificar alarms a cada 10 segundos
  useEffect(() => {
    if (!session) return
    // Verificar imediatamente ao abrir
    checkAlarms()
    const interval = setInterval(checkAlarms, 10000)
    return () => clearInterval(interval)
  }, [session])

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

  function openLembreteModal(at: Atendimento) {
    setSelectedAtendimento(at)
    setEditingLembrete(null)
    setLembreteTipo('interno')
    setLembreteData('')
    setLembreteHora('')
    setLembreteMensagem('')
    setShowLembreteModal(true)
  }

  function openEditLembreteModal(lembrete: Lembrete, at: Atendimento) {
    setSelectedAtendimento(at)
    setEditingLembrete(lembrete)
    setLembreteTipo(lembrete.tipo_envio)
    const dt = new Date(lembrete.data_hora_agendada)
    setLembreteData(format(dt, 'yyyy-MM-dd'))
    setLembreteHora(format(dt, 'HH:mm'))
    setLembreteMensagem(lembrete.mensagem)
    setShowLembreteModal(true)
  }

  async function handleSaveLembrete() {
    if (!selectedAtendimento || !lembreteData || !lembreteHora || !lembreteMensagem.trim()) {
      toast.error('Preencha todos os campos')
      return
    }

    const dataHora = new Date(`${lembreteData}T${lembreteHora}:00`)

    if (editingLembrete) {
      // Editar lembrete existente
      await supabase
        .from('lembretes')
        .update({
          tipo_envio: lembreteTipo,
          mensagem: lembreteMensagem.trim(),
          data_hora_agendada: dataHora.toISOString(),
        })
        .eq('id', editingLembrete.id)
      toast.success('Lembrete atualizado')
    } else {
      // Criar novo lembrete
      await createLembrete({
        atendimento_id: selectedAtendimento.id,
        tipo_envio: lembreteTipo,
        mensagem: lembreteMensagem.trim(),
        data_hora_agendada: dataHora.toISOString(),
      })
    }

    setShowLembreteModal(false)
  }

  async function handleDeleteLembrete(lembreteId: string) {
    if (!confirm('Tem certeza que deseja apagar este lembrete?')) return
    await supabase.from('lembretes').delete().eq('id', lembreteId)
    toast.success('Lembrete apagado')
  }

  function getLembretesDoAtendimento(atendimentoId: string) {
    return lembretes?.filter((l) => l.atendimento_id === atendimentoId) ?? []
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
      <header className="flex items-center justify-between mb-6 p-4 rounded-lg" style={{ backgroundColor: '#1a1a1a', border: '3px solid #444' }}>
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-blue-400" />
          <span className="text-xl font-bold text-white">AtendZap</span>
          <span className="text-sm text-gray-400">/ CRM</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 px-4 py-2 rounded font-medium" style={{ backgroundColor: '#333', color: '#fff', border: '2px solid #555' }}>
            <Home className="h-4 w-4" /> Página Inicial
          </a>
          <span className="flex items-center gap-2 px-4 py-2 rounded font-medium" style={{ backgroundColor: '#2563EB', color: '#fff', border: '2px solid #1D4ED8' }}>
            <Users className="h-4 w-4" /> CRM
          </span>
          <a href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded font-medium" style={{ backgroundColor: '#333', color: '#fff', border: '2px solid #555' }}>
            <TrendingUp className="h-4 w-4" /> Dashboard
          </a>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="card-3d">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#FFFAF0' }}>Total</CardTitle>
              <MessageCircle className="h-4 w-4" style={{ color: '#2E8B57' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#FFFAF0' }}>{stats.total}</div>
              <p className="text-xs" style={{ color: '#A9A9A9' }}>atendimentos</p>
            </CardContent>
          </Card>
          <Card className="card-3d">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#FFFAF0' }}>Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.pendente}</div>
              <p className="text-xs" style={{ color: '#A9A9A9' }}>aguardando ação</p>
            </CardContent>
          </Card>
          <Card className="card-3d">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#FFFAF0' }}>Agendados</CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.agendado}</div>
              <p className="text-xs" style={{ color: '#A9A9A9' }}>com data marcada</p>
            </CardContent>
          </Card>
          <Card className="card-3d">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#FFFAF0' }}>Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4" style={{ color: '#2E8B57' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#2E8B57' }}>{stats.entregue}</div>
              <p className="text-xs" style={{ color: '#A9A9A9' }}>entregue e finalizado</p>
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
          {isLoadingAtendimentos ? (
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
                <TableRow style={{ backgroundColor: '#555', borderBottom: '2px solid #888' }}>
                  <TableHead style={{ color: '#FFFAF0', borderBottom: '2px solid #888' }}>Nome</TableHead>
                  <TableHead style={{ color: '#FFFAF0', borderBottom: '2px solid #888' }}>Telefone</TableHead>
                  <TableHead style={{ color: '#FFFAF0', borderBottom: '2px solid #888' }}>Email</TableHead>
                  <TableHead style={{ color: '#FFFAF0', borderBottom: '2px solid #888' }}>Nicho</TableHead>
                  <TableHead style={{ color: '#FFFAF0', borderBottom: '2px solid #888' }}>Status</TableHead>
                  <TableHead style={{ color: '#FFFAF0', borderBottom: '2px solid #888' }}>Data/Hora</TableHead>
                  <TableHead style={{ color: '#FFFAF0', borderBottom: '2px solid #888' }}>Agendamento / Endereço</TableHead>
                  <TableHead style={{ color: '#FFFAF0', borderBottom: '2px solid #888' }}>Produtos</TableHead>
                  <TableHead style={{ color: '#FFFAF0', borderBottom: '2px solid #888' }}>Resumo</TableHead>
                  <TableHead style={{ color: '#FFFAF0', borderBottom: '2px solid #888' }}>Lembretes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atendimentos?.map((at) => {
                  const lembretesDoAt = getLembretesDoAtendimento(at.id)
                  const pendentes = lembretesDoAt.filter((l) => l.status === 'pendente').length
                  return (
                  <TableRow key={at.id} style={{ borderBottom: '2px solid #888', backgroundColor: '#555' }}>
                    <TableCell className="font-medium" style={{ color: '#FFFAF0', borderBottom: '1px solid #888' }}>{at.nome ?? '—'}</TableCell>
                    <TableCell style={{ color: '#FFFAF0', borderBottom: '1px solid #888' }}>{at.telefone ?? '—'}</TableCell>
                    <TableCell style={{ color: '#FFFAF0', borderBottom: '1px solid #888' }}>{at.email ?? '—'}</TableCell>
                    <TableCell style={{ color: '#FFFAF0', borderBottom: '1px solid #888' }}>{nichoLabel[at.nicho] ?? at.nicho ?? '—'}</TableCell>
                    <TableCell style={{ borderBottom: '1px solid #888' }}>
                      <span className={`text-sm font-medium ${statusColor[at.status ?? ''] ?? ''}`}>
                        {statusLabel[at.status ?? ''] ?? at.status ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell style={{ color: '#FFFAF0', borderBottom: '1px solid #888' }}>
                      {formatDate(at.data_agendamento)}
                      {at.hora_agendamento ? ` ${at.hora_agendamento}` : ''}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px]" style={{ color: '#FFFAF0', borderBottom: '1px solid #888' }}>
                      {formatDate(at.data_agendamento)}
                      {at.hora_agendamento ? ` ${at.hora_agendamento}` : ''}
                      {at.endereco_entrega ? (
                        <>
                          {at.data_agendamento ? ' - ' : ''}
                          {`${at.endereco_entrega}${at.numero_endereco ? `, ${at.numero_endereco}` : ''}`}
                          {at.complemento ? `, ${at.complemento}` : ''}
                          {at.bairro_entrega ? `, ${at.bairro_entrega}` : ''}
                        </>
                      ) : ''}
                    </TableCell>
                    <TableCell className="text-xs max-w-[150px]" style={{ borderBottom: '1px solid #888' }}>
                      <span className="block break-words whitespace-normal" style={{ color: '#FFFAF0' }}>{at.produtos_citados ?? '—'}</span>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px]" style={{ borderBottom: '1px solid #888' }}>
                      <span className="block break-words whitespace-normal" style={{ color: '#FFFAF0' }}>{at.resumo_conversa ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {lembretesDoAt.length > 0 ? (
                          <>
                            {lembretesDoAt.map((lembrete) => {
                              const tipoIcon = lembrete.tipo_envio === 'interno' ? '🔔' : lembrete.tipo_envio === 'whatsapp' ? '💬' : '✉️'
                              const tipoLabel = lembrete.tipo_envio === 'interno' ? 'Int' : lembrete.tipo_envio === 'whatsapp' ? 'WA' : 'Email'
                              const statusColor = lembrete.status === 'pendente' ? 'text-yellow-400' : lembrete.status === 'concluido' || lembrete.status === 'enviado' ? 'text-green-400' : 'text-gray-400'
                              const statusLabel = lembrete.status === 'pendente' ? '⏳' : lembrete.status === 'concluido' ? '✅' : lembrete.status === 'enviado' ? '📤' : '❌'
                              const dataFormatada = format(new Date(lembrete.data_hora_agendada), "dd/MM/yyyy HH:mm")
                              return (
                                <div key={lembrete.id} className="text-xs bg-slate-800 rounded p-1.5 flex items-center justify-between gap-2">
                                  <div className="flex flex-col gap-0.5 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="text-muted-foreground">{tipoIcon} [{tipoLabel}]</span>
                                      <span className="text-gray-400 text-[10px]">{dataFormatada}</span>
                                    </div>
                                    <div className="text-gray-200 truncate">{lembrete.mensagem}</div>
                                    <div className="text-[10px]">
                                      <span className={statusColor}>{statusLabel}</span>
                                      <span className="text-gray-500 ml-1">{lembrete.status}</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => openEditLembreteModal(lembrete, at)}
                                    className="text-blue-400 hover:text-blue-300 flex-shrink-0"
                                    title="Editar lembrete"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLembrete(lembrete.id)}
                                    className="text-red-400 hover:text-red-300 flex-shrink-0"
                                    title="Apagar lembrete"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )
                            })}
                          </>
                        ) : null}
                        <button
                          onClick={() => openLembreteModal(at)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                          style={{ backgroundColor: '#2563EB', color: '#fff' }}
                        >
                          <Bell className="h-3 w-3" />
                          {lembretesDoAt.length > 0 ? 'Add' : 'Lembrete'}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      {/* Modal de Lembrete */}
      <Dialog open={showLembreteModal} onOpenChange={setShowLembreteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              {editingLembrete ? 'Editar Lembrete' : 'Novo Lembrete'}
              {selectedAtendimento && (
                <span className="text-sm font-normal text-muted-foreground">
                  — {selectedAtendimento.nome}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Lembrete</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLembreteTipo('interno')}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${lembreteTipo === 'interno' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  <Bell className="h-4 w-4" /> Interno
                </button>
                <button
                  type="button"
                  onClick={() => setLembreteTipo('whatsapp')}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${lembreteTipo === 'whatsapp' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setLembreteTipo('email')}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${lembreteTipo === 'email' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Email
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={lembreteData}
                  onChange={(e) => setLembreteData(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hora</label>
                <Input
                  type="time"
                  value={lembreteHora}
                  onChange={(e) => setLembreteHora(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem</label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Digite a mensagem do lembrete..."
                value={lembreteMensagem}
                onChange={(e) => setLembreteMensagem(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLembreteModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLembrete} disabled={isCreating}>
              {isCreating ? 'Salvando...' : 'Salvar Lembrete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
