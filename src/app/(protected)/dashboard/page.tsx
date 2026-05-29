 "use client";

  import { useAuth, logAccess } from '@/hooks/useAuth'
  import { createSupabaseClient } from '@/lib/supabase'
  import { type Nicho } from '@/lib/types'
  import { useQuery } from '@tanstack/react-query'
  import { useEffect, useState } from 'react'
  import { useRouter } from 'next/navigation'
  import { format, subDays, parseISO } from 'date-fns'
  import { ptBR } from 'date-fns/locale'
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
  import { TrendingUp, Package, MessageCircle, Calendar, Home, Users } from 'lucide-react'
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

    const { data: atendimentos, isLoading: isLoadingAtendimentos, error: atendimentosError } = useQuery({
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

        const { data, error } = await query
        if (error) throw error
        return data ?? []
      },
      enabled: !!session && !isLoading,
      retry: false,
      staleTime: 30000,
    })

    const barData = Object.entries(nicheLabels).map(([key, label]) => ({
      name: label,
      value: atendimentos?.filter((a) => a.nicho === key).length ?? 0,
      fill: nicheColors[key],
    }))

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

    const totalAtendimentos = atendimentos?.length ?? 0
    const totalProdutos = Object.values(produtoCounts).reduce((a, b) => a + b, 0)

    // High relief card style
    const cardStyle = {
      backgroundColor: '#D4D4D4',
      border: '3px solid #888',
      boxShadow: '4px 4px 0 #555, -1px -1px 0 #fff',
    }

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#000', padding: '20px' }}>
        {/* Header Navigation */}
        <header className="flex items-center justify-between mb-6 p-4 rounded-lg" style={{ backgroundColor: '#696969', border: '3px solid #444' }}>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6" style={{ color: '#2E8B57' }} />
            <span className="text-xl font-bold" style={{ color: '#2E8B57' }}>AtendZap</span>
            <span className="text-sm" style={{ color: '#A9A9A9' }}>/ Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 px-4 py-2 rounded font-medium" style={{ backgroundColor: '#555', color: '#FFFAF0', border: '2px solid #777' }}>
              <Home className="h-4 w-4" /> Página Inicial
            </a>
            <a href="/crm" className="flex items-center gap-2 px-4 py-2 rounded font-medium" style={{ backgroundColor: '#555', color: '#FFFAF0', border: '2px solid #777' }}>
              <Users className="h-4 w-4" /> CRM
            </a>
            <a href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded font-medium" style={{ backgroundColor: '#2E8B57', color: '#FFFAF0', border: '2px solid #1a5f3a' }}>
              <TrendingUp className="h-4 w-4" /> Dashboard
            </a>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-lg" style={{ backgroundColor: '#696969', border: '3px solid #444' }}>
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-white">Nicho:</label>
            <select
              value={nichoFilter}
              onChange={(e) => setNichoFilter(e.target.value)}
              className="px-4 py-2 rounded font-medium"
              style={{ backgroundColor: '#D4D4D4', color: '#000', border: '2px solid #888' }}
            >
              <option value="todos">Todos</option>
              <option value="construcao">Materiais</option>
              <option value="gastronomia">Gastronomia</option>
              <option value="medico">Médico</option>
              <option value="petshop">PetShop</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-white">De:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 rounded font-medium"
              style={{ backgroundColor: '#D4D4D4', color: '#000', border: '2px solid #888' }}
            />
            <label className="text-sm font-bold text-white">Até:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 rounded font-medium"
              style={{ backgroundColor: '#D4D4D4', color: '#000', border: '2px solid #888' }}
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg" style={{ ...cardStyle }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">Total Atendimentos</span>
              <MessageCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-3xl font-bold text-black">{totalAtendimentos}</div>
            <p className="text-xs text-gray-500 mt-1">Período selecionado</p>
          </div>

          <div className="p-4 rounded-lg" style={{ ...cardStyle }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">Produtos Citados</span>
              <Package className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-3xl font-bold text-black">{totalProdutos}</div>
            <p className="text-xs text-gray-500 mt-1">itens mencionados</p>
          </div>

          <div className="p-4 rounded-lg" style={{ ...cardStyle }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">Nichos Ativos</span>
              <TrendingUp className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-3xl font-bold text-black">{barData.filter((b) => b.value > 0).length}</div>
            <p className="text-xs text-gray-500 mt-1">com atendimentos</p>
          </div>

          <div className="p-4 rounded-lg" style={{ ...cardStyle }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">Data Atual</span>
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-3xl font-bold text-black">{format(new Date(), 'dd/MM')}</div>
            <p className="text-xs text-gray-500 mt-1">{format(new Date(), 'yyyy')}</p>
          </div>
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="p-4 rounded-lg" style={{ ...cardStyle }}>
            <CardHeader>
              <CardTitle className="text-base font-bold text-black">Atendimentos por Nicho</CardTitle>
            </CardHeader>
            <CardContent>
              {barData.every((b) => b.value === 0) ? (
                <div className="flex items-center justify-center h-[200px] text-gray-500">Sem dados no período</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsBar data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#999" />
                    <XAxis dataKey="name" tick={{ fill: '#333', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#333', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #888' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                  </RechartsBar>
                </ResponsiveContainer>
              )}
            </CardContent>
          </div>

          <div className="p-4 rounded-lg" style={{ ...cardStyle }}>
            <CardHeader>
              <CardTitle className="text-base font-bold text-black">Produtos Mais Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-gray-500">Sem dados no período</div>
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
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #888' }} />
                    <Legend wrapperStyle={{ color: '#333' }} />
                  </RechartsPie>
                </ResponsiveContainer>
              )}
            </CardContent>
          </div>
        </div>

        {/* Line chart */}
        <div className="p-4 rounded-lg" style={{ ...cardStyle }}>
          <CardHeader>
            <CardTitle className="text-base font-bold text-black">Evolução de Atendimentos (últimos 14
  dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {lineData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-gray-500">Sem dados no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <RechartsLine data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#999" />
                  <XAxis dataKey="name" tick={{ fill: '#333', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#333', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #888' }} />
                  <Line type="monotone" dataKey="value" stroke="#38BDF8" strokeWidth={2} dot={{ fill: '#38BDF8', r: 4 
  }} />
                </RechartsLine>
              </ResponsiveContainer>
            )}
          </CardContent>
        </div>
      </div>
    )
  }