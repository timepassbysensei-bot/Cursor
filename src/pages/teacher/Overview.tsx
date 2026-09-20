import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, ClipboardList, CalendarCheck, FileQuestion, Percent, Trophy } from "lucide-react";
import { PageHeader } from "../../features/admin/PageHeader";
import { Card, Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchTeacherBatches,
  fetchRoster,
  fetchBatchTests,
  fetchAttendance,
} from "../../services/staff";

export default function TeacherOverview() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const batchesQ = useQuery({
    queryKey: ["teacher", "batches", profile?.id],
    queryFn: () => fetchTeacherBatches(profile!.role, profile!.id),
    enabled: Boolean(profile),
  });

  const batches = batchesQ.data ?? [];
  const [primaryBatchId] = useState<string | null>(batches[0]?.id ?? null);
  const rosterQ = useQuery({
    queryKey: ["teacher", "roster", primaryBatchId],
    queryFn: () => fetchRoster(primaryBatchId!),
    enabled: Boolean(primaryBatchId),
  });
  const testsQ = useQuery({
    queryKey: ["teacher", "tests", primaryBatchId],
    queryFn: () => fetchBatchTests(primaryBatchId!),
    enabled: Boolean(primaryBatchId),
  });

  const today = new Date().toISOString().slice(0, 10);
  const attendanceQ = useQuery({
    queryKey: ["teacher", "attendance-today", primaryBatchId, today],
    queryFn: () => fetchAttendance(primaryBatchId!, today),
    enabled: Boolean(primaryBatchId),
  });

  void qc;
  const stats = useMemo(() => {
    const tests = testsQ.data ?? [];
    const published = tests.filter((t) => t.status === "published").length;
    const pending = tests.filter((t) => t.status === "scheduled" || t.status === "marks_entered").length;
    const markedToday = (attendanceQ.data ?? []).length;
    return { batches: batches.length, students: rosterQ.data?.length ?? 0, tests, published, pending, markedToday };
  }, [batches.length, rosterQ.data, testsQ.data, attendanceQ.data]);

  if (batchesQ.isLoading) return <LoadingState />;
  if (batchesQ.isError) return <ErrorState onRetry={() => batchesQ.refetch()} />;

  return (
    <div>
      <PageHeader
        title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description="Your batches at a glance. Select a batch below to manage attendance, tests and assignments."
      />

      {batches.length === 0 ? (
        <EmptyState
          title="No batches assigned yet"
          hint="Ask the academy office to assign you to a batch from the admin Batches page. Once assigned, you can mark attendance, create tests and share assignments here."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "My batches", value: stats.batches, icon: Users },
              { label: "Students (primary batch)", value: stats.students, icon: Users },
              { label: "Tests created", value: stats.tests.length, icon: ClipboardList },
              { label: "Attendance marked today", value: stats.markedToday, icon: CalendarCheck },
            ].map((s) => (
              <Card key={s.label} className="flex items-center gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy/[0.07] text-navy">
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{s.label}</p>
                  <p className="font-display text-2xl font-extrabold text-navy">{s.value}</p>
                </div>
              </Card>
            ))}
          </div>

          <h2 className="mt-8 mb-3 font-display text-base font-bold text-navy">My batches</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((b) => (
              <Card key={b.id} className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={b.status === "ongoing" ? "green" : "saffron"}>{b.status}</Badge>
                  <span className="text-xs text-muted">{b.timing_text ?? ""}</span>
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-navy">{b.name}</h3>
                <p className="text-sm text-muted">{b.courses?.title ?? "—"}</p>
              </Card>
            ))}
          </div>

          {stats.pending > 0 && (
            <Card className="mt-8 border-saffron/40 bg-saffron/[0.05] p-5">
              <div className="flex items-center gap-3">
                <Percent className="h-5 w-5 text-saffron" aria-hidden />
                <p className="text-sm text-ink">
                  <span className="font-display font-bold text-navy">{stats.pending}</span> test
                  {stats.pending === 1 ? "" : "s"} awaiting marks entry or review —{" "}
                  <a href="/teacher/tests" className="font-semibold text-saffron underline">go to Tests &amp; Marks</a>
                </p>
              </div>
            </Card>
          )}

          {stats.published > 0 && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Trophy className="h-4 w-4 text-green-success" aria-hidden />
              {stats.published} test{stats.published === 1 ? "" : "s"} published to students.
              <FileQuestion className="h-4 w-4" aria-hidden />
            </p>
          )}
        </>
      )}
    </div>
  );
}
