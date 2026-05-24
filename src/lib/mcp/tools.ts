export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const tools: Tool[] = [
  {
    name: 'coletar_dados_cliente',
    description: 'Coleta dados básicos do cliente durante o atendimento WhatsApp',
    inputSchema: {
      type: 'object',
      properties: {
        nome: { type: 'string', description: 'Nome completo do cliente' },
        telefone: { type: 'string', description: 'Telefone com DDD, apenas números (10 ou 11 dígitos)' },
        email: { type: 'string', description: 'Email do cliente (opcional)' }
      },
      required: ['nome', 'telefone']
    }
  },
  {
    name: 'coletar_endereco',
    description: 'Coleta endereço completo de entrega',
    inputSchema: {
      type: 'object',
      properties: {
        logradouro: { type: 'string', description: 'Nome da rua/avenida' },
        numero: { type: 'string', description: 'Número do endereço' },
        complemento: { type: 'string', description: 'Complemento (apto, bloco, etc)' },
        bairro: { type: 'string', description: 'Bairro' },
        cidade: { type: 'string', description: 'Cidade (padrão: Rio de Janeiro)' },
        estado: { type: 'string', description: 'Estado (padrão: RJ)' },
        cep: { type: 'string', description: 'CEP apenas números (8 dígitos)' },
        regiao: { type: 'string', enum: ['Zona Norte', 'Zona Sul', 'Zona Oeste', 'Centro', 'Baixada', 'Grande RJ'], description: 'Região do RJ' }
      },
      required: ['logradouro', 'numero', 'bairro']
    }
  },
  {
    name: 'registrar_produtos',
    description: 'Registra lista de produtos ou serviços mencionados pelo cliente',
    inputSchema: {
      type: 'object',
      properties: {
        produtos: { type: 'string', description: 'Lista de produtos/serviços separados por vírgula' },
        observacao: { type: 'string', description: 'Observação adicional sobre os produtos' }
      },
      required: ['produtos']
    }
  },
  {
    name: 'agendar_atendimento',
    description: 'Registra agendamento de entrega, consulta ou retirada',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
        hora: { type: 'string', description: 'Hora no formato HH:MM' },
        tipo: { type: 'string', enum: ['entrega', 'consulta', 'retirada', 'presencial'], description: 'Tipo de atendimento' },
        observacao: { type: 'string', description: 'Observação sobre o agendamento' }
      },
      required: ['data', 'hora', 'tipo']
    }
  },
  {
    name: 'registrar_atendimento',
    description: 'Finaliza e salva o atendimento completo no CRM. Deve ser chamada AO FINAL da conversa.',
    inputSchema: {
      type: 'object',
      properties: {
        nicho: { type: 'string', enum: ['construcao', 'gastronomia', 'medico', 'petshop'], description: 'Nicho do atendimento' },
        resumo_conversa: { type: 'string', description: 'Resumo da conversa gerado pelo agente' },
        transferencia: { type: 'string', description: 'Nome do atendente para transferência (opcional)' }
      },
      required: ['nicho', 'resumo_conversa']
    }
  }
];

// Estado em memória do atendimento (será guardado no GPT Maker, não aqui)
// Este arquivo só define as tools, não mantém estado