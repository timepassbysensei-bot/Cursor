import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "../../features/admin/PageHeader";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { adminService } from "../../services/admin";
import { supabase } from "../../lib/supabaseClient";
import type { Profile } from "../../types";

export default function AdminTeachers() {
  const qc = useQueryClient();
  const teachersQ = useQuery({
    queryKey: ["admin", "teachers"],
    queryFn: () => adminService.teachers() as Promise<Profile[]>,
  });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const teachers = teachersQ.data ?? [];

  const toggle = useMutation({
    mutationFn: async (t: Profile) => {
      await supabase.from("profiles").update({ is_active: !t.is_active }).eq("id", t.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "teachers"] });
      setMessage("Teacher updated.");
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Faculty accounts. Teachers manage attendance, tests, marks and assignments for batches assigned to them."
        actions={
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            Create Teacher Account
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

      {teachersQ.isLoading ? (
        <LoadingState />
      ) : teachersQ.isError ? (
        <ErrorState onRetry={() => teachersQ.refetch()} />
      ) : teachers.length === 0 ? (
        <EmptyState
          title="No teachers yet"
          hint="Create faculty accounts so batches can be assigned to teachers."
          action={<Button size="sm" variant="outline" className="mt-2" onClick={() => setInviteOpen(true)}>Create Teacher Account</Button>}
        />
      ) : (
        <DataTable<Profile>
          data={teachers}
          searchKeys={["full_name", "email"]}
          searchPlaceholder="Search teachers…"
          columns={[
            {
              key: "name",
              header: "Teacher",
              render: (t) => (
                <div>
                  <p className="font-semibold text-navy">{t.full_name}</p>
                  <p className="text-xs text-muted">{t.email ?? "—"}</p>
                </div>
              ),
            },
            { key: "phone", header: "Phone", render: (t) => t.phone ?? "—" },
            {
              key: "status",
              header: "Status",
              render: (t) => <Badge tone={t.is_active ? "green" : "red"}>{t.is_active ? "Active" : "Deactivated"}</Badge>,
            },
            {
              key: "actions",
              header: "Actions",
              render: (t) => (
                <Button
                  variant={t.is_active ? "danger" : "outline"}
                  size="sm"
                  disabled={toggle.isPending}
                  onClick={() => toggle.mutate(t)}
                >
                  {t.is_active ? "Deactivate" : "Reactivate"}
                </Button>
              ),
            },
          ]}
        />
      )}

      <CreateTeacherModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreated={(msg) => {
          setInviteOpen(false);
          setMessage(msg);
          qc.invalidateQueries({ queryKey: ["admin", "teachers"] });
        }}
      />
    </div>
  );
}

function CreateTeacherModal({
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
  const [phone, setPhone] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Enter a valid email");
    if (fullName.trim().length < 2) return setError("Enter the teacher's full name");
    if (tempPassword.length < 8) return setError("Temporary password must be at least 8 characters");
    setBusy(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("create-staff", {
        body: { email, full_name: fullName.trim(), phone: phone || null, role: "teacher", temporary_password: tempPassword },
      });
      if (fnErr) throw fnErr;
      onCreated(
        (data as { message?: string })?.message ??
          "Teacher account created. Share the temporary password securely."
      );
      setEmail(""); setFullName(""); setPhone(""); setTempPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account. Is the create-staff edge function deployed?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Teacher Account">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="ct-name" className="mb-1.5 block text-sm font-semibold text-ink">Full name *</label>
          <input id="ct-name" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ct-email" className="mb-1.5 block text-sm font-semibold text-ink">Email *</label>
          <input id="ct-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ct-phone" className="mb-1.5 block text-sm font-semibold text-ink">Phone</label>
          <input id="ct-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ct-pass" className="mb-1.5 block text-sm font-semibold text-ink">Temporary password *</label>
          <input id="ct-pass" className="input" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-lightgray pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
