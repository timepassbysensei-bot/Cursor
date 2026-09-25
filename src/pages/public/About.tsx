import { Compass, Gamepad2, Quote, Youtube } from "lucide-react";
import { useSeo } from "../../hooks/useSeo";
import { useSiteContent } from "../../hooks/useSiteContent";
import { DEFAULT_SITE_CONTENT } from "../../lib/siteContent";
import { safeExternal } from "../../lib/utils";
import { youtubeChannelUrl } from "../../lib/supabaseClient";
import { ButtonLink } from "../../components/ui/Button";
import { Badge, Panel, Section, SectionHeading } from "../../components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "../../components/Reveal";
import { Wordmark } from "../../components/Wordmark";

const CONTENT_KINDS = [
  { label: "Lore", body: "The history and world-building behind the story you are already playing." },
  { label: "Story explanations", body: "Questlines and cutscenes unpacked in order, without skipping the why." },
  { label: "Character builds", body: "What to level, what to skip, and the reasoning behind each choice." },
  { label: "Beginner guides", body: "First-week guidance written for someone starting from zero." },
  { label: "Patch & updates", body: "What actually changed after an update, and how it affects your account." },
  { label: "Reactions", body: "First impressions on reveals, trailers and new regions." },
];

export default function About() {
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();

  useSeo({
    title: `About ${content.brandName}`,
    description: content.aboutIntro,
  });

  const channelUrl = safeExternal(content.socialYouTube) ?? youtubeChannelUrl;

  return (
    <>
      <div className="shell py-14 sm:py-20">
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="eyebrow mb-5">About</p>
              <h1 className="font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.02em] text-ink text-balance sm:text-5xl">
                Gaming stories, told the slow way.
              </h1>
              <p className="mt-6 text-[15px] leading-relaxed text-muted text-pretty">{content.aboutIntro}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-muted text-pretty">
                {content.aboutIdentity}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                {content.aboutGames.map((game) => (
                  <Badge key={game} tone="blue" icon={<Gamepad2 className="h-3 w-3" aria-hidden />}>
                    {game}
                  </Badge>
                ))}
                <Badge tone="neutral">Hindi</Badge>
                <Badge tone="neutral">Long-form &amp; Shorts</Badge>
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink to={channelUrl} external size="lg">
                  <Youtube className="h-4 w-4" aria-hidden />
                  Watch on YouTube
                </ButtonLink>
                <ButtonLink to="/videos" variant="outline" size="lg">
                  Browse the video library
                </ButtonLink>
              </div>
            </div>

            {/* Avatar / identity card. A placeholder, never a stock photo. */}
            <Panel className="relative overflow-hidden p-7">
              <span aria-hidden className="aura right-[-5rem] top-[-5rem] h-56 w-56 bg-violet/22" />
              <div className="relative flex items-center gap-4">
                <WordmarkMarkLarge />
                <div>
                  <p className="font-display text-lg font-semibold text-ink">{content.brandName}</p>
                  <p className="text-2xs uppercase tracking-[0.18em] text-faint">Gaming storyteller</p>
                </div>
              </div>

              <dl className="mt-7 space-y-4 border-t border-hairline pt-6 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Covers</dt>
                  <dd className="text-right font-medium text-ink">{content.aboutGames.join(" · ")}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Language</dt>
                  <dd className="text-right font-medium text-ink">Hindi</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Focus</dt>
                  <dd className="text-right font-medium text-ink">Lore, builds, beginner guides</dd>
                </div>
              </dl>

              <p className="mt-6 border-t border-hairline pt-5 text-xs leading-relaxed text-faint">
                Arian's profile picture is uploaded from the admin studio. Until then this original wordmark
                stands in — no stock photography is used anywhere on this site.
              </p>
            </Panel>
          </div>
        </Reveal>
      </div>

      {/* ------------------------------------------------------- what Arian makes */}
      <Section aura="cyan" ariaLabel="Content categories">
        <SectionHeading
          eyebrow="What Arian makes"
          title="Six kinds of video, one idea behind all of them."
          subtitle="Understanding what you are playing — the story it tells and the systems under it."
        />
        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENT_KINDS.map((kind) => (
            <RevealItem key={kind.label}>
              <article className="card-hover h-full rounded-2xl border border-hairline bg-surface/60 p-6">
                <h3 className="font-display text-base font-semibold text-ink">{kind.label}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{kind.body}</p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
        <p className="mt-6 text-xs text-faint">
          Editable from the studio — the list above is managed in <strong>Admin → Settings</strong>.
        </p>
      </Section>

      {/* -------------------------------------------------------------- journey */}
      <Section aura="violet" ariaLabel="Creator journey">
        <SectionHeading
          eyebrow="The journey"
          title="How the channel grew, one explanation at a time."
          subtitle="Editable in the studio, so Arian can keep this timeline honest as it continues."
        />
        <ol className="relative space-y-8 border-l border-hairline pl-6 sm:pl-10">
          {content.aboutTimeline.map((entry, index) => (
            <RevealItem key={`${entry.year}-${index}`}>
              <li className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[1.9rem] top-1.5 h-3 w-3 rounded-full border border-cyan/50 bg-base sm:-left-[3.15rem]"
                />
                <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-cyan">{entry.year}</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-ink">{entry.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{entry.body}</p>
              </li>
            </RevealItem>
          ))}
        </ol>
      </Section>

      {/* -------------------------------------------------------- Arian's message */}
      <Section ariaLabel="A message from Arian">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-hairline bg-surface/60 p-8 sm:p-12">
            <span aria-hidden className="aura left-[-5rem] top-[-6rem] h-64 w-64 bg-cyan/16" />
            <Quote className="h-6 w-6 text-cyan/70" aria-hidden />
            <blockquote className="relative mt-6 max-w-3xl">
              <p className="whitespace-pre-wrap font-display text-xl leading-relaxed tracking-tight text-ink/95 text-pretty sm:text-2xl">
                {content.aboutMessage}
              </p>
              <footer className="mt-6 text-sm text-muted">— {content.brandName}</footer>
            </blockquote>
          </div>
        </Reveal>
      </Section>

      {/* ------------------------------------------------------------- closing */}
      <Section ariaLabel="Get in touch" bordered={false}>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Youtube,
              title: "Watch the channel",
              body: "Every video lives on YouTube.",
              to: channelUrl,
              external: true,
              cta: "Open YouTube",
            },
            {
              icon: Compass,
              title: "Explore the gallery",
              body: "Artwork and screenshots from the videos.",
              to: "/gallery",
              external: false,
              cta: "View gallery",
            },
            {
              icon: Gamepad2,
              title: "Work together",
              body: "Sponsorship enquiries go straight to Arian.",
              to: "/sponsor",
              external: false,
              cta: "Sponsor Arian",
            },
          ].map((card) => (
            <Panel key={card.title} className="flex h-full flex-col p-6">
              <card.icon className="h-5 w-5 text-cyan" aria-hidden />
              <h2 className="mt-4 font-display text-base font-semibold text-ink">{card.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{card.body}</p>
              <ButtonLink
                to={card.to}
                external={card.external}
                variant="outline"
                size="sm"
                className="mt-5 self-start"
              >
                {card.cta}
              </ButtonLink>
            </Panel>
          ))}
        </div>
      </Section>
    </>
  );
}

/**
 * A large version of the wordmark used as the placeholder avatar slot.
 * Deliberately abstract: no invented photograph of Arian is ever shown.
 */
function WordmarkMarkLarge() {
  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-hairline bg-gradient-to-br from-blue/20 to-violet/20">
      <Wordmark name="" compact size={40} />
    </span>
  );
}
