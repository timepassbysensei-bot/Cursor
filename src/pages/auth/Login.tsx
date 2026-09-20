import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { loginSchema, type LoginInput } from "../../validation/schemas";
import { signIn } from "../../services/auth";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ?? null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!loading && session && profile) {
      const dash: Record<string, string> = {
        super_admin: "/admin",
        admin: "/admin",
        teacher: "/teacher",
        student: "/student",
      };
      navigate(returnTo ?? dash[profile.role] ?? "/", { replace: true });
    }
  }, [session, profile, loading, navigate, returnTo]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const { error: err } = await signIn(values.email, values.password);
    if (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : "Could not sign in. Please check your connection and try again."
      );
    }
  });

  return (
    <div className="flex min-h-screen flex-col bg-navy-dark">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Link to="/" className="mx-auto flex items-center gap-2.5 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
            <LogIn className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-display text-lg font-bold">Bokaro Defence Academy</span>
        </Link>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white p-6 shadow-lift sm:p-8">
          <h1 className="font-display text-2xl font-extrabold text-navy">Student Login</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in with the email and password provided by the academy office.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && <p role="alert" className="mt-1 text-xs font-medium text-error">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="input pr-11"
                  placeholder="Your password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                </button>
              </div>
              {errors.password && <p role="alert" className="mt-1 text-xs font-medium text-error">{errors.password.message}</p>}
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Signing in…</>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/auth/forgot-password" className="font-semibold text-navy hover:underline">
              Forgot password?
            </Link>
            <Link to="/" className="text-muted hover:text-navy">
              ← Back to website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
