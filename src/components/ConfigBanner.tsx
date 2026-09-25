import { useState } from "react";
import { Database, X } from "lucide-react";
import { DEMO_MODE } from "../services/content";

/**
 * Renders only while the deployment has no Supabase credentials. It explains
 * why the content is sample content instead of leaving Arian staring at an
 * empty site or a stack of failed requests.
 */
export function ConfigBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (!DEMO_MODE || dismissed) return null;

  return (
    <div className="relative border-b border-blue/25 bg-blue/[0.09]" role="status">
      <div className="shell flex items-start gap-3 py-2.5">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden />
        <p className="flex-1 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink">Demo mode.</span> This site is not connected to its
          database yet, so everything below is sample content. Add{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-ink">VITE_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-ink">VITE_SUPABASE_ANON_KEY</code>, run
          the Supabase migrations, and your own videos, gallery and messages take over.
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
