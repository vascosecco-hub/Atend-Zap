import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Nota: GPT Maker não suporta headers customizados, autenticação removida
  // 1. Parse body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // 3. Create Supabase admin client (service role key bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // 4. Extract atendimento data
  const {
    nome,
    telefone,
    nicho,
    resumo_conversa,
    produtos_citados,
    transferido_para,
    data_agendamento,
    hora_agendamento,
    tipo_atendimento,
    endereco_entrega,
    numero_endereco,
    complemento,
    bairro_entrega,
    regiao_entrega,
    cep_entrega,
    status_entrega,
    observacao_entrega,
  } = body

  // 5. Insert into atendimentos table
  const { data: atendimento, error: atendimentoError } = await supabase
    .from('atendimentos')
    .insert({
      nome,
      telefone,
      nicho,
      resumo_conversa,
      produtos_citados,
      transferido_para,
      data_agendamento,
      hora_agendamento,
      tipo_atendimento,
      endereco_entrega,
      numero_endereco,
      complemento,
      bairro_entrega,
      regiao_entrega,
      cep_entrega,
      status_entrega: status_entrega || 'agendado',
      observacao_entrega,
      status: 'pendente',
    })
    .select()
    .single()

  if (atendimentoError) {
    console.error('Error inserting atendimento:', atendimentoError)
    return NextResponse.json({ error: atendimentoError.message }, { status: 500 })
  }

  // 6. Log access
  await supabase.from('logs_acesso').insert({
    acao: 'webhook_gpt_maker',
    detalhes: { atendimento_id: atendimento.id, nicho },
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  })

  return NextResponse.json({ success: true, id: atendimento.id })
}