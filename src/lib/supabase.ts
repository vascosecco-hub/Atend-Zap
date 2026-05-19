import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
}

export const createSupabaseClient = () =>
  createClient(supabaseUrl, supabaseAnonKey)

export const supabase = createSupabaseClient()

// Re-export database types
export type {
  Nicho,
  StatusAtendimento,
  TipoAtendimento,
  RegiaoEntrega,
  StatusEntrega,
  Perfil,
  Atendimento,
  User,
  LogAcesso,
  ConteudoAgente,
} from './types'