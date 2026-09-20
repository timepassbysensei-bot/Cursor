import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  Inbox,
  CalendarRange,
  Megaphone,
  Trophy,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "../../features/admin/PageHeader";
import { Card, Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { adminService } from "../../services/admin";
import { supabase } from "../../lib/supabaseClient";
import { formatDate } from "../../lib/utils";

async function count(table: string, filters: Record<string, string> = {}): Promise<number> {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

export default function AdminOverview() {
  const studentsQ = useQuery({ queryKey: ["ov", "students"], queryFn: () => count("profiles", { role: "student" }) });
  const teachersQ = useQuery({ queryKey: ["ov", "teachers"], queryFn: () => count("profiles", { role: "teacher" }) });
  const batchesQ = useQuery({ queryKey: ["ov", "batches"], queryFn: () => count("batches", { status: "ongoing" }) });
  const newInqQ = useQuery({ queryKey: ["ov", "inq-new"], queryFn: () => count("inquiries", { status: "new" }) });
  const totalInqQ = useQuery({ queryKey: ["ov", "inq-all"], queryFn: () => count("inquiries") });
  const noticesQ = useQuery({ queryKey: ["ov", "notices"], queryFn: () => count("notices", { status: "published" }) });
  const achievementsQ = useQuery({ queryKey: ["ov", "ach"], queryFn: () => count("achievements", { status: "published" }) });
  const recentInqQ = useQuery({ queryKey: ["admin", "inquiries"], queryFn: () => adminService.inquiries() });

  const cards = [
    { to: "/admin/students", label: "Students", value: studentsQ.data, icon: Users, tone: "navy" as const },
    { to: "/admin/teachers", label: "Teachers", value: teachersQ.data, icon: GraduationCap, tone: "navy" as const },
    { to: "/admin/batches", label: "Ongoing batches", value: batchesQ.data, icon: CalendarRange, tone: "green" as const },
    { to: "/admin/inquiries", label: "New inquiries", value: newInqQ.data, icon: Inbox, tone: "saffron" as const },
    { to: "/admin/notices", label: "Published notices", value: noticesQ.data, icon: Megaphone, tone: "navy" as const },
    { to: "/admin/achievements", label: "Published results", value: achievementsQ.data, icon: Trophy, tone: "green" as const },
  ];

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Live snapshot of the academy — numbers come straight from the database."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="group">
            <Card className="flex items-center gap-4 p-5 transition-shadow group-hover:shadow-lift">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                c.tone === "saffron" ? "bg-saffron/10 text-saffron" : c.tone === "green" ? "bg-green-success/10 text-green-success" : "bg-navy/[0.07] text-navy"
              }`}>
                <c.icon className="h-6 w-6" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.label}</p>
                {c.value === undefined ? (
                  <div className="mt-1 h-7 w-12 animate-pulse rounded bg-lightgray" aria-hidden />
                ) : (
                  <p className="font-display text-2xl font-extrabold text-navy">{c.value}</p>
                )}
              </div>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-navy">Latest inquiries</h2>
            <Link to="/admin/inquiries" className="text-sm font-semibold text-saffron hover:underline">View all</Link>
          </div>
          {recentInqQ.isLoading ? (
            <LoadingState />
          ) : recentInqQ.isError ? (
            <ErrorState onRetry={() => recentInqQ.refetch()} />
          ) : (recentInqQ.data ?? []).length === 0 ? (
            <EmptyState compact title="No inquiries yet" hint="Website inquiries will appear here." />
          ) : (
            <ul className="mt-4 divide-y divide-lightgray">
              {recentInqQ.data!.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{i.name}</p>
                    <p className="text-xs text-muted">{i.phone} · {formatDate(i.created_at)}</p>
                  </div>
                  <Badge tone={i.status === "new" ? "saffron" : i.status === "admitted" ? "green" : "gray"}>
                    {i.status.replace("_", " ")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-saffron" aria-hidden />
            <h2 className="font-display text-base font-bold text-navy">Admissions funnel</h2>
          </div>
          {totalInqQ.isLoading || newInqQ.isLoading ? (
            <LoadingState />
          ) : (
            <dl className="mt-4 space-y-4">
              {[
                { label: "Total inquiries", value: totalInqQ.data ?? 0 },
                { label: "New (awaiting contact)", value: newInqQ.data ?? 0 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted">{row.label}</dt>
                    <dd className="font-display font-bold text-navy">{row.value}</dd>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-lightgray">
                    <div
                      className="h-full rounded-full bg-saffron transition-all"
                      style={{ width: `${Math.min(100, row.value * 10)}%` }}
                    />
                  </div>
                </div>
              ))}
              <li className="list-none text-xs text-muted">
                Update inquiry statuses in the Inquiries page to track admitted students.
              </li>
            </dl>
          )}
        </Card>
      </div>
    </div>
  );
}
