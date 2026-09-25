import { Link } from "react-router-dom";
import { Compass, Home, Youtube } from "lucide-react";
import { useSeo } from "../../hooks/useSeo";
import { useSiteContent } from "../../hooks/useSiteContent";
import { DEFAULT_SITE_CONTENT } from "../../lib/siteContent";
import { ButtonLink } from "../../components/ui/Button";
import { Reveal } from "../../components/Reveal";
import { youtubeChannelUrl } from "../../lib/supabaseClient";
import { safeExternal } from "../../lib/utils";

const SUGGESTIONS = [
  { to: "/videos", label: "Video library", body: "Every video, with filters and search." },
  { to: "/gallery", label: "Gallery", body: "Artwork and screenshots from the channel." },
  { to: "/about", label: "About Arian", body: "Who makes this, and what it covers." },
  { to: "/chat", label: "Arian Assistant", body: "Ask a question about the channel." },
];

export default function NotFound() {
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();
  useSeo({
    title: `Page not found — ${content.brandName}`,
    description: "That page does not exist. Here is where to go instead.",
    noIndex: true,
  });

  const channelUrl = safeExternal(content.socialYouTube) ?? youtubeChannelUrl;

  return (
    <div className="shell flex min-h-[70vh] flex-col justify-center py-20">
      <Reveal>
        <p className="eyebrow mb-6">Error 404</p>
        <h1 className="max-w-2xl font-display text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.03em] text-ink text-balance sm:text-6xl">
          This page is not part of the story.
        </h1>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted text-pretty">
          The link may be old, or the page may have moved. Everything below is still where you left it.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink to="/" size="lg">
            <Home className="h-4 w-4" aria-hidden />
            Back to the homepage
          </ButtonLink>
          <ButtonLink to={channelUrl} external variant="outline" size="lg">
            <Youtube className="h-4 w-4" aria-hidden />
            Watch on YouTube
          </ButtonLink>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUGGESTIONS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group rounded-2xl border border-hairline bg-surface/60 p-5 transition-all duration-500 ease-editorial hover:-translate-y-1 hover:border-white/20"
            >
              <Compass className="h-4 w-4 text-cyan" aria-hidden />
              <p className="mt-4 font-display text-sm font-semibold text-ink">{item.label}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.body}</p>
            </Link>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
