import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * A page section. `aura` paints the animated gradient light that sits behind
 * major sections; it is always pointer-events-none and below the content.
 * Moods tint the light: `mint`/`gold` are Genshin-botanical, `cyan`/`violet`
 * are Wuthering-Atmospheric.
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
  aura?: "mint" | "gold" | "cyan" | "violet" | "mixed";
  auraClassName?: string;
  bordered?: boolean;
}) {
  const auras = {
    mint: "bg-mint/16",
    gold: "bg-gold/14",
    cyan: "bg-cyan/16",
    violet: "bg-violet/16",
    mixed: "bg-gradient-to-br from-mint/14 via-cyan/12 to-violet/14",
  } as const;

  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(
        "relative isolate overflow-hidden py-20 sm:py-24 lg:py-28",
        bordered && "border-t border-hairline",
        className
      )}
    >
      {aura && (
        <span
          aria-hidden
          className={cn(
            "aura animate-aurora top-[-14rem] left-1/2 h-[26rem] w-[38rem] -translate-x-1/2",
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
  mood = "cyan",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
  action?: ReactNode;
  mood?: "cyan" | "mint" | "gold" | "violet";
}) {
  const eyebrowMoodClass = {
    cyan: "",
    mint: "eyebrow-mint",
    gold: "eyebrow-gold",
    violet: "eyebrow-violet",
  }[mood];

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
          <p className={cn("eyebrow mb-4", align === "center" && "eyebrow-center justify-center", eyebrowMoodClass)}>
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-ink text-balance sm:text-4xl">
          {title}
        </h2>
        {subtitle && <p className="mt-4 text-[15px] leading-relaxed text-muted text-pretty">{subtitle}</p>}
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

type BadgeTone = "neutral" | "blue" | "ocean" | "cyan" | "violet" | "jade" | "mint" | "coral" | "amber" | "gold";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "border-white/12 bg-white/[0.05] text-muted",
  blue: "border-cyan/30 bg-cyan/10 text-cyan",
  ocean: "border-ocean/30 bg-ocean/10 text-ocean",
  cyan: "border-cyan/30 bg-cyan/10 text-cyan",
  violet: "border-violet/30 bg-violet/10 text-violet",
  jade: "border-jade/30 bg-jade/10 text-jade",
  mint: "border-mint/30 bg-mint/10 text-mint",
  coral: "border-coral/30 bg-coral/10 text-coral",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  gold: "border-gold/30 bg-gold/10 text-gold",
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

/** Styled native select — the mobile-safe filter control (native picker UI). */
export function FilterSelect({
  label,
  options,
  value,
  onChange,
  id,
  className,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (next: string) => void;
  id: string;
  className?: string;
}) {
  return (
    <label htmlFor={id} className={cn("block", className)}>
      <span className="mb-1.5 block text-2xs font-semibold uppercase tracking-[0.18em] text-faint">{label}</span>
      <span className="relative block">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="input w-full appearance-none pr-9">
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
        />
      </span>
    </label>
  );
}

/**
 * Filter chip row for wide screens. On phones the videos page swaps these for
 * `FilterSelect` dropdowns; wherever chips still appear they wrap instead of
 * scrolling sideways, so nothing can escape the viewport.
 */
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
    <div className={cn("flex flex-wrap gap-2", className)} role="group" aria-label={label}>
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-200",
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
