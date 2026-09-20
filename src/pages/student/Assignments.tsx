import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileQuestion, Loader2, Upload } from "lucide-react";
import { Card, Badge } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import { fetchStudentBatchIds, uploadResourceFile } from "../../services/staff";
import { formatDate, formatDateTime } from "../../lib/utils";

interface AssignmentWithSubs {
  id: string;
  title: string;
  instructions: string | null;
  due_date: string | null;
  max_score: number | null;
  attachment_url: string | null;
  batches: { name: string } | null;
  assignment_submissions: {
    id: string;
    student_id: string;
    submitted_at: string;
    text_notes: string | null;
    attachment_url: string | null;
    score: number | null;
    feedback: string | null;
    status: string;
  }[];
}

export default function StudentAssignments() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState<AssignmentWithSubs | null>(null);

  const batchIdsQ = useQuery({
    queryKey: ["student", "batches", profile?.id],
    queryFn: () => fetchStudentBatchIds(profile!.id),
    enabled: Boolean(profile),
  });
  const batchIds = batchIdsQ.data ?? [];

  const assignmentsQ = useQuery({
    queryKey: ["student", "assignments-full", batchIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*, batches(name), assignment_submissions(*)")
        .in("batch_id", batchIds)
        .eq("status", "active")
        .order("due_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AssignmentWithSubs[];
    },
    enabled: batchIds.length > 0,
  });

  if (batchIdsQ.isLoading) return <LoadingState />;
  if (batchIdsQ.isError) return <ErrorState onRetry={() => batchIdsQ.refetch()} />;

  const assignments = (assignmentsQ.data ?? []).filter((a) =>
    a.assignment_submissions.some((s) => s.student_id === profile?.id) || true
  );
  const mySub = (a: AssignmentWithSubs) =>
    a.assignment_submissions.find((s) => s.student_id === profile?.id) ?? null;
  const overdue = (a: AssignmentWithSubs) => a.due_date && !mySub(a) && new Date(a.due_date) < new Date();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-navy sm:text-2xl">Assignments</h1>
        <p className="mt-1 text-sm text-muted">Submit your work and read teacher feedback here.</p>
      </div>

      {batchIds.length === 0 ? (
        <EmptyState title="Not enrolled yet" hint="You will see assignments once the office enrols you in a batch." />
      ) : assignmentsQ.isLoading ? (
        <LoadingState />
      ) : assignmentsQ.isError ? (
        <ErrorState onRetry={() => assignmentsQ.refetch()} />
      ) : assignments.length === 0 ? (
        <EmptyState icon={<FileQuestion className="h-8 w-8 text-muted/60" aria-hidden />} title="No assignments" hint="Your teachers have not posted any assignments yet." />
      ) : (
        <ul className="space-y-4">
          {assignments.map((a) => {
            const sub = mySub(a);
            return (
              <Card as="li" key={a.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold text-navy">{a.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {a.batches?.name ?? ""} · Due {formatDate(a.due_date)}
                      {a.max_score ? ` · Max ${a.max_score}` : ""}
                    </p>
                  </div>
                  {sub ? (
                    <Badge tone={sub.status === "graded" ? "green" : "navy"}>
                      {sub.status === "graded" ? `Graded: ${sub.score ?? "—"}${a.max_score ? `/${a.max_score}` : ""}` : "Submitted"}
                    </Badge>
                  ) : overdue(a) ? (
                    <Badge tone="red">Overdue</Badge>
                  ) : (
                    <Badge tone="saffron">Pending</Badge>
                  )}
                </div>
                {a.instructions && <p className="mt-3 text-sm text-muted">{a.instructions}</p>}
                {a.attachment_url && (
                  <a href={a.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-saffron underline">
                    View attachment
                  </a>
                )}
                {sub?.feedback && (
                  <p className="mt-3 rounded-lg bg-green-success/[0.06] p-3 text-sm text-ink">
                    <span className="font-semibold text-green-success">Teacher feedback: </span>
                    {sub.feedback}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {!sub ? (
                    <Button size="sm" onClick={() => setSubmitting(a)}>Submit Work</Button>
                  ) : (
                    <span className="text-xs text-muted">Submitted {formatDateTime(sub.submitted_at)}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </ul>
      )}

      <SubmitModal
        assignment={submitting}
        onClose={() => setSubmitting(null)}
        onSubmitted={() => {
          setSubmitting(null);
          qc.invalidateQueries({ queryKey: ["student", "assignments-full", batchIds] });
          qc.invalidateQueries({ queryKey: ["student", "assignments", batchIds] });
        }}
      />
    </div>
  );
}

function SubmitModal({
  assignment,
  onClose,
  onSubmitted,
}: {
  assignment: AssignmentWithSubs | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { profile } = useAuth();
  const [notes, setNotes] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!assignment) return null;
  const activeAssignment: AssignmentWithSubs = assignment;

  async function handleFile(file: File | undefined): Promise<void> {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setFileUrl(await uploadResourceFile(file, "submissions"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!notes.trim() && !fileUrl) {
      setError("Add notes or attach a file");
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await supabase.from("assignment_submissions").upsert(
        {
          assignment_id: activeAssignment.id,
          student_id: profile!.id,
          text_notes: notes || null,
          attachment_url: fileUrl || null,
          status: "submitted",
        },
        { onConflict: "assignment_id,student_id" }
      );
      if (err) throw err;
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Submit — ${assignment.title}`}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="sub-notes" className="mb-1.5 block text-sm font-semibold text-ink">Your notes / answer</label>
          <textarea id="sub-notes" rows={4} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div>
          <label htmlFor="sub-file" className="mb-1.5 block text-sm font-semibold text-ink">Attach a file (optional)</label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-lightgray px-4 py-4 text-sm font-semibold text-navy hover:border-navy/40">
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Uploading…</> : <><Upload className="h-4 w-4" aria-hidden /> Choose file</>}
            <input id="sub-file" type="file" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
          {fileUrl && <p className="mt-1 text-xs text-green-success">File attached ✓</p>}
        </div>
        {error && <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-lightgray pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || uploading}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Submitting…</> : "Submit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
