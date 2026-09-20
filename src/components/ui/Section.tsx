import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Section({
  children,
  className,
  tone = "offwhite",
  id,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  tone?: "offwhite" | "navy" | "cream" | "white" | "greenTint";
  id?: string;
  ariaLabel?: string;
}) {
  const tones: Record<string, string> = {
    offwhite: "bg-offwhite",
    navy: "bg-navy text-white",
    darknavy: "bg-navy-dark text-white",
    cream: "bg-cream text-ink",
    white: "bg-white",
    greenTint: "bg-green-academy/[0.06]",
  };
  return (
    <section id={id} aria-label={ariaLabel} className={cn("py-14 sm:py-16 lg:py-20", tones[tone], className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  tone = "dark",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10 max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "mb-3 text-xs font-semibold uppercase tracking-[0.18em]",
            tone === "light" ? "text-saffron-soft" : "text-saffron"
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl",
          tone === "light" ? "text-white" : "text-navy"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={cn("mt-4 text-base leading-relaxed", tone === "light" ? "text-white/70" : "text-muted")}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  return (
    <Tag className={cn("rounded-xl border border-lightgray bg-white shadow-card", className)}>
      {children}
    </Tag>
  );
}

export function Badge({
  children,
  tone = "navy",
  className,
}: {
  children: ReactNode;
  tone?: "navy" | "green" | "saffron" | "gray" | "red";
  className?: string;
}) {
  const tones: Record<string, string> = {
    navy: "bg-navy/[0.08] text-navy",
    green: "bg-green-success/10 text-green-success",
    saffron: "bg-saffron/10 text-saffron",
    gray: "bg-lightgray text-muted",
    red: "bg-error/10 text-error",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
