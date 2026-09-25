import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Loader2, MailCheck, Send } from "lucide-react";
import { AuthNotice, AuthShell } from "../../components/AuthShell";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { resetRequestSchema, type ResetRequestInput } from "../../validation/schemas";
import { requestPasswordReset } from "../../services/auth";
import { useSeo } from "../../hooks/useSeo";
import { errorMessage } from "../../lib/utils";

export default function ForgotPassword() {
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useSeo({
    title: "Reset your password — Arian",
    description: "Request a password reset link for your account.",
    noIndex: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestInput>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ResetRequestInput) => {
    setError(null);
    try {
      const { error: resetError } = await requestPasswordReset(values.email);
      if (resetError) throw resetError;
      setSent(values.email);
    } catch (caught) {
      setError(errorMessage(caught, "The reset email could not be sent. Please try again."));
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email you signed up with and we will send a link to set a new password."
      footer={
        <p className="text-sm text-muted">
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-cyan underline-offset-2 hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="space-y-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10">
            <MailCheck className="h-6 w-6 text-cyan" aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-muted">
            If an account exists for <strong className="text-ink">{sent}</strong>, a reset link is on its way. The
            link expires shortly, so use it soon.
          </p>
          <AuthNotice tone="info">
            Nothing arrived? Check the spam folder, then try again in a minute — reset emails are rate limited by
            the mail service.
          </AuthNotice>
          <Button variant="outline" onClick={() => setSent(null)}>
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label="Email" htmlFor="reset-email" error={errors.email?.message} required>
            <input
              id="reset-email"
              type="email"
              className="input"
              autoComplete="email"
              autoFocus
              {...register("email")}
            />
          </Field>

          {error && <AuthNotice tone="error">{error}</AuthNotice>}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden />
                Send reset link
              </>
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
