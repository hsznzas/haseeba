import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = (import.meta as any).env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder')
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Demo mode will work, but you need VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for real user authentication.');
}

// Regular client (user-scoped with RLS)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// Admin client (bypasses RLS for global platform queries)
// Only use this for admin dashboard functions that need to see all users' data
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || supabaseAnonKey || 'placeholder-service-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storageKey: 'sb-admin-auth-token' // Unique key to prevent GoTrueClient conflict
    }
  }
);
