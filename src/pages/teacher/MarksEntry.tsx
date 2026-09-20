import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Send } from "lucide-react";
import { PageHeader } from "../../features/admin/PageHeader";
import { Card, Badge } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Modal";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import { fetchRoster, fetchSubjects, fetchMarks, upsertMarks, markTestPublished, type TestRow } from "../../services/staff";
import { calculateStudentResult, computeBatchStats, type MarkCell } from "../../features/marks/marksMath";
import { formatDate } from "../../lib/utils";

export default function TeacherMarksEntry() {
  const { testId = "" } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const qc = useQueryClient();

  const [cells, setCells] = useState<Record<string, Record<string, MarkCell>>>({});
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testsQ = useQuery({
    queryKey: ["teacher", "test", testId],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("tests")
        .select("*, batches(id, name, faculty_teacher_id)")
        .eq("id", testId)
        .maybeSingle();
      if (err) throw err;
      return data;
    },
    enabled: Boolean(testId),
  });

  const test = testsQ.data as
    | (TestRow & {
        batches: { id: string; name: string; faculty_teacher_id: string | null } | null;
      })
    | undefined;

  const batchId = test?.batch_id ?? "";

  const subjectsQ = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects, enabled: Boolean(test) });
  const rosterQ = useQuery({
    queryKey: ["teacher", "roster", batchId],
    queryFn: () => fetchRoster(batchId),
    enabled: Boolean(batchId),
  });
  const marksQ = useQuery({
    queryKey: ["teacher", "marks", testId],
    queryFn: () => fetchMarks(testId),
    enabled: Boolean(testId),
  });

  useEffect(() => {
    const map: Record<string, Record<string, MarkCell>> = {};
    for (const m of marksQ.data ?? []) {
      map[m.student_id] = map[m.student_id] ?? {};
      map[m.student_id][m.subject_id] = {
        marks_obtained: m.marks_obtained == null ? null : Number(m.marks_obtained),
        is_absent: m.is_absent,
      };
    }
    setCells(map);
    setDirty(false);
  }, [marksQ.data]);

  const columns = useMemo(() => {
    const all = subjectsQ.data ?? [];
    return all
      .filter((s) => test?.subject_ids?.includes(s.id))
      .map((s) => ({ subject_id: s.id, name: s.name, max_marks: test?.max_marks_per_subject ?? 100 }));
  }, [subjectsQ.data, test]);

  const roster = useMemo(() => rosterQ.data ?? [], [rosterQ.data]);

  const rows = useMemo(
    () =>
      roster.map((s) => ({
        student_id: s.id,
        student_name: s.full_name,
        cells: cells[s.id] ?? {},
      })),
    [roster, cells]
  );

  const stats = useMemo(
    () => computeBatchStats(rows, columns, test?.passing_percent ?? 33),
    [rows, columns, test?.passing_percent]
  );

  const save = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      const payload = [];
      for (const [student_id, subjectMap] of Object.entries(cells)) {
        for (const [subject_id, cell] of Object.entries(subjectMap)) {
          if (cell.is_absent || cell.marks_obtained != null) {
            payload.push({
              test_id: testId,
              student_id,
              subject_id,
              marks_obtained: cell.is_absent ? null : cell.marks_obtained,
              is_absent: cell.is_absent,
              entered_by: profile.id,
            });
          }
        }
      }
      await upsertMarks(payload);
    },
    onSuccess: () => {
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 2500);
      qc.invalidateQueries({ queryKey: ["teacher", "marks", testId] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const publish = useMutation({
    mutationFn: async () => {
      await save.mutateAsync();
      await markTestPublished(testId, true);
    },
    onSuccess: () => {
      setPublishConfirm(false);
      qc.invalidateQueries({ queryKey: ["teacher", "test", testId] });
      qc.invalidateQueries({ queryKey: ["teacher", "tests", batchId] });
      navigate("/teacher/tests");
    },
    onError: (e: Error) => setError(e.message),
  });

  if (testsQ.isLoading) return <LoadingState />;
  if (testsQ.isError) return <ErrorState onRetry={() => testsQ.refetch()} />;
  if (!test) return <EmptyState title="Test not found" hint="It may have been deleted." />;
  if (!columns.length && !subjectsQ.isLoading)
    return <EmptyState title="No subjects configured" hint="Ask the admin to add subjects before entering marks." />;

  const published = test.publish_result;

  return (
    <div>
      <Link to="/teacher/tests" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to tests
      </Link>
      <PageHeader
        title={test.title}
        description={`${formatDate(test.test_date)} · passing at ${test.passing_percent}% per subject · marks are saved per student; missing marks are never counted as zero.`}
        actions={
          <>
            {saved && <span className="self-center text-sm font-semibold text-green-success" role="status">Saved ✓</span>}
            <Button size="sm" variant="outline" onClick={() => save.mutate()} disabled={save.isPending || !dirty}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              Save Draft
            </Button>
            <Button size="sm" onClick={() => setPublishConfirm(true)} disabled={publish.isPending || published}>
              <Send className="h-4 w-4" aria-hidden /> {published ? "Published" : "Publish to Students"}
            </Button>
          </>
        }
      />

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">{error}</p>
      )}
      {published && (
        <p className="mb-4 rounded-lg border border-green-success/25 bg-green-success/[0.06] px-4 py-3 text-sm text-green-success" role="status">
          Results for this test are published — students can see their marks.
        </p>
      )}

      {rosterQ.isLoading || marksQ.isLoading ? (
        <LoadingState />
      ) : rosterQ.isError ? (
        <ErrorState onRetry={() => rosterQ.refetch()} />
      ) : roster.length === 0 ? (
        <EmptyState title="No students enrolled" hint="Enrol students into this batch to enter marks." />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge tone="navy">Average: {stats.averagePercent != null ? `${stats.averagePercent}%` : "—"}</Badge>
            <Badge tone="green">Pass: {stats.passCount}</Badge>
            <Badge tone="red">Fail: {stats.failCount}</Badge>
            <Badge tone="saffron">Absent: {stats.absentCount}</Badge>
            <Badge tone="gray">Incomplete: {stats.incompleteCount}</Badge>
          </div>

          {/* Mobile: per-student card */}
          <div className="space-y-3 md:hidden">
            {roster.map((s) => (
              <Card key={s.id} className="p-4">
                <p className="font-semibold text-navy">{s.full_name}</p>
                <div className="mt-3 space-y-2">
                  {columns.map((col) => {
                    const cell = cells[s.id]?.[col.subject_id];
                    return (
                      <div key={col.subject_id} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted">{col.name}</span>
                        <MarksInput
                          value={cell ?? null}
                          max={col.max_marks}
                          onChange={(c) => {
                            setCells((prev) => ({ ...prev, [s.id]: { ...(prev[s.id] ?? {}), [col.subject_id]: c } }));
                            setDirty(true);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop grid */}
          <div className="table-scroll hidden rounded-xl border border-lightgray bg-white shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-lightgray bg-offwhite">
                  <th scope="col" className="px-4 py-3 font-display text-xs font-bold uppercase tracking-wide text-muted">Student</th>
                  {columns.map((c) => (
                    <th key={c.subject_id} scope="col" className="px-4 py-3 font-display text-xs font-bold uppercase tracking-wide text-muted">
                      {c.name} <span className="normal-case text-muted/60">/{c.max_marks}</span>
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 font-display text-xs font-bold uppercase tracking-wide text-muted">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const result = calculateStudentResult(row, columns, test?.passing_percent ?? 33);
                  return (
                    <tr key={row.student_id} className="border-b border-lightgray/70 last:border-0">
                      <td className="px-4 py-2 font-medium text-navy">{row.student_name}</td>
                      {columns.map((col) => (
                        <td key={col.subject_id} className="px-2 py-2">
                          <MarksInput
                            value={row.cells[col.subject_id] ?? null}
                            max={col.max_marks}
                            onChange={(c) => {
                              setCells((prev) => ({
                                ...prev,
                                [row.student_id]: { ...(prev[row.student_id] ?? {}), [col.subject_id]: c },
                              }));
                              setDirty(true);
                            }}
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        {result.isComplete ? (
                          <span className={result.pass ? "font-semibold text-green-success" : "font-semibold text-error"}>
                            {result.totalObtained}/{result.totalMax} ({result.percentage}%)
                          </span>
                        ) : (
                          <span className="text-xs text-muted">Incomplete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={publishConfirm}
        title="Publish results to students?"
        message="Students in this batch will be able to see their own marks, total and pass/fail status. Publish only after verifying the entries."
        confirmLabel="Publish"
        onConfirm={() => publish.mutate()}
        onCancel={() => setPublishConfirm(false)}
      />
    </div>
  );
}

function MarksInput({
  value,
  max,
  onChange,
}: {
  value: MarkCell | null;
  max: number;
  onChange: (cell: MarkCell) => void;
}) {
  const absent = value?.is_absent ?? false;
  const marks = absent ? "" : value?.marks_obtained?.toString() ?? "";
  return (
    <div className="flex items-center gap-1.5">
      <label className="sr-only">Marks</label>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        disabled={absent}
        placeholder="—"
        value={marks}
        onChange={(e) => onChange({ marks_obtained: e.target.value === "" ? null : Number(e.target.value), is_absent: false })}
        aria-label={`Marks out of ${max}`}
        className="h-9 w-16 rounded-lg border border-lightgray px-2 text-sm text-ink focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 disabled:bg-lightgray/40 disabled:text-muted"
      />
      <button
        type="button"
        onClick={() => onChange({ marks_obtained: null, is_absent: !absent })}
        aria-pressed={absent}
        title="Absent"
        className={`h-9 rounded-lg border px-2 text-xs font-semibold ${
          absent ? "border-error bg-error text-white" : "border-lightgray bg-white text-muted hover:bg-offwhite"
        }`}
      >
        A
      </button>
    </div>
  );
}
