import type { ReactNode } from "react";
import { Loader2, Inbox, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center gap-3 text-muted" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  compact = false,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  compact?: boolean;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-lightgray bg-white text-center",
        compact ? "gap-2 px-6 py-8" : "gap-3 px-6 py-14"
      )}
    >
      {icon ?? <Inbox className="h-8 w-8 text-muted/60" aria-hidden />}
      <p className="font-display text-base font-semibold text-navy">{title}</p>
      {hint && <p className="max-w-md text-sm text-muted">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  hint,
  onRetry,
}: {
  title?: string;
  hint?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-error/20 bg-error/[0.04] px-6 py-10 text-center"
    >
      <AlertTriangle className="h-8 w-8 text-error" aria-hidden />
      <p className="font-display text-base font-semibold text-error">{title}</p>
      {hint && <p className="max-w-md text-sm text-muted">{hint}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg border border-navy/25 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/[0.04]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Try again
        </button>
      )}
    </div>
  );
}
