import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseKeyFallback(supabaseAnonKey),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

function supabaseKeyFallback(key: string | undefined): string {
  return key ?? "public-anon-key-placeholder";
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
