import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn("flex min-h-[140px] items-center justify-center gap-3 text-muted", className)}
      role="status"
    >
      <Loader2 className="h-4 w-4 animate-spin text-cyan" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
  compact = false,
  className,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-surface/50 text-center",
        compact ? "gap-2 px-6 py-8" : "gap-3 px-6 py-14",
        className
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-white/[0.04]">
        {icon ?? <Inbox className="h-5 w-5 text-faint" aria-hidden />}
      </span>
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-md text-sm leading-relaxed text-muted">{hint}</p>}
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
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
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-coral/25 bg-coral/[0.06] px-6 py-10 text-center"
    >
      <AlertTriangle className="h-6 w-6 text-coral" aria-hidden />
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-md text-sm leading-relaxed text-muted">{hint}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-xl border border-hairline px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-cyan/50 hover:bg-cyan/[0.06]"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Try again
        </button>
      )}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full", className)} aria-hidden />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("panel overflow-hidden p-4", className)} aria-hidden>
      <SkeletonBlock className="h-40 w-full rounded-xl" />
      <SkeletonBlock className="mt-4 h-4 w-3/4" />
      <SkeletonBlock className="mt-2 h-3 w-1/2" />
    </div>
  );
}

export function SkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)} role="status" aria-label="Loading content">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Thin progress bar used by uploads and quota meters. */
export function ProgressBar({
  value,
  label,
  tone = "cyan",
  className,
}: {
  value: number;
  label?: string;
  tone?: "cyan" | "jade" | "coral";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const tones = {
    cyan: "bg-gradient-to-r from-blue to-cyan",
    jade: "bg-jade",
    coral: "bg-coral",
  } as const;

  return (
    <div className={className}>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-300 ease-out", tones[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {label && <p className="mt-1.5 text-2xs text-faint">{label}</p>}
    </div>
  );
}
