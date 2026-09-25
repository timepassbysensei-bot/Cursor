import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Loader2 } from "lucide-react";
import { AuthNotice, AuthShell } from "../../components/AuthShell";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { newPasswordSchema, type NewPasswordInput } from "../../validation/schemas";
import { updatePassword } from "../../services/auth";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { useToast } from "../../components/ui/Toast";
import { errorMessage } from "../../lib/utils";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";

export default function ResetPassword() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [recoveryDetected, setRecoveryDetected] = useState(false);

  useSeo({
    title: "Set a new password — Arian",
    description: "Choose a new password for your account.",
    noIndex: true,
  });

  // Supabase fires PASSWORD_RECOVERY when the link is opened; detectSessionInUrl
  // turns the token in the URL into a session for us.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryDetected(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = async (values: NewPasswordInput) => {
    setError(null);
    try {
      const { error: updateError } = await updatePassword(values.password);
      if (updateError) throw updateError;
      setDone(true);
      push({ title: "Password updated", description: "You can sign in with it now.", variant: "success" });
      window.setTimeout(() => navigate("/login", { replace: true }), 1600);
    } catch (caught) {
      setError(errorMessage(caught, "The password could not be updated. Please open the reset link again."));
    }
  };

  const linkUsable = Boolean(session) || recoveryDetected;

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose something you have not used here before."
      footer={
        <p className="text-sm text-muted">
          <Link to="/login" className="font-semibold text-cyan underline-offset-2 hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {!isSupabaseConfigured ? (
        <AuthNotice tone="error">Password reset needs Supabase to be connected first.</AuthNotice>
      ) : loading ? (
        <p className="text-sm text-muted">Checking your reset link…</p>
      ) : done ? (
        <AuthNotice tone="success">
          Password updated. Taking you to the sign-in page…
        </AuthNotice>
      ) : !linkUsable ? (
        <div className="space-y-5">
          <AuthNotice tone="error">
            This password reset link is missing or has expired. Request a fresh one and it will work.
          </AuthNotice>
          <Button onClick={() => navigate("/forgot-password")}>Request a new link</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field
            label="New password"
            htmlFor="new-password"
            error={errors.password?.message}
            hint="8+ characters, with a letter and a number"
            required
          >
            <input
              id="new-password"
              type="password"
              className="input"
              autoComplete="new-password"
              autoFocus
              {...register("password")}
            />
          </Field>

          <Field
            label="Confirm new password"
            htmlFor="new-password-confirm"
            error={errors.confirm?.message}
            required
          >
            <input
              id="new-password-confirm"
              type="password"
              className="input"
              autoComplete="new-password"
              {...register("confirm")}
            />
          </Field>

          {error && <AuthNotice tone="error">{error}</AuthNotice>}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Updating…
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" aria-hidden />
                Update password
              </>
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
