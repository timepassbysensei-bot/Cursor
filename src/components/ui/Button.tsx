import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

type Variant = "primary" | "navy" | "outline" | "outlineLight" | "ghost" | "whatsapp" | "danger";
type Size = "sm" | "md" | "lg";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-display font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron";

const variants: Record<Variant, string> = {
  primary:
    "bg-saffron text-white hover:bg-saffron/90 shadow-sm active:scale-[0.99]",
  navy: "bg-navy text-white hover:bg-navy-mid shadow-sm active:scale-[0.99]",
  outline:
    "border border-navy/25 bg-white text-navy hover:border-navy hover:bg-navy/[0.04]",
  outlineLight:
    "border border-white/40 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
  ghost: "text-navy hover:bg-navy/[0.06]",
  whatsapp: "bg-[#1FA855] text-white hover:bg-[#178a44]",
  danger: "bg-error text-white hover:bg-error/90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm sm:text-[15px]",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
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
  const cls = cn(base, variants[variant], sizes[size], className);
  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={cls} {...rest}>
      {children}
    </Link>
  );
}
