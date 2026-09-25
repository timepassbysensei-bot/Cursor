import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { clientMessageSchema, type ClientMessageInput } from "../../validation/schemas";
import { fetchSentMessages, sendMessageToArian } from "../../services/client";
import { errorMessage, formatDateTime } from "../../lib/utils";
import { PageHeader } from "../../components/PageHeader";
import { Panel, Badge } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { PendingAccessNotice } from "../../components/guards";
import { useToast } from "../../components/ui/Toast";

export default function ContactArian() {
  const { profile, user, hasClientAccess } = useAuth();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [sent, setSent] = useState(false);

  useSeo({
    title: "Message Arian",
    description: "Write directly to Arian from your client dashboard.",
    noIndex: true,
  });

  const sentQuery = useQuery({
    queryKey: ["client-sent", profile?.id],
    queryFn: () => fetchSentMessages(profile!.id),
    enabled: Boolean(profile?.id) && hasClientAccess,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientMessageInput>({
    resolver: zodResolver(clientMessageSchema),
    defaultValues: { subject: "", body: "" },
  });

  const send = useMutation({
    mutationFn: async (values: ClientMessageInput) => {
      if (!user) throw new Error("You are not signed in.");
      await sendMessageToArian({
        userId: user.id,
        fullName: profile?.full_name ?? "",
        email: profile?.email ?? user.email ?? "",
        subject: values.subject,
        body: values.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-sent", profile?.id] });
      queryClient.invalidateQueries({ queryKey: ["client-inbox", profile?.id] });
      reset();
      setSent(true);
      push({ title: "Message sent", description: "Arian will see it in the studio inbox.", variant: "success" });
    },
    onError: (error: Error) => {
      push({
        title: "Message not sent",
        description: errorMessage(error),
        variant: "error",
      });
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Direct message"
        title="Message Arian"
        description="Anything you send here is private to your account and Arian's studio inbox — nobody else can read it."
      />

      {!hasClientAccess ? (
        <PendingAccessNotice />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <Panel className="p-6">
            {sent ? (
              <div className="py-4 text-center" role="status">
                <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-jade/30 bg-jade/10">
                  <CheckCircle2 className="h-6 w-6 text-jade" aria-hidden />
                </span>
                <h2 className="font-display text-lg font-semibold text-ink">Message sent</h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
                  It is in the studio inbox now. Arian's reply will appear in your inbox on this dashboard.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
                  Write another
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit((values) => send.mutate(values))}
                className="space-y-5"
                noValidate
              >
                <Field label="Subject" htmlFor="client-subject" error={errors.subject?.message} required>
                  <input
                    id="client-subject"
                    className="input"
                    placeholder="What is this about?"
                    {...register("subject")}
                  />
                </Field>

                <Field
                  label="Message"
                  htmlFor="client-body"
                  error={errors.body?.message}
                  hint="Include anything specific — a video name, a link, or the question itself."
                  required
                >
                  <textarea id="client-body" rows={8} className="input" {...register("body")} />
                </Field>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-5">
                  <p className="max-w-sm text-2xs leading-relaxed text-faint">
                    Attachments are not enabled yet — file uploads need a moderation policy first. Share a link in
                    the message instead.
                  </p>
                  <Button type="submit" size="lg" disabled={send.isPending}>
                    {send.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" aria-hidden />
                        Send to Arian
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Panel>

          <Panel className="p-6">
            <h2 className="font-display text-base font-semibold text-ink">Your sent messages</h2>
            <p className="mt-1.5 text-xs text-muted">A record of everything you have written from this account.</p>

            <div className="mt-5">
              {sentQuery.isLoading ? (
                <LoadingState label="Loading…" />
              ) : sentQuery.isError ? (
                <ErrorState title="Could not load your messages" onRetry={() => void sentQuery.refetch()} />
              ) : (sentQuery.data ?? []).length === 0 ? (
                <EmptyState compact title="Nothing sent yet" hint="Your first message will be listed here." />
              ) : (
                <ul className="space-y-3">
                  {(sentQuery.data ?? []).map((message) => (
                    <li key={message.id} className="rounded-xl border border-hairline bg-white/[0.02] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-medium text-ink">
                          {message.subject || "(no subject)"}
                        </p>
                        {message.is_read ? (
                          <Badge tone="jade">Seen</Badge>
                        ) : (
                          <Badge tone="neutral">Delivered</Badge>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{message.body}</p>
                      <p className="mt-2 text-2xs text-faint">{formatDateTime(message.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
