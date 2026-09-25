import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "./Wordmark";
import { useSiteContent } from "../hooks/useSiteContent";
import { DEFAULT_SITE_CONTENT } from "../lib/siteContent";

/**
 * Split-screen auth shell: editorial branding on the left, the form on the
 * right. On mobile the branding collapses to a compact header so the form is
 * immediately reachable.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      <div className="grain-overlay" aria-hidden />

      {/* Branding panel */}
      <aside className="relative isolate hidden overflow-hidden border-r border-hairline bg-panel/60 lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-12">
        <span aria-hidden className="aura animate-drift left-[-6rem] top-[-6rem] h-[24rem] w-[28rem] bg-blue/22" />
        <span
          aria-hidden
          className="aura animate-drift bottom-[-8rem] right-[-6rem] h-[22rem] w-[26rem] bg-violet/20"
          style={{ animationDelay: "-8s" }}
        />

        <Link to="/" className="relative w-fit" aria-label={`${content.brandName} — home`}>
          <Wordmark name={content.brandName} subtitle="Gaming storyteller" size={42} />
        </Link>

        <div className="relative max-w-md">
          <p className="eyebrow mb-6">{content.heroEyebrow}</p>
          <p className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-ink text-balance">
            {content.heroStatement}
          </p>
          <p className="mt-5 text-sm leading-relaxed text-muted">{content.tagline}</p>
        </div>

        <p className="relative text-2xs uppercase tracking-[0.2em] text-faint">
          {content.aboutGames.join(" · ")} · Hindi
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4 lg:hidden">
          <Link to="/" aria-label={`${content.brandName} — home`}>
            <Wordmark name={content.brandName} size={34} />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
          <div className={wide ? "w-full max-w-lg" : "w-full max-w-md"}>
            <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-ink text-balance sm:text-3xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">{subtitle}</p>

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-8 border-t border-hairline pt-6">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

/** Compact inline messages used by every auth form. */
export function AuthNotice({ tone, children }: { tone: "success" | "error" | "info"; children: ReactNode }) {
  const tones = {
    success: "border-jade/25 bg-jade/[0.08] text-jade",
    error: "border-coral/25 bg-coral/[0.08] text-coral",
    info: "border-cyan/25 bg-cyan/[0.07] text-cyan",
  } as const;

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}
    >
      {children}
    </p>
  );
}
