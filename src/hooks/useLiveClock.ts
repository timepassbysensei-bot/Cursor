import { useEffect, useState } from "react";

/**
 * A ticking wall clock for the hero. Renders `--:--` on the server and the
 * first client paint, so markup never disagrees with hydration, then updates
 * every second. Reduced-motion users still get the time; it just updates in
 * place without animation.
 */
export function useLiveClock(): { time: string; date: string; zone: string; ready: boolean } {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!now) return { time: "--:--", date: "", zone: "", ready: false };

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
  const zone = (Intl.DateTimeFormat().resolvedOptions().timeZone ?? "").replace(/_/g, " ");

  return { time, date, zone, ready: true };
}
