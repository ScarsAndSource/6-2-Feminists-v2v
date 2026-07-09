import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getOrCreateUser() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    return session.user;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}
