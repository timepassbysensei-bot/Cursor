import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, MailOpen, Megaphone, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { fetchClientInbox, markInboxItemRead, type InboxItem } from "../../services/client";
import { cn, formatDateTime, formatRelative } from "../../lib/utils";
import { PageHeader } from "../../components/PageHeader";
import { Panel, Badge } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { PendingAccessNotice } from "../../components/guards";
import { useToast } from "../../components/ui/Toast";

export default function ClientMessages() {
  const { profile, hasClientAccess } = useAuth();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useSeo({
    title: "Messages from Arian",
    description: "Replies and announcements from Arian, in your private inbox.",
    noIndex: true,
  });

  const inboxQuery = useQuery({
    queryKey: ["client-inbox", profile?.id],
    queryFn: () => fetchClientInbox(profile!.id),
    enabled: Boolean(profile?.id) && hasClientAccess,
  });

  const items = inboxQuery.data ?? [];
  const visible = filter === "unread" ? items.filter((item) => !item.isRead) : items;
  const selected = visible.find((item) => item.id === selectedId) ?? null;

  const markRead = useMutation({
    mutationFn: (item: InboxItem) => markInboxItemRead(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["client-inbox", profile?.id] }),
    onError: () => push({ title: "Could not mark as read", variant: "error" }),
  });

  // Opening a message marks it read — the same thing the user would expect
  // from any inbox.
  useEffect(() => {
    if (selected && !selected.isRead) markRead.mutate(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="Messages from Arian"
        description="Replies from the studio land here, along with any announcement sent to clients."
        actions={
          <Link
            to="/dashboard/contact"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-blue to-cyan px-3.5 text-xs font-semibold text-base"
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            Write to Arian
          </Link>
        }
      />

      {!hasClientAccess ? (
        <PendingAccessNotice />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <Panel className="overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-hairline p-3">
              {(["all", "unread"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  aria-pressed={filter === option}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                    filter === option ? "bg-white/[0.08] text-ink" : "text-muted hover:text-ink"
                  )}
                >
                  {option}
                  {option === "unread" && items.some((i) => !i.isRead) && (
                    <span className="ml-1.5 rounded-full bg-cyan/20 px-1.5 text-2xs text-cyan">
                      {items.filter((i) => !i.isRead).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="scroll-thin max-h-[32rem] overflow-y-auto">
              {inboxQuery.isLoading ? (
                <LoadingState label="Loading your inbox…" />
              ) : inboxQuery.isError ? (
                <div className="p-4">
                  <ErrorState title="Inbox unavailable" onRetry={() => void inboxQuery.refetch()} />
                </div>
              ) : visible.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    compact
                    icon={<Inbox className="h-5 w-5 text-faint" aria-hidden />}
                    title={filter === "unread" ? "Nothing unread" : "No messages yet"}
                    hint={
                      filter === "unread"
                        ? "You have read everything Arian sent."
                        : "When Arian replies or posts an update, it appears here."
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-hairline">
                  {visible.map((item) => (
                    <li key={`${item.kind}-${item.id}`}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors",
                          selected?.id === item.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                        )}
                        aria-current={selected?.id === item.id}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            item.isRead ? "bg-white/20" : "bg-cyan"
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "truncate text-sm",
                                item.isRead ? "text-ink/80" : "font-semibold text-ink"
                              )}
                            >
                              {item.title}
                            </span>
                            {item.kind === "broadcast" && (
                              <Megaphone className="h-3 w-3 shrink-0 text-violet" aria-hidden />
                            )}
                          </span>
                          <span className="mt-1 block truncate text-xs text-muted">{item.body}</span>
                          <span className="mt-1 block text-2xs text-faint">{formatRelative(item.createdAt)}</span>
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
                  <Badge tone={selected.kind === "broadcast" ? "violet" : "cyan"}>
                    {selected.kind === "broadcast" ? "Announcement" : "From Arian"}
                  </Badge>
                  <span className="text-2xs text-faint">{formatDateTime(selected.createdAt)}</span>
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
                  {selected.title}
                </h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">{selected.body}</p>

                {!selected.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-6"
                    onClick={() => markRead.mutate(selected)}
                    disabled={markRead.isPending}
                  >
                    <MailOpen className="h-3.5 w-3.5" aria-hidden />
                    Mark as read
                  </Button>
                )}
              </article>
            ) : (
              <EmptyState
                icon={<MailOpen className="h-5 w-5 text-faint" aria-hidden />}
                title="Choose a message"
                hint="Pick anything on the left to read it here. You only ever see messages addressed to your own account."
              />
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
