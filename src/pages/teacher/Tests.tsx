import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { PageHeader } from "../../features/admin/PageHeader";
import { Card, Badge } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchTeacherBatches,
  fetchSubjects,
  fetchBatchTests,
  upsertTest,
} from "../../services/staff";
import { formatDate } from "../../lib/utils";

export default function TeacherTests() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [batchId, setBatchId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const batchesQ = useQuery({
    queryKey: ["teacher", "batches", profile?.id],
    queryFn: () => fetchTeacherBatches(profile!.role, profile!.id),
    enabled: Boolean(profile),
  });

  useEffect(() => {
    if (!batchId && batchesQ.data && batchesQ.data.length > 0) setBatchId(batchesQ.data[0].id);
  }, [batchesQ.data, batchId]);

  const testsQ = useQuery({
    queryKey: ["teacher", "tests", batchId],
    queryFn: () => fetchBatchTests(batchId),
    enabled: Boolean(batchId),
  });

  const tests = testsQ.data ?? [];

  return (
    <div>
      <PageHeader
        title="Tests & Marks"
        description="Create tests for your batches and enter marks. Results become visible to students only after you publish them."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!batchId}>
            <Plus className="h-4 w-4" aria-hidden /> New Test
          </Button>
        }
      />

      {batchesQ.isLoading ? (
        <LoadingState />
      ) : batchesQ.isError ? (
        <ErrorState onRetry={() => batchesQ.refetch()} />
      ) : (batchesQ.data ?? []).length === 0 ? (
        <EmptyState title="No batches assigned" hint="The office assigns batches to teachers." />
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <label htmlFor="tst-batch" className="mb-1.5 block text-sm font-semibold text-ink">Batch</label>
            <select id="tst-batch" className="input" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
              {(batchesQ.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {testsQ.isLoading ? (
            <LoadingState />
          ) : testsQ.isError ? (
            <ErrorState onRetry={() => testsQ.refetch()} />
          ) : tests.length === 0 ? (
            <EmptyState
              title="No tests yet"
              hint="Create your first test for this batch — then enter marks per subject."
              action={
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden /> New Test
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {tests.map((t) => (
                <Card as="li" key={t.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy">{t.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDate(t.test_date)} · {t.subject_ids.length} subject{t.subject_ids.length === 1 ? "" : "s"} · max {t.max_marks_per_subject}/subject
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        t.status === "published" ? "green" : t.status === "scheduled" ? "gray" : "saffron"
                      }
                    >
                      {t.status.replace("_", " ")}
                    </Badge>
                    <Link to={`/teacher/tests/${t.id}/marks`}>
                      <Button variant="outline" size="sm">
                        {t.status === "scheduled" ? "Enter marks" : "Review marks"}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </>
      )}

      <CreateTestModal
        open={createOpen}
        batchId={batchId}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          qc.invalidateQueries({ queryKey: ["teacher", "tests", batchId] });
        }}
      />
    </div>
  );
}

function CreateTestModal({
  open,
  batchId,
  onClose,
  onCreated,
}: {
  open: boolean;
  batchId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { profile } = useAuth();
  const subjectsQ = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects, enabled: open });
  const [title, setTitle] = useState("");
  const [testDate, setTestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [maxMarks, setMaxMarks] = useState("100");
  const [passing, setPassing] = useState("33");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Enter a test title");
    if (subjectIds.length === 0) return setError("Select at least one subject");
    setBusy(true);
    try {
      await upsertTest({
        batch_id: batchId,
        title: title.trim(),
        test_date: testDate,
        subject_ids: subjectIds,
        max_marks_per_subject: Number(maxMarks) || 100,
        passing_percent: Number(passing) || 33,
        status: "scheduled",
        created_by: profile?.id,
      });
      setTitle("");
      setSubjectIds([]);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the test.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Test">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="nt-title" className="mb-1.5 block text-sm font-semibold text-ink">Title *</label>
          <input id="nt-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly Test 4 — Maths & English" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="nt-date" className="mb-1.5 block text-sm font-semibold text-ink">Date *</label>
            <input id="nt-date" type="date" className="input" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="nt-max" className="mb-1.5 block text-sm font-semibold text-ink">Max marks / subject</label>
            <input id="nt-max" type="number" min={1} className="input" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
          </div>
          <div>
            <label htmlFor="nt-pass" className="mb-1.5 block text-sm font-semibold text-ink">Passing %</label>
            <input id="nt-pass" type="number" min={0} max={100} className="input" value={passing} onChange={(e) => setPassing(e.target.value)} />
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">Subjects *</legend>
          {subjectsQ.isLoading ? (
            <p className="text-sm text-muted">Loading subjects…</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(subjectsQ.data ?? []).map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-lightgray text-saffron focus:ring-saffron"
                    checked={subjectIds.includes(s.id)}
                    onChange={(e) =>
                      setSubjectIds((ids) => (e.target.checked ? [...ids, s.id] : ids.filter((i) => i !== s.id)))
                    }
                  />
                  {s.name}
                </label>
              ))}
            </div>
          )}
          {subjectsQ.data && subjectsQ.data.length === 0 && (
            <p className="text-xs text-muted">No subjects configured. Ask the admin to add subjects first.</p>
          )}
        </fieldset>
        {error && <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-lightgray pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Creating…</> : "Create Test"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
