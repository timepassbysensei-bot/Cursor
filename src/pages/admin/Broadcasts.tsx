import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Megaphone, Send, Trash2, Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { adminService, logAdminAction } from "../../services/admin";
import { broadcastSchema, type BroadcastInput } from "../../validation/schemas";
import { cn, errorMessage, formatDateTime } from "../../lib/utils";
import { PageHeader } from "../../components/PageHeader";
import { Badge, Panel } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import type { Broadcast } from "../../types";

const AUDIENCES = [
  {
    value: "all_clients" as const,
    label: "Every active client",
    hint: "Delivered to the dashboard inbox of every approved client.",
  },
  {
    value: "single_client" as const,
    label: "One client",
    hint: "A private note to a single client's inbox.",
  },
  {
    value: "public_announcement" as const,
    label: "Public announcement",
    hint: "Shown in a banner across the public site to every visitor.",
  },
];

export default function AdminBroadcasts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [form, setForm] = useState<BroadcastInput>({
    title: "",
    body: "",
    audienceType: "all_clients",
    recipientUserId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewing, setPreviewing] = useState(false);
  const [deleting, setDeleting] = useState<Broadcast | null>(null);

  useSeo({ title: "Broadcasts — Arian studio", description: "Message clients and post announcements.", noIndex: true });

  const broadcastsQuery = useQuery({
    queryKey: ["admin-broadcasts"],
    queryFn: () => adminService.broadcasts(),
    enabled: isSupabaseConfigured,
  });

  const deliveriesQuery = useQuery({
    queryKey: ["admin-deliveries"],
    queryFn: () => adminService.deliveries(),
    enabled: isSupabaseConfigured,
  });

  const clientsQuery = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => adminService.clients(),
    enabled: isSupabaseConfigured,
  });

  const activeClients = (clientsQuery.data ?? []).filter((client) => client.status === "active");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    queryClient.invalidateQueries({ queryKey: ["admin-deliveries"] });
    queryClient.invalidateQueries({ queryKey: ["public-announcement"] });
  };

  const send = useMutation({
    mutationFn: async ({ values, status }: { values: BroadcastInput; status: "sent" | "draft" }) => {
      if (!user) throw new Error("You are not signed in.");

      // Resolve the recipient list once, so the delivery rows match exactly
      // who the message was addressed to.
      const recipients =
        values.audienceType === "all_clients"
          ? activeClients.map((client) => client.id)
          : values.audienceType === "single_client" && values.recipientUserId
            ? [values.recipientUserId]
            : [];

      await adminService.createBroadcast({
        title: values.title,
        body: values.body,
        audienceType: values.audienceType,
        recipientUserIds: recipients,
        createdBy: user.id,
        status,
      });

      await logAdminAction({
        adminUserId: user.id,
        action: status === "draft" ? "broadcast.drafted" : "broadcast.sent",
        entityType: "broadcasts",
        details: { audience: values.audienceType, recipients: recipients.length, title: values.title },
      });
    },
    onSuccess: (_data, variables) => {
      invalidate();
      setForm({ title: "", body: "", audienceType: "all_clients", recipientUserId: "" });
      push({
        title: variables.status === "draft" ? "Draft saved" : "Broadcast sent",
        description:
          variables.status === "draft"
            ? "Drafts are stored but not delivered."
            : "Stored in the website inbox. No email is sent from here.",
        variant: "success",
      });
    },
    onError: (error: Error) =>
      push({ title: "Could not send", description: errorMessage(error), variant: "error" }),
  });

  const remove = useMutation({
    mutationFn: (broadcast: Broadcast) => adminService.deleteBroadcast(broadcast.id),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      push({ title: "Broadcast deleted", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not delete", description: errorMessage(error), variant: "error" }),
  });

  const submit = (status: "sent" | "draft") => {
    const parsed = broadcastSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) nextErrors[String(issue.path[0])] = issue.message;
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    send.mutate({ values: parsed.data, status });
  };

  const broadcasts = useMemo(() => broadcastsQuery.data ?? [], [broadcastsQuery.data]);
  const deliveries = useMemo(() => deliveriesQuery.data ?? [], [deliveriesQuery.data]);

  const deliveryStats = useMemo(() => {
    const map = new Map<string, { delivered: number; read: number }>();
    for (const delivery of deliveries) {
      const entry = map.get(delivery.broadcast_id) ?? { delivered: 0, read: 0 };
      entry.delivered += 1;
      if (delivery.status === "read") entry.read += 1;
      map.set(delivery.broadcast_id, entry);
    }
    return map;
  }, [deliveries]);

  const audienceHint = AUDIENCES.find((option) => option.value === form.audienceType)?.hint ?? "";
  const recipientCount =
    form.audienceType === "all_clients" ? activeClients.length : form.audienceType === "single_client" ? 1 : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Outreach"
        title="Broadcasts"
        description="Write once, deliver into the website inbox. With no email provider configured, nothing here claims an email was delivered — everything is stored in the site."
      />

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <Panel className="p-6">
          <h2 className="font-display text-base font-semibold text-ink">Compose</h2>

          <div className="mt-5 space-y-5">
            <fieldset>
              <legend className="label">Audience</legend>
              <div className="space-y-2">
                {AUDIENCES.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                      form.audienceType === option.value
                        ? "border-cyan/50 bg-cyan/[0.06]"
                        : "border-hairline hover:border-white/20"
                    )}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value={option.value}
                      checked={form.audienceType === option.value}
                      onChange={() =>
                        setForm({ ...form, audienceType: option.value, recipientUserId: "" })
                      }
                      className="mt-0.5 h-4 w-4 accent-cyan"
                    />
                    <span>
                      <span className="block text-sm font-medium text-ink">{option.label}</span>
                      <span className="mt-0.5 block text-2xs leading-relaxed text-faint">{option.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {form.audienceType === "single_client" && (
              <Field label="Client" htmlFor="broadcast-recipient" error={errors.recipientUserId} required>
                <select
                  id="broadcast-recipient"
                  className="input"
                  value={form.recipientUserId}
                  onChange={(event) => setForm({ ...form, recipientUserId: event.target.value })}
                >
                  <option value="">Choose a client…</option>
                  {(clientsQuery.data ?? []).map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.full_name || client.email} ({client.status})
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Subject" htmlFor="broadcast-title" error={errors.title} required>
              <input
                id="broadcast-title"
                className="input"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="e.g. New beginner guide series starts this week"
              />
            </Field>

            <Field
              label="Message"
              htmlFor="broadcast-body"
              error={errors.body}
              hint={`${audienceHint} ${recipientCount > 0 ? `· ${recipientCount} recipient${recipientCount === 1 ? "" : "s"}` : ""}`}
              required
            >
              <textarea
                id="broadcast-body"
                rows={7}
                className="input"
                value={form.body}
                onChange={(event) => setForm({ ...form, body: event.target.value })}
              />
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5">
              <Button variant="outline" onClick={() => setPreviewing((value) => !value)}>
                <Eye className="h-4 w-4" aria-hidden />
                {previewing ? "Hide preview" : "Preview"}
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => submit("draft")}
                  disabled={send.isPending}
                >
                  Save draft
                </Button>
                <Button onClick={() => submit("sent")} disabled={send.isPending}>
                  {send.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden />
                  )}
                  Send
                </Button>
              </div>
            </div>

            {previewing && (
              <div className="rounded-2xl border border-hairline bg-white/[0.02] p-5">
                <p className="eyebrow mb-4">Preview</p>
                <p className="font-display text-base font-semibold text-ink">
                  {form.title || "Untitled broadcast"}
                </p>
                <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {form.body || "Your message will appear here."}
                </p>
                <p className="mt-4 text-2xs text-faint">
                  Audience: {AUDIENCES.find((option) => option.value === form.audienceType)?.label}
                  {recipientCount > 0 ? ` · ${recipientCount} recipient${recipientCount === 1 ? "" : "s"}` : ""}
                </p>
              </div>
            )}
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-display text-base font-semibold text-ink">Sent &amp; drafted</h2>
          <p className="mt-1.5 text-xs text-muted">
            Delivery status comes from the per-recipient records, not from an email provider.
          </p>

          <div className="mt-5">
            {broadcastsQuery.isLoading ? (
              <LoadingState label="Loading broadcasts…" />
            ) : broadcastsQuery.isError ? (
              <ErrorState title="Broadcasts could not load" onRetry={() => void broadcastsQuery.refetch()} />
            ) : broadcasts.length === 0 ? (
              <EmptyState
                icon={<Megaphone className="h-5 w-5 text-faint" aria-hidden />}
                title="Nothing sent yet"
                hint="Compose a message to a client, to everyone, or as a public announcement."
              />
            ) : (
              <ul className="space-y-3">
                {broadcasts.map((broadcast) => {
                  const stats = deliveryStats.get(broadcast.id);
                  return (
                    <li key={broadcast.id} className="rounded-xl border border-hairline bg-white/[0.02] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{broadcast.title}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Badge
                              tone={
                                broadcast.audience_type === "public_announcement"
                                  ? "violet"
                                  : broadcast.audience_type === "single_client"
                                    ? "cyan"
                                    : "blue"
                              }
                            >
                              {broadcast.audience_type === "public_announcement"
                                ? "Public"
                                : broadcast.audience_type === "single_client"
                                  ? "One client"
                                  : "All clients"}
                            </Badge>
                            {broadcast.status === "draft" && <Badge tone="amber">Draft</Badge>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-coral hover:bg-coral/10"
                          onClick={() => setDeleting(broadcast)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Delete
                        </Button>
                      </div>

                      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">{broadcast.body}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-faint">
                        <span>{formatDateTime(broadcast.created_at)}</span>
                        {broadcast.status === "sent" && stats && (
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3 w-3" aria-hidden />
                            {stats.delivered} delivered · {stats.read} read
                          </span>
                        )}
                        {broadcast.status === "sent" && !stats && broadcast.audience_type === "public_announcement" && (
                          <span>Visible to every visitor on the public site</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Panel>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this broadcast?"
        message={`"${deleting?.title ?? ""}" and its delivery records will be removed. Clients who already read it keep nothing.`}
        confirmLabel="Delete broadcast"
        destructive
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
