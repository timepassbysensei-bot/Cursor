import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Inbox, MessageSquarePlus, Send, Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { useSiteContent } from "../../hooks/useSiteContent";
import { fetchClientInbox } from "../../services/client";
import { DEFAULT_SITE_CONTENT } from "../../lib/siteContent";
import { formatRelative } from "../../lib/utils";
import { PageHeader, StatTile } from "../../components/PageHeader";
import { Badge, Panel } from "../../components/ui/Section";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { PendingAccessNotice } from "../../components/guards";

export default function ClientOverview() {
  const { profile, hasClientAccess } = useAuth();
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();

  useSeo({
    title: "Your dashboard — Arian",
    description: "Messages from Arian, your sponsorship enquiries and your profile.",
    noIndex: true,
  });

  const inboxQuery = useQuery({
    queryKey: ["client-inbox", profile?.id],
    queryFn: () => fetchClientInbox(profile!.id),
    enabled: Boolean(profile?.id) && hasClientAccess,
  });

  const inbox = inboxQuery.data ?? [];
  const unread = inbox.filter((item) => !item.isRead);

  return (
    <div>
      <PageHeader
        eyebrow="Client dashboard"
        title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description="Everything Arian has sent you, plus a direct line to reply. Your account stays private to you."
        actions={
          <>
            <Link
              to="/dashboard/contact"
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-blue to-cyan px-3.5 text-xs font-semibold text-base"
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
              Message Arian
            </Link>
            <Link
              to="/dashboard/sponsor"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-hairline px-3.5 text-xs font-semibold text-ink transition-colors hover:border-cyan/50"
            >
              Sponsor Arian
            </Link>
          </>
        }
      />

      {!hasClientAccess && <PendingAccessNotice className="mb-6" />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Account status"
          value={profile?.status === "active" ? "Active" : "Pending"}
          hint={profile?.status === "active" ? "All features unlocked" : "Waiting on Arian's approval"}
          icon={<Sparkles className="h-4 w-4" aria-hidden />}
          tone={profile?.status === "active" ? "jade" : "amber"}
        />
        <StatTile
          label="Messages"
          value={inbox.length}
          hint="From Arian and the studio"
          icon={<Inbox className="h-4 w-4" aria-hidden />}
        />
        <StatTile
          label="Unread"
          value={unread.length}
          hint={unread.length > 0 ? "New since you last looked" : "You are all caught up"}
          icon={<MessageSquarePlus className="h-4 w-4" aria-hidden />}
          tone={unread.length > 0 ? "violet" : "jade"}
        />
        <StatTile
          label="Member since"
          value={profile?.created_at ? new Date(profile.created_at).getFullYear() : "—"}
          hint="Your account created"
          tone="blue"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Panel className="p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-base font-semibold text-ink">Recent messages</h2>
            <Link
              to="/dashboard/messages"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan underline-offset-2 hover:underline"
            >
              Open inbox
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <div className="mt-5">
            {!hasClientAccess ? (
              <EmptyState
                compact
                title="Inbox unlocks after approval"
                hint="Arian reviews new accounts before messages can be sent or received."
              />
            ) : inboxQuery.isLoading ? (
              <LoadingState label="Loading your inbox…" />
            ) : inboxQuery.isError ? (
              <ErrorState
                title="Your inbox could not load"
                hint="Something went wrong fetching your messages."
                onRetry={() => void inboxQuery.refetch()}
              />
            ) : inbox.length === 0 ? (
              <EmptyState
                compact
                title="No messages yet"
                hint="When Arian sends an update, or replies to something you wrote, it lands here."
              />
            ) : (
              <ul className="divide-y divide-hairline">
                {inbox.slice(0, 5).map((item) => (
                  <li key={`${item.kind}-${item.id}`} className="flex items-start gap-3 py-3.5 first:pt-0">
                    <span
                      aria-hidden
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        item.isRead ? "bg-white/20" : "bg-cyan"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                        {item.kind === "broadcast" && <Badge tone="violet">Announcement</Badge>}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{item.body}</p>
                    </div>
                    <span className="shrink-0 text-2xs text-faint">{formatRelative(item.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-6">
            <h2 className="font-display text-base font-semibold text-ink">Your account</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Name</dt>
                <dd className="truncate text-right font-medium text-ink">{profile?.full_name || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Email</dt>
                <dd className="truncate text-right font-medium text-ink">{profile?.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Access level</dt>
                <dd className="text-right font-medium text-ink">
                  {profile?.status === "active" ? "Active client" : "Pending approval"}
                </dd>
              </div>
            </dl>
            <Link
              to="/dashboard/profile"
              className="mt-5 inline-flex h-9 items-center rounded-xl border border-hairline px-3.5 text-xs font-semibold text-ink transition-colors hover:border-cyan/50"
            >
              Manage profile
            </Link>
          </Panel>

          <Panel className="p-6">
            <h2 className="font-display text-base font-semibold text-ink">A note from Arian</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
              {content.featuredMessageActive
                ? content.featuredMessageBody
                : "Nothing new right now — the studio will post updates here."}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
