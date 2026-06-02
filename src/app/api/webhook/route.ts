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
  console.log('[GPT Maker Webhook] Body recebido:', JSON.stringify(body, null, 2))
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
    resumo,
    produtos,
    endereco,
    email,
    transferido_para,
    data_agendamento,
    hora_agendamento,
    tipo_atendimento,
    numero_endereco,
    complemento,
    bairro_entrega,
    regiao_entrega,
    cep_entrega,
    status_entrega,
    observacao_entrega,
  } = body

  // 4.5: Extract real name, phone, and products from resumo if placeholders are sent
  let nomeFinal = nome
  let telefoneFinal = telefone
  let produtosFinal = produtos

  // If nome is a placeholder or empty, try to extract from resumo
  if (!nomeFinal || nomeFinal === 'Cliente WhatsApp') {
    const nameMatch = resumo?.match(/Cliente\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)*)\s+solicitou/i)
      || resumo?.match(/Cliente\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)*)\s+pediu/i)
      || resumo?.match(/^([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)*)\s+solicitou/i)
      || resumo?.match(/^([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)*)\s+pediu/i)
      || resumo?.match(/Cliente:\s*([A-Za-zÀ-ÿ\s]+?)(?:,|$)/i)
      || resumo?.match(/cliente\s*(?:é|se llama)?\s*([A-Za-zÀ-ÿ\s]+?)(?:\s*,|\s*telefone|\s*\d|$)/i)
      || resumo?.match(/nome[:\s]+([A-Za-zÀ-ÿ\s]+?)(?:\s*,|\s*telefone|\s*\d|$)/i)
    if (nameMatch) {
      nomeFinal = nameMatch[1].trim()
    }
  }

  // If telefone is empty/placeholder, try to extract from resumo
  if (!telefoneFinal) {
    const phoneMatch = resumo?.match(/telefone[:\s]*(\d{8,11})/)
      || resumo?.match(/(\d{5}-\d{4})/)
      || resumo?.match(/(\d{8,11})/)
    if (phoneMatch) {
      telefoneFinal = phoneMatch[1].replace(/\D/g, '')
    }
  }

  // If produtos is empty, try to extract from resumo or use the produtos field
  if (!produtosFinal) {
    // Try to find product mentions in resumo (common patterns)
    const productPatterns = [
      /(?:produto[s]?[:\s]*|solicitou[:\s]*|pediu[:\s]*|quer\s+(?:um|uma)?:?)(.+?)(?:\s*(?:para|entrega|endereço|cliente)|$)/gi,
      /(?:Vitaminas?|Filés?|Bebidas?|Sucos?|Sanduíches?|Hambúrgueres?|Pizzas?|Combos?|Pratos?|Itens?)[A-Za-zÀ-ÿ\s,]+/gi,
    ]
    const foundProducts: string[] = []
    for (const pattern of productPatterns) {
      let match
      while ((match = pattern.exec(resumo || '')) !== null) {
        const product = match[1] || match[0]
        if (product.trim() && product.trim().length > 2) {
          foundProducts.push(product.trim())
        }
      }
    }
    if (foundProducts.length > 0) {
      produtosFinal = foundProducts.join(', ')
    }
  }

  // 5. Insert into atendimentos table
    const { data: atendimento, error: atendimentoError } = await supabase
      .from('atendimentos')
      .insert({
        nome: nomeFinal,
        telefone: telefoneFinal || null,
        nicho: 'construcao',
        resumo_conversa: resumo || null,
        produtos_citados: produtosFinal || null,
        transferido_para,
        data_agendamento,
        hora_agendamento,
        tipo_atendimento,
        endereco_entrega: endereco || null,
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
    detalhes: { atendimento_id: atendimento.id, nicho: 'construcao' },
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  })

  return NextResponse.json({ success: true, id: atendimento.id })
}