import { useEffect, useState } from "react";
import { ArrowUp, WifiOff } from "lucide-react";
import { cn } from "../lib/utils";

/** Gradient progress bar across the very top of the viewport. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="scroll-progress"
      style={{ width: "100%", transform: `scaleX(${progress})` }}
    />
  );
}

/** Floating back-to-top control, visible once the reader is a screen deep. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(window.scrollY > 640);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={cn(
        "glass fixed bottom-4 right-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full text-ink shadow-lift transition-all duration-300 ease-editorial hover:border-cyan/50",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      )}
    >
      <ArrowUp className="h-4 w-4" aria-hidden />
    </button>
  );
}

/** Honest offline notice. Shown only when the browser reports no connection. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="relative z-[70] border-b border-gold/30 bg-gold/[0.09]" role="status">
      <div className="shell flex items-center gap-3 py-2.5">
        <WifiOff className="h-4 w-4 shrink-0 text-gold" aria-hidden />
        <p className="text-xs font-medium text-ink">
          You are offline — pages you have already visited still work.
        </p>
      </div>
    </div>
  );
}
