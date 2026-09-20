import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck } from "lucide-react";
import { Card, Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import { formatDate } from "../../lib/utils";

interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "late" | "leave";
  batches: { name: string } | null;
}

const TONE: Record<AttendanceRecord["status"], "green" | "red" | "saffron" | "navy"> = {
  present: "green",
  absent: "red",
  late: "saffron",
  leave: "navy",
};

export default function StudentAttendance() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<"all" | AttendanceRecord["status"]>("all");

  const recordsQ = useQuery({
    queryKey: ["student", "attendance-all", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("id, date, status, batches(name)")
        .eq("student_id", profile!.id)
        .order("date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as AttendanceRecord[];
    },
    enabled: Boolean(profile),
  });

  const records = useMemo(() => recordsQ.data ?? [], [recordsQ.data]);

  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, leave: 0 };
    for (const r of records) counts[r.status]++;
    const sessions = records.length;
    const attended = counts.present + counts.late;
    return {
      ...counts,
      sessions,
      rate: sessions > 0 ? Math.round((attended / sessions) * 100) : null,
    };
  }, [records]);

  const filtered = filter === "all" ? records : records.filter((r) => r.status === filter);

  if (recordsQ.isLoading) return <LoadingState />;
  if (recordsQ.isError) return <ErrorState onRetry={() => recordsQ.refetch()} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-navy sm:text-2xl">My Attendance</h1>
        <p className="mt-1 text-sm text-muted">Your attendance record across all batches.</p>
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-8 w-8 text-muted/60" aria-hidden />}
          title="No attendance records yet"
          hint="Once your teachers start marking attendance, your record will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Card className="p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Rate</p>
              <p className="font-display text-2xl font-extrabold text-navy">{summary.rate != null ? `${summary.rate}%` : "—"}</p>
            </Card>
            {(["present", "absent", "late", "leave"] as const).map((s) => (
              <Card key={s} className="p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{s}</p>
                <p className="font-display text-2xl font-extrabold text-navy">{summary[s]}</p>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(["all", "present", "absent", "late", "leave"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  filter === f ? "border-navy bg-navy text-white" : "border-lightgray bg-white text-ink hover:bg-offwhite"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <ul className="mt-4 space-y-2">
            {filtered.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-lightgray bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy">{formatDate(r.date)}</p>
                  <p className="text-xs text-muted">{r.batches?.name ?? "Batch"}</p>
                </div>
                <Badge tone={TONE[r.status]}>{r.status}</Badge>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="rounded-xl border border-dashed border-lightgray bg-white px-4 py-8 text-center text-sm text-muted">
                No {filter} records.
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
