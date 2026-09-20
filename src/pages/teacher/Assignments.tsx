import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileQuestion, Loader2, Plus } from "lucide-react";
import { PageHeader } from "../../features/admin/PageHeader";
import { Card, Badge } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchTeacherBatches,
  fetchBatchAssignments,
  fetchRoster,
  upsertAssignment,
  gradeSubmission,
  type AssignmentRow,
} from "../../services/staff";
import { formatDate, formatDateTime } from "../../lib/utils";

export default function TeacherAssignments() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [batchId, setBatchId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewing, setReviewing] = useState<AssignmentRow | null>(null);

  const batchesQ = useQuery({
    queryKey: ["teacher", "batches", profile?.id],
    queryFn: () => fetchTeacherBatches(profile!.role, profile!.id),
    enabled: Boolean(profile),
  });

  useEffect(() => {
    if (!batchId && batchesQ.data && batchesQ.data.length > 0) setBatchId(batchesQ.data[0].id);
  }, [batchesQ.data, batchId]);

  const assignmentsQ = useQuery({
    queryKey: ["teacher", "assignments", batchId],
    queryFn: () => fetchBatchAssignments(batchId),
    enabled: Boolean(batchId),
  });

  const assignments = useMemo(() => assignmentsQ.data ?? [], [assignmentsQ.data]);
  const pendingReview = useMemo(
    () =>
      assignments.reduce(
        (n, a) => n + (a.assignment_submissions ?? []).filter((s) => s.status === "submitted").length,
        0
      ),
    [assignments]
  );

  if (batchesQ.isLoading) return <LoadingState />;
  if (batchesQ.isError) return <ErrorState onRetry={() => batchesQ.refetch()} />;
  const batches = batchesQ.data ?? [];

  return (
    <div>
      <PageHeader
        title="Assignments"
        description={pendingReview > 0 ? `${pendingReview} submission${pendingReview === 1 ? "" : "s"} waiting for your review.` : "Create assignments and grade student submissions."}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!batchId}>
            <Plus className="h-4 w-4" aria-hidden /> New Assignment
          </Button>
        }
      />

      {batches.length === 0 ? (
        <EmptyState title="No batches assigned" hint="The office assigns batches to teachers." />
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <label htmlFor="as-batch" className="mb-1.5 block text-sm font-semibold text-ink">Batch</label>
            <select id="as-batch" className="input" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {assignmentsQ.isLoading ? (
            <LoadingState />
          ) : assignmentsQ.isError ? (
            <ErrorState onRetry={() => assignmentsQ.refetch()} />
          ) : assignments.length === 0 ? (
            <EmptyState
              icon={<FileQuestion className="h-8 w-8 text-muted/60" aria-hidden />}
              title="No assignments yet"
              hint="Create an assignment with a due date; students submit from their portal."
              action={
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden /> New Assignment
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {assignments.map((a) => {
                const subs = a.assignment_submissions ?? [];
                const pending = subs.filter((s) => s.status === "submitted").length;
                return (
                  <Card as="li" key={a.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy">{a.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Due {formatDate(a.due_date)} · {subs.length} submitted
                        {a.max_score ? ` · max ${a.max_score}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pending > 0 && <Badge tone="saffron">{pending} to grade</Badge>}
                      <Button variant="outline" size="sm" onClick={() => setReviewing(a)}>
                        Review
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </ul>
          )}
        </>
      )}

      <CreateAssignmentModal
        open={createOpen}
        batchId={batchId}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          qc.invalidateQueries({ queryKey: ["teacher", "assignments", batchId] });
        }}
      />

      <ReviewModal
        assignment={reviewing}
        onClose={() => setReviewing(null)}
        onGraded={() => {
          qc.invalidateQueries({ queryKey: ["teacher", "assignments", batchId] });
          setReviewing(null);
        }}
      />
    </div>
  );
}

function CreateAssignmentModal({
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
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Enter a title");
    setBusy(true);
    try {
      await upsertAssignment({
        batch_id: batchId,
        title: title.trim(),
        instructions: instructions || null,
        due_date: dueDate || null,
        max_score: maxScore ? Number(maxScore) : null,
        attachment_url: attachmentUrl || null,
        status: "active",
        created_by: profile?.id,
      });
      setTitle(""); setInstructions(""); setDueDate(""); setMaxScore(""); setAttachmentUrl("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the assignment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Assignment" wide>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="na-title" className="mb-1.5 block text-sm font-semibold text-ink">Title *</label>
          <input id="na-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="na-inst" className="mb-1.5 block text-sm font-semibold text-ink">Instructions</label>
          <textarea id="na-inst" rows={4} className="input" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="na-due" className="mb-1.5 block text-sm font-semibold text-ink">Due date</label>
            <input id="na-due" type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="na-score" className="mb-1.5 block text-sm font-semibold text-ink">Max score</label>
            <input id="na-score" type="number" min={0} className="input" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
          </div>
          <div>
            <label htmlFor="na-url" className="mb-1.5 block text-sm font-semibold text-ink">Attachment URL</label>
            <input id="na-url" type="url" className="input" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} />
          </div>
        </div>
        {error && <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-lightgray pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Creating…</> : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ReviewModal({
  assignment,
  onClose,
  onGraded,
}: {
  assignment: AssignmentRow | null;
  onClose: () => void;
  onGraded: () => void;
}) {
  const namesQ = useQuery({
    queryKey: ["teacher", "roster", assignment?.batch_id],
    queryFn: () => fetchRoster(assignment!.batch_id),
    enabled: Boolean(assignment),
  });

  const roster = useMemo(() => namesQ.data ?? [], [namesQ.data]);

  const [grades, setGrades] = useState<Record<string, { score: string; feedback: string }>>({});

  useEffect(() => {
    const map: Record<string, { score: string; feedback: string }> = {};
    for (const s of assignment?.assignment_submissions ?? []) {
      map[s.student_id] = { score: s.score?.toString() ?? "", feedback: s.feedback ?? "" };
    }
    setGrades(map);
  }, [assignment]);

  const grade = useMutation({
    mutationFn: async (sub: { id: string; student_id: string }) => {
      const g = grades[sub.student_id];
      await gradeSubmission(sub.id, g?.score ? Number(g.score) : null, g?.feedback || null);
    },
    onSuccess: onGraded,
  });

  if (!assignment) return null;
  const subs = assignment.assignment_submissions ?? [];

  return (
    <Modal open onClose={onClose} title={`Submissions — ${assignment.title}`} wide>
      {subs.length === 0 ? (
        <EmptyState compact title="No submissions yet" hint="Students have not submitted this assignment." />
      ) : (
        <ul className="space-y-4">
          {subs.map((s) => (
            <li key={s.id} className="rounded-xl border border-lightgray p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-navy">
                  {roster.find((r) => r.id === s.student_id)?.full_name ?? "Student"}
                </p>
                <Badge tone={s.status === "graded" ? "green" : "saffron"}>{s.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">Submitted {formatDateTime(s.submitted_at)}</p>
              {s.text_notes && <p className="mt-2 rounded-lg bg-offwhite p-3 text-sm text-ink">{s.text_notes}</p>}
              {s.attachment_url && (
                <a href={s.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-saffron underline">
                  View attachment
                </a>
              )}
              <div className="mt-3 grid gap-3 sm:grid-cols-[100px_1fr]">
                <div>
                  <label htmlFor={`g-score-${s.id}`} className="mb-1 block text-xs font-semibold text-ink">
                    Score{assignment.max_score ? ` / ${assignment.max_score}` : ""}
                  </label>
                  <input
                    id={`g-score-${s.id}`}
                    type="number"
                    className="input h-9"
                    value={grades[s.student_id]?.score ?? ""}
                    onChange={(e) =>
                      setGrades((g) => ({ ...g, [s.student_id]: { score: e.target.value, feedback: g[s.student_id]?.feedback ?? "" } }))
                    }
                  />
                </div>
                <div>
                  <label htmlFor={`g-fb-${s.id}`} className="mb-1 block text-xs font-semibold text-ink">Feedback</label>
                  <input
                    id={`g-fb-${s.id}`}
                    className="input h-9"
                    value={grades[s.student_id]?.feedback ?? ""}
                    onChange={(e) =>
                      setGrades((g) => ({ ...g, [s.student_id]: { score: g[s.student_id]?.score ?? "", feedback: e.target.value } }))
                    }
                  />
                </div>
              </div>
              <div className="mt-3 text-right">
                <Button size="sm" onClick={() => grade.mutate({ id: s.id, student_id: s.student_id })} disabled={grade.isPending}>
                  {grade.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Save Grade"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}


