export type Nicho = 'construcao' | 'gastronomia' | 'medico' | 'petshop'
export type StatusAtendimento = 'encerrado' | 'transferido' | 'pendente'
export type TipoAtendimento = 'entrega' | 'consulta' | 'retirada' | 'presencial'
export type RegiaoEntrega = 'Zona Norte' | 'Zona Sul' | 'Zona Oeste' | 'Centro' | 'Baixada' | 'Grande RJ'
export type StatusEntrega = 'agendado' | 'confirmado' | 'em_rota' | 'entregue' | 'cancelado'
export type Perfil = 'admin' | 'usuario'

export interface Atendimento {
  id: string
  data_hora: string
  nome: string
  telefone: string
  nicho: Nicho
  resumo_conversa: string | null
  produtos_citados: string | null
  transferido_para: string | null
  status: StatusAtendimento
  lembrete: string | null
  lembrete_data: string | null
  data_agendamento: string | null
  hora_agendamento: string | null
  tipo_atendimento: TipoAtendimento | null
  endereco_entrega: string | null
  numero_endereco: string | null
  complemento: string | null
  bairro_entrega: string | null
  regiao_entrega: RegiaoEntrega | null
  cep_entrega: string | null
  status_entrega: StatusEntrega | null
  observacao_entrega: string | null
  created_at: string
  tenant_id: string
}

export type PerfilRole = 'administrador' | 'usuario_comum'

export interface User {
  id: string
  user_id: string
  nome: string | null
  role: PerfilRole
  created_at: string
}

export interface LogAcesso {
  id: string
  user_id: string
  acao: string
  registro_id: string | null
  data_hora: string
  ip_address: string | null
}

export interface ConteudoAgente {
  id: string
  nicho: Nicho
  saudacao: string
  mensagem_consentimento: string
  perguntas: unknown[]
  texto_encerramento: string
  updated_at: string
  updated_by: string | null
}