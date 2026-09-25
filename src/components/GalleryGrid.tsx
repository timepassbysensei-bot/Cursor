import { useCallback, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../lib/utils";
import type { GalleryItem } from "../types";

/**
 * Editorial masonry built on CSS columns: no layout library, no JS measuring,
 * and it reflows naturally from one column on a 390px phone to three on
 * desktop. Images are lazy-loaded and always carry real alt text.
 */
export function GalleryGrid({
  items,
  onOpen,
  className,
}: {
  items: GalleryItem[];
  onOpen: (index: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("columns-1 gap-5 sm:columns-2 lg:columns-3", className)}>
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpen(index)}
          className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-hairline bg-surface/70 text-left transition-all duration-500 ease-editorial hover:-translate-y-1 hover:border-white/20 hover:shadow-glow"
          aria-label={`Open image: ${item.title || item.alt_text}`}
        >
          <div className="relative overflow-hidden">
            <img
              src={item.public_url}
              alt={item.alt_text}
              loading="lazy"
              decoding="async"
              width={item.width ?? undefined}
              height={item.height ?? undefined}
              className="w-full object-cover transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.05]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/85 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          </div>
          {(item.title || item.category) && (
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="truncate text-[13px] font-medium text-ink">{item.title}</span>
              {item.category && (
                <span className="shrink-0 text-2xs uppercase tracking-[0.14em] text-cyan">
                  {item.category}
                </span>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export function Lightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const reduced = useReducedMotion();
  const open = index !== null;
  const panelRef = useRef<HTMLDivElement>(null);

  const item = useMemo(() => (index === null ? null : items[index] ?? null), [items, index]);

  const go = useCallback(
    (delta: number) => {
      if (index === null || items.length === 0) return;
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndexChange]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, go]);

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col bg-black/92 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <p className="min-w-0 truncate font-display text-sm font-semibold text-ink">
              {item.title || "Gallery image"}
            </p>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs tabular-nums text-muted sm:inline">
                {(index ?? 0) + 1} / {items.length}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close image viewer"
                className="rounded-xl border border-hairline p-2 text-muted transition-colors hover:bg-white/5 hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={item.title || "Gallery image viewer"}
            className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-3 outline-none sm:px-16"
          >
            <motion.img
              key={item.id}
              src={item.public_url}
              alt={item.alt_text}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="max-h-full max-w-full rounded-xl object-contain shadow-lift"
            />

            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-hairline bg-black/50 p-3 text-ink backdrop-blur-md transition-transform hover:scale-105 sm:left-4"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-hairline bg-black/50 p-3 text-ink backdrop-blur-md transition-transform hover:scale-105 sm:right-4"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </>
            )}
          </div>

          {(item.caption || item.alt_text) && (
            <p className="mx-auto max-w-3xl px-5 pb-6 text-center text-xs leading-relaxed text-muted">
              {item.caption || item.alt_text}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
