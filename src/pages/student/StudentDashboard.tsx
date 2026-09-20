import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarCheck, ClipboardList, FileQuestion, Megaphone, BarChart3 } from "lucide-react";
import { Card, Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useAuth } from "../../hooks/useAuth";
import { fetchStudentBatchIds, fetchBatchNoticeBoard } from "../../services/staff";
import { supabase } from "../../lib/supabaseClient";
import { formatDate } from "../../lib/utils";

export default function StudentDashboard() {
  const { profile } = useAuth();

  const batchIdsQ = useQuery({
    queryKey: ["student", "batches", profile?.id],
    queryFn: () => fetchStudentBatchIds(profile!.id),
    enabled: Boolean(profile),
  });
  const batchIds = batchIdsQ.data ?? [];

  const noticesQ = useQuery({
    queryKey: ["student", "notices", batchIds],
    queryFn: () => fetchBatchNoticeBoard(batchIds),
    enabled: batchIds.length > 0,
  });

  const testsQ = useQuery({
    queryKey: ["student", "tests", batchIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tests")
        .select("id, title, test_date, publish_result, batches(name)")
        .in("batch_id", batchIds)
        .neq("status", "archived")
        .order("test_date", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
    enabled: batchIds.length > 0,
  });

  const assignmentsQ = useQuery({
    queryKey: ["student", "assignments", batchIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, title, due_date, assignment_submissions(student_id, status)")
        .in("batch_id", batchIds)
        .eq("status", "active")
        .order("due_date", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; title: string; test_date: string; publish_result: boolean; batches: { name: string } | null }[];
    },
    enabled: batchIds.length > 0,
  });

  const attendanceQ = useQuery({
    queryKey: ["student", "attendance-summary", profile?.id],
    queryFn: async () => {
      const { count: total, error: e1 } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("student_id", profile!.id);
      const { count: present, error: e2 } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("student_id", profile!.id)
        .in("status", ["present", "late"]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { total: total ?? 0, present: present ?? 0 };
    },
    enabled: Boolean(profile),
  });

  const mySubmissions = useMemo(() => {
    const set = new Set<string>();
    for (const a of (assignmentsQ.data ?? []) as Record<string, unknown>[]) {
      const subs = (a.assignment_submissions ?? []) as { student_id: string }[];
      if (subs.some((s) => s.student_id === profile?.id)) set.add(a.id as string);
    }
    return set;
  }, [assignmentsQ.data, profile?.id]);

  if (batchIdsQ.isLoading) return <LoadingState />;
  if (batchIdsQ.isError) return <ErrorState onRetry={() => batchIdsQ.refetch()} />;

  const attendanceRate =
    attendanceQ.data && attendanceQ.data.total > 0
      ? Math.round((attendanceQ.data.present / attendanceQ.data.total) * 100)
      : null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-navy sm:text-2xl">
            Hello{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {profile?.roll_number ? `Roll number ${String(profile.roll_number)} · ` : ""}
            {batchIds.length} active batch{batchIds.length === 1 ? "" : "es"}
          </p>
        </div>
      </div>

      {batchIds.length === 0 ? (
        <EmptyState
          title="You are not enrolled in a batch yet"
          hint="The academy office enrols students into batches. Once enrolled, your tests, assignments and attendance will appear here."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              to="/student/attendance"
              icon={CalendarCheck}
              label="Attendance rate"
              value={attendanceRate != null ? `${attendanceRate}%` : "—"}
              hint={attendanceRate != null ? `${attendanceQ.data?.present}/${attendanceQ.data?.total} sessions` : "No records yet"}
            />
            <StatCard
              to="/student/results"
              icon={BarChart3}
              label="Published results"
              value={String((testsQ.data ?? []).filter((t) => t.publish_result).length)}
              hint="View your marks"
            />
            <StatCard
              to="/student/assignments"
              icon={FileQuestion}
              label="Pending submissions"
              value={String(((assignmentsQ.data ?? []) as { id: string }[]).length - mySubmissions.size)}
              hint="Assignments awaiting your submission"
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
                  <Megaphone className="h-4 w-4 text-saffron" aria-hidden /> Batch notices
                </h2>
              </div>
              {noticesQ.isLoading ? (
                <LoadingState />
              ) : noticesQ.data && noticesQ.data.length > 0 ? (
                <ul className="mt-4 divide-y divide-lightgray">
                  {noticesQ.data.slice(0, 5).map((n) => (
                    <li key={n.id} className="py-3">
                      <p className="text-sm font-semibold text-navy">{n.pinned ? "📌 " : ""}{n.title}</p>
                      {n.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.description}</p>}
                      <p className="mt-1 text-xs text-muted">{formatDate(n.publish_date)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact title="No batch notices" hint="Announcements for your batch will appear here." />
              )}
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
                  <ClipboardList className="h-4 w-4 text-saffron" aria-hidden /> Recent tests
                </h2>
                <Link to="/student/results" className="text-sm font-semibold text-saffron hover:underline">Results</Link>
              </div>
              {testsQ.isLoading ? (
                <LoadingState />
              ) : testsQ.data && testsQ.data.length > 0 ? (
                <ul className="mt-4 divide-y divide-lightgray">
                  {testsQ.data.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy">{t.title}</p>
                        <p className="text-xs text-muted">{formatDate(t.test_date)}</p>
                      </div>
                      <Badge tone={t.publish_result ? "green" : "gray"}>
                        {t.publish_result ? "Result out" : "Pending"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact title="No tests yet" hint="Tests from your teachers will appear here." />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  to,
  icon: Icon,
  label,
  value,
  hint,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="p-5 transition-shadow group-hover:shadow-lift">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/[0.07] text-navy">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="font-display text-2xl font-extrabold text-navy">{value}</p>
        <p className="mt-0.5 text-xs text-muted">{hint}</p>
      </Card>
    </Link>
  );
}
