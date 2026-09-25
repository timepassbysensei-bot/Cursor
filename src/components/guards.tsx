import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Ban, Clock, Loader2, ShieldOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ButtonLink } from "./ui/Button";
import { isSupabaseConfigured } from "../lib/supabaseClient";

export function FullScreenLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-base" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-cyan" aria-hidden />
      <p className="text-sm text-muted">{label}</p>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function Notice({
  icon,
  title,
  body,
  tone = "neutral",
}: {
  icon: ReactNode;
  title: string;
  body: string;
  tone?: "neutral" | "danger";
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div
        className={`panel w-full max-w-lg p-8 text-center ${tone === "danger" ? "border-coral/25" : ""}`}
        role="alert"
      >
        <span
          className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border ${
            tone === "danger" ? "border-coral/30 bg-coral/10 text-coral" : "border-hairline bg-white/5 text-cyan"
          }`}
        >
          {icon}
        </span>
        <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/contact" size="sm">
            Contact Arian
          </ButtonLink>
          <ButtonLink to="/" variant="outline" size="sm">
            Back to the site
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

/**
 * Requires a signed-in session. The attempted path is kept in `returnTo` so
 * signing in lands the visitor where they were headed instead of the homepage.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (!isSupabaseConfigured) {
    return (
      <Notice
        icon={<ShieldOff className="h-5 w-5" aria-hidden />}
        title="Accounts are not connected yet"
        body="This build has no Supabase credentials, so sign-in is unavailable. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then reload."
      />
    );
  }
  if (loading) return <FullScreenLoader label="Checking your session…" />;
  if (!session) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
  return <>{children}</>;
}

/** Client area: requires a session and a client account that is not blocked. */
export function RequireClient({ children }: { children: ReactNode }) {
  const { session, profile, role, status, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader label="Opening your dashboard…" />;
  if (!isSupabaseConfigured) {
    return (
      <Notice
        icon={<ShieldOff className="h-5 w-5" aria-hidden />}
        title="Accounts are not connected yet"
        body="Connect Supabase to use the client dashboard. Public pages keep working in demo mode."
      />
    );
  }
  if (!session) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
  if (role === "admin") return <Navigate to="/admin" replace />;

  if (status === "banned") {
    return (
      <Notice
        tone="danger"
        icon={<Ban className="h-5 w-5" aria-hidden />}
        title="Your access has been removed"
        body="This account is banned from the client dashboard. If you believe this is a mistake, use the contact page."
      />
    );
  }

  if (status === "suspended") {
    return (
      <Notice
        icon={<Clock className="h-5 w-5" aria-hidden />}
        title="Your account is suspended"
        body="Access is paused for now. Your messages and data stay safe and will be available again once Arian restores access."
      />
    );
  }

  if (!profile) {
    return (
      <Notice
        icon={<ShieldOff className="h-5 w-5" aria-hidden />}
        title="We could not load your profile"
        body="Your account exists but its profile row could not be read. Sign in again, or contact Arian if it keeps happening."
      />
    );
  }

  return <>{children}</>;
}

/** Admin area: the role check mirrors the database's `is_admin()`. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, profile, role, status, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader label="Verifying access…" />;
  if (!isSupabaseConfigured) {
    return (
      <Notice
        icon={<ShieldOff className="h-5 w-5" aria-hidden />}
        title="The studio is not connected yet"
        body="Connect Supabase and create the first admin user to open the studio."
      />
    );
  }
  if (!session) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
  if (role !== "admin") {
    return (
      <Notice
        tone="danger"
        icon={<ShieldOff className="h-5 w-5" aria-hidden />}
        title="Admin access only"
        body="This area manages videos, the gallery, clients and broadcasts. Your account does not have admin access."
      />
    );
  }
  if (status !== "active") {
    return (
      <Notice
        tone="danger"
        icon={<ShieldOff className="h-5 w-5" aria-hidden />}
        title="Admin access paused"
        body="This admin account is not active. Restore it in the database before signing in again."
      />
    );
  }
  if (!profile) return <FullScreenLoader label="Loading your profile…" />;

  return <>{children}</>;
}

/** Small inline notice used when a pending client can see a page but not act. */
export function PendingAccessNotice({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4 text-sm leading-relaxed text-amber-200/90 ${
        className ?? ""
      }`}
      role="status"
    >
      <p className="font-display font-semibold text-amber-100">Access pending approval</p>
      <p className="mt-1 text-muted">
        Your account is created but Arian has not approved it yet. You can update your profile now —
        messaging and sponsorship unlock automatically once access is granted.{" "}
        <Link to="/contact" className="font-semibold text-cyan underline-offset-2 hover:underline">
          Ask Arian to approve it
        </Link>
        .
      </p>
    </div>
  );
}
