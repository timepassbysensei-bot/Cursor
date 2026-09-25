import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Small numeric/stat tile used on both dashboards. */
export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "cyan",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "cyan" | "blue" | "violet" | "jade" | "coral" | "amber";
}) {
  const tones = {
    cyan: "text-cyan",
    blue: "text-blue",
    violet: "text-violet",
    jade: "text-jade",
    coral: "text-coral",
    amber: "text-amber-300",
  } as const;

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-faint">{label}</p>
        {icon && <span className={tones[tone]}>{icon}</span>}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-1.5 text-2xs leading-relaxed text-faint">{hint}</p>}
    </div>
  );
}
