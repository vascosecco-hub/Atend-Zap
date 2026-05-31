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
  import { TrendingUp, Package, MessageCircle, Calendar, Home, Users, Menu } from 'lucide-react'
  import { Sheet, SheetContent } from '@/components/ui/sheet'
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
    const [isMobile, setIsMobile] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [screenWidth, setScreenWidth] = useState(1280)

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768)
        setScreenWidth(window.innerWidth)
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
      if (isLoading) return
      if (!session) {
        router.push('/login')
      } else {
        logAccess('visualizou_dashboard')
      }
    }, [isLoading, session, router])

    const { data: atendimentos } = useQuery({
      queryKey: ['dashboard-atendimentos', startDate, endDate, nichoFilter],
      queryFn: async () => {
        let query = supabase
          .from('atendimentos')
          .select('*')

        if (startDate) {
          query = query.gte('created_at', startDate)
        }
        if (endDate) {
          query = query.lte('created_at', endDate + 'T23:59:59')
        }

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

    // High relief card style - lighter on mobile
    const cardStyle = {
      backgroundColor: '#D4D4D4',
      border: screenWidth < 768 ? '2px solid #888' : '3px solid #888',
      boxShadow: screenWidth < 768
        ? '2px 2px 0 #777'
        : '4px 4px 0 #555, -1px -1px 0 #fff',
    }

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#000', padding: '20px' }}>
        {/* Header Navigation */}
        <header className="flex items-center justify-between mb-6 p-3 sm:p-4 rounded-lg" style={{ backgroundColor: '#696969', border: '3px solid #444' }}>
          <div className="flex items-center gap-2 sm:gap-3">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#2E8B57' }} />
            <span className="text-lg sm:text-xl font-bold" style={{ color: '#2E8B57' }}>AtendZap</span>
            <span className="hidden sm:inline text-sm" style={{ color: '#A9A9A9' }}>/ Dashboard</span>
          </div>

          {isMobile ? (
            <>
              <button
                onClick={() => setMenuOpen(true)}
                className="flex items-center gap-2 p-2 rounded font-medium"
                style={{ backgroundColor: '#555', color: '#FFFAF0', border: '2px solid #777' }}
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetContent side="left" className="w-[250px] bg-[#696969] border-r border-[#444]">
                  <div className="flex flex-col gap-3 mt-8">
                    <span className="text-lg font-bold px-3" style={{ color: '#2E8B57' }}>Menu</span>
                    <a href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded font-medium" style={{ backgroundColor: '#555', color: '#FFFAF0', border: '2px solid #777' }}>
                      <Home className="h-5 w-5" /> Página Inicial
                    </a>
                    <a href="/crm" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded font-medium" style={{ backgroundColor: '#555', color: '#FFFAF0', border: '2px solid #777' }}>
                      <Users className="h-5 w-5" /> CRM
                    </a>
                    <a href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded font-medium" style={{ backgroundColor: '#2E8B57', color: '#FFFAF0', border: '2px solid #1a5f3a' }}>
                      <TrendingUp className="h-5 w-5" /> Dashboard
                    </a>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
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
          )}
        </header>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 mb-6 p-3 md:p-4 rounded-lg" style={{ backgroundColor: '#696969', border: '3px solid #444' }}>
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-white shrink-0">Nicho:</label>
            <select
              value={nichoFilter}
              onChange={(e) => setNichoFilter(e.target.value)}
              className="flex-1 md:flex-none px-3 py-2 rounded font-medium text-sm"
              style={{ backgroundColor: '#D4D4D4', color: '#000', border: '2px solid #888' }}
            >
              <option value="todos">Todos</option>
              <option value="construcao">Materiais</option>
              <option value="gastronomia">Gastronomia</option>
              <option value="medico">Médico</option>
              <option value="petshop">PetShop</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-white shrink-0">De:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 rounded font-medium text-sm"
                style={{ backgroundColor: '#D4D4D4', color: '#000', border: '2px solid #888' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-white shrink-0">Até:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 rounded font-medium text-sm"
                style={{ backgroundColor: '#D4D4D4', color: '#000', border: '2px solid #888' }}
              />
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="p-3 sm:p-4 rounded-lg" style={{ ...cardStyle }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-bold text-gray-700">Total Atendimentos</span>
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-black">{totalAtendimentos}</div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Período selecionado</p>
          </div>

          <div className="p-3 sm:p-4 rounded-lg" style={{ ...cardStyle }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-bold text-gray-700">Produtos Citados</span>
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-black">{totalProdutos}</div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">itens mencionados</p>
          </div>

          <div className="p-3 sm:p-4 rounded-lg" style={{ ...cardStyle }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-bold text-gray-700">Nichos Ativos</span>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-black">{barData.filter((b) => b.value > 0).length}</div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">com atendimentos</p>
          </div>

          <div className="p-3 sm:p-4 rounded-lg" style={{ ...cardStyle }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-bold text-gray-700">Data Atual</span>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-black">{format(new Date(), 'dd/MM')}</div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{format(new Date(), 'yyyy')}</p>
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
                <ResponsiveContainer width="100%" height={screenWidth < 640 ? 260 : 220}>
                  <RechartsBar data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#999" />
                    <XAxis dataKey="name" tick={{ fill: '#333', fontSize: screenWidth < 640 ? 10 : 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#333', fontSize: screenWidth < 640 ? 10 : 12 }} />
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
                <ResponsiveContainer width="100%" height={screenWidth < 640 ? 260 : 220}>
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={screenWidth < 640 ? 35 : 50}
                      outerRadius={screenWidth < 640 ? 65 : 80}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #888' }} />
                    <Legend wrapperStyle={{ color: '#333', fontSize: screenWidth < 640 ? 10 : 12 }} />
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
              <ResponsiveContainer width="100%" height={screenWidth < 640 ? 260 : 220}>
                <RechartsLine data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#999" />
                  <XAxis dataKey="name" tick={{ fill: '#333', fontSize: screenWidth < 640 ? 10 : 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#333', fontSize: screenWidth < 640 ? 10 : 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #888' }} />
                  <Line type="monotone" dataKey="value" stroke="#38BDF8" strokeWidth={2} dot={{ fill: '#38BDF8', r: 4 }} />
                </RechartsLine>
              </ResponsiveContainer>
            )}
          </CardContent>
        </div>
      </div>
    )
  }