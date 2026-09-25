import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

/**
 * Exported so the storage uploader can talk to the Storage REST endpoint
 * directly (Supabase's JS client does not report upload progress) and so
 * demo mode can be detected in one place.
 */
export const SUPABASE_URL = supabaseUrl ?? "";
export const SUPABASE_ANON_KEY = supabaseAnonKey ?? "";
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "public-anon-key-placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/** Canonical origin, used for auth redirect links and share metadata. */
export const siteUrl =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ??
  (typeof window !== "undefined" ? window.location.origin : "");

export const youtubeChannelUrl =
  (import.meta.env.VITE_YOUTUBE_CHANNEL_URL as string | undefined)?.trim() ||
  "https://www.youtube.com/@youknowArian";

export const chatEndpoint = (import.meta.env.VITE_CHAT_ENDPOINT as string | undefined) ?? "/api/chat";
