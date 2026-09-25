import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowRight, Bot, Clapperboard, Gamepad2, Handshake, Languages, Layers, Sparkles, Youtube } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useSeo } from "../../hooks/useSeo";
import { useLiveClock } from "../../hooks/useLiveClock";
import { useSiteContent } from "../../hooks/useSiteContent";
import { fetchFeaturedVideo, fetchPublishedGallery, fetchPublishedVideos } from "../../services/content";
import { youtubeChannelUrl } from "../../lib/supabaseClient";
import { DEFAULT_SITE_CONTENT } from "../../lib/siteContent";
import { safeExternal } from "../../lib/utils";
import { ButtonLink } from "../../components/ui/Button";
import { Section, SectionHeading, Badge } from "../../components/ui/Section";
import { ErrorState, SkeletonGrid } from "../../components/ui/States";
import { Reveal, RevealGroup, RevealItem } from "../../components/Reveal";
import { HeroBackdrop } from "../../components/HeroBackdrop";
import { QuickAccess } from "../../components/QuickAccess";
import { VideoCard } from "../../components/VideoCard";
import { GalleryGrid, Lightbox } from "../../components/GalleryGrid";
import { GAMES } from "../../lib/options";

const PILLARS = [
  {
    icon: Clapperboard,
    title: "Lore, explained",
    body: "The history, the regions and the story beats that sit behind the questline — told in order, so it finally clicks.",
    mood: "mint" as const,
  },
  {
    icon: Layers,
    title: "Builds that work",
    body: "Character guides and build breakdowns that explain why the pieces fit together, not just which numbers to copy.",
    mood: "cyan" as const,
  },
  {
    icon: Sparkles,
    title: "Spend with a plan",
    body: "Banner and pull advice before you commit your wishes or your pulls, weighed up honestly.",
    mood: "gold" as const,
  },
  {
    icon: Languages,
    title: "In Hindi",
    body: "Every video is made in Hindi, for players who want the story without fighting a language barrier.",
    mood: "violet" as const,
  },
];

const PILLAR_MOODS = {
  mint: "border-mint/30 bg-gradient-to-br from-mint/18 to-jade/8 text-mint",
  cyan: "border-cyan/30 bg-gradient-to-br from-cyan/18 to-ocean/8 text-cyan",
  gold: "border-gold/30 bg-gradient-to-br from-gold/18 to-cream/8 text-gold",
  violet: "border-violet/30 bg-gradient-to-br from-violet/18 to-lavender/8 text-violet",
} as const;

