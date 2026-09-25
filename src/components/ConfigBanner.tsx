import { Database, X } from "lucide-react";
import { useState } from "react";
import { DEMO_MODE } from "../services/content";
import { isSupabaseConfigured } from "../lib/supabaseClient";

/**
 * Demo mode is a development convenience: it appears only when the dev server
 * runs without Supabase credentials (or an admin opts in via VITE_DEMO_MODE).
 * A production deployment without configuration shows nothing here — the
 * public pages render real empty states instead of sample content, and the
 * setup warning lives in the admin studio where it belongs.
 */
export function ConfigBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (!DEMO_MODE || dismissed) return null;

  return (
    <div className="relative border-b border-mint/25 bg-mint/[0.07]" role="status">
      <div className="shell flex items-start gap-3 py-2.5">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-jade" aria-hidden />
        <p className="flex-1 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink">Local demo mode.</span> This dev server is not
          connected to Supabase, so sample content is shown. Add{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-ink">VITE_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-ink">VITE_SUPABASE_ANON_KEY</code> to
          replace it with real content.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss demo notice"
          className="rounded-lg p-1.5 text-faint transition-colors hover:bg-white/5 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/**
 * Developer-facing misconfiguration notice. Rendered inside the admin studio
 * only — never on the public site.
 */
export function SetupWarning() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/[0.07] p-5" role="status">
      <p className="font-display text-sm font-semibold text-ink">Database not connected</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        The studio cannot reach Supabase, so counts read zero and nothing can be uploaded. Add{" "}
        <code className="rounded bg-white/10 px-1 py-0.5 text-ink">VITE_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-white/10 px-1 py-0.5 text-ink">VITE_SUPABASE_ANON_KEY</code>,
        run the migrations in <code className="rounded bg-white/10 px-1 py-0.5 text-ink">supabase/migrations/</code>,
        then reload.
      </p>
    </div>
  );
}
