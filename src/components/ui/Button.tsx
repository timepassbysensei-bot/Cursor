import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-xl font-display font-semibold tracking-tight transition-all duration-200 ease-editorial active:scale-[0.975] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-blue to-cyan text-base shadow-[0_10px_36px_-14px_rgba(82,214,232,0.75)] hover:brightness-110",
  secondary: "glass text-ink hover:border-white/25 hover:bg-white/[0.07]",
  outline: "border border-hairline bg-transparent text-ink hover:border-cyan/50 hover:bg-cyan/[0.06]",
  ghost: "text-muted hover:bg-white/[0.06] hover:text-ink",
  danger: "bg-coral/90 text-base hover:bg-coral",
  success: "bg-jade/90 text-base hover:bg-jade",
};

const sizes: Record<Size, string> = {
  // Every size keeps a 44px minimum tap target on touch screens.
  sm: "h-9 min-h-[36px] px-3.5 text-xs sm:text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  to,
  variant = "primary",
  size = "md",
  className,
  children,
  external,
  ...rest
}: CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    to: string;
    external?: boolean;
  }) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={classes} {...rest}>
      {children}
    </Link>
  );
}

/** Small square icon button used across the studio toolbars. */
export function IconButton({
  label,
  children,
  className,
  variant = "secondary",
  ...rest
}: { label: string; children: ReactNode; variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        base,
        variants[variant],
        "h-9 w-9 shrink-0 p-0",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
