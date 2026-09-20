import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import {
  getProfile,
  getSession,
  signOut,
} from "../services/auth";
import type { AppRole, Profile } from "../types";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isActive: boolean;
  forcePasswordChange: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getSession().then((s) => {
      if (!mounted) return;
      setSession(s);
      if (!s) setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const mounted = true;
    if (!session) {
      setProfile(null);
      return;
    }
    getProfile(session.user.id)
      .then((p) => {
        if (!mounted) return;
        setProfile(p);
      })
      .catch(() => {
        if (mounted) setProfile(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
  }, [session]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      role: profile?.role ?? null,
      isActive: profile ? profile.is_active : true,
      forcePasswordChange: profile?.force_password_change ?? false,
      loading,
      signOut: handleSignOut,
    }),
    [session, profile, loading, handleSignOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  ;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
