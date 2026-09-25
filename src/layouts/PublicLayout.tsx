import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Images, LayoutDashboard, Menu, Radio, UserRound, X, Youtube } from "lucide-react";
import { cn } from "../lib/utils";
import { safeExternal } from "../lib/utils";
import { youtubeChannelUrl } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { useSiteContent } from "../hooks/useSiteContent";
import { fetchPublicAnnouncement } from "../services/content";
import { Wordmark } from "../components/Wordmark";
import { ButtonLink } from "../components/ui/Button";
import { ConfigBanner } from "../components/ConfigBanner";
import { CursorGlow } from "../components/CursorGlow";
import { PageTransition } from "../components/PageTransition";
import { AudioPlayer } from "../components/AudioPlayer";
import { AssistantWidget } from "../components/Assistant";
import { BackToTop, OfflineBanner, ScrollProgress } from "../components/SiteChrome";
import { DEFAULT_SITE_CONTENT } from "../lib/siteContent";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/videos", label: "Videos" },
  { to: "/gallery", label: "Gallery" },
  { to: "/sponsor", label: "Sponsor" },
  { to: "/chat", label: "Assistant" },
  { to: "/contact", label: "Contact" },
];

export default function PublicLayout() {
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();
  const { session, profile } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const location = useLocation();

  const { data: announcement } = useQuery({
    queryKey: ["public-announcement"],
    queryFn: fetchPublicAnnouncement,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  const channelUrl = safeExternal(content.socialYouTube) ?? youtubeChannelUrl;
  const dashboardPath = profile?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[90] focus:rounded-xl focus:bg-elevated focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:ring-2 focus:ring-cyan"
      >
        Skip to main content
      </a>

      <ScrollProgress />
      <CursorGlow />
      <div className="grain-overlay" aria-hidden />

      <OfflineBanner />
      <ConfigBanner />

      {announcement && !announcementDismissed && (
        <div className="relative border-b border-violet/25 bg-violet/[0.08]" role="region" aria-label="Announcement">
          <div className="shell flex items-start gap-3 py-2.5">
            <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet" aria-hidden />
            <p className="flex-1 text-xs leading-relaxed text-muted">
              <span className="font-semibold text-ink">{announcement.title}</span>
              {announcement.body ? ` — ${announcement.body}` : ""}
            </p>
            <button
              type="button"
              onClick={() => setAnnouncementDismissed(true)}
              aria-label="Dismiss announcement"
              className="rounded-lg p-1.5 text-faint transition-colors hover:bg-white/5 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-hairline bg-base/70 backdrop-blur-xl">
        <div className="shell flex h-[68px] items-center justify-between gap-4">
          <Link to="/" aria-label={`${content.brandName} — home`} className="shrink-0">
            <Wordmark name={content.brandName} subtitle="Gaming storyteller" size={38} />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                    isActive ? "bg-white/[0.07] text-ink" : "text-muted hover:bg-white/[0.04] hover:text-ink"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Mobile: the important actions stay visible without the menu. */}
            <ButtonLink
              to="/gallery"
              variant="ghost"
              size="sm"
              className="px-2.5 lg:hidden"
              aria-label="Open the gallery"
            >
              <Images className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink
              to={session ? dashboardPath : "/login"}
              variant="ghost"
              size="sm"
              className="px-2.5 lg:hidden"
              aria-label={session ? "Open your dashboard" : "Client login"}
            >
              <UserRound className="h-4 w-4" aria-hidden />
            </ButtonLink>

            {session ? (
              <ButtonLink to={dashboardPath} variant="secondary" size="sm" className="hidden lg:inline-flex">
                <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
                {profile?.role === "admin" ? "Studio" : "Dashboard"}
              </ButtonLink>
            ) : (
              <ButtonLink to="/login" variant="ghost" size="sm" className="hidden lg:inline-flex">
                Sign in
              </ButtonLink>
            )}
            <ButtonLink to={channelUrl} external size="sm" className="hidden sm:inline-flex">
              <Youtube className="h-3.5 w-3.5" aria-hidden />
              Watch on YouTube
            </ButtonLink>
            <button
              type="button"
              onClick={() => setDrawerOpen((value) => !value)}
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav"
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              className="rounded-xl border border-hairline p-2.5 text-ink transition-colors hover:bg-white/5 lg:hidden"
            >
              {drawerOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              id="mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-hairline bg-base/95 lg:hidden"
            >
              <nav aria-label="Mobile" className="shell py-4">
                <ul className="grid gap-1">
                  {NAV_LINKS.map((link) => (
                    <li key={link.to}>
                      <NavLink
                        to={link.to}
                        end={link.end}
                        className={({ isActive }) =>
                          cn(
                            "block rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
                            isActive ? "bg-white/[0.07] text-ink" : "text-muted hover:bg-white/[0.04] hover:text-ink"
                          )
                        }
                      >
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-hairline pt-4">
                  <ButtonLink to="/sponsor" variant="outline" className="w-full">
                    Sponsor
                  </ButtonLink>
                  <ButtonLink to="/gallery" variant="outline" className="w-full">
                    Gallery
                  </ButtonLink>
                  {session ? (
                    <ButtonLink to={dashboardPath} variant="secondary" className="col-span-2 w-full">
                      {profile?.role === "admin" ? "Open the studio" : "Client dashboard"}
                    </ButtonLink>
                  ) : (
                    <ButtonLink to="/login" variant="secondary" className="col-span-2 w-full">
                      Client login
                    </ButtonLink>
                  )}
                  <ButtonLink to={channelUrl} external className="col-span-2 w-full">
                    <Youtube className="h-4 w-4" aria-hidden />
                    Watch on YouTube
                  </ButtonLink>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="main" className="flex-1 pb-24">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <footer className="border-t border-hairline bg-base/60">
        <div className="shell py-16">
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Wordmark name={content.brandName} subtitle="Gaming storyteller" size={40} />
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">{content.footerNote}</p>
              <ButtonLink to={channelUrl} external variant="secondary" size="sm" className="mt-6">
                <Youtube className="h-3.5 w-3.5" aria-hidden />
                youtube.com/@youknowArian
              </ButtonLink>
            </div>

            <nav aria-label="Explore">
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-faint">Explore</h2>
              <ul className="mt-5 space-y-3 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link className="text-muted transition-colors hover:text-ink" to={link.to}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Work with Arian">
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-faint">
                Work with Arian
              </h2>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <Link className="text-muted transition-colors hover:text-ink" to="/sponsor">
                    Sponsorship
                  </Link>
                </li>
                <li>
                  <Link className="text-muted transition-colors hover:text-ink" to="/contact">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link className="text-muted transition-colors hover:text-ink" to="/chat">
                    Arian Assistant
                  </Link>
                </li>
                <li>
                  <Link className="text-muted transition-colors hover:text-ink" to="/dashboard">
                    Client dashboard
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-label="Account and legal">
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-faint">Account</h2>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  {session ? (
                    <Link className="text-muted transition-colors hover:text-ink" to={dashboardPath}>
                      {profile?.role === "admin" ? "Admin studio" : "Dashboard"}
                    </Link>
                  ) : (
                    <Link className="text-muted transition-colors hover:text-ink" to="/login">
                      Login
                    </Link>
                  )}
                </li>
                {!session && (
                  <li>
                    <Link className="text-muted transition-colors hover:text-ink" to="/signup">
                      Create account
                    </Link>
                  </li>
                )}
                <li>
                  <Link className="text-muted transition-colors hover:text-ink" to="/privacy">
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link className="text-muted transition-colors hover:text-ink" to="/terms">
                    Terms of use
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {content.contactEmail && (
            <p className="mt-12 text-sm text-muted">
              Business enquiries:{" "}
              <a
                className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline"
                href={`mailto:${content.contactEmail}`}
              >
                {content.contactEmail}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            </p>
          )}

          <div className="mt-10 flex flex-col gap-3 border-t border-hairline pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {content.brandName}. All rights reserved. Not affiliated with or endorsed
              by HoYoverse or Kuro Games.
            </p>
            <p className="text-faint">
              Built for {content.brandName} — videos, lore and the worlds behind the screen.
            </p>
          </div>
        </div>
      </footer>

      {/* Compact mobile bottom action bar: sponsor, gallery, login always live. */}
      <nav
        aria-label="Quick actions"
        className="glass fixed inset-x-3 bottom-3 z-[55] flex items-center justify-around rounded-2xl px-2 py-2 shadow-lift sm:hidden"
      >
        {[
          { to: "/sponsor", label: "Sponsor", icon: "🤝" },
          { to: "/gallery", label: "Gallery", icon: "🖼️" },
          { to: session ? dashboardPath : "/login", label: session ? "Dashboard" : "Client", icon: "👤" },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-4 py-1.5 text-2xs font-semibold text-muted transition-colors hover:text-ink"
          >
            <span aria-hidden className="text-base leading-none">
              {action.icon}
            </span>
            {action.label}
          </Link>
        ))}
      </nav>

      <BackToTop />
      <AudioPlayer />
      <AssistantWidget
        intro={content.chatbotIntro}
        suggestions={content.chatbotSuggestions}
        disclaimer={content.chatbotDisclaimer}
      />
    </div>
  );
}
