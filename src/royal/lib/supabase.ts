import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios em .env');
}

// Untyped client. Tipos por tabela em src/types/database.ts são aplicados ao consumir resultados.
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
