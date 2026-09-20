import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { AppRole, Profile } from "../types";

export interface AuthUserState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isActive: boolean;
  forcePasswordChange: boolean;
  loading: boolean;
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<Profile>();
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function requestPasswordReset(email: string) {
  const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined) ?? window.location.origin;
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/reset-password`,
  });
}

export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

export async function signOut() {
  return supabase.auth.signOut();
}
