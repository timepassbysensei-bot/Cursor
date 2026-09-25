import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { AuthNotice, AuthShell } from "../../components/AuthShell";
import { Button, ButtonLink } from "../../components/ui/Button";
import { resendVerificationEmail } from "../../services/auth";
import { useSeo } from "../../hooks/useSeo";
import { isEmail } from "../../lib/utils";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSeo({
    title: "Verify your email — Arian",
    description: "Confirm your email address to finish setting up your account.",
    noIndex: true,
  });

  const onResend = async () => {
    setError(null);
    if (!isEmail(email)) {
      setError("Open this page from the verification email, or sign up again with your address.");
      return;
    }
    setBusy(true);
    try {
      await resendVerificationEmail(email);
      setResent(true);
    } catch {
      setError("The verification email could not be resent right now. Please try again in a minute.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Confirming your address keeps your account recoverable and lets Arian reply to you."
    >
      <div className="space-y-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10">
          <MailCheck className="h-6 w-6 text-cyan" aria-hidden />
        </span>

        <p className="text-sm leading-relaxed text-muted">
          {email ? (
            <>
              We are waiting on confirmation for <strong className="text-ink">{email}</strong>. Open the link in
              that email to finish.
            </>
          ) : (
            "Open the verification link from your email to finish confirming your address."
          )}
        </p>

        <AuthNotice tone="info">
          Confirming your email does not grant access on its own — client accounts also need Arian's approval, and
          you will see the status on your dashboard.
        </AuthNotice>

        {resent && <AuthNotice tone="success">Verification email sent again.</AuthNotice>}
        {error && <AuthNotice tone="error">{error}</AuthNotice>}

        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/login">Go to sign in</ButtonLink>
          <Button variant="outline" onClick={() => void onResend()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Resend verification email
          </Button>
        </div>

        <p className="flex items-start gap-2 border-t border-hairline pt-5 text-2xs leading-relaxed text-faint">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jade" aria-hidden />
          Still stuck?{" "}
          <Link to="/contact" className="text-cyan underline-offset-2 hover:underline">
            Contact Arian
          </Link>{" "}
          and the account can be sorted out from the studio.
        </p>
      </div>
    </AuthShell>
  );
}
