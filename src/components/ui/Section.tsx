import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * A page section. `aura` paints the animated gradient light that sits behind
 * major sections; it is always pointer-events-none and below the content.
 */
export function Section({
  children,
  className,
  id,
  ariaLabel,
  aura,
  auraClassName,
  bordered = true,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  ariaLabel?: string;
  aura?: "blue" | "violet" | "cyan" | "mixed";
  auraClassName?: string;
  bordered?: boolean;
}) {
  const auras = {
    blue: "bg-blue/20",
    violet: "bg-violet/18",
    cyan: "bg-cyan/16",
    mixed: "bg-gradient-to-br from-blue/20 via-violet/14 to-cyan/16",
  } as const;

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn("relative isolate overflow-hidden py-20 sm:py-24 lg:py-28", bordered && "border-t border-hairline", className)}
    >
      {aura && (
        <span
          aria-hidden
          className={cn(
            "aura animate-drift top-[-14rem] left-1/2 h-[26rem] w-[38rem] -translate-x-1/2",
            auras[aura],
            auraClassName
          )}
        />
      )}
      <div className="shell relative">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-12 flex flex-col gap-6",
        align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className={cn("eyebrow mb-4", align === "center" && "eyebrow-center justify-center")}>{eyebrow}</p>
        )}
        <h2 className="font-display text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-ink text-balance sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-[15px] leading-relaxed text-muted text-pretty">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function Panel({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li" | "aside";
}) {
  return <Tag className={cn("panel", className)}>{children}</Tag>;
}

type BadgeTone = "neutral" | "blue" | "cyan" | "violet" | "jade" | "coral" | "amber";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "border-white/12 bg-white/[0.05] text-muted",
  blue: "border-blue/30 bg-blue/10 text-blue",
  cyan: "border-cyan/30 bg-cyan/10 text-cyan",
  violet: "border-violet/30 bg-violet/10 text-violet",
  jade: "border-jade/30 bg-jade/10 text-jade",
  coral: "border-coral/30 bg-coral/10 text-coral",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-[0.12em]",
        BADGE_TONES[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Filter chip row used by the videos and gallery toolbars. */
export function FilterChips({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1", className)} role="group" aria-label={label}>
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={cn(
              "relative shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-200",
              active
                ? "border-cyan/50 bg-cyan/[0.12] text-ink"
                : "border-hairline bg-white/[0.02] text-muted hover:border-white/20 hover:text-ink"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
