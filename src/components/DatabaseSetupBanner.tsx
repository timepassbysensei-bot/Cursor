import { Database } from "lucide-react";
import { isSupabaseConfigured } from "../lib/supabaseClient";

/**
 * Renders only while the deployment has no Supabase credentials. It explains
 * why public sections look empty and what to set, instead of leaving staff
 * staring at blank content.
 */
export function DatabaseSetupBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="border-b border-saffron/30 bg-saffron-pale" role="status">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5 text-xs sm:px-6 lg:px-8">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-saffron" aria-hidden />
        <p className="text-ink">
          <span className="font-semibold">Setup needed:</span> this site is not connected to its
          database yet. Add <code className="rounded bg-white/70 px-1">VITE_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-white/70 px-1">VITE_SUPABASE_ANON_KEY</code> in
          Settings&nbsp;→&nbsp;Environment, then reload. Until then, public sections show their empty
          states.
        </p>
      </div>
    </div>
  );
}
