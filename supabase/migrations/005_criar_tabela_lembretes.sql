-- Migration 005: Criar tabela lembretes
-- Sistema: Atendimentos WhatsApp v3.0

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar ENUMs
DO $$ BEGIN
  CREATE TYPE tipo_lembrete_enum AS ENUM ('whatsapp', 'email', 'interno');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE status_lembrete_enum AS ENUM ('pendente', 'enviado', 'concluido', 'cancelado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela: lembretes
CREATE TABLE IF NOT EXISTS lembretes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  atendimento_id UUID REFERENCES atendimentos(id) ON DELETE CASCADE,
  tipo_envio tipo_lembrete_enum NOT NULL,
  mensagem TEXT NOT NULL CHECK (char_length(mensagem) >= 1 AND char_length(mensagem) <= 500),
  data_hora_agendada TIMESTAMP WITH TIME ZONE NOT NULL,
  status status_lembrete_enum DEFAULT 'pendente',
  enviado_em TIMESTAMP WITH TIME ZONE,
  criado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_lembretes_atendimento ON lembretes(atendimento_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_data_hora ON lembretes(data_hora_agendada);
CREATE INDEX IF NOT EXISTS idx_lembretes_status ON lembretes(status);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lembretes_updated_at
  BEFORE UPDATE ON lembretes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS para lembretes (mesma política de atendimentos)
ALTER TABLE lembretes ENABLE ROW LEVEL SECURITY;

-- Policy: usuários veem apenas lembretes dos seus atendimentos
CREATE POLICY lembretes_select ON lembretes
  FOR SELECT USING (
    atendimento_id IN (
      SELECT id FROM atendimentos WHERE tenant_id = current_setting('app.tenant_id', true)::UUID
    )
  );

-- Policy: usuários podem criar lembretes
CREATE POLICY lembretes_insert ON lembretes
  FOR INSERT WITH CHECK (true);

-- Policy: usuários podem atualizar status dos seus lembretes
CREATE POLICY lembretes_update ON lembretes
  FOR UPDATE USING (
    atendimento_id IN (
      SELECT id FROM atendimentos WHERE tenant_id = current_setting('app.tenant_id', true)::UUID
    )
  );

-- Policy: apenas admin pode deletar
CREATE POLICY lembretes_delete ON lembretes
  FOR DELETE USING (
    current_setting('app.user_role', true) = 'administrador'
  );