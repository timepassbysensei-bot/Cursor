import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import { PageHeader } from "../../features/admin/PageHeader";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { DataTable } from "../../components/ui/DataTable";
import { adminService } from "../../services/admin";
import { supabase } from "../../lib/supabaseClient";
import type { Batch, Profile } from "../../types";

export default function AdminStudents() {
  const qc = useQueryClient();
  const studentsQ = useQuery({
    queryKey: ["admin", "students"],
    queryFn: () => adminService.students() as Promise<Profile[]>,
  });
  const batchesQ = useQuery({ queryKey: ["admin", "batches"], queryFn: () => adminService.batches() });
  const enrollmentsQ = useQuery({
    queryKey: ["admin", "enrollments"],
    queryFn: () => adminService.enrollments(),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [enrollFor, setEnrollFor] = useState<Profile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const students = useMemo(() => studentsQ.data ?? [], [studentsQ.data]);
  const enrollments = useMemo(() => enrollmentsQ.data ?? [], [enrollmentsQ.data]);

  const enrollmentByStudent = useMemo(() => {
    const map = new Map<string, { batch: string; status: string; id: string }[]>();
    for (const e of enrollments as Record<string, unknown>[]) {
      const sid = e.student_id as string;
      const batch = (e.batches as { name?: string } | null)?.name ?? "Batch";
      const list = map.get(sid) ?? [];
      list.push({ batch, status: String(e.status), id: String(e.id) });
      map.set(sid, list);
    }
    return map;
  }, [enrollments]);

  const deactivate = useMutation({
    mutationFn: async (s: Profile) => {
      await adminService.updateStudent(s.id, { is_active: !s.is_active });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "students"] });
      setMessage("Student updated.");
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Students"
        description="Student accounts, status and batch enrolments. New accounts are created by the academy office with a temporary password."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden /> Create Student Account
          </Button>
        }
      />

      {message && (
        <p role="status" className="mb-4 rounded-lg border border-green-success/25 bg-green-success/[0.06] px-4 py-3 text-sm text-green-success">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {studentsQ.isLoading ? (
        <LoadingState />
      ) : studentsQ.isError ? (
        <ErrorState onRetry={() => studentsQ.refetch()} />
      ) : students.length === 0 ? (
        <EmptyState
          title="No students yet"
          hint="Create the first student account — the student will set a new password at first sign-in."
          action={
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setCreateOpen(true)}>
              <UserPlus className="h-4 w-4" aria-hidden /> Create Student Account
            </Button>
          }
        />
      ) : (
        <DataTable<Profile>
          data={students}
          searchKeys={["full_name", "email", "roll_number"]}
          searchPlaceholder="Search students…"
          columns={[
            {
              key: "name",
              header: "Student",
              render: (s) => (
                <div>
                  <p className="font-semibold text-navy">{s.full_name}</p>
                  <p className="text-xs text-muted">{s.email ?? "—"}</p>
                </div>
              ),
            },
            { key: "roll", header: "Roll No.", render: (s) => s.roll_number ?? "—" },
            {
              key: "status",
              header: "Status",
              render: (s) => (
                <Badge tone={s.is_active ? "green" : "red"}>{s.is_active ? "Active" : "Deactivated"}</Badge>
              ),
            },
            {
              key: "batches",
              header: "Batches",
              render: (s) => {
                const list = enrollmentByStudent.get(s.id) ?? [];
                if (list.length === 0) return <span className="text-xs text-muted">Not enrolled</span>;
                return (
                  <span className="text-xs">
                    {list.map((b) => b.batch).join(", ")}
                  </span>
                );
              },
            },
            {
              key: "actions",
              header: "Actions",
              render: (s) => (
                <div className="flex flex-wrap gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => setEnrollFor(s)}>
                    Enrol in batch
                  </Button>
                  <Button
                    variant={s.is_active ? "danger" : "outline"}
                    size="sm"
                    disabled={deactivate.isPending}
                    onClick={() => deactivate.mutate(s)}
                  >
                    {s.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              ),
            },
          ]}
          mobileCard={(s) => (
            <div>
              <p className="font-semibold text-navy">{s.full_name}</p>
              <p className="text-xs text-muted">{s.email ?? "—"}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={s.is_active ? "green" : "red"}>{s.is_active ? "Active" : "Deactivated"}</Badge>
                {(enrollmentByStudent.get(s.id) ?? []).map((b) => (
                  <Badge key={b.id} tone="navy">{b.batch}</Badge>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setEnrollFor(s)}>
                  Enrol
                </Button>
                <Button
                  variant={s.is_active ? "danger" : "outline"}
                  size="sm"
                  className="flex-1"
                  disabled={deactivate.isPending}
                  onClick={() => deactivate.mutate(s)}
                >
                  {s.is_active ? "Deactivate" : "Reactivate"}
                </Button>
              </div>
            </div>
          )}
        />
      )}

      <CreateStudentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(msg) => {
          setCreateOpen(false);
          setMessage(msg);
          qc.invalidateQueries({ queryKey: ["admin", "students"] });
        }}
      />

      <EnrollModal
        student={enrollFor}
        batches={batchesQ.data ?? []}
        enrollments={enrollments as Record<string, unknown>[]}
        onClose={() => setEnrollFor(null)}
        onDone={() => {
          setEnrollFor(null);
          qc.invalidateQueries({ queryKey: ["admin", "enrollments"] });
        }}
      />
    </div>
  );
}

function CreateStudentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roll, setRoll] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Enter a valid email");
    if (fullName.trim().length < 2) return setError("Enter the student's full name");
    if (tempPassword.length < 8) return setError("Temporary password must be at least 8 characters");
    setBusy(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("create-student", {
        body: { email, full_name: fullName.trim(), roll_number: roll || null, temporary_password: tempPassword },
      });
      if (fnErr) throw fnErr;
      onCreated(
        (data as { message?: string })?.message ??
          "Student account created. Share the temporary password with the student — they must change it at first sign-in."
      );
      setEmail(""); setFullName(""); setRoll(""); setTempPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account. Is the create-student edge function deployed?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Student Account">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="cs-name" className="mb-1.5 block text-sm font-semibold text-ink">Full name *</label>
          <input id="cs-name" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="cs-email" className="mb-1.5 block text-sm font-semibold text-ink">Email *</label>
          <input id="cs-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="cs-roll" className="mb-1.5 block text-sm font-semibold text-ink">Roll number</label>
          <input id="cs-roll" className="input" value={roll} onChange={(e) => setRoll(e.target.value)} />
        </div>
        <div>
          <label htmlFor="cs-pass" className="mb-1.5 block text-sm font-semibold text-ink">Temporary password *</label>
          <input id="cs-pass" className="input" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} />
          <p className="mt-1 text-xs text-muted">
            Share it securely and advise the student to change it immediately after first sign-in.
          </p>
        </div>
        {error && <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-lightgray pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Creating…</> : "Create Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EnrollModal({
  student,
  batches,
  enrollments,
  onClose,
  onDone,
}: {
  student: Profile | null;
  batches: (Batch & { courses?: { title: string } })[];
  enrollments: Record<string, unknown>[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [batchId, setBatchId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!student) return null;

  const existing = new Set(
    enrollments.filter((e) => e.student_id === student.id).map((e) => e.batch_id as string)
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!batchId || !student) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.upsertEnrollment({ student_id: student.id, batch_id: batchId, status: "active" });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enrol the student.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={Boolean(student)} onClose={onClose} title={`Enrol ${student.full_name}`}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="en-batch" className="mb-1.5 block text-sm font-semibold text-ink">Batch *</label>
          <select id="en-batch" className="input" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">Select a batch…</option>
            {batches
              .filter((b) => b.status !== "archived")
              .map((b) => (
                <option key={b.id} value={b.id} disabled={existing.has(b.id)}>
                  {b.name} — {b.courses?.title ?? "course"}{existing.has(b.id) ? " (already enrolled)" : ""}
                </option>
              ))}
          </select>
        </div>
        {error && <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-lightgray pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || !batchId}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Enrolling…</> : "Enrol Student"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
