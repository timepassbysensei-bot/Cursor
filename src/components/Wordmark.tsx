import { cn } from "../lib/utils";

/**
 * Arian's wordmark.
 *
 * The mark is an original letterform "A" drawn with two strokes inside a
 * hairline tile — deliberately not a copy of any platform logo or badge, and
 * deliberately not a stock icon.
 */
export function WordmarkMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-hairline bg-gradient-to-br from-white/[0.09] to-white/[0.02]",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden focusable="false">
        <defs>
          <linearGradient id="arian-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#52D6E8" />
            <stop offset="0.55" stopColor="#5E9FE8" />
            <stop offset="1" stopColor="#9B7CFF" />
          </linearGradient>
        </defs>
        <g
          fill="none"
          stroke="url(#arian-mark)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11.5 29.5 L20 10.5 L28.5 29.5" />
          <path d="M15.4 23 H24.6" />
        </g>
      </svg>
    </span>
  );
}

export function Wordmark({
  name,
  className,
  subtitle,
  size = 36,
  compact = false,
}: {
  name: string;
  className?: string;
  subtitle?: string;
  size?: number;
  compact?: boolean;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <WordmarkMark size={size} />
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate font-display text-[15px] font-semibold leading-tight tracking-tight text-ink">
            {name}
          </span>
          {subtitle && (
            <span className="block truncate text-2xs font-medium uppercase tracking-[0.18em] text-faint">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
