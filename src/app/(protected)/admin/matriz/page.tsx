"use client";

import { Check } from 'lucide-react'

const permissions = [
  { label: 'Ver atendimentos', admin: true, usuario: true },
  { label: 'Ver agendamentos', admin: true, usuario: true },
  { label: 'Exportar CSV', admin: true, usuario: false },
  { label: 'Criar lembrete', admin: true, usuario: true },
  { label: 'Atualizar status entrega', admin: true, usuario: true },
  { label: 'Excluir atendimento', admin: true, usuario: false },
  { label: 'Editar conteúdo agente', admin: true, usuario: false },
  { label: 'Gerenciar usuários', admin: true, usuario: false },
  { label: 'Ver matriz', admin: true, usuario: false },
]

export default function AdminMatriz() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Matriz de Permissão</h1>
      <div className="rounded-xl border border-border/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Permissão</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Admin</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Usuário</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map(perm => (
              <tr key={perm.label} className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3 text-foreground">{perm.label}</td>
                <td className="text-center px-4 py-3">
                  {perm.admin ? (
                    <span className="inline-flex items-center justify-center text-green-500">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-lg">&mdash;</span>
                  )}
                </td>
                <td className="text-center px-4 py-3">
                  {perm.usuario ? (
                    <span className="inline-flex items-center justify-center text-green-500">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-lg">&mdash;</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
