-- Migration 006: Adicionar coluna email na tabela atendimentos
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS email TEXT;