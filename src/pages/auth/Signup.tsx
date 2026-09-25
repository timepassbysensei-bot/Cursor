import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { AuthNotice, AuthShell } from "../../components/AuthShell";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { signupSchema, type SignupInput } from "../../validation/schemas";
import { resendVerificationEmail, signUpClient } from "../../services/auth";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { useToast } from "../../components/ui/Toast";
import { errorMessage } from "../../lib/utils";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

export default function Signup() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useSeo({
    title: "Create your account — Arian",
    description:
      "Create a client account to message Arian, track sponsorship enquiries and read replies in your dashboard.",
    noIndex: true,
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false as unknown as true,
    },
  });

  useEffect(() => {
    if (authLoading || !session) return;
    navigate("/dashboard", { replace: true });
  }, [authLoading, session, navigate]);

  const onSubmit = async (values: SignupInput) => {
    setError(null);
    try {
      const { data, error: signUpError } = await signUpClient({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      });
      if (signUpError) throw signUpError;

      // With email confirmation enabled Supabase returns no session, and the
      // account stays pending until both the email is confirmed and Arian
      // approves access.
      if (!data.session) {
        setNeedsVerification(true);
        return;
      }
      push({
        title: "Account created",
        description: "Your access is pending Arian's approval.",
        variant: "success",
      });
      navigate("/dashboard", { replace: true });
    } catch (caught) {
      const message = errorMessage(caught, "That account could not be created. Please try again.");
      setError(
        /already registered|already exists/i.test(message)
          ? "An account with that email already exists. Try signing in instead."
          : message
      );
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail(getValues("email"));
      setResent(true);
    } catch {
      setError("The verification email could not be resent yet. Please try again in a minute.");
    } finally {
      setResending(false);
    }
  };

  if (needsVerification) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle="One step left before your dashboard opens."
        footer={
          <p className="text-sm text-muted">
            Already confirmed?{" "}
            <Link to="/login" className="font-semibold text-cyan underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        }
      >
        <div className="space-y-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10">
            <MailCheck className="h-6 w-6 text-cyan" aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-muted">
            We sent a verification link to <strong className="text-ink">{getValues("email")}</strong>. Open it to
            confirm your address.
          </p>
          <AuthNotice tone="info">
            Accounts start with <strong>pending</strong> access. Once your email is confirmed, Arian approves the
            account and messaging unlocks. You can sign in and update your profile in the meantime.
          </AuthNotice>
          {resent && <AuthNotice tone="success">Verification email sent again.</AuthNotice>}
          <div className="flex flex-wrap gap-2">
            <ButtonLink to="/login" size="md">
              Go to sign in
            </ButtonLink>
            <Button variant="outline" size="md" onClick={() => void onResend()} disabled={resending}>
              {resending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Resend the email
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your client account"
      subtitle="Message Arian, keep your sponsorship enquiries in one place, and read replies in your dashboard."
      footer={
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-cyan underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {!isSupabaseConfigured ? (
        <AuthNotice tone="error">
          Sign-up is not connected yet. Add <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code>, apply the Supabase migrations, then reload.
        </AuthNotice>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label="Your name" htmlFor="signup-name" error={errors.fullName?.message} required>
            <input id="signup-name" className="input" autoComplete="name" autoFocus {...register("fullName")} />
          </Field>

          <Field label="Email" htmlFor="signup-email" error={errors.email?.message} required>
            <input id="signup-email" type="email" className="input" autoComplete="email" {...register("email")} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Password"
              htmlFor="signup-password"
              error={errors.password?.message}
              hint="8+ characters, with a letter and a number"
              required
            >
              <input
                id="signup-password"
                type="password"
                className="input"
                autoComplete="new-password"
                {...register("password")}
              />
            </Field>

            <Field
              label="Confirm password"
              htmlFor="signup-confirm"
              error={errors.confirmPassword?.message}
              required
            >
              <input
                id="signup-confirm"
                type="password"
                className="input"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
            </Field>
          </div>

          <div>
            <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-muted">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-hairline bg-base/60 accent-cyan"
                {...register("acceptTerms")}
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="text-cyan underline-offset-2 hover:underline">
                  terms of use
                </Link>{" "}
                and the{" "}
                <Link to="/privacy" className="text-cyan underline-offset-2 hover:underline">
                  privacy policy
                </Link>
                .
              </span>
            </label>
            {errors.acceptTerms && (
              <p role="alert" className="mt-1.5 text-2xs text-coral">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          {error && <AuthNotice tone="error">{error}</AuthNotice>}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Creating your account…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Create account
              </>
            )}
          </Button>

          <p className="flex items-start gap-2 rounded-xl border border-hairline bg-white/[0.02] px-3.5 py-3 text-2xs leading-relaxed text-faint">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jade" aria-hidden />
            Every sign-up creates a client account with pending access. Admin access is never selectable here and
            is granted only by Arian.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
