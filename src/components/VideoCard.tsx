import { ExternalLink, ImageOff, Play } from "lucide-react";
import { useState } from "react";
import { cn, formatDate } from "../lib/utils";
import { extractYouTubeId, youtubeThumbnail, youtubeWatchUrl } from "../lib/youtube";
import { Badge } from "./ui/Section";
import type { Video } from "../types";

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Resolves the best available real thumbnail and degrades gracefully:
 * maxres → hq → "thumbnail unavailable" state. A generated fake image is
 * never shown for a real video; a real database video without a working
 * thumbnail gets an honest, designed fallback block.
 */
function useThumbnail(video: Video) {
  const youtubeId = video.youtube_id || extractYouTubeId(video.youtube_url) || "";
  const primary = video.thumbnail_url || (youtubeId ? youtubeThumbnail(youtubeId, "maxresdefault") : "");
  const backup = youtubeId ? youtubeThumbnail(youtubeId, "hqdefault") : "";
  const [step, setStep] = useState(0);

  const candidates = [primary, backup].filter((value) => Boolean(value)) as string[];
  const exhausted = candidates.length === 0 || step >= candidates.length;
  const src = exhausted ? "" : candidates[Math.min(step, candidates.length - 1)];

  return {
    src,
    unavailable: exhausted,
    onError: () => setStep((current) => current + 1),
  };
}

function isRecent(publishedAt: string): boolean {
  const parsed = Date.parse(publishedAt);
  if (Number.isNaN(parsed)) return false;
  return Date.now() - parsed < NEW_WINDOW_MS;
}

export function VideoCard({
  video,
  variant = "grid",
  className,
}: {
  video: Video;
  variant?: "grid" | "feature";
  className?: string;
}) {
  const youtubeId = video.youtube_id || extractYouTubeId(video.youtube_url) || "";
  const isPlayable = Boolean(youtubeId);
  const { src, unavailable, onError } = useThumbnail(video);
  const featured = variant === "feature";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface/70 transition-all duration-500 ease-editorial",
        isPlayable && "hover:-translate-y-1 hover:border-white/20 hover:shadow-glow",
        className
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-elevated",
          featured ? "aspect-[16/10] sm:aspect-[16/9]" : "aspect-video"
        )}
      >
        {unavailable ? (
          <div
            aria-hidden
            className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-surface via-elevated to-base text-faint"
          >
            <ImageOff className="h-6 w-6" />
            <span className={cn("font-display", featured ? "text-xs" : "text-2xs")}>Thumbnail unavailable</span>
          </div>
        ) : (
          <img
            src={src}
            alt=""
            loading={featured ? "eager" : "lazy"}
            decoding="async"
            onError={onError}
            className={cn(
              "h-full w-full object-cover transition-transform duration-[900ms] ease-editorial",
              isPlayable && "group-hover:scale-[1.045]"
            )}
          />
        )}

        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-base via-base/35 to-transparent opacity-90"
        />

        {isPlayable && (
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 backdrop-blur-md transition-transform duration-500 ease-editorial group-hover:scale-110"
          >
            <Play className="ml-0.5 h-5 w-5 fill-ink text-ink" />
          </span>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {video.game && <Badge tone="ocean">{video.game}</Badge>}
          {video.is_featured && <Badge tone="violet">Featured</Badge>}
          {!featured && isRecent(video.published_at) && <Badge tone="mint">New</Badge>}
        </div>

        {video.duration_text && (
          <span className="absolute bottom-3 right-3 rounded-md border border-white/15 bg-black/60 px-1.5 py-0.5 font-display text-2xs font-semibold text-ink backdrop-blur-sm">
            {video.duration_text}
          </span>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col", featured ? "p-5 sm:p-7" : "p-4")}>
        <h3
          className={cn(
            "font-display font-semibold leading-snug tracking-tight text-ink text-balance",
            featured ? "text-lg sm:text-2xl" : "text-[15px]"
          )}
        >
          {video.title}
        </h3>

        {video.description && (
          <p
            className={cn(
              "mt-2 leading-relaxed text-muted",
              featured ? "text-sm sm:text-[15px]" : "line-clamp-2 text-[13px]"
            )}
          >
            {video.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs uppercase tracking-[0.14em] text-faint">
          {video.category && <span className="text-jade">{video.category}</span>}
          <span>{formatDate(video.published_at)}</span>
        </div>

        {/* Explicit, always-available watch link. The stretched overlay below
            makes the whole card clickable, but this link stays on top and
            works independently — the two never conflict. */}
        {isPlayable && (
          <a
            href={youtubeWatchUrl(youtubeId)}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-20 mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-hairline px-4 py-2.5 font-display text-xs font-semibold text-ink transition-colors hover:border-coral/60 hover:bg-coral/[0.08]"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Watch on YouTube
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>

      {/* Stretched-link overlay: the whole card opens the video. Skipped when
          there is no real link, so nothing pretends to be clickable. */}
      {isPlayable && (
        <a
          href={youtubeWatchUrl(youtubeId)}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10 rounded-2xl"
          aria-label={`${video.title} — opens on YouTube in a new tab`}
        />
      )}
    </article>
  );
}
