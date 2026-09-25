import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

/**
 * A soft light that follows the pointer on precise-pointer devices.
 *
 * Three deliberate limits: it only mounts on desktop pointers (never on
 * touch), it never mounts under prefers-reduced-motion, and it updates
 * springs rather than React state so tracking a 4K pointer costs no renders.
 */
export function CursorGlow() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(-600);
  const y = useMotionValue(-600);
  const smoothX = useSpring(x, { stiffness: 70, damping: 20, mass: 0.5 });
  const smoothY = useSpring(y, { stiffness: 70, damping: 20, mass: 0.5 });

  useEffect(() => {
    if (reduced) return;
    const finePointer = window.matchMedia("(pointer: fine)");
    const wideEnough = window.matchMedia("(min-width: 1024px)");
    if (!finePointer.matches || !wideEnough.matches) return;

    setEnabled(true);
    const onMove = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-[55] h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] will-change-transform"
      style={{
        left: smoothX,
        top: smoothY,
        background:
          "radial-gradient(circle, rgba(94,159,232,0.16) 0%, rgba(155,124,255,0.09) 42%, transparent 72%)",
      }}
    />
  );
}
