"use client";

import { useQuery } from '@tanstack/react-query'
import { createSupabaseClient } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/hooks/useAuth'

const supabase = createSupabaseClient()

export default function LogsPage() {
  const { isAdmin, isLoading } = useAuth()

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('logs_acesso')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      return data ?? []
    },
    enabled: !!isAdmin,
  })

  if (isLoading) return <div className="text-muted-foreground py-12">Carregando...</div>
  if (!isAdmin) return <div className="text-red-400 py-12">Acesso negado. Apenas administradores.</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Logs de Acesso</h1>
        <p className="text-muted-foreground">
          Visualização das últimas atividades e integrações no sistema.
        </p>
      </div>

      <div className="rounded-xl border border-border/40 bg-[var(--gradient-card)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>User ID / Origem</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingLogs ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Carregando logs...
                </TableCell>
              </TableRow>
            ) : logs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Nenhum log encontrado.
                </TableCell>
              </TableRow>
            ) : (
              logs?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {log.created_at ? format(parseISO(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : '—'}
                  </TableCell>
                  <TableCell className="font-medium">{log.acao}</TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">
                    {log.user_id ?? 'Webhook / Sistema'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {log.ip_address ?? '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
