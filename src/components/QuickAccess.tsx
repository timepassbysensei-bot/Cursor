import { ArrowRight, Camera, Handshake, PlayCircle, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { RevealGroup, RevealItem } from "./Reveal";
import { cn } from "../lib/utils";

const ITEMS = [
  {
    to: "/sponsor",
    icon: Handshake,
    title: "Sponsor Arian",
    body: "Campaign formats, audiences and a direct line — no agency runaround.",
    mood: "gold" as const,
  },
  {
    to: "/gallery",
    icon: Camera,
    title: "Explore the gallery",
    body: "Screenshots and artwork from the worlds the channel covers.",
    mood: "mint" as const,
  },
  {
    to: "/login",
    icon: UserPlus,
    title: "Become a client",
    body: "A direct inbox with Arian, sponsor status and private broadcasts.",
    mood: "violet" as const,
  },
  {
    to: "/videos",
    icon: PlayCircle,
    title: "Watch the videos",
    body: "Lore, builds and banner advice — searchable, filterable, all of it.",
    mood: "cyan" as const,
  },
];

const MOODS = {
  gold: {
    ring: "hover:border-gold/50",
    glow: "group-hover:shadow-glow-gold",
    icon: "border-gold/30 bg-gradient-to-br from-gold/20 to-cream/10 text-gold",
  },
  mint: {
    ring: "hover:border-mint/50",
    glow: "group-hover:shadow-glow-jade",
    icon: "border-mint/30 bg-gradient-to-br from-mint/20 to-jade/10 text-mint",
  },
  violet: {
    ring: "hover:border-violet/50",
    glow: "group-hover:shadow-glow-violet",
    icon: "border-violet/30 bg-gradient-to-br from-violet/20 to-lavender/10 text-violet",
  },
  cyan: {
    ring: "hover:border-cyan/50",
    glow: "group-hover:shadow-glow",
    icon: "border-cyan/30 bg-gradient-to-br from-cyan/20 to-ocean/10 text-cyan",
  },
} as const;

/**
 * The four doors into the site, directly below the hero. On phones these
 * stack as large, 44px+ touch cards; nothing important lives only in the
 * hamburger menu.
 */
export function QuickAccess() {
  return (
    <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map((item) => {
        const mood = MOODS[item.mood];
        return (
          <RevealItem key={item.to}>
            <Link
              to={item.to}
              className={cn(
                "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface/70 p-6 transition-all duration-500 ease-editorial hover:-translate-y-1",
                mood.ring,
                mood.glow
              )}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
              <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl border", mood.icon)}>
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{item.body}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors group-hover:text-ink">
                Continue
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
