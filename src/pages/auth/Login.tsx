import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { AuthNotice, AuthShell } from "../../components/AuthShell";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { loginSchema, magicLinkSchema, type LoginInput } from "../../validation/schemas";
import { getCurrentUser, getProfile, sendMagicLink, signInWithPassword } from "../../services/auth";
import { homePathFor, useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { errorMessage } from "../../lib/utils";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { useToast } from "../../components/ui/Toast";

export default function Login() {
  const { session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { push } = useToast();
  const returnTo = params.get("returnTo");

  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [magicBusy, setMagicBusy] = useState(false);

  useSeo({
    title: "Sign in — Arian",
    description: "Sign in to your client dashboard or the admin studio.",
    noIndex: true,
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Already signed in: send them where they were heading.
  useEffect(() => {
    if (authLoading || !session) return;
    navigate(returnTo ?? homePathFor(profile?.role ?? "client"), { replace: true });
  }, [authLoading, session, profile, returnTo, navigate]);

  const onSubmit = async (values: LoginInput) => {
    setError(null);
    try {
      const { error: signInError } = await signInWithPassword(values.email, values.password);
      if (signInError) throw signInError;

      // The role decides the destination, and it is read from the database —
      // never from anything the browser supplied.
      const user = await getCurrentUser();
      const account = user ? await getProfile(user.id) : null;
      const destination = returnTo ?? homePathFor(account?.role ?? "client");

      push({ title: "Signed in", description: "Welcome back.", variant: "success" });
      navigate(destination, { replace: true });
    } catch (caught) {
      const message = errorMessage(caught, "Sign in failed. Check your details and try again.");
      setError(
        /invalid login credentials/i.test(message)
          ? "That email and password combination did not match. Check both, or reset your password."
          : /email not confirmed/i.test(message)
            ? "Please confirm your email address first — check your inbox for the verification link."
            : message
      );
    }
  };

  const onMagicLink = async () => {
    setError(null);
    const parsed = magicLinkSchema.safeParse({ email: getValues("email") });
    if (!parsed.success) {
      setError("Enter your email address first, then request the sign-in link.");
      return;
    }
    setMagicBusy(true);
    try {
      const { error: otpError } = await sendMagicLink(parsed.data.email);
      if (otpError) throw otpError;
      setMagicSent(true);
    } catch (caught) {
      setError(errorMessage(caught, "The sign-in link could not be sent."));
    } finally {
      setMagicBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to read messages from Arian, manage your sponsorship enquiries, or open the studio."
      footer={
        <p className="text-sm text-muted">
          No account yet?{" "}
          <Link to="/signup" className="font-semibold text-cyan underline-offset-2 hover:underline">
            Create one
          </Link>{" "}
          — new accounts are approved by Arian before messaging unlocks.
        </p>
      }
    >
      {!isSupabaseConfigured ? (
        <AuthNotice tone="error">
          Authentication is not connected yet. Add <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code>, apply the Supabase migrations, then reload.
        </AuthNotice>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label="Email" htmlFor="login-email" error={errors.email?.message} required>
            <input
              id="login-email"
              type="email"
              className="input"
              autoComplete="email"
              autoFocus
              {...register("email")}
            />
          </Field>

          <Field label="Password" htmlFor="login-password" error={errors.password?.message} required>
            <input
              id="login-password"
              type="password"
              className="input"
              autoComplete="current-password"
              {...register("password")}
            />
          </Field>

          <div className="flex items-center justify-between gap-3">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-muted underline-offset-2 transition-colors hover:text-ink hover:underline"
            >
              Forgot password?
            </Link>
            <Link
              to="/signup"
              className="text-xs font-semibold text-muted underline-offset-2 transition-colors hover:text-ink hover:underline sm:hidden"
            >
              Create account
            </Link>
          </div>

          {error && <AuthNotice tone="error">{error}</AuthNotice>}
          {magicSent && (
            <AuthNotice tone="success">
              A one-time sign-in link is on its way to your inbox. Open it on this device to finish signing in.
            </AuthNotice>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>

          <div className="flex items-center gap-3 text-2xs uppercase tracking-[0.2em] text-faint">
            <span className="h-px flex-1 bg-hairline" />
            or
            <span className="h-px flex-1 bg-hairline" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => void onMagicLink()}
            disabled={magicBusy}
          >
            {magicBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Sending link…
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" aria-hidden />
                Email me a sign-in link
              </>
            )}
          </Button>

          <p className="flex items-start gap-2 rounded-xl border border-hairline bg-white/[0.02] px-3.5 py-3 text-2xs leading-relaxed text-faint">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet" aria-hidden />
            Magic links only work for accounts that already exist — they do not create one, so they cannot skip
            the approval step.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
