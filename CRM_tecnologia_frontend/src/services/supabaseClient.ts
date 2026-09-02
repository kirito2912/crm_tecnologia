import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true cuando las variables VITE_SUPABASE_* están definidas */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl?.trim() && supabaseAnonKey?.trim());
}

let client: SupabaseClient | null = null;

/**
 * Cliente singleton de Supabase.
 * Retorna null si no hay credenciales — el módulo dataset funciona en modo local.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(supabaseUrl!, supabaseAnonKey!);
  }
  return client;
}

export const DATASETS_BUCKET = 'datasets';
export const DATASETS_TABLE = 'datasets_ml';
