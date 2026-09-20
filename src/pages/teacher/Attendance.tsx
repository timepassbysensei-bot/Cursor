import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CheckCheck, Loader2 } from "lucide-react";
import { PageHeader } from "../../features/admin/PageHeader";
import { Card, Badge } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useAuth } from "../../hooks/useAuth";
import { fetchTeacherBatches, fetchRoster, fetchAttendance, upsertAttendance } from "../../services/staff";
import { cn } from "../../lib/utils";

type Status = "present" | "absent" | "late" | "leave";

const STATUSES: { value: Status; label: string; short: string; tone: string }[] = [
  { value: "present", label: "Present", short: "P", tone: "bg-green-success text-white" },
  { value: "absent", label: "Absent", short: "A", tone: "bg-error text-white" },
  { value: "late", label: "Late", short: "L", tone: "bg-saffron text-white" },
  { value: "leave", label: "Leave", short: "Lv", tone: "bg-navy text-white" },
];

export default function TeacherAttendance() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [saved, setSaved] = useState(false);

  const batchesQ = useQuery({
    queryKey: ["teacher", "batches", profile?.id],
    queryFn: () => fetchTeacherBatches(profile!.role, profile!.id),
    enabled: Boolean(profile),
  });

  useEffect(() => {
    if (!batchId && batchesQ.data && batchesQ.data.length > 0) {
      setBatchId(batchesQ.data[0].id);
    }
  }, [batchesQ.data, batchId]);

  const rosterQ = useQuery({
    queryKey: ["teacher", "roster", batchId],
    queryFn: () => fetchRoster(batchId),
    enabled: Boolean(batchId),
  });

  const existingQ = useQuery({
    queryKey: ["teacher", "attendance", batchId, date],
    queryFn: () => fetchAttendance(batchId, date),
    enabled: Boolean(batchId),
  });

  useEffect(() => {
    const map: Record<string, Status> = {};
    for (const row of existingQ.data ?? []) map[row.student_id] = row.status;
    setMarks(map);
  }, [existingQ.data]);

  const roster = rosterQ.data ?? [];
  const markedCount = Object.keys(marks).length;

  const save = useMutation({
    mutationFn: async () => {
      if (!profile || !batchId) return;
      const rows = Object.entries(marks).map(([student_id, status]) => ({
        batch_id: batchId,
        student_id,
        date,
        status,
        marked_by: profile.id,
      }));
      await upsertAttendance(rows);
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      qc.invalidateQueries({ queryKey: ["teacher", "attendance", batchId, date] });
    },
  });

  const summary = useMemo(() => {
    const counts: Record<Status, number> = { present: 0, absent: 0, late: 0, leave: 0 };
    for (const s of Object.values(marks)) counts[s]++;
    return counts;
  }, [marks]);

  if (batchesQ.isLoading) return <LoadingState />;
  if (batchesQ.isError) return <ErrorState onRetry={() => batchesQ.refetch()} />;

  const batches = batchesQ.data ?? [];

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark daily attendance for your batches. Saving again overwrites the same day's record."
      />

      {batches.length === 0 ? (
        <EmptyState title="No batches assigned" hint="The office assigns batches to teachers." />
      ) : (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-end gap-4 p-4">
            <div className="min-w-[200px] flex-1">
              <label htmlFor="att-batch" className="mb-1.5 block text-sm font-semibold text-ink">Batch</label>
              <select id="att-batch" className="input" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="att-date" className="mb-1.5 block text-sm font-semibold text-ink">Date</label>
              <input id="att-date" type="date" className="input" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const all: Record<string, Status> = {};
                for (const s of roster) all[s.id] = "present";
                setMarks(all);
              }}
              disabled={roster.length === 0}
            >
              <CheckCheck className="h-4 w-4" aria-hidden /> Mark all present
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || markedCount === 0}>
              {save.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Saving…</>
              ) : (
                <><CalendarCheck className="h-4 w-4" aria-hidden /> Save Attendance</>
              )}
            </Button>
            {saved && <span className="self-center text-sm font-semibold text-green-success" role="status">Saved ✓</span>}
          </Card>

          {save.isError && (
            <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">
              {(save.error as Error)?.message ?? "Could not save attendance."}
            </p>
          )}

          {rosterQ.isLoading || existingQ.isLoading ? (
            <LoadingState />
          ) : rosterQ.isError ? (
            <ErrorState onRetry={() => rosterQ.refetch()} />
          ) : roster.length === 0 ? (
            <EmptyState title="No students enrolled" hint="Enrol students into this batch from the admin Students page." />
          ) : (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                {(Object.entries(summary) as [Status, number][]).map(([k, v]) => (
                  <Badge key={k} tone={k === "present" ? "green" : k === "absent" ? "red" : k === "late" ? "saffron" : "navy"}>
                    {k}: {v}
                  </Badge>
                ))}
                <Badge tone="gray">unmarked: {roster.length - markedCount}</Badge>
              </div>

              <ul className="space-y-2">
                {roster.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lightgray bg-white p-3 sm:p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">{s.full_name}</p>
                      <p className="text-xs text-muted">{s.roll_number ?? "No roll no."}</p>
                    </div>
                    <div className="flex gap-1.5" role="group" aria-label={`Attendance for ${s.full_name}`}>
                      {STATUSES.map((st) => (
                        <button
                          key={st.value}
                          type="button"
                          onClick={() => setMarks((m) => ({ ...m, [s.id]: st.value }))}
                          aria-pressed={marks[s.id] === st.value}
                          title={st.label}
                          className={cn(
                            "h-9 w-11 rounded-lg border text-xs font-bold transition-colors",
                            marks[s.id] === st.value
                              ? st.tone
                              : "border-lightgray bg-white text-muted hover:bg-offwhite"
                          )}
                        >
                          <span className="sr-only sm:hidden">{st.short}</span>
                          <span className="hidden sm:inline">{st.short}</span>
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
