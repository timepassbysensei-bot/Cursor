import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";

export default function VerifyEmail() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-dark px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 text-center shadow-lift">
        <MailCheck className="mx-auto h-12 w-12 text-green-success" aria-hidden />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-navy">Verify your email</h1>
        <p className="mt-2 text-sm text-muted">
          We have sent a verification link to your email address. Please verify to activate your account.
        </p>
        <Link to="/auth/login" className="mt-6 inline-block font-semibold text-navy hover:underline">
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
