import { Bot, Compass, Lock, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { useSeo } from "../../hooks/useSeo";
import { useSiteContent } from "../../hooks/useSiteContent";
import { DEFAULT_SITE_CONTENT } from "../../lib/siteContent";
import { AssistantConversation } from "../../components/Assistant";
import { Panel } from "../../components/ui/Section";
import { Reveal } from "../../components/Reveal";

const SCOPE = [
  "Arian, and what the channel is about",
  "The games Arian covers and the videos he makes",
  "How the gallery, dashboard and this website work",
  "Sponsorship, permissions and how to get in touch",
];

const OUT_OF_SCOPE = [
  "General knowledge or homework questions",
  "Anything that is not about Arian or this website",
  "Personal details about Arian — the assistant will not invent any",
  "Decisions that need Arian himself, like a sponsorship agreement",
];

export default function Chat() {
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();

  useSeo({
    title: `Arian Assistant — ${content.brandName}`,
    description:
      "Arian Assistant answers questions about Arian, the channel, the games covered here, this website and sponsorship. Built by Arian for this site.",
  });

  return (
    <div className="shell py-14 sm:py-20">
      <Reveal>
        <header className="max-w-3xl">
          <p className="eyebrow mb-5">Arian Assistant</p>
          <h1 className="font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.02em] text-ink text-balance sm:text-5xl">
            Ask about the channel, and get an answer grounded in it.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-muted text-pretty">
            The assistant knows this website and the games Arian covers — nothing more. If a question is outside
            that, it will say so rather than guess.
          </p>
        </header>
      </Reveal>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <Reveal>
          <Panel className="flex h-[min(78vh,42rem)] flex-col overflow-hidden p-0">
            <AssistantConversation
              intro={content.chatbotIntro}
              suggestions={content.chatbotSuggestions}
              disclaimer={content.chatbotDisclaimer}
            />
          </Panel>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="space-y-5">
            <Panel className="p-6">
              <Bot className="h-5 w-5 text-cyan" aria-hidden />
              <h2 className="mt-4 font-display text-base font-semibold text-ink">What it can answer</h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted">
                {SCOPE.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                    {item}
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel className="p-6">
              <ShieldAlert className="h-5 w-5 text-violet" aria-hidden />
              <h2 className="mt-4 font-display text-base font-semibold text-ink">What it will not do</h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted">
                {OUT_OF_SCOPE.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet" />
                    {item}
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel className="p-6">
              <Lock className="h-5 w-5 text-jade" aria-hidden />
              <h2 className="mt-4 font-display text-base font-semibold text-ink">How it is built</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Answers come from Arian's own written notes, held in the site database and served through a secure
                serverless function. The AI key lives on the server and is never exposed to the browser, and
                questions are rate limited.
              </p>
              <p className="mt-4 text-2xs leading-relaxed text-faint">{content.chatbotDisclaimer}</p>
            </Panel>

            <Panel className="p-6">
              <Compass className="h-5 w-5 text-blue" aria-hidden />
              <h2 className="mt-4 font-display text-base font-semibold text-ink">Need a real answer?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                The assistant is helpful, not official. For anything that matters, message Arian directly.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to="/contact"
                  className="inline-flex h-9 items-center rounded-xl bg-gradient-to-r from-blue to-cyan px-3.5 text-xs font-semibold text-base"
                >
                  Contact Arian
                </Link>
                <Link
                  to="/sponsor"
                  className="inline-flex h-9 items-center rounded-xl border border-hairline px-3.5 text-xs font-semibold text-ink transition-colors hover:border-cyan/50"
                >
                  Sponsorship
                </Link>
              </div>
            </Panel>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
