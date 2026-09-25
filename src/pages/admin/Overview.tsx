import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Ban,
  Clock,
  Handshake,
  Images,
  Inbox,
  Music4,
  Plus,
  UserCheck,
  Users,
  Video,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { adminService } from "../../services/admin";
import { DEMO_MODE, isMissingRelation } from "../../services/content";
import { formatDateTime, formatRelative, truncate } from "../../lib/utils";
import { PageHeader, StatTile } from "../../components/PageHeader";
import { Badge, Panel } from "../../components/ui/Section";
import { ErrorState, LoadingState, EmptyState } from "../../components/ui/States";
import { ButtonLink } from "../../components/ui/Button";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

export default function AdminOverview() {
  const { profile } = useAuth();

  useSeo({ title: "Studio overview — Arian", noIndex: true, description: "Admin overview." });

  const overviewQuery = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => adminService.overview(),
    enabled: isSupabaseConfigured,
  });

  const messagesQuery = useQuery({
    queryKey: ["admin-messages", "recent"],
    queryFn: () => adminService.messages(),
    enabled: isSupabaseConfigured,
  });

  const auditQuery = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => adminService.auditLogs(),
    enabled: isSupabaseConfigured,
    retry: (count, error) => count < 1 && !isMissingRelation(error),
  });

  const overview = overviewQuery.data;
  const recentMessages = (messagesQuery.data ?? []).slice(0, 5);

  return (
    <div>
      <PageHeader
        eyebrow="Studio"
        title={`Hello${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description="Everything on the public site is managed from here: videos, gallery, audio, clients, the inbox and broadcasts."
        actions={
          <>
            <ButtonLink to="/admin/videos" size="sm">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add a video
            </ButtonLink>
            <ButtonLink to="/admin/gallery" variant="outline" size="sm">
              <Images className="h-3.5 w-3.5" aria-hidden />
              Upload images
            </ButtonLink>
          </>
        }
      />

      {DEMO_MODE && (
        <div className="mb-6 rounded-2xl border border-blue/25 bg-blue/[0.07] p-4 text-sm leading-relaxed text-muted" role="status">
          <p className="font-display font-semibold text-ink">Demo mode — no database connected</p>
          <p className="mt-1">
            Counts and lists stay empty until <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> are set and the Supabase migrations are applied. Public pages show
            sample content in the meantime.
          </p>
        </div>
      )}

      {overviewQuery.isLoading ? (
        <LoadingState label="Counting everything…" />
      ) : overviewQuery.isError ? (
        <ErrorState
          title="The overview could not load"
          hint={
            isMissingRelation((overviewQuery.error as { message?: string }) ?? {})
              ? "The database tables are missing. Run the migrations in supabase/migrations."
              : "Something went wrong reading the counts."
          }
          onRetry={() => void overviewQuery.refetch()}
        />
      ) : overview ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Registered clients"
              value={overview.totalClients}
              hint="All client accounts"
              icon={<Users className="h-4 w-4" aria-hidden />}
              tone="blue"
            />
            <StatTile
              label="Pending requests"
              value={overview.pendingClients}
              hint={overview.pendingClients > 0 ? "Waiting for approval" : "Nothing waiting"}
              icon={<Clock className="h-4 w-4" aria-hidden />}
              tone={overview.pendingClients > 0 ? "amber" : "jade"}
            />
            <StatTile
              label="Active clients"
              value={overview.activeClients}
              hint="Approved and unlocked"
              icon={<UserCheck className="h-4 w-4" aria-hidden />}
              tone="jade"
            />
            <StatTile
              label="Banned clients"
              value={overview.bannedClients}
              hint="No dashboard access"
              icon={<Ban className="h-4 w-4" aria-hidden />}
              tone={overview.bannedClients > 0 ? "coral" : "blue"}
            />
            <StatTile
              label="Unread messages"
              value={overview.unreadMessages}
              hint="Across public and client inbox"
              icon={<Inbox className="h-4 w-4" aria-hidden />}
              tone={overview.unreadMessages > 0 ? "violet" : "jade"}
            />
            <StatTile
              label="Gallery images"
              value={overview.galleryCount}
              hint="Uploaded and stored"
              icon={<Images className="h-4 w-4" aria-hidden />}
            />
            <StatTile
              label="Managed videos"
              value={overview.videoCount}
              hint="Including drafts"
              icon={<Video className="h-4 w-4" aria-hidden />}
              tone="blue"
            />
            <StatTile
              label="Active audio track"
              value={overview.activeTrack ? "1" : "0"}
              hint={overview.activeTrack?.title ?? "No track selected"}
              icon={<Music4 className="h-4 w-4" aria-hidden />}
              tone={overview.activeTrack ? "jade" : "amber"}
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <Panel className="p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-base font-semibold text-ink">Recent sponsorship requests</h2>
                <Link
                  to="/admin/messages"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan underline-offset-2 hover:underline"
                >
                  Open inbox
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>

              <div className="mt-5">
                {overview.recentLeads.length === 0 ? (
                  <EmptyState
                    compact
                    icon={<Handshake className="h-5 w-5 text-faint" aria-hidden />}
                    title="No sponsorship requests yet"
                    hint="Enquiries submitted through the sponsor page appear here."
                  />
                ) : (
                  <ul className="divide-y divide-hairline">
                    {overview.recentLeads.map((lead) => (
                      <li key={lead.id} className="py-3.5 first:pt-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-medium text-ink">{lead.company || lead.name}</p>
                          <Badge tone={lead.status === "new" ? "cyan" : "neutral"}>{lead.status}</Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted">
                          {lead.email}
                          {lead.budget ? ` · ${lead.budget}` : ""}
                        </p>
                        <p className="mt-1 text-2xs text-faint">{formatRelative(lead.created_at)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>

            <Panel className="p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-base font-semibold text-ink">Latest inbox activity</h2>
                <Link
                  to="/admin/messages"
                  className="text-xs font-semibold text-cyan underline-offset-2 hover:underline"
                >
                  All messages
                </Link>
              </div>

              <div className="mt-5">
                {messagesQuery.isLoading ? (
                  <LoadingState label="Loading messages…" />
                ) : recentMessages.length === 0 ? (
                  <EmptyState compact title="Inbox is empty" hint="Contact, sponsorship and client messages land here." />
                ) : (
                  <ul className="divide-y divide-hairline">
                    {recentMessages.map((message) => (
                      <li key={message.id} className="flex items-start gap-3 py-3.5 first:pt-0">
                        <span
                          aria-hidden
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            message.is_read ? "bg-white/20" : "bg-cyan"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">
                            {message.sender_name || message.sender_email || "Unknown sender"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {message.subject || truncate(message.body, 60)}
                          </p>
                        </div>
                        <span className="shrink-0 text-2xs text-faint">{formatRelative(message.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>
          </div>

          <Panel className="mt-6 p-6">
            <h2 className="font-display text-base font-semibold text-ink">Recent admin activity</h2>
            <p className="mt-1.5 text-xs text-muted">
              Every change made from the studio is recorded, so nothing happens silently.
            </p>
            <div className="mt-5">
              {auditQuery.isLoading ? (
                <LoadingState label="Loading activity…" />
              ) : (auditQuery.data ?? []).length === 0 ? (
                <EmptyState compact title="No recorded activity yet" hint="Actions taken in the studio show up here." />
              ) : (
                <ul className="divide-y divide-hairline text-sm">
                  {(auditQuery.data ?? []).slice(0, 8).map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0">
                      <span className="text-ink">
                        <span className="font-medium">{entry.action}</span>
                        {entry.entity_type && <span className="text-muted"> · {entry.entity_type}</span>}
                      </span>
                      <span className="text-2xs text-faint">{formatDateTime(entry.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  );
}
