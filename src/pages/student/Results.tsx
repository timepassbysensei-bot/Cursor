import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { Card, Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useAuth } from "../../hooks/useAuth";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { supabase } from "../../lib/supabaseClient";
import { fetchStudentBatchIds } from "../../services/staff";
import {
  calculateStudentResult,
  type SubjectColumn,
  type StudentMarkRow,
} from "../../features/marks/marksMath";
import { formatDate } from "../../lib/utils";

interface TestInfo {
  id: string;
  title: string;
  test_date: string;
  publish_result: boolean;
  subject_ids: string[];
  max_marks_per_subject: number;
  passing_percent: number;
  batch_id: string;
  batches: { name: string } | null;
}

interface MarkInfo {
  test_id: string;
  subject_id: string;
  marks_obtained: number | null;
  is_absent: boolean;
}

interface SubjectInfo {
  id: string;
  name: string;
}

export default function StudentResults() {
  const { profile } = useAuth();
  const { data: settings } = useSiteSettings();
  const rankingEnabled = settings?.feature_flags?.ranking_enabled ?? false;

  const batchIdsQ = useQuery({
    queryKey: ["student", "batches", profile?.id],
    queryFn: () => fetchStudentBatchIds(profile!.id),
    enabled: Boolean(profile),
  });
  const batchIds = batchIdsQ.data ?? [];

  const testsQ = useQuery({
    queryKey: ["student", "tests-published", batchIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tests")
        .select("id, title, test_date, publish_result, subject_ids, max_marks_per_subject, passing_percent, batch_id, batches(name)")
        .in("batch_id", batchIds)
        .eq("publish_result", true)
        .order("test_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TestInfo[];
    },
    enabled: batchIds.length > 0,
  });

  const marksQ = useQuery({
    queryKey: ["student", "marks", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marks")
        .select("test_id, subject_id, marks_obtained, is_absent")
        .eq("student_id", profile!.id);
      if (error) throw error;
      return (data ?? []) as MarkInfo[];
    },
    enabled: Boolean(profile),
  });

  const subjectsQ = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id, name");
      if (error) throw error;
      return (data ?? []) as SubjectInfo[];
    },
  });

  const subjectName = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of subjectsQ.data ?? []) map.set(s.id, s.name);
    return map;
  }, [subjectsQ.data]);

  if (batchIdsQ.isLoading) return <LoadingState />;
  if (batchIdsQ.isError) return <ErrorState onRetry={() => batchIdsQ.refetch()} />;

  const tests = testsQ.data ?? [];
  const marks = marksQ.data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-navy sm:text-2xl">My Results</h1>
        <p className="mt-1 text-sm text-muted">
          Only tests your teacher has published appear here. Missing marks are shown as pending — never as zero.
        </p>
      </div>

      {batchIds.length === 0 ? (
        <EmptyState title="Not enrolled yet" hint="Results appear once you are enrolled in a batch." />
      ) : testsQ.isLoading || marksQ.isLoading ? (
        <LoadingState />
      ) : testsQ.isError ? (
        <ErrorState onRetry={() => testsQ.refetch()} />
      ) : tests.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-8 w-8 text-muted/60" aria-hidden />}
          title="No published results yet"
          hint="When a teacher publishes a test's results, they will appear here."
        />
      ) : (
        <ul className="space-y-4">
          {tests.map((t) => {
            const columns: SubjectColumn[] = (t.subject_ids ?? [])
              .map((id) => ({ subject_id: id, name: subjectName.get(id) ?? "Subject", max_marks: t.max_marks_per_subject }))
              .filter((c) => subjectName.has(c.subject_id));
            const myMarks = marks.filter((m) => m.test_id === t.id);
            const row: StudentMarkRow = {
              student_id: profile!.id,
              student_name: profile?.full_name ?? "",
              cells: Object.fromEntries(
                myMarks.map((m) => [m.subject_id, { marks_obtained: m.marks_obtained == null ? null : Number(m.marks_obtained), is_absent: m.is_absent }])
              ),
            };
            const result = calculateStudentResult(row, columns, t.passing_percent);

            return (
              <Card as="li" key={t.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-bold text-navy">{t.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{t.batches?.name ?? ""} · {formatDate(t.test_date)}</p>
                  </div>
                  {result.isComplete ? (
                    <Badge tone={result.pass ? "green" : "red"}>
                      {result.pass ? "Pass" : "Needs improvement"}
                    </Badge>
                  ) : (
                    <Badge tone="gray">Result incomplete</Badge>
                  )}
                </div>

                <div className="table-scroll mt-4">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-lightgray">
                        <th scope="col" className="py-2 pr-4 font-display text-xs font-bold uppercase tracking-wide text-muted">Subject</th>
                        <th scope="col" className="py-2 pr-4 font-display text-xs font-bold uppercase tracking-wide text-muted">Marks</th>
                        <th scope="col" className="py-2 font-display text-xs font-bold uppercase tracking-wide text-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((c) => {
                        const cell = row.cells[c.subject_id];
                        if (!cell) {
                          return (
                            <tr key={c.subject_id} className="border-b border-lightgray/60 last:border-0">
                              <td className="py-2 pr-4 text-ink">{c.name}</td>
                              <td className="py-2 pr-4 text-muted">—</td>
                              <td className="py-2"><Badge tone="gray">Pending entry</Badge></td>
                            </tr>
                          );
                        }
                        if (cell.is_absent) {
                          return (
                            <tr key={c.subject_id} className="border-b border-lightgray/60 last:border-0">
                              <td className="py-2 pr-4 text-ink">{c.name}</td>
                              <td className="py-2 pr-4 text-muted">—</td>
                              <td className="py-2"><Badge tone="saffron">Absent</Badge></td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={c.subject_id} className="border-b border-lightgray/60 last:border-0">
                            <td className="py-2 pr-4 text-ink">{c.name}</td>
                            <td className="py-2 pr-4 font-semibold text-navy">
                              {cell.marks_obtained ?? "—"}/{c.max_marks}
                            </td>
                            <td className="py-2">
                              {cell.marks_obtained == null ? (
                                <Badge tone="gray">Pending</Badge>
                              ) : cell.marks_obtained >= (c.max_marks * t.passing_percent) / 100 ? (
                                <Badge tone="green">Pass</Badge>
                              ) : (
                                <Badge tone="red">Below pass mark</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {result.isComplete && (
                  <p className="mt-4 rounded-lg bg-offwhite px-4 py-3 text-sm">
                    <span className="font-semibold text-navy">Total: </span>
                    {result.totalObtained}/{result.totalMax}{" "}
                    <span className="font-semibold text-navy">({result.percentage}%)</span>
                    {rankingEnabled && <RankNote testId={t.id} percentage={result.percentage ?? 0} />}
                  </p>
                )}
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RankNote({
  testId,
  percentage,
}: {
  testId: string;
  percentage: number;
  columns?: SubjectColumn[];
}) {
  const ranksQ = useQuery({
    queryKey: ["student", "rank", testId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("test_ranks", { p_test_id: testId });
      if (error) throw error;
      return data as Record<string, number>;
    },
  });
  if (ranksQ.isLoading || ranksQ.isError || !ranksQ.data) return null;
  const rank = ranksQ.data[percentage.toString()];
  if (rank == null) return null;
  return <span className="text-muted"> · Rank {rank}</span>;
}
