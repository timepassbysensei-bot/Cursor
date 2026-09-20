import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { AppRole } from "../types";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite" role="status">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy/20 border-t-navy" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/auth/login" state={{ returnTo: location.pathname + location.search }} replace />;
  }
  return <>{children}</>;
}

export function RequireRole({ roles, children }: { roles: AppRole[]; children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite" role="status">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy/20 border-t-navy" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/auth/login" state={{ returnTo: location.pathname + location.search }} replace />;
  }
  if (profile && !profile.is_active) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-offwhite px-4 text-center">
        <p className="font-display text-xl font-bold text-navy">Account deactivated</p>
        <p className="max-w-md text-sm text-muted">
          Your account has been deactivated. Please contact the academy office for assistance.
        </p>
      </div>
    );
  }
  if (profile && !roles.includes(profile.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-offwhite px-4 text-center">
        <p className="font-display text-xl font-bold text-navy">Access denied</p>
        <p className="max-w-md text-sm text-muted">
          You do not have permission to view this area. If you believe this is a mistake, contact the academy office.
        </p>
      </div>
    );
  }
  if (profile?.force_password_change) {
    return <Navigate to="/auth/change-password" replace />;
  }
  if (!profile && session) {
    // Profile row missing: treat as unauthorized rather than crashing.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-offwhite px-4 text-center">
        <p className="font-display text-xl font-bold text-navy">Profile unavailable</p>
        <p className="max-w-md text-sm text-muted">
          We could not load your profile. Please sign in again or contact the academy office.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
