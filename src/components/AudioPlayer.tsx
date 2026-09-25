import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Music2, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "../lib/utils";
import { fetchActiveAudioTrack } from "../services/content";

const MUTED_KEY = "arian.audio-muted";
const DISMISSED_KEY = "arian.audio-dismissed";

/**
 * A small, optional music player pinned to the site shell.
 *
 * Rules it follows deliberately:
 *   · never autoplays — playback starts only from a click on the play button;
 *   · starts muted-unless-chosen, and remembers that choice in localStorage;
 *   · the panel can be dismissed for the whole session;
 *   · it survives navigation because it lives in the layout, not in a page.
 */
export function AudioPlayer() {
  const { data: track } = useQuery({
    queryKey: ["audio-track"],
    queryFn: fetchActiveAudioTrack,
    staleTime: 5 * 60 * 1000,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.35);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setMuted(window.localStorage.getItem(MUTED_KEY) !== "false");
    setDismissed(window.localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(MUTED_KEY, String(muted));
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
    setDismissed(true);
    window.localStorage.setItem(DISMISSED_KEY, "true");
  }, []);

  if (!track || dismissed) return null;

  const ariaLabel = `${track.title}${track.artist ? ` by ${track.artist}` : ""}`;

  return (
    <>
      <audio ref={audioRef} src={track.public_url} loop preload="none" muted={muted} />

      <div className="fixed bottom-4 left-4 z-[60] print:hidden">
        <AnimatePresence initial={false} mode="wait">
          {expanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="glass w-[min(calc(100vw-2rem),19rem)] rounded-2xl p-4 shadow-lift"
              role="region"
              aria-label="Background music player"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="eyebrow mb-1 text-cyan">Optional music</p>
                  <p className="truncate font-display text-sm font-semibold text-ink">{track.title}</p>
                  {track.artist && <p className="truncate text-2xs text-faint">{track.artist}</p>}
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Hide music player"
                  className="-mr-1 -mt-1 rounded-lg p-1.5 text-faint transition-colors hover:bg-white/5 hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? "Pause music" : "Play music"}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue to-cyan text-base transition-transform active:scale-95"
                >
                  {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="ml-0.5 h-4 w-4" aria-hidden />}
                </button>

                <button
                  type="button"
                  onClick={() => setMuted((value) => !value)}
                  aria-label={muted ? "Unmute music" : "Mute music"}
                  aria-pressed={muted}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-muted transition-colors hover:text-ink"
                >
                  {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
                </button>

                <label className="flex flex-1 items-center gap-2">
                  <span className="sr-only">Music volume</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(event) => {
                      setVolume(Number(event.target.value));
                      setMuted(Number(event.target.value) === 0);
                    }}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan"
                  />
                </label>
              </div>

              <p className="mt-3 text-2xs leading-relaxed text-faint">
                Music is entirely optional and only plays if you start it. It never autoplays with sound.
              </p>
            </motion.div>
          ) : (
            <motion.button
              key="collapsed"
              type="button"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setExpanded(true);
                void togglePlay();
              }}
              aria-label={`Music player — ${ariaLabel}. Starts muted.`}
              className={cn(
                "glass flex h-11 items-center gap-2.5 rounded-full pl-3 pr-4 text-xs font-semibold text-ink shadow-lift transition-colors hover:border-cyan/40"
              )}
            >
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue to-violet">
                {playing ? <Pause className="h-3 w-3" aria-hidden /> : <Music2 className="h-3 w-3" aria-hidden />}
              </span>
              <span className="max-w-[9rem] truncate">{track.title}</span>
              {muted && <span className="text-2xs font-medium text-faint">muted</span>}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
