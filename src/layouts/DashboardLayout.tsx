import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  ClipboardList,
  CalendarCheck,
  FileQuestion,
  Inbox,
  MessageSquare,
  Megaphone,
  Trophy,
  Quote,
  Images,
  HelpCircle,
  PanelTop,
  Settings,
  ScrollText,
  Menu,
  X,
  LogOut,
  Home,
  CalendarRange,
  FolderOpen,
  BarChart3,
  Award,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { AcademyLogo } from "../components/AcademyLogo";
import { cn } from "../lib/utils";
import type { AppRole } from "../types";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; end?: boolean };

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/admin/batches", label: "Batches", icon: CalendarRange },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { to: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { to: "/admin/notices", label: "Notices", icon: Megaphone },
  { to: "/admin/achievements", label: "Achievements", icon: Trophy },
  { to: "/admin/testimonials", label: "Testimonials", icon: Quote },
  { to: "/admin/gallery", label: "Gallery", icon: Images },
  { to: "/admin/faqs", label: "FAQs & Chatbot", icon: HelpCircle },
  { to: "/admin/site-content", label: "Website Content", icon: PanelTop },
  { to: "/admin/site-settings", label: "Site Settings", icon: Settings },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
];

const TEACHER_NAV: NavItem[] = [
  { to: "/teacher", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/teacher/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/teacher/tests", label: "Tests & Marks", icon: ClipboardList },
  { to: "/teacher/assignments", label: "Assignments", icon: FileQuestion },
  { to: "/teacher/resources", label: "Resources", icon: FolderOpen },
];

const STUDENT_NAV: NavItem[] = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/student/assignments", label: "Assignments", icon: FileQuestion },
  { to: "/student/resources", label: "Resources", icon: FolderOpen },
  { to: "/student/results", label: "Results", icon: BarChart3 },
  { to: "/student/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/student/messages", label: "Messages", icon: MessageSquare },
  { to: "/student/profile", label: "Profile", icon: Award },
];

export default function DashboardLayout({ area }: { area: "admin" | "teacher" | "student" }) {
  const { profile, role, signOut } = useAuth();
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const nav = area === "admin" ? ADMIN_NAV : area === "teacher" ? TEACHER_NAV : STUDENT_NAV;
  const areaLabel = area === "admin" ? "Admin" : area === "teacher" ? "Faculty" : "Student";

  const allowed = (r: AppRole | null) => r === "super_admin" || r === "admin" || r === "teacher" || r === "student";

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav aria-label={`${areaLabel} menu`} className="flex flex-col gap-1">
      {nav
        .filter(() => allowed(role))
        .map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-saffron/10 font-semibold text-navy"
                  : "text-ink/75 hover:bg-navy/[0.05] hover:text-navy"
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {item.label}
          </NavLink>
        ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-offwhite">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-lightgray bg-white lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-lightgray px-4">
          <AcademyLogo logoUrl={settings?.logo_url ?? null} className="h-9 w-9" />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-navy">
              {settings?.academy_name ?? "Bokaro Defence Academy"}
            </p>
            <p className="text-[11px] font-medium text-muted">{areaLabel} portal</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks />
        </div>
        <div className="border-t border-lightgray p-3">
          <NavLink
            to="/"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink/70 hover:bg-navy/[0.05]"
          >
            <Home className="h-[18px] w-[18px]" aria-hidden />
            View website
          </NavLink>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink/70 hover:bg-error/[0.06] hover:text-error"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-navy-dark/50"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu overlay"
            tabIndex={-1}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-lift">
            <div className="flex h-16 items-center justify-between border-b border-lightgray px-4">
              <p className="font-display font-bold text-navy">{areaLabel} menu</p>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="rounded p-2 hover:bg-navy/[0.06]">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavLinks onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t border-lightgray p-3">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-error"
              >
                <LogOut className="h-[18px] w-[18px]" aria-hidden />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-lightgray bg-white/95 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-navy hover:bg-navy/[0.06] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" aria-hidden />
            </button>
            <p className="font-display text-base font-bold text-navy">
              {areaLabel} Portal
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">
              {profile?.full_name ?? profile?.email ?? ""}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-white" aria-hidden>
              {(profile?.full_name ?? "U").slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-6 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
