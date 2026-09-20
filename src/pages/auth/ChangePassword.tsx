import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { newPasswordSchema, type NewPasswordInput } from "../../validation/schemas";
import { updatePassword } from "../../services/auth";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import type { AppRole } from "../../types";

const DASHBOARD_BY_ROLE: Record<AppRole, string> = {
  super_admin: "/admin",
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};

export default function ChangePassword() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordInput>({ resolver: zodResolver(newPasswordSchema), defaultValues: { password: "", confirm: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const { error: err } = await updatePassword(values.password);
    if (err) {
      setError("Could not update your password. Please try again.");
      return;
    }
    if (session) {
      await supabase
        .from("profiles")
        .update({ force_password_change: false })
        .eq("id", session.user.id);
    }
    setSuccess(true);
    // Send the user on to their own portal rather than the public homepage —
    // this page is reached by students/staff who must change a temporary password.
    const destination = profile ? DASHBOARD_BY_ROLE[profile.role] : "/";
    setTimeout(() => navigate(destination, { replace: true }), 1800);
  });

  return (
    <div className="flex min-h-screen flex-col bg-navy-dark">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-lift sm:p-8">
          <h1 className="font-display text-2xl font-extrabold text-navy">Change password</h1>
          <p className="mt-1 text-sm text-muted">
            Choose a strong password with at least 8 characters, including a letter and a number.
          </p>
          {success ? (
            <div className="mt-6 rounded-xl border border-green-success/25 bg-green-success/[0.06] p-6 text-center" role="status">
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-success" aria-hidden />
              <p className="mt-3 font-display text-base font-bold text-navy">Password changed</p>
              <p className="mt-1 text-sm text-muted">Taking you to your dashboard…</p>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
              <div>
                <label htmlFor="cp1" className="mb-1.5 block text-sm font-semibold text-ink">New password</label>
                <input id="cp1" type="password" className="input" autoComplete="new-password" {...register("password")} />
                {errors.password && <p role="alert" className="mt-1 text-xs font-medium text-error">{errors.password.message}</p>}
              </div>
              <div>
                <label htmlFor="cp2" className="mb-1.5 block text-sm font-semibold text-ink">Confirm password</label>
                <input id="cp2" type="password" className="input" autoComplete="new-password" {...register("confirm")} />
                {errors.confirm && <p role="alert" className="mt-1 text-xs font-medium text-error">{errors.confirm.message}</p>}
              </div>
              {error && (
                <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Updating…</> : "Change Password"}
              </Button>
            </form>
          )}
          <div className="mt-4 text-sm">
            <Link to="/" className="font-semibold text-navy hover:underline">← Back to website</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
