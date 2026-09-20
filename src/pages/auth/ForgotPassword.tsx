import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { resetRequestSchema, type ResetRequestInput } from "../../validation/schemas";
import { requestPasswordReset } from "../../services/auth";

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestInput>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const { error: err } = await requestPasswordReset(values.email);
    if (err) {
      setError("Could not send the reset email. Please try again.");
      return;
    }
    setSent(true);
  });

  return (
    <div className="flex min-h-screen flex-col bg-navy-dark">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-lift sm:p-8">
          <h1 className="font-display text-2xl font-extrabold text-navy">Forgot password</h1>
          {sent ? (
            <div className="mt-6 rounded-xl border border-green-success/25 bg-green-success/[0.06] p-6 text-center" role="status">
              <MailCheck className="mx-auto h-10 w-10 text-green-success" aria-hidden />
              <p className="mt-3 font-display text-base font-bold text-navy">Check your email</p>
              <p className="mt-1 text-sm text-muted">
                If the address is registered, a password reset link has been sent.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">
                Enter your registered email and we will send you a reset link.
              </p>
              <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
                <div>
                  <label htmlFor="fp-email" className="mb-1.5 block text-sm font-semibold text-ink">Email</label>
                  <input id="fp-email" type="email" className="input" placeholder="you@example.com" {...register("email")} />
                  {errors.email && <p role="alert" className="mt-1 text-xs font-medium text-error">{errors.email.message}</p>}
                </div>
                {error && (
                  <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending…</> : "Send Reset Link"}
                </Button>
              </form>
            </>
          )}
          <div className="mt-4 text-sm">
            <Link to="/auth/login" className="font-semibold text-navy hover:underline">← Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
