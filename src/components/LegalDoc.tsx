import { Link } from "react-router-dom";
import { Reveal } from "./Reveal";
import { Panel } from "./ui/Section";

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

/**
 * Shared shell for the legal pages. These pages describe what the site
 * actually does — it does not track visitors with advertising cookies, and it
 * says so — and flags the parts Arian should review once the site is live.
 */
export function LegalDoc({
  title,
  intro,
  sections,
  links,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  links: { to: string; label: string }[];
}) {
  return (
    <div className="shell py-14 sm:py-20">
      <Reveal>
        <header className="max-w-3xl">
          <p className="eyebrow mb-5">Legal</p>
          <h1 className="font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.02em] text-ink text-balance sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-muted text-pretty">{intro}</p>
        </header>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-[0.3fr_1fr] lg:items-start">
        <nav aria-label="On this page" className="lg:sticky lg:top-24">
          <Panel className="p-5">
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-faint">On this page</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {sections.map((section, index) => (
                <li key={section.heading}>
                  <a
                    href={`#section-${index}`}
                    className="text-muted transition-colors hover:text-ink"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-2 border-t border-hairline pt-4 text-sm">
              {links.map((link) => (
                <p key={link.to}>
                  <Link to={link.to} className="text-cyan underline-offset-2 hover:underline">
                    {link.label}
                  </Link>
                </p>
              ))}
            </div>
          </Panel>
        </nav>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <Reveal key={section.heading} delay={index * 0.04}>
              <section id={`section-${index}`} className="scroll-mt-24">
                <h2 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
                  {section.heading}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-sm leading-relaxed text-muted">
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2.5">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan/70" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
