import type { Session, User } from "@supabase/supabase-js";
import { siteUrl, supabase } from "../lib/supabaseClient";
import type { Profile } from "../types";

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status, avatar_url, bio, last_seen_at, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle<Profile>();
  if (error) throw error;
  return data;
}

/**
 * Public sign-up. The role is never sent from the browser — the database
 * trigger creates every new account as a `client` with `pending` access.
 */
export async function signUpClient(input: { email: string; password: string; fullName: string }) {
  return supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: { full_name: input.fullName.trim() },
      emailRedirectTo: `${siteUrl}/dashboard`,
    },
  });
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
}

/**
 * Optional magic-link sign-in. `shouldCreateUser: false` keeps it as an
 * alternative login for existing accounts rather than a second sign-up path
 * that would bypass the approval queue.
 */
export async function sendMagicLink(email: string) {
  return supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${siteUrl}/dashboard`,
    },
  });
}

export async function resendVerificationEmail(email: string) {
  return supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo: `${siteUrl}/dashboard` },
  });
}

export async function requestPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${siteUrl}/auth/reset-password`,
  });
}

export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

export async function signOut() {
  return supabase.auth.signOut();
}

/** Only the columns a client may change about themselves. */
export async function updateOwnProfile(
  userId: string,
  patch: { full_name?: string; avatar_url?: string | null; bio?: string | null }
) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

/** Cheap "last active" signal for the admin clients table. */
export async function touchLastSeen(userId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) {
    // Never surface this: it is a nicety, not a requirement of any flow.
    console.warn("Could not update last_seen_at", error.message);
  }
}
