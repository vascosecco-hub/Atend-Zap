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
  } from '@/components/ui/chart'
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
  import { BarChart, PieChart, LineChart, TrendingUp, Package, MessageCircle, Calendar, Home, Users } from
  'lucide-react'
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
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [nichoFilter, setNichoFilter] = useState<string>('todos')

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
      queryKey: ['dashboard-atendimentos', startDate, endDate, nichoFilter],
      queryFn: async () => {
        let query = supabase
          .from('atendimentos')
          .select('*')
          .gte('created_at', startDate || format(subDays(new Date(), 30), 'yyyy-MM-dd'))
          .lte('created_at', endDate ? endDate + 'T23:59:59' : format(new Date(), 'yyyy-MM-dd'))

        if (nichoFilter !== 'todos') {
          query = query.eq('nicho', nichoFilter)
        }

        const { data } = await query
        return data ?? []
      },
    })

    // Bar chart: atendimentos por nicho
    const barData = Object.entries(nicheLabels).map(([key, label]) => ({
      name: label,
      value: atendimentos?.filter((a) => a.nicho === key).length ?? 0,
      fill: nicheColors[key],
    }))

    // Pie chart: produtos mais pedidos
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

    // Card styling com borda em relief
    const cardStyle = {
      boxShadow: '4px 4px 8px rgba(0,0,0,0.3), -2px -2px 6px rgba(255,255,255,0.05)',
      borderWidth: '2px',
      borderColor: 'rgba(255,255,255,0.1)',
      backgroundColor: 'rgba(30,30,30,0.9)',
    }

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0A0A0A' }}>
        {/* Header com navegação */}
        <header className="flex items-center justify-between border-b border-border/40 px-6 py-4" style={{ 
  backgroundColor: '#111111' }}>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              Atend<span className="text-primary">Zap</span>
            </span>
            <span className="ml-3 text-sm text-muted-foreground">/ Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-1 px-3 py-1.5 text-sm rounded border" style={{ 
  backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}>
              <Home className="h-4 w-4" /> Home
            </a>
            <a href="/crm" className="flex items-center gap-1 px-3 py-1.5 text-sm rounded border" style={{ 
  backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}>
              <Users className="h-4 w-4" /> CRM
            </a>
            <a href="/dashboard" className="flex items-center gap-1 px-3 py-1.5 text-sm rounded border" style={{ 
  backgroundColor: '#3B82F6', borderColor: '#3B82F6', color: '#fff' }}>
              <TrendingUp className="h-4 w-4" /> Dashboard
            </a>
          </div>
        </header>

        <main className="px-6 py-6 space-y-6">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: '#1a1a1a',
  border: '2px solid #333' }}>
            {/* Nich filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: '#fff' }}>NichO:</label>
              <select
                value={nichoFilter}
                onChange={(e) => setNichoFilter(e.target.value)}
                className="px-3 py-2 rounded text-sm"
                style={{ backgroundColor: '#2a2a2a', border: '2px solid #444', color: '#fff' }}
              >
                <option value="todos">Todos</option>
                <option value="construcao">Materiais</option>
                <option value="gastronomia">Gastronomia</option>
                <option value="medico">Médico</option>
                <option value="petshop">PetShop</option>
              </select>
            </div>

            {/* Date range selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: '#fff' }}>De:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded text-sm"
                style={{ backgroundColor: '#2a2a2a', border: '2px solid #444', color: '#fff' }}
              />
              <label className="text-sm font-medium" style={{ color: '#fff' }}>Até:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded text-sm"
                style={{ backgroundColor: '#2a2a2a', border: '2px solid #444', color: '#fff' }}
              />
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg" style={{ ...cardStyle, backgroundColor: '#1e1e1e' }}>
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>Total Atendimentos</span>
                <MessageCircle className="h-4 w-4" style={{ color: '#9CA3AF' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: '#fff' }}>{totalAtendimentos}</div>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Período selecionado</p>
            </div>

            <div className="p-4 rounded-lg" style={{ ...cardStyle, backgroundColor: '#1e1e1e' }}>
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>Produtos Citados</span>
                <Package className="h-4 w-4" style={{ color: '#9CA3AF' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: '#fff' }}>{totalProdutos}</div>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>itens mencionados</p>
            </div>

            <div className="p-4 rounded-lg" style={{ ...cardStyle, backgroundColor: '#1e1e1e' }}>
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>Nichos Ativos</span>
                <TrendingUp className="h-4 w-4" style={{ color: '#9CA3AF' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: '#fff' }}>{barData.filter((b) => b.value >
  0).length}</div>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>com atendimentos</p>
            </div>

            <div className="p-4 rounded-lg" style={{ ...cardStyle, backgroundColor: '#1e1e1e' }}>
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>Data</span>
                <Calendar className="h-4 w-4" style={{ color: '#9CA3AF' }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: '#fff' }}>{format(new Date(), 'dd/MM')}</div>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{format(new Date(), 'yyyy')}</p>
            </div>
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <div className="p-4 rounded-lg" style={{ ...cardStyle, backgroundColor: '#1e1e1e' }}>
              <CardHeader>
                <CardTitle className="text-base" style={{ color: '#fff' }}>Atendimentos por Nicho</CardTitle>
              </CardHeader>
              <CardContent>
                {barData.every((b) => b.value === 0) ? (
                  <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: '#6B7280' }}>
                    Sem dados no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <RechartsBar data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                    </RechartsBar>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </div>

            {/* Pie chart */}
            <div className="p-4 rounded-lg" style={{ ...cardStyle, backgroundColor: '#1e1e1e' }}>
              <CardHeader>
                <CardTitle className="text-base" style={{ color: '#fff' }}>Produtos Mais Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: '#6B7280' }}>
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
                      <Tooltip contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }} />
                      <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                    </RechartsPie>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </div>
          </div>

          {/* Line chart */}
          <div className="p-4 rounded-lg" style={{ ...cardStyle, backgroundColor: '#1e1e1e' }}>
            <CardHeader>
              <CardTitle className="text-base" style={{ color: '#fff' }}>Evolução de Atendimentos (últimos 14
  dias)</CardTitle>
            </CardHeader>
            <CardContent>
              {lineData.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: '#6B7280' }}>
                  Sem dados no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsLine data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }} />
                    <Line type="monotone" dataKey="value" stroke="#38BDF8" strokeWidth={2} dot={{ fill: '#38BDF8', r: 
  4 }} />
                  </RechartsLine>
                </ResponsiveContainer>
              )}
            </CardContent>
          </div>
        </main>
      </div>
    )
  }