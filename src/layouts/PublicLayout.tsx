import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  GraduationCap,
} from "lucide-react";
import { ButtonLink } from "../components/ui/Button";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { useAuth } from "../hooks/useAuth";
import { safeExternal, cn } from "../lib/utils";
import { AcademyLogo } from "../components/AcademyLogo";
import { DatabaseSetupBanner } from "../components/DatabaseSetupBanner";
import ChatbotWidget from "../features/chatbot/ChatbotWidget";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/courses", label: "Courses" },
  { to: "/admissions", label: "Admissions" },
  { to: "/results", label: "Results" },
  { to: "/gallery", label: "Gallery" },
  { to: "/notices", label: "Notices" },
  { to: "/resources", label: "Resources" },
  { to: "/contact", label: "Contact" },
];

export default function PublicLayout() {
  const { data: settings } = useSiteSettings();
  const { session, profile } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [announceDismissed, setAnnounceDismissed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  const flags = settings?.feature_flags;
  const phone = safeExternal(settings?.contact_phone ? `tel:+91${settings.contact_phone}` : null);

  const dashboards: Record<string, string> = {
    super_admin: "/admin",
    admin: "/admin",
    teacher: "/teacher",
    student: "/student",
  };

  return (
    <div className="flex min-h-screen flex-col bg-offwhite">
      {/* Keyboard users can bypass the long nav */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <DatabaseSetupBanner />

      {/* Announcement bar */}
      {settings?.announcement_enabled && settings.announcement_text && !announceDismissed && (
        <div className="bg-navy-dark text-white" role="region" aria-label="Announcement">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2 text-center text-xs sm:text-sm">
            <span className="flex-1">{settings.announcement_text}</span>
            <button
              type="button"
              onClick={() => setAnnounceDismissed(true)}
              aria-label="Dismiss announcement"
              className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-lightgray bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Bokaro Defence Academy home">
            <AcademyLogo logoUrl={settings?.logo_url ?? null} className="h-10 w-10 shrink-0" />
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] font-bold leading-tight text-navy sm:text-base">
                {settings?.academy_name ?? "Bokaro Defence Academy"}
              </span>
              <span className="block truncate text-[11px] font-medium text-muted">
                NDA · CDS · AFCAT · Agniveer
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 xl:flex">
            {NAV_LINKS.slice(0, 9).map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-navy/[0.06] text-navy" : "text-ink/80 hover:bg-navy/[0.04] hover:text-navy"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {session && profile && dashboards[profile.role] ? (
              <ButtonLink to={dashboards[profile.role]} size="sm" variant="outline" className="hidden sm:inline-flex">
                My Dashboard
              </ButtonLink>
            ) : (
              <ButtonLink to="/auth/login" size="sm" variant="outline" className="hidden sm:inline-flex">
                Student Login
              </ButtonLink>
            )}
            <ButtonLink to="/admissions#apply" size="sm" className="hidden md:inline-flex">
              Apply Now
            </ButtonLink>
            <button
              type="button"
              className="rounded-lg p-2 text-navy hover:bg-navy/[0.06] xl:hidden"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
            >
              {drawerOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div id="mobile-drawer" className="border-t border-lightgray bg-white xl:hidden">
            <nav aria-label="Mobile" className="mx-auto max-w-7xl px-4 py-3">
              <ul className="grid gap-1">
                {NAV_LINKS.map((l) => (
                  <li key={l.to}>
                    <NavLink
                      to={l.to}
                      end={l.to === "/"}
                      className={({ isActive }) =>
                        cn(
                          "block rounded-lg px-3 py-2.5 text-[15px] font-medium",
                          isActive ? "bg-navy/[0.06] font-semibold text-navy" : "text-ink/80 hover:bg-navy/[0.04]"
                        )
                      }
                    >
                      {l.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-lightgray pt-3">
                {session && profile && dashboards[profile.role] ? (
                  <ButtonLink to={dashboards[profile.role]} variant="outline" className="w-full">
                    My Dashboard
                  </ButtonLink>
                ) : (
                  <ButtonLink to="/auth/login" variant="outline" className="w-full">
                    Student Login
                  </ButtonLink>
                )}
                <ButtonLink to="/admissions#apply" className="w-full">
                  Apply Now
                </ButtonLink>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-navy-dark text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <AcademyLogo logoUrl={settings?.logo_url ?? null} className="h-10 w-10" />
                <p className="font-display text-base font-bold">{settings?.academy_name ?? "Bokaro Defence Academy"}</p>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
                {settings?.footer_description ??
                  "Structured preparation for NDA, CDS, AFCAT and Agniveer aspirants — disciplined academics, physical readiness and personal mentorship."}
              </p>
            </div>
            <nav aria-label="Courses">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white/90">Courses</h2>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li><Link className="hover:text-white" to="/courses">All Courses</Link></li>
                <li><Link className="hover:text-white" to="/admissions">Admissions</Link></li>
                <li><Link className="hover:text-white" to="/results">Results</Link></li>
                <li><Link className="hover:text-white" to="/notices">Notices</Link></li>
              </ul>
            </nav>
            <nav aria-label="Quick links">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white/90">Quick Links</h2>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li><Link className="hover:text-white" to="/about">About Us</Link></li>
                <li><Link className="hover:text-white" to="/gallery">Gallery</Link></li>
                <li><Link className="hover:text-white" to="/resources">Resources</Link></li>
                <li><Link className="hover:text-white" to="/contact">Contact</Link></li>
                <li><Link className="hover:text-white" to="/auth/login">Student Login</Link></li>
              </ul>
            </nav>
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white/90">Contact</h2>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {settings?.contact_address && (
                  <li className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron-soft" aria-hidden />
                    <span>{settings.contact_address}</span>
                  </li>
                )}
                {phone && (
                  <li className="flex gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-saffron-soft" aria-hidden />
                    <a href={`tel:+91${settings?.contact_phone}`} className="hover:text-white">
                      +91 {settings?.contact_phone}
                    </a>
                  </li>
                )}
                {settings?.contact_email && (
                  <li className="flex gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-saffron-soft" aria-hidden />
                    <a href={`mailto:${settings.contact_email}`} className="hover:text-white">
                      {settings.contact_email}
                    </a>
                  </li>
                )}
                {settings?.contact_hours && (
                  <li className="flex gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-saffron-soft" aria-hidden />
                    <span>{settings.contact_hours}</span>
                  </li>
                )}
              </ul>
              {/* Social links rendered only when configured */}
              <SocialLinks settings={settings ?? null} />
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row">
            <p>© {new Date().getFullYear()} {settings?.academy_name ?? "Bokaro Defence Academy"}. All rights reserved.</p>
            <ul className="flex flex-wrap items-center gap-4">
              <li><Link className="hover:text-white" to="/privacy">Privacy Policy</Link></li>
              <li><Link className="hover:text-white" to="/terms">Terms &amp; Conditions</Link></li>
              <li><Link className="hover:text-white" to="/refund-policy">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Floating actions */}
      <FloatingActions flags={flags} phone={settings?.contact_phone ?? null} whatsapp={settings?.contact_whatsapp ?? null} />
      {flags?.chatbot_enabled !== false && <ChatbotWidget />}
    </div>
  );
}

function SocialLinks({ settings }: { settings: import("../types").SiteSettings | null }) {
  if (!settings) return null;
  const links = [
    { key: "facebook_url", label: "Facebook" },
    { key: "instagram_url", label: "Instagram" },
    { key: "youtube_url", label: "YouTube" },
    { key: "twitter_url", label: "X (Twitter)" },
  ] as const;
  const social = (settings as unknown as Record<string, string | null>) ?? {};
  const available = links.filter((l) => safeExternal(social[l.key]));
  if (available.length === 0) return null;
  return (
    <ul className="mt-5 flex gap-2">
      {available.map((l) => (
        <li key={l.key}>
          <a
            href={social[l.key] as string}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.label}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
          >
            {l.label.charAt(0)}
          </a>
        </li>
      ))}
    </ul>
  );
}

function FloatingActions({
  flags,
  phone,
  whatsapp,
}: {
  flags: ReturnType<typeof useSiteSettings>["data"] extends null ? never : import("../types").FeatureFlags | undefined;
  phone: string | null;
  whatsapp: string | null;
}) {
  const items: { key: string; href: string | null; label: string; icon: JSX.Element; className: string }[] = [];
  if (flags?.floating_call_enabled !== false && phone) {
    items.push({
      key: "call",
      href: `tel:+91${phone}`,
      label: "Call now",
      icon: <Phone className="h-5 w-5" aria-hidden />,
      className: "bg-navy hover:bg-navy-mid",
    });
  }
  if (flags?.floating_whatsapp_enabled !== false && whatsapp) {
    items.push({
      key: "wa",
      href: `https://wa.me/91${whatsapp}`,
      label: "WhatsApp us",
      icon: <MessageCircle className="h-5 w-5" aria-hidden />,
      className: "bg-[#1FA855] hover:bg-[#178a44]",
    });
  }
  if (flags?.floating_apply_enabled !== false) {
    items.push({
      key: "apply",
      href: null,
      label: "Apply",
      icon: <GraduationCap className="h-5 w-5" aria-hidden />,
      className: "bg-saffron hover:bg-saffron/90",
    });
  }
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
      {items.map((item) =>
        item.href ? (
          <a
            key={item.key}
            href={item.href}
            target={item.href.startsWith("http") ? "_blank" : undefined}
            rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
            aria-label={item.label}
            title={item.label}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lift transition-transform hover:scale-105",
              item.className
            )}
          >
            {item.icon}
          </a>
        ) : (
          <Link
            key={item.key}
            to="/admissions#apply"
            aria-label={item.label}
            title={item.label}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lift transition-transform hover:scale-105",
              item.className
            )}
          >
            {item.icon}
          </Link>
        )
      )}
    </div>
  );
}
