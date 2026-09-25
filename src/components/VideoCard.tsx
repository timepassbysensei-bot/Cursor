import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { cn, formatDate } from "../lib/utils";
import { placeholderArt } from "../lib/placeholderArt";
import { extractYouTubeId, youtubeThumbnail, youtubeWatchUrl } from "../lib/youtube";
import { Badge } from "./ui/Section";
import type { Video } from "../types";

/**
 * Resolves the best available thumbnail and degrades gracefully:
 * maxres → hq → generated artwork. A blank grey box is never shown, and the
 * chain always terminates because step 2 ignores the network entirely.
 */
function useThumbnail(video: Video) {
  const youtubeId = video.youtube_id || extractYouTubeId(video.youtube_url) || "";
  const primary = video.thumbnail_url || (youtubeId ? youtubeThumbnail(youtubeId, "maxresdefault") : "");
  const backup = youtubeId ? youtubeThumbnail(youtubeId, "hqdefault") : "";
  const generated = placeholderArt(video.id || video.title || "video", 1280, 720);
  const [step, setStep] = useState(0);

  const candidates = [primary, backup, generated].filter((value) => Boolean(value)) as string[];
  const safeStep = Math.min(step, Math.max(0, candidates.length - 1));
  const src = candidates[safeStep] ?? generated;

  return {
    src,
    isGenerated: safeStep === candidates.length - 1,
    onError: () => setStep((current) => Math.min(candidates.length - 1, current + 1)),
  };
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
  const { src, isGenerated, onError } = useThumbnail(video);
  const featured = variant === "feature";

  const inner = (
    <>
      <div
        className={cn(
          "relative overflow-hidden",
          featured ? "aspect-[16/10] sm:aspect-[16/9]" : "aspect-video"
        )}
      >
        <img
          src={src}
          alt=""
          loading={featured ? "eager" : "lazy"}
          decoding="async"
          onError={onError}
          className={cn(
            "h-full w-full object-cover transition-transform duration-[900ms] ease-editorial",
            isPlayable && "group-hover:scale-[1.045]",
            isGenerated && "opacity-90"
          )}
        />

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
          {video.game && <Badge tone="blue">{video.game}</Badge>}
          {video.is_featured && <Badge tone="violet">Featured</Badge>}
          {!isPlayable && <Badge tone="neutral">Sample</Badge>}
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
          {video.category && <span className="text-cyan">{video.category}</span>}
          <span>{formatDate(video.published_at)}</span>
          {isPlayable && (
            <span className="ml-auto inline-flex items-center gap-1 text-muted transition-colors group-hover:text-ink">
              Watch on YouTube
              <ExternalLink className="h-3 w-3" aria-hidden />
            </span>
          )}
        </div>
      </div>
    </>
  );

  const classes = cn(
    "group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface/70 transition-all duration-500 ease-editorial",
    isPlayable && "hover:-translate-y-1 hover:border-white/20 hover:shadow-glow",
    className
  );

  // Without a real YouTube link the card is not clickable — no dead links.
  if (!isPlayable) {
    return <article className={classes}>{inner}</article>;
  }

  return (
    <a
      href={youtubeWatchUrl(youtubeId)}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      aria-label={`${video.title} — opens on YouTube in a new tab`}
    >
      {inner}
    </a>
  );
}