export default function Home() {
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();
  const videosQuery = useQuery({ queryKey: ["public-videos"], queryFn: fetchPublishedVideos });
  const featuredQuery = useQuery({ queryKey: ["featured-video"], queryFn: fetchFeaturedVideo });
  const galleryQuery = useQuery({ queryKey: ["public-gallery"], queryFn: fetchPublishedGallery });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const clock = useLiveClock();

  useSeo({
    title: content.seoTitle,
    description: content.seoDescription,
    image: safeExternal(content.ogImageUrl),
  });

  const channelUrl = safeExternal(content.socialYouTube) ?? youtubeChannelUrl;
  const videos = videosQuery.data ?? [];
  const latest = videos.slice(0, 6);
  const featured = featuredQuery.data ?? videos.find((video) => video.is_featured) ?? videos[0] ?? null;
  const gallery = (galleryQuery.data ?? []).slice(0, 6);

  return (
    <>
      {/* ------------------------------------------------------------- hero */}
      <section className="relative isolate overflow-hidden pb-20 pt-14 sm:pb-28 sm:pt-20 lg:pb-36">
        <HeroBackdrop />

        <div className="shell relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <Reveal>
              <p className="eyebrow eyebrow-mint">{content.heroEyebrow}</p>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-6 font-display text-[3.25rem] font-semibold leading-[0.95] tracking-[-0.03em] text-ink sm:text-7xl lg:text-[5.25rem]">
                {content.heroTitle}
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-6 max-w-xl font-display text-xl leading-snug tracking-tight text-balance sm:text-2xl">
                <span className="text-gradient-mint">{content.heroStatement}</span>
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted text-pretty">
                {content.heroDescription}
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink to={channelUrl} external size="lg" variant="secondary" className="border-coral/40 hover:border-coral hover:bg-coral/10">
                  <Youtube className="h-4 w-4 text-coral" aria-hidden />
                  {content.heroPrimaryCta}
                </ButtonLink>
                <ButtonLink to="/sponsor" size="lg">
                  <Handshake className="h-4 w-4" aria-hidden />
                  Sponsor Arian
                </ButtonLink>
                <ButtonLink to="/gallery" variant="outline" size="lg">
                  Gallery
                </ButtonLink>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6 border-t border-hairline pt-8 sm:grid-cols-3">
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.2em] text-faint">Games covered</dt>
                  <dd className="mt-2 font-display text-sm font-semibold text-ink">{GAMES.join(" · ")}</dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.2em] text-faint">Language</dt>
                  <dd className="mt-2 font-display text-sm font-semibold text-ink">Hindi</dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-[0.2em] text-faint">Local time</dt>
                  <dd className="mt-2 font-display text-sm font-semibold tabular-nums text-ink">
                    <span suppressHydrationWarning>
                      {clock.ready ? (
                        <>
                          {clock.time}
                          <span className="ml-2 text-2xs font-normal text-faint">{clock.zone}</span>
                        </>
                      ) : (
                        "--:--"
                      )}
                    </span>
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>

          {/* Featured content card */}
          <Reveal delay={0.14} y={reduced ? 0 : 28}>
            <div className="relative">
              <span
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-mint/16 via-cyan/12 to-violet/14 blur-2xl"
              />
              {featuredQuery.isLoading ? (
                <div className="panel overflow-hidden p-0">
                  <div className="skeleton aspect-video w-full" />
                  <div className="space-y-3 p-6">
                    <div className="skeleton h-5 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
              ) : featured ? (
                <>
                  <VideoCard video={featured} variant="feature" />
                  <p className="mt-4 flex items-center gap-2 text-2xs uppercase tracking-[0.18em] text-faint">
                    <Sparkles className="h-3 w-3 text-gold" aria-hidden />
                    Featured on the channel
                  </p>
                </>
              ) : (
                <div className="panel p-8 text-center">
                  <p className="font-display text-lg font-semibold text-ink">The next video will land here.</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Add a YouTube link in the studio and mark it featured — it appears on the homepage instantly.
                  </p>
                  <ButtonLink to="/videos" variant="outline" size="sm" className="mt-5">
                    Browse videos
                  </ButtonLink>
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {/* Animated scroll indicator */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center sm:flex">
          <motion.span
            aria-hidden
            animate={reduced ? undefined : { y: [0, 8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-faint"
          >
            <ArrowDown className="h-4 w-4" />
          </motion.span>
        </div>
      </section>

      {/* ----------------------------------------------------- quick access */}
      <section aria-label="Quick access" className="relative z-10 -mt-8 pb-4 sm:-mt-10">
        <div className="shell">
          <QuickAccess />
        </div>
      </section>

      {/* ---------------------------------------------------------- pillars */}
      <Section aura="mint" ariaLabel="What Arian makes">
        <SectionHeading
          mood="mint"
          eyebrow="What you will find here"
          title="Story first, mechanics second — and both explained properly."
          subtitle="Four kinds of videos, one through-line: understanding the game you are already playing."
        />
        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <RevealItem key={pillar.title}>
              <article className="card-hover h-full rounded-2xl border border-hairline bg-surface/60 p-6">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${PILLAR_MOODS[pillar.mood]}`}>
                  <pillar.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-base font-semibold text-ink">{pillar.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{pillar.body}</p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* ----------------------------------------------------- about preview */}
      <Section aura="gold" ariaLabel="About Arian">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div>
            <p className="eyebrow eyebrow-gold mb-5">About</p>
            <h2 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-ink text-balance sm:text-4xl">
              The worlds behind the screen, told patiently.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-muted text-pretty">{content.aboutIntro}</p>
            <p className="mt-4 text-[15px] leading-relaxed text-muted text-pretty">{content.aboutIdentity}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {content.aboutCategories.slice(0, 6).map((category) => (
                <Badge key={category} tone="gold">
                  {category}
                </Badge>
              ))}
            </div>
            <ButtonLink to="/about" variant="outline" className="mt-9">
              Read the full story
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {content.aboutGames.map((game, index) => (
              <article key={game} className="panel relative overflow-hidden p-6" style={{ minHeight: 200 }}>
                <span
                  aria-hidden
                  className={`aura top-[-4rem] right-[-3rem] h-40 w-40 ${index === 0 ? "bg-mint/22" : "bg-cyan/22"}`}
                />
                <Gamepad2 className="h-5 w-5 text-jade" aria-hidden />
                <p className="mt-4 font-display text-lg font-semibold text-ink">{game}</p>
                <p className="mt-2 text-2xs uppercase tracking-[0.16em] text-faint">
                  {index === 0 ? "Lore · Builds · Banners" : "Guides · Story · Reactions"}
                </p>
              </article>
            ))}
            <article className="panel p-6 sm:col-span-2">
              <p className="eyebrow eyebrow-mint mb-3">On the channel</p>
              <p className="text-sm leading-relaxed text-muted">
                Long-form breakdowns for the big questions, and Shorts for the details you only need sixty
                seconds with.
              </p>
            </article>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------ latest videos */}
      <Section aura="cyan" ariaLabel="Latest videos">
        <SectionHeading
          eyebrow="Latest from the channel"
          title="New videos, straight from YouTube."
          subtitle="Every card opens the real video in a new tab."
          action={
            <ButtonLink to="/videos" variant="outline" size="sm">
              View all videos
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </ButtonLink>
          }
        />

        {videosQuery.isLoading ? (
          <SkeletonGrid count={3} />
        ) : videosQuery.isError ? (
          <ErrorState
            title="Videos could not load"
            hint="The video list did not come back. Check the connection and try again."
            onRetry={() => void videosQuery.refetch()}
          />
        ) : latest.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/12 bg-surface/50 px-6 py-14 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-white/[0.04]">
              <Youtube className="h-5 w-5 text-jade" aria-hidden />
            </span>
            <p className="mt-4 font-display text-lg font-semibold text-ink">Arian's next video will appear here.</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Nothing has been published yet — once a video goes live, it shows up here with its real thumbnail.
            </p>
            <ButtonLink to={channelUrl} external className="mt-6">
              <Youtube className="h-4 w-4" aria-hidden />
              Open Arian's YouTube channel
            </ButtonLink>
          </div>
        ) : (
          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((video) => (
              <RevealItem key={video.id}>
                <VideoCard video={video} className="h-full" />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </Section>

      {/* --------------------------------------------------- featured message */}
      {content.featuredMessageActive && (
        <Section ariaLabel="A message from Arian" className="py-16 sm:py-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-surface/90 via-surface/60 to-elevated/70 p-8 sm:p-12">
              <span aria-hidden className="aura left-[-6rem] top-[-8rem] h-72 w-72 bg-gold/16" />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
              />
              <div className="relative max-w-3xl">
                <p className="eyebrow eyebrow-gold mb-5">A message from {content.brandName}</p>
                <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight text-ink text-balance sm:text-[2rem]">
                  {content.featuredMessageTitle}
                </h2>
                <p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-muted text-pretty">
                  {content.featuredMessageBody}
                </p>
              </div>
            </div>
          </Reveal>
        </Section>
      )}

      {/* ---------------------------------------------------------- gallery */}
      <Section aura="violet" ariaLabel="Gallery preview">
        <SectionHeading
          mood="violet"
          eyebrow="Gallery"
          title="Artwork, screenshots and moments worth keeping."
          subtitle="Only images Arian has the rights to publish — uploaded straight from the studio."
          action={
            <ButtonLink to="/gallery" variant="outline" size="sm">
              Open the gallery
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </ButtonLink>
          }
        />

        {galleryQuery.isLoading ? (
          <SkeletonGrid count={3} />
        ) : gallery.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/12 bg-surface/50 px-6 py-14 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-white/[0.04]">
              <Gamepad2 className="h-5 w-5 text-violet" aria-hidden />
            </span>
            <p className="mt-4 font-display text-lg font-semibold text-ink">The gallery is being prepared.</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Arian is choosing what to publish here — check back soon.
            </p>
            <ButtonLink to="/gallery" variant="outline" size="sm" className="mt-6">
              Visit the gallery page
            </ButtonLink>
          </div>
        ) : (
          <GalleryGrid items={gallery} onOpen={setLightboxIndex} />
        )}
      </Section>

      <Lightbox
        items={gallery}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />

      {/* -------------------------------------------------------- sponsorship */}
      <Section aura="gold" ariaLabel="Work with Arian">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <p className="eyebrow eyebrow-gold mb-5">Sponsorship</p>
            <h2 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-ink text-balance sm:text-4xl">
              {content.sponsorHeadline}
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted text-pretty">{content.sponsorIntro}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {content.sponsorFormats.slice(0, 5).map((format) => (
                <Badge key={format} tone="gold">
                  {format}
                </Badge>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to="/sponsor" size="lg">
                <Handshake className="h-4 w-4" aria-hidden />
                Start a sponsorship enquiry
              </ButtonLink>
              <ButtonLink to="/contact" variant="outline" size="lg">
                Ask a question first
              </ButtonLink>
            </div>
          </div>

          <Reveal delay={0.1}>
            <div className="panel p-7">
              <p className="eyebrow eyebrow-mint mb-4">How it works</p>
              <ol className="space-y-5">
                {[
                  { step: "1", title: "Send the details", body: "Company, campaign, timeline and budget range." },
                  { step: "2", title: "Arian replies", body: "Personally, straight to the email you leave." },
                  { step: "3", title: "Plan the fit", body: "Format and slot agreed before anything is filmed." },
                  { step: "4", title: "Disclosed, always", body: "Paid partnerships are labelled on screen and in the description." },
                ].map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 font-display text-xs font-semibold text-gold">
                      {item.step}
                    </span>
                    <span>
                      <span className="block font-display text-sm font-semibold text-ink">{item.title}</span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{item.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 border-t border-hairline pt-5 text-xs leading-relaxed text-faint">
                {content.sponsorDisclosure}
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ----------------------------------------------------- assistant teaser */}
      <Section aura="violet" ariaLabel="Arian Assistant">
        <Reveal>
          <div className="grid items-center gap-10 rounded-3xl border border-hairline bg-surface/60 p-8 sm:p-12 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="eyebrow eyebrow-violet mb-5">Arian Assistant</p>
              <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight text-ink text-balance sm:text-[2rem]">
                A small assistant that knows this website, and only this website.
              </h2>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted text-pretty">
                Ask about the games covered, the kind of videos on the channel, sponsorship, or how to get in
                touch. It is built by Arian for this site, and it will say so when a question is outside its
                scope.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink to="/chat" size="lg">
                  <Bot className="h-4 w-4" aria-hidden />
                  Open Arian Assistant
                </ButtonLink>
                <ButtonLink to="/contact" variant="ghost" size="lg">
                  Talk to Arian instead
                </ButtonLink>
              </div>
            </div>

            <div className="panel p-5">
              <div className="flex items-center gap-2.5 border-b border-hairline pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-gradient-to-br from-violet/25 to-lavender/20">
                  <Bot className="h-4 w-4 text-violet" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-xs font-semibold text-ink">Arian Assistant</p>
                  <p className="text-2xs text-faint">Online · answers about this channel</p>
                </div>
              </div>
              <div className="space-y-3 pt-4">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-jade/80 to-cyan/70 px-3.5 py-2 text-[13px] text-base">
                  Which games does Arian cover?
                </p>
                <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-md border border-hairline bg-white/[0.04] px-3.5 py-2 text-[13px] leading-relaxed text-ink">
                  Genshin Impact and Wuthering Waves — lore, builds, banner advice and beginner guides, in Hindi.
                </p>
                <p className="flex flex-wrap gap-2 pt-1">
                  {content.chatbotSuggestions.slice(0, 2).map((suggestion) => (
                    <span key={suggestion} className="rounded-full border border-hairline px-3 py-1.5 text-2xs text-muted">
                      {suggestion}
                    </span>
                  ))}
                </p>
              </div>
              <p className="mt-5 border-t border-hairline pt-4 text-2xs leading-relaxed text-faint">
                Illustration of the assistant. {content.chatbotDisclaimer}
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ------------------------------------------------------------- closing */}
      <Section ariaLabel="Watch on YouTube" bordered={false}>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-mint/[0.12] via-cyan/[0.08] to-violet/[0.1] p-8 text-center sm:p-14">
            <span aria-hidden className="aura left-1/2 top-[-8rem] h-64 w-[32rem] -translate-x-1/2 bg-mint/18" />
            <p className="eyebrow eyebrow-center eyebrow-mint mb-5 justify-center">Ready when you are</p>
            <h2 className="mx-auto max-w-2xl font-display text-2xl font-semibold leading-tight tracking-tight text-ink text-balance sm:text-[2rem]">
              Start with one video, and see if the story lands.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink to={channelUrl} external size="lg" variant="secondary" className="border-coral/40 hover:border-coral hover:bg-coral/10">
                <Youtube className="h-4 w-4 text-coral" aria-hidden />
                Watch on YouTube
              </ButtonLink>
              <Link
                to="/gallery"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-hairline px-6 font-display text-[15px] font-semibold text-ink transition-colors hover:border-cyan/50 hover:bg-cyan/[0.06]"
              >
                See the gallery
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
