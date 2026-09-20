import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageHeader } from "../../features/admin/PageHeader";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { adminService } from "../../services/admin";
import { supabase } from "../../lib/supabaseClient";
import type { Inquiry, InquiryStatus } from "../../types";
import { formatDate, formatDateTime } from "../../lib/utils";

const STATUS_TONES: Record<InquiryStatus, "navy" | "green" | "saffron" | "gray" | "red"> = {
  new: "saffron",
  contacted: "navy",
  interested: "navy",
  follow_up: "saffron",
  admitted: "green",
  closed: "gray",
  spam: "red",
};

const STATUS_OPTIONS: { value: InquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "follow_up", label: "Follow-up" },
  { value: "admitted", label: "Admitted" },
  { value: "closed", label: "Closed" },
  { value: "spam", label: "Spam" },
];

export default function AdminInquiries() {
  const qc = useQueryClient();
  const inquiriesQ = useQuery({ queryKey: ["admin", "inquiries"], queryFn: () => adminService.inquiries() });
  const [detail, setDetail] = useState<Inquiry | null>(null);

  const data = inquiriesQ.data ?? [];
  const newCount = data.filter((i) => i.status === "new").length;

  async function updateStatus(id: string, status: InquiryStatus) {
    await supabase.from("inquiries").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "inquiries"] });
    setDetail((d) => (d && d.id === id ? { ...d, status } : d));
  }

  return (
    <div>
      <PageHeader
        title="Admission Inquiries"
        description="Leads captured from the website inquiry and contact forms. Update status as your team follows up."
      />

      {inquiriesQ.isLoading ? (
        <LoadingState />
      ) : inquiriesQ.isError ? (
        <ErrorState onRetry={() => inquiriesQ.refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          title="No inquiries yet"
          hint="New inquiries submitted through the website will appear here automatically."
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">
            <span className="font-display font-bold text-navy">{newCount}</span> new inquiry{newCount === 1 ? "" : "s"} awaiting first contact · {data.length} total
          </p>
          <DataTable<Inquiry>
            data={data}
            searchKeys={["name", "phone", "city"]}
            searchPlaceholder="Search inquiries…"
            columns={[
              {
                key: "name",
                header: "Lead",
                render: (i) => (
                  <div>
                    <p className="font-semibold text-navy">{i.name}</p>
                    <p className="text-xs text-muted">{i.phone}{i.city ? ` · ${i.city}` : ""}</p>
                  </div>
                ),
              },
              { key: "date", header: "Received", render: (i) => formatDate(i.created_at) },
              {
                key: "status",
                header: "Status",
                render: (i) => <Badge tone={STATUS_TONES[i.status]}>{i.status.replace("_", " ")}</Badge>,
              },
              { key: "followup", header: "Follow-up", render: (i) => formatDate(i.follow_up_date) },
              {
                key: "actions",
                header: "Actions",
                render: (i) => (
                  <Button variant="outline" size="sm" onClick={() => setDetail(i)}>
                    Open
                  </Button>
                ),
              },
            ]}
            mobileCard={(i) => (
              <div>
                <p className="font-semibold text-navy">{i.name}</p>
                <p className="text-xs text-muted">{i.phone} · {formatDateTime(i.created_at)}</p>
                <div className="mt-2"><Badge tone={STATUS_TONES[i.status]}>{i.status.replace("_", " ")}</Badge></div>
                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setDetail(i)}>
                  Open
                </Button>
              </div>
            )}
          />
        </>
      )}

      <InquiryDetailModal
        inquiry={detail}
        onClose={() => setDetail(null)}
        onStatus={(s) => detail && updateStatus(detail.id, s)}
      />
    </div>
  );
}

function InquiryDetailModal({
  inquiry,
  onClose,
  onStatus,
}: {
  inquiry: Inquiry | null;
  onClose: () => void;
  onStatus: (s: InquiryStatus) => void;
}) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(inquiry?.internal_notes ?? "");
  const [followUp, setFollowUp] = useState(inquiry?.follow_up_date ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!inquiry) return null;

  async function saveMeta() {
    setBusy(true);
    setError(null);
    try {
      await adminService.updateInquiry(inquiry!.id, {
        internal_notes: notes || null,
        follow_up_date: followUp || null,
      });
      qc.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Inquiry — ${inquiry.name}`} wide>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="font-semibold text-ink">Phone</dt><dd><a className="text-navy underline" href={`tel:+91${inquiry.phone}`}>{inquiry.phone}</a></dd></div>
        <div><dt className="font-semibold text-ink">Email</dt><dd>{inquiry.email ?? "—"}</dd></div>
        <div><dt className="font-semibold text-ink">City</dt><dd>{inquiry.city ?? "—"}</dd></div>
        <div><dt className="font-semibold text-ink">Source</dt><dd>{inquiry.source_page ?? "—"}{inquiry.utm_source ? ` (${inquiry.utm_source})` : ""}</dd></div>
        <div className="sm:col-span-2"><dt className="font-semibold text-ink">Message</dt><dd className="text-muted">{inquiry.message ?? "—"}</dd></div>
        <div className="sm:col-span-2"><dt className="font-semibold text-ink">Received</dt><dd>{formatDateTime(inquiry.created_at)}</dd></div>
      </dl>

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-ink">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onStatus(s.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                inquiry.status === s.value
                  ? "border-navy bg-navy text-white"
                  : "border-lightgray bg-white text-ink hover:bg-offwhite"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inq-follow" className="mb-1.5 block text-sm font-semibold text-ink">Follow-up date</label>
          <input id="inq-follow" type="date" className="input" value={followUp ?? ""} onChange={(e) => setFollowUp(e.target.value)} />
        </div>
        <div>
          <label htmlFor="inq-notes" className="mb-1.5 block text-sm font-semibold text-ink">Internal notes</label>
          <textarea id="inq-notes" rows={2} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">{error}</p>}

      <div className="mt-5 flex justify-end gap-3 border-t border-lightgray pt-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={saveMeta} disabled={busy}>
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Saving…</> : "Save Notes"}
        </Button>
      </div>
    </Modal>
  );
}
