import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "framer-motion";
import { fetchActiveSiteMedia } from "../services/siteMedia";

interface ParticleSpec {
  left: string;
  size: number;
  duration: string;
  delay: string;
  x: string;
  opacity: number;
}

/** Deterministic pseudo-random particle field — stable between renders. */
function buildParticles(count: number): ParticleSpec[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = (index * 2654435761) % 997;
    const left = (seed % 100) + (index % 3);
    const size = 2 + (seed % 4);
    const duration = 9 + (seed % 9);
    const delay = (seed % 110) / 10;
    const x = ((seed >> 3) % 60) - 30;
    const opacity = 0.25 + ((seed >> 5) % 40) / 100;
    return {
      left: `${Math.min(98, Math.max(0, left))}%`,
      size,
      duration: `${duration}s`,
      delay: `-${delay}s`,
      x: `${x}px`,
      opacity,
    };
  });
}

/**
 * The living background behind the hero.
 *
 * With an admin-uploaded hero loop: a muted, looping, playsInline video with
 * a dark gradient overlay and a poster. On small screens, slow connections or
 * `prefers-reduced-motion` the poster image stands in for the video.
 *
 * With no media: the CSS aurora — two slow light pools plus a sparse particle
 * field. Never a blank rectangle, never a stock photo pretending to be real.
 */
export function HeroBackdrop({ compact = false }: { compact?: boolean }) {
  const reduced = useReducedMotion();
  const { data: media } = useQuery({
    queryKey: ["site-media", "hero_video"],
    queryFn: () => fetchActiveSiteMedia("hero_video"),
    staleTime: 5 * 60 * 1000,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const showVideo = Boolean(
    media && media.media_kind === "video" && media.public_url && !reduced && !narrow && !failed
  );
  const showPoster = Boolean(media && (media.poster_url || media.media_kind === "image") && !showVideo);
  const posterUrl = media?.poster_url || (media?.media_kind === "image" ? media.public_url : null);

  const particles = useMemo(() => buildParticles(compact ? 12 : 22), [compact]);

  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      {/* Admin video loop */}
      {showVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={media?.public_url}
          poster={posterUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        />
      )}

      {/* Static fallback: poster image (mobile, reduced motion, video error) */}
      {showPoster && posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
      )}

      {/* Always-on readability gradient over media */}
      {media && (
        <span className="absolute inset-0 bg-gradient-to-b from-base/72 via-base/55 to-base" />
      )}

      {/* CSS aurora — the no-media default */}
      {!media && (
        <>
          <span
            className="aura animate-aurora left-[-14rem] top-[-12rem] h-[36rem] w-[42rem] bg-mint/20"
            style={{ animationDelay: "-4s" }}
          />
          <span
            className="aura animate-aurora right-[-12rem] top-[-6rem] h-[30rem] w-[36rem] bg-cyan/18"
            style={{ animationDelay: "-9s" }}
          />
          <span
            className="aura animate-aurora bottom-[-16rem] left-1/3 h-[30rem] w-[34rem] bg-violet/14"
            style={{ animationDelay: "-13s" }}
          />
        </>
      )}

      {/* Particle field — hero only, skipped for reduced motion by CSS */}
      <div className="particles">
        {particles.map((particle, index) => (
          <span
            key={index}
            className="particle"
            style={
              {
                left: particle.left,
                width: particle.size,
                height: particle.size,
                "--rise-duration": particle.duration,
                "--rise-delay": particle.delay,
                "--rise-x": particle.x,
                "--rise-opacity": particle.opacity,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Fine grid, fading out toward the content */}
      <span className="pointer-events-none absolute inset-0 opacity-[0.3] [background-image:linear-gradient(to_right,rgba(247,248,252,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(247,248,252,0.04)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(70%_60%_at_50%_20%,black,transparent)]" />
    </div>
  );
}
