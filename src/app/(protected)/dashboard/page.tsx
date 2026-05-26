"use client";

import { useAuth, logAccess } from '@/hooks/useAuth'
import { createSupabaseClient } from '@/lib/supabase'
import { type Nicho } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, subDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, PieChart, LineChart, TrendingUp, Package, MessageCircle, Calendar } from 'lucide-react'
import {
  Bar,
  BarChart as RechartsBar,
  Line,
  LineChart as RechartsLine,
  Pie,
  PieChart as RechartsPie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ptBR as chartPtBR } from 'date-fns/locale'

const supabase = createSupabaseClient()

const nicheColors: Record<string, string> = {
  construcao: '#F59E0B',
  gastronomia: '#FB923C',
  medico: '#38BDF8',
  petshop: '#22C55E',
}

const nicheLabels: Record<string, string> = {
  construcao: 'Materiais',
  gastronomia: 'Gastronomia',
  medico: 'Médico',
  petshop: 'PetShop',
}

export default function Dashboard() {
  const router = useRouter()
  const { session, isLoading } = useAuth()
  const [dateRange, setDateRange] = useState(30)

  useEffect(() => {
    if (isLoading) return
    if (!session) {
      router.push('/login')
    } else {
      logAccess('visualizou_dashboard')
    }
  }, [isLoading, session, router])

  // Fetch atendimentos for analytics
  const { data: atendimentos } = useQuery({
    queryKey: ['dashboard-atendimentos', dateRange],
    queryFn: async () => {
      const since = format(subDays(new Date(), dateRange), 'yyyy-MM-dd')
      const { data } = await supabase
        .from('atendimentos')
        .select('*')
        .gte('created_at', since)
      return data ?? []
    },
  })

  // Bar chart: atendimentos por nicho
  const barData = Object.entries(nicheLabels).map(([key, label]) => ({
    name: label,
    value: atendimentos?.filter((a) => a.nicho === key).length ?? 0,
    fill: nicheColors[key],
  }))

  // Pie chart: produtos mais pedidos (parse from produtos_citados)
  const produtoCounts: Record<string, number> = {}
  atendimentos?.forEach((a) => {
    if (a.produtos_citados) {
      const produtos = a.produtos_citados.split(',').map((p: string) => p.trim())
      produtos.forEach((p: string) => {
        if (p) produtoCounts[p] = (produtoCounts[p] || 0) + 1
      })
    }
  })
  const pieData = Object.entries(produtoCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value], i) => ({
      name,
      value,
      fill: ['#F59E0B', '#FB923C', '#38BDF8', '#22C55E', '#A855F7', '#EC4899', '#14B8A6', '#F97316'][i % 8],
    }))

  // Line chart: atendimentos por dia
  const dayCounts: Record<string, number> = {}
  atendimentos?.forEach((a) => {
    const day = format(parseISO(a.created_at), 'dd/MM', { locale: ptBR })
    dayCounts[day] = (dayCounts[day] || 0) + 1
  })
  const lineData = Object.entries(dayCounts)
    .sort((a, b) => {
      const [ad, am] = a[0].split('/').reverse()
      const [bd, bm] = b[0].split('/').reverse()
      return new Date(`${am}/${ad}`).getTime() - new Date(`${bm}/${bd}`).getTime()
    })
    .slice(-14)
    .map(([name, value]) => ({ name, value }))

  // Stats summary
  const totalAtendimentos = atendimentos?.length ?? 0
  const totalProdutos = Object.values(produtoCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border/40 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            Atend<span className="text-primary">Zap</span>
          </span>
          <span className="ml-3 text-sm text-muted-foreground">/ Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{session?.user?.email}</span>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* Date range selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Período:</span>
          {[7, 15, 30].map((days) => (
            <button
              key={days}
              onClick={() => setDateRange(days)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                dateRange === days
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-accent'
              }`}
            >
              {days} dias
            </button>
          ))}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Atendimentos</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAtendimentos}</div>
              <p className="text-xs text-muted-foreground">últimos {dateRange} dias</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Produtos Citados</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProdutos}</div>
              <p className="text-xs text-muted-foreground">itens mencionados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground"> Nichos Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{barData.filter((b) => b.value > 0).length}</div>
              <p className="text-xs text-muted-foreground">com atendimentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Data</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{format(new Date(), 'dd/MM')}</div>
              <p className="text-xs text-muted-foreground">{format(new Date(), 'yyyy')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart: atendimentos por nicho */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atendimentos por Nicho</CardTitle>
            </CardHeader>
            <CardContent>
              {barData.every((b) => b.value === 0) ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                  Sem dados no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsBar data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                  </RechartsBar>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie chart: produtos mais pedidos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Produtos Mais Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                  Sem dados no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Line chart: evolução por dia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução de Atendimentos (últimos 14 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {lineData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                Sem dados no período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <RechartsLine data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#38BDF8" strokeWidth={2} dot={{ fill: '#38BDF8', r: 4 }} />
                </RechartsLine>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
