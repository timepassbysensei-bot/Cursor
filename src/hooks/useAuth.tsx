import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { getProfile, signOut as signOutService, touchLastSeen } from "../services/auth";
import type { AppRole, ClientStatus, Profile } from "../types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  status: ClientStatus | null;
  loading: boolean;
  /** True only for an active admin — the value every admin guard uses. */
  isAdmin: boolean;
  /** True for a client whose access has been approved. */
  hasClientAccess: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LAST_SEEN_KEY = "arian.last-seen";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadProfile = useCallback(async (userId: string, attempt = 0): Promise<void> => {
    try {
      const next = await getProfile(userId);
      if (!mounted.current) return;
      if (next) {
        setProfile(next);
        return;
      }
      // The `on_auth_user_created` trigger and the client's first read can race
      // on a brand-new sign-up; retry once before giving up.
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        if (!mounted.current) return;
        await loadProfile(userId, attempt + 1);
        return;
      }
      setProfile(null);
    } catch {
      if (mounted.current) setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled || !mounted.current) return;
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted.current) return;
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    let active = true;
    void loadProfile(session.user.id).finally(() => {
      if (active && mounted.current) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [session, loadProfile]);

  // A once-per-hour "last active" stamp so the admin clients table is useful
  // without writing on every render.
  useEffect(() => {
    if (!session?.user || !isSupabaseConfigured) return;
    const last = Number(window.sessionStorage.getItem(LAST_SEEN_KEY) ?? 0);
    if (Date.now() - last < 60 * 60 * 1000) return;
    window.sessionStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
    void touchLastSeen(session.user.id);
  }, [session]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOutService();
    } finally {
      setProfile(null);
      setSession(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = profile?.role ?? null;
    const status = profile?.status ?? null;
    return {
      session,
      user: session?.user ?? null,
      profile,
      role,
      status,
      loading,
      isAdmin: role === "admin",
      hasClientAccess: role === "client" && status === "active",
      refreshProfile,
      signOut: handleSignOut,
    };
  }, [session, profile, loading, refreshProfile, handleSignOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

/** Where a signed-in user belongs after login. */
export function homePathFor(role: AppRole | null): string {
  return role === "admin" ? "/admin" : "/dashboard";
}
