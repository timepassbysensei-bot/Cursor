import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  Handshake,
  Inbox,
  Mail,
  MailOpen,
  Reply,
  Send,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { adminService, logAdminAction } from "../../services/admin";
import { cn, errorMessage, formatDateTime, formatRelative, isEmail, truncate } from "../../lib/utils";
import { PageHeader } from "../../components/PageHeader";
import { Badge, Panel } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog, Modal } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import type { Message, SponsorshipLead } from "../../types";

type Filter = "all" | "unread" | "public" | "clients" | "sponsorships" | "archived";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "public", label: "Public" },
  { key: "clients", label: "Clients" },
  { key: "sponsorships", label: "Sponsorships" },
  { key: "archived", label: "Archived" },
];

/** One row in the inbox, regardless of which table it came from. */
interface InboxRow {
  id: string;
  source: "message" | "lead";
  kind: "contact" | "client" | "sponsorship" | "admin_reply";
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  isArchived: boolean;
  senderUserId: string | null;
  lead?: SponsorshipLead;
}

export default function AdminMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<InboxRow | null>(null);
  const [deleting, setDeleting] = useState<InboxRow | null>(null);
  const [reply, setReply] = useState<{ subject: string; body: string } | null>(null);
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});

  useSeo({ title: "Messages — Arian studio", description: "The studio inbox.", noIndex: true });

  const messagesQuery = useQuery({
    queryKey: ["admin-messages"],
    queryFn: () => adminService.messages(),
    enabled: isSupabaseConfigured,
  });

  const leadsQuery = useQuery({
    queryKey: ["admin-leads"],
    queryFn: () => adminService.sponsorshipLeads(),
    enabled: isSupabaseConfigured,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
    queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  const rows: InboxRow[] = useMemo(() => {
    const fromMessages = (messagesQuery.data ?? []).map<InboxRow>((message: Message) => ({
      id: message.id,
      source: "message",
      kind: message.message_type,
      senderName: message.sender_name || message.sender_email || "Unknown sender",
      senderEmail: message.sender_email,
      subject: message.subject || "(no subject)",
      body: message.body,
      createdAt: message.created_at,
      isRead: message.is_read,
      isArchived: message.is_archived,
      senderUserId: message.sender_user_id,
    }));

    const fromLeads = (leadsQuery.data ?? []).map<InboxRow>((lead: SponsorshipLead) => ({
      id: lead.id,
      source: "lead",
      kind: "sponsorship",
      senderName: lead.name || lead.email || "Unknown sender",
      senderEmail: lead.email,
      subject: lead.company ? `Sponsorship — ${lead.company}` : "Sponsorship enquiry",
      body: lead.message ?? "",
      createdAt: lead.created_at,
      isRead: lead.status !== "new",
      isArchived: lead.is_archived,
      senderUserId: lead.sender_user_id,
      lead,
    }));

    return [...fromMessages, ...fromLeads].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
  }, [messagesQuery.data, leadsQuery.data]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "unread":
        return rows.filter((row) => !row.isRead && !row.isArchived);
      case "public":
        return rows.filter((row) => row.kind === "contact" && !row.isArchived);
      case "clients":
        return rows.filter((row) => row.kind === "client" && !row.isArchived);
      case "sponsorships":
        return rows.filter((row) => row.kind === "sponsorship" && !row.isArchived);
      case "archived":
        return rows.filter((row) => row.isArchived);
      default:
        return rows.filter((row) => !row.isArchived);
    }
  }, [rows, filter]);

  const unreadCount = rows.filter((row) => !row.isRead && !row.isArchived).length;

  const setFlags = useMutation({
    mutationFn: async ({ row, flags }: { row: InboxRow; flags: { is_read?: boolean; is_archived?: boolean } }) => {
      if (row.source === "lead" && row.lead) {
        // Leads use a status field rather than read flags.
        const nextStatus = flags.is_archived ? "spam" : "reviewing";
        await adminService.updateLeadStatus(row.id, nextStatus);
        return;
      }
      await adminService.setMessageFlags(row.id, flags);
    },
    onSuccess: () => invalidate(),
    onError: (error: Error) =>
      push({ title: "Could not update the message", description: errorMessage(error), variant: "error" }),
  });

  const remove = useMutation({
    mutationFn: async (row: InboxRow) => {
      if (row.source === "lead") await adminService.deleteLead(row.id);
      else await adminService.deleteMessage(row.id);
      if (user) {
        await logAdminAction({
          adminUserId: user.id,
          action: "message.deleted",
          entityType: row.source === "lead" ? "sponsorship_leads" : "messages",
          entityId: row.id,
        });
      }
    },
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      setSelected(null);
      push({ title: "Deleted", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not delete", description: errorMessage(error), variant: "error" }),
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!reply || !selected || !user) return;
      await adminService.replyToMessage({
        adminUserId: user.id,
        recipientUserId: selected.senderUserId,
        recipientEmail: selected.senderEmail,
        recipientName: selected.senderName,
        subject: reply.subject,
        body: reply.body,
      });
      await adminService.setMessageFlags(selected.id, { is_read: true });
    },
    onSuccess: () => {
      invalidate();
      setReply(null);
      push({ title: "Reply saved", description: "It is stored in the message thread.", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not save the reply", description: errorMessage(error), variant: "error" }),
  });

  const submitReply = () => {
    if (!reply) return;
    const errors: Record<string, string> = {};
    if (reply.subject.trim().length < 3) errors.subject = "Add a subject";
    if (reply.body.trim().length < 5) errors.body = "Write the reply";
    if (Object.keys(errors).length > 0) {
      setReplyErrors(errors);
      return;
    }
    setReplyErrors({});
    sendReply.mutate();
  };

  const openRow = (row: InboxRow) => {
    setSelected(row);
    if (!row.isRead) setFlags.mutate({ row, flags: { is_read: true } });
  };

  const loading = messagesQuery.isLoading || leadsQuery.isLoading;
  const failed = messagesQuery.isError && leadsQuery.isError;

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="Messages"
        description="Contact form messages, client messages and sponsorship enquiries in one place. Replies are stored in the website inbox — no email provider is configured, so nothing here claims an email was delivered."
        actions={
          <Badge tone={unreadCount > 0 ? "cyan" : "jade"}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </Badge>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter messages">
        {FILTERS.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={filter === option.key}
            onClick={() => setFilter(option.key)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
              filter === option.key
                ? "border-cyan/50 bg-cyan/[0.12] text-ink"
                : "border-hairline bg-white/[0.02] text-muted hover:border-white/20 hover:text-ink"
            )}
          >
            {option.label}
            {option.key === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-cyan/20 px-1.5 text-2xs text-cyan">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Panel className="overflow-hidden p-0">
          <div className="scroll-thin max-h-[34rem] overflow-y-auto">
            {loading ? (
              <LoadingState label="Loading the inbox…" />
            ) : failed ? (
              <div className="p-4">
                <ErrorState
                  title="The inbox could not load"
                  onRetry={() => {
                    void messagesQuery.refetch();
                    void leadsQuery.refetch();
                  }}
                />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  compact
                  icon={<Inbox className="h-5 w-5 text-faint" aria-hidden />}
                  title="Nothing in this view"
                  hint={
                    filter === "all"
                      ? "Messages from the contact form, clients and sponsors land here."
                      : "Try another filter."
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {filtered.map((row) => (
                  <li key={`${row.source}-${row.id}`}>
                    <button
                      type="button"
                      onClick={() => openRow(row)}
                      aria-current={selected?.id === row.id && selected?.source === row.source}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors",
                        selected?.id === row.id && selected?.source === row.source
                          ? "bg-white/[0.06]"
                          : "hover:bg-white/[0.03]"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          row.isRead ? "bg-white/20" : "bg-cyan"
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn("truncate text-sm", row.isRead ? "text-ink/80" : "font-semibold text-ink")}
                          >
                            {row.senderName}
                          </span>
                          <KindBadge kind={row.kind} />
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">{row.subject}</span>
                        <span className="mt-1 block text-2xs text-faint">{formatRelative(row.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        <Panel className="p-6">
          {selected ? (
            <article>
              <div className="flex flex-wrap items-center gap-2">
                <KindBadge kind={selected.kind} />
                <span className="text-2xs text-faint">{formatDateTime(selected.createdAt)}</span>
              </div>

              <h2 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">{selected.subject}</h2>

              <p className="mt-1 text-xs text-muted">
                {selected.senderName}
                {selected.senderEmail ? ` · ${selected.senderEmail}` : ""}
              </p>

              {selected.lead && (
                <dl className="mt-5 grid gap-3 rounded-xl border border-hairline bg-white/[0.02] p-4 text-xs sm:grid-cols-2">
                  {[
                    ["Company", selected.lead.company],
                    ["Website", selected.lead.website],
                    ["Platform", selected.lead.preferred_platform],
                    ["Budget", selected.lead.budget],
                    ["Timeline", selected.lead.timeline],
                    ["Objective", selected.lead.campaign_objective],
                  ]
                    .filter(([, value]) => Boolean(value))
                    .map(([label, value]) => (
                      <div key={label as string}>
                        <dt className="text-2xs uppercase tracking-[0.14em] text-faint">{label}</dt>
                        <dd className="mt-1 break-words text-muted">{value}</dd>
                      </div>
                    ))}
                </dl>
              )}

              <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {selected.body || "No message body was included."}
              </p>

              <div className="mt-7 flex flex-wrap gap-2 border-t border-hairline pt-5">
                <Button
                  size="sm"
                  onClick={() => {
                    setReplyErrors({});
                    setReply({
                      subject: selected.subject.startsWith("Re:")
                        ? selected.subject
                        : `Re: ${selected.subject}`,
                      body: "",
                    });
                  }}
                >
                  <Reply className="h-3.5 w-3.5" aria-hidden />
                  Reply
                </Button>

                {selected.isRead ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFlags.mutate({ row: selected, flags: { is_read: false } })}
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    Mark unread
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFlags.mutate({ row: selected, flags: { is_read: true } })}
                  >
                    <MailOpen className="h-3.5 w-3.5" aria-hidden />
                    Mark read
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFlags.mutate({ row: selected, flags: { is_archived: !selected.isArchived } })}
                >
                  {selected.isArchived ? (
                    <>
                      <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
                      Restore
                    </>
                  ) : (
                    <>
                      <Archive className="h-3.5 w-3.5" aria-hidden />
                      Archive
                    </>
                  )}
                </Button>

                {isEmail(selected.senderEmail) && (
                  <a
                    href={`mailto:${selected.senderEmail}?subject=${encodeURIComponent(
                      selected.subject.startsWith("Re:") ? selected.subject : `Re: ${selected.subject}`
                    )}`}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-hairline px-3.5 text-xs font-semibold text-ink transition-colors hover:border-cyan/50"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    Open in mail app
                  </a>
                )}

                <Button size="sm" variant="danger" onClick={() => setDeleting(selected)}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Delete
                </Button>
              </div>

              <p className="mt-5 text-2xs leading-relaxed text-faint">
                {selected.senderUserId
                  ? "This sender has an account, so a reply is stored in their dashboard inbox."
                  : "This sender has no account, so a stored reply has nowhere to appear. Use the mail link above, or save the reply as a record."}
              </p>
            </article>
          ) : (
            <EmptyState
              icon={<Mail className="h-5 w-5 text-faint" aria-hidden />}
              title="Pick a message"
              hint="Select anything on the left to read it, reply, archive or delete."
            />
          )}
        </Panel>
      </div>

      <Modal
        open={Boolean(reply)}
        onClose={() => setReply(null)}
        title="Reply"
        description="Stored in the website inbox. No email is sent — use the mail-app link if the sender needs it by email."
        footer={
          <>
            <Button variant="outline" onClick={() => setReply(null)} disabled={sendReply.isPending}>
              Cancel
            </Button>
            <Button onClick={submitReply} disabled={sendReply.isPending}>
              Save reply
            </Button>
          </>
        }
      >
        {reply && (
          <div className="space-y-5">
            <Field label="Subject" htmlFor="reply-subject" error={replyErrors.subject} required>
              <input
                id="reply-subject"
                className="input"
                value={reply.subject}
                onChange={(event) => setReply({ ...reply, subject: event.target.value })}
              />
            </Field>
            <Field label="Message" htmlFor="reply-body" error={replyErrors.body} required>
              <textarea
                id="reply-body"
                rows={7}
                className="input"
                value={reply.body}
                onChange={(event) => setReply({ ...reply, body: event.target.value })}
              />
            </Field>
            <p className="rounded-xl border border-hairline bg-white/[0.02] p-3 text-2xs leading-relaxed text-faint">
              Preview: {truncate(reply.body || "Your reply will appear here.", 180)}
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this message?"
        message="It will be removed from the inbox permanently. Archiving keeps it, so that is usually the safer choice."
        confirmLabel="Delete message"
        destructive
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function KindBadge({ kind }: { kind: InboxRow["kind"] }) {
  if (kind === "sponsorship") {
    return (
      <Badge tone="violet" icon={<Handshake className="h-3 w-3" aria-hidden />}>
        Sponsor
      </Badge>
    );
  }
  if (kind === "client") return <Badge tone="cyan">Client</Badge>;
  if (kind === "admin_reply") return <Badge tone="jade">Reply</Badge>;
  return <Badge tone="neutral">Public</Badge>;
}
