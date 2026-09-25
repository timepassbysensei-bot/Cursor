import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  ChevronLeft,
  Home,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Music4,
  PanelLeftClose,
  Send,
  Settings,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import { cn, initialsOf } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { useSiteContent } from "../hooks/useSiteContent";
import { Wordmark } from "../components/Wordmark";
import { Badge } from "../components/ui/Section";
import { DEFAULT_SITE_CONTENT } from "../lib/siteContent";
import type { ClientStatus } from "../types";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
};

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/gallery", label: "Gallery", icon: Images },
  { to: "/admin/videos", label: "Videos", icon: Video },
  { to: "/admin/audio", label: "Audio", icon: Music4 },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/messages", label: "Messages", icon: Inbox },
  { to: "/admin/broadcasts", label: "Broadcasts", icon: Megaphone },
  { to: "/admin/settings", label: "Content & settings", icon: Settings },
];

const CLIENT_NAV: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/messages", label: "Messages from Arian", icon: MessageSquare },
  { to: "/dashboard/contact", label: "Message Arian", icon: Send },
  { to: "/dashboard/sponsor", label: "Sponsor Arian", icon: BarChart3 },
  { to: "/dashboard/profile", label: "Profile", icon: UserRound },
];

const STATUS_TONE: Record<ClientStatus, "jade" | "amber" | "coral" | "neutral"> = {
  active: "jade",
  pending: "amber",
  suspended: "neutral",
  banned: "coral",
};

const STATUS_LABEL: Record<ClientStatus, string> = {
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
  banned: "Banned",
};

const COLLAPSE_KEY = "arian.sidebar-collapsed";

export default function DashboardLayout({ area }: { area: "admin" | "client" }) {
  const { profile, status, signOut } = useAuth();
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "true");
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      window.localStorage.setItem(COLLAPSE_KEY, String(!value));
      return !value;
    });
  };

  const nav = area === "admin" ? ADMIN_NAV : CLIENT_NAV;
  const areaLabel = area === "admin" ? "Studio" : "Dashboard";

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  const SidebarContent = ({ compact, onNavigate }: { compact: boolean; onNavigate?: () => void }) => (
    <>
      <div className="flex h-[68px] items-center gap-2.5 border-b border-hairline px-4">
        <Link to="/" aria-label="Back to the public site" onClick={onNavigate}>
          <Wordmark name={content.brandName} size={34} compact={compact} />
        </Link>
        {!compact && (
          <Badge tone={area === "admin" ? "violet" : "cyan"} className="ml-auto">
            {areaLabel}
          </Badge>
        )}
      </div>

      <nav aria-label={`${areaLabel} navigation`} className="scroll-thin flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={compact ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                isActive ? "bg-white/[0.08] text-ink" : "text-muted hover:bg-white/[0.04] hover:text-ink",
                compact && "justify-center px-0"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId={`${area}-nav-indicator`}
                    className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-gradient-to-b from-cyan to-blue"
                    transition={{ duration: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                {!compact && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-hairline p-3">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-white/[0.04] hover:text-ink",
            compact && "justify-center px-0"
          )}
          title={compact ? "View website" : undefined}
        >
          <Home className="h-[18px] w-[18px] shrink-0" aria-hidden />
          {!compact && "View website"}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-coral/[0.08] hover:text-coral",
            compact && "justify-center px-0"
          )}
          title={compact ? "Sign out" : undefined}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
          {!compact && "Sign out"}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-base">
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 264 }}
        initial={false}
        transition={{ duration: reduced ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-hairline bg-panel/80 backdrop-blur-xl lg:flex"
      >
        <SidebarContent compact={collapsed} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`${areaLabel} navigation`}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 flex w-[17.5rem] flex-col border-r border-hairline bg-panel"
            >
              <SidebarContent compact={false} onNavigate={() => setDrawerOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between gap-3 border-b border-hairline bg-base/75 px-4 backdrop-blur-xl lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="rounded-xl border border-hairline p-2.5 text-ink transition-colors hover:bg-white/5 lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden rounded-xl border border-hairline p-2.5 text-muted transition-colors hover:bg-white/5 hover:text-ink lg:inline-flex"
            >
              {collapsed ? <ChevronLeft className="h-4 w-4 rotate-180" aria-hidden /> : <PanelLeftClose className="h-4 w-4" aria-hidden />}
            </button>
            <h1 className="truncate font-display text-sm font-semibold text-ink sm:text-base">
              {area === "admin" ? `${content.brandName} studio` : `Welcome back`}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {status && area === "client" && (
              <Badge tone={STATUS_TONE[status]} className="hidden sm:inline-flex">
                {STATUS_LABEL[status]}
              </Badge>
            )}
            {status && area === "admin" && (
              <Badge tone="violet" className="hidden sm:inline-flex">
                Admin
              </Badge>
            )}
            <div className="flex items-center gap-2.5">
              <span className="hidden max-w-[12rem] truncate text-sm text-muted sm:inline">
                {profile?.full_name || profile?.email}
              </span>
              <span
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-hairline bg-gradient-to-br from-blue/30 to-violet/30 font-display text-xs font-bold text-ink"
                aria-hidden
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsOf(profile?.full_name || profile?.email || "?")
                )}
              </span>
            </div>
          </div>
        </header>

        <main id="main" className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      {/* Screen-reader-only route announcer */}
      <span className="sr-only" role="status" aria-live="polite">
        {location.pathname.replace(/\//g, " ")}
      </span>
    </div>
  );
}
