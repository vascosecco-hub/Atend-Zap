import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/mcp/supabase';

// Dados coletados durante o atendimento (em memória por enquanto)
interface AtendimentoData {
  nome?: string;
  telefone?: string;
  email?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  regiao?: string;
  produtos?: string;
  observacao_produtos?: string;
  data_agendamento?: string;
  hora_agendamento?: string;
  tipo_atendimento?: string;
  observacao_agendamento?: string;
  nicho?: string;
  resumo_conversa?: string;
  transferencia?: string;
}

// Store em memória para guardar dados do atendimento
// Em produção, isso deveria ser transient (Redis ou similar)
const atendimentoStore = new Map<string, AtendimentoData>();

function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 11);
}

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 11;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Formato JSON-RPC 2.0
    const { jsonrpc, id, method, params } = body;

    if (jsonrpc !== '2.0') {
      return NextResponse.json(
        { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id },
        { status: 400 }
      );
    }

    // Extrair session_id dos headers ou gerar um
    const sessionId = request.headers.get('x-session-id') || 'default';
    const storeKey = `${sessionId}`;

    let result: unknown;

    // Parse tool name and arguments
    const toolName = params?.name || params?.tool;
    const args = params?.arguments || params?.args || {};

    // =============================================
    // Handler para método 'initialize' do MCP
    // =============================================
    if (method === 'initialize') {
      result = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}
        },
        serverInfo: {
          name: 'AtendZap',
          version: '1.0.0'
        },
        instructions: 'Registra atendimentos WhatsApp no CRM. Use as ferramentas coletar_dados_cliente, coletar_endereco, registrar_produtos, agendar_atendimento e registrar_atendimento.'
      };
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result
      });
    }

    // =============================================
    // Handler para método 'tools/list' do MCP
    // =============================================
    if (method === 'tools/list') {
      const { tools } = await import('@/lib/mcp/tools');
      result = {
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema
        }))
      };
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result
      });
    }

    switch (toolName) {
      case 'coletar_dados_cliente': {
        const { nome, telefone, email } = args;

        if (!nome && !telefone) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Nome e telefone são obrigatórios' }
          });
        }

        if (telefone && !validatePhone(telefone)) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Telefone deve ter entre 8 e 11 dígitos' }
          });
        }

        const current = atendimentoStore.get(storeKey) || {};
        atendimentoStore.set(storeKey, {
          ...current,
          nome: nome || current.nome,
          telefone: sanitizePhone(telefone || '') || current.telefone,
          email: email || current.email
        });

        result = { success: true, message: 'Dados do cliente coletados', data: { nome, telefone: sanitizePhone(telefone || '') } };
        break;
      }

      case 'coletar_endereco': {
        const { logradouro, numero, complemento, bairro, cep, regiao } = args;

        if (!logradouro && !numero && !bairro) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Logradouro, número e bairro são obrigatórios' }
          });
        }

        const current = atendimentoStore.get(storeKey) || {};
        atendimentoStore.set(storeKey, {
          ...current,
          logradouro: logradouro || current.logradouro,
          numero: numero || current.numero,
          complemento: complemento || current.complemento,
          bairro: bairro || current.bairro,
          cep: cep ? cep.replace(/\D/g, '') : current.cep,
          regiao: regiao || current.regiao
        });

        result = { success: true, message: 'Endereço coletado', data: { logradouro, numero, bairro } };
        break;
      }

      case 'registrar_produtos': {
        const { produtos, observacao } = args;

        if (!produtos) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Lista de produtos é obrigatória' }
          });
        }

        const current = atendimentoStore.get(storeKey) || {};
        atendimentoStore.set(storeKey, {
          ...current,
          produtos: produtos || current.produtos,
          observacao_produtos: observacao || current.observacao_produtos
        });

        result = { success: true, message: 'Produtos registrados' };
        break;
      }

      case 'agendar_atendimento': {
        const { data, hora, tipo, observacao } = args;

        if (!data || !hora || !tipo) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Data, hora e tipo são obrigatórios' }
          });
        }

        const validTypes = ['entrega', 'consulta', 'retirada', 'presencial'];
        if (!validTypes.includes(tipo)) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Tipo deve ser um dos: ${validTypes.join(', ')}` }
          });
        }

        const current = atendimentoStore.get(storeKey) || {};
        atendimentoStore.set(storeKey, {
          ...current,
          data_agendamento: data,
          hora_agendamento: hora,
          tipo_atendimento: tipo,
          observacao_agendamento: observacao
        });

        result = { success: true, message: `Agendamento registrado para ${data} às ${hora}`, data: { data, hora, tipo } };
        break;
      }

      case 'registrar_atendimento': {
        const { nicho, resumo_conversa, transferencia } = args;

        if (!nicho || !resumo_conversa) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Nicho e resumo da conversa são obrigatórios' }
          });
        }

        const validNichos = ['construcao', 'gastronomia', 'medico', 'petshop'];
        if (!validNichos.includes(nicho)) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Nicho deve ser um dos: ${validNichos.join(', ')}` }
          });
        }

        // Buscar dados coletados
        const dados = atendimentoStore.get(storeKey) || {};

        // Montar endereço completo
        const enderecoCompleto = [
          dados.logradouro,
          dados.numero,
          dados.complemento,
          dados.bairro,
          dados.cep ? `CEP ${dados.cep}` : ''
        ].filter(Boolean).join(', ');

        // Inserir no banco
        const insertData = {
          nome: dados.nome || 'Cliente WhatsApp',
          telefone: dados.telefone || null,
          email: dados.email || null,
          nicho: nicho,
          resumo_conversa: resumo_conversa,
          produtos_citados: dados.produtos || null,
          transferido_para: transferencia || null,
          status: transferencia ? 'transferido' : 'pendente',
          // Endereço
          endereco_entrega: dados.logradouro || null,
          numero_endereco: dados.numero || null,
          complemento: dados.complemento || null,
          bairro_entrega: dados.bairro || null,
          regiao_entrega: dados.regiao || null,
          cep_entrega: dados.cep || null,
          // Agendamento
          data_agendamento: dados.data_agendamento || null,
          hora_agendamento: dados.hora_agendamento || null,
          tipo_atendimento: dados.tipo_atendimento || null,
          status_entrega: dados.data_agendamento ? 'agendado' : null,
          observacao_entrega: dados.observacao_agendamento || null
        };

        const { data: inserted, error: insertError } = await supabaseAdmin
          .from('atendimentos')
          .insert(insertData)
          .select('id')
          .single();

        if (insertError) {
          console.error('Erro ao inserir atendimento:', insertError);
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32603, message: 'Erro ao salvar atendimento', details: insertError.message }
          });
        }

        // Limpar store após salvar
        atendimentoStore.delete(storeKey);

        result = {
          success: true,
          message: 'Atendimento registrado com sucesso!',
          atendimento_id: inserted.id
        };
        break;
      }

      default:
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Tool '${toolName}' não encontrada` }
        });
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result
    });

  } catch (error) {
    console.error('Erro no MCP:', error);
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32603, message: 'Internal error', details: String(error) }
    }, { status: 500 });
  }
}

// GET para listar tools disponíveis
export async function GET() {
  const { tools } = await import('@/lib/mcp/tools');

  return NextResponse.json({
    jsonrpc: '2.0',
    id: null,
    result: {
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }))
    }
  });
}