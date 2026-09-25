import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, MessageSquare, ShieldOff, Trash2, UserCheck, UserX } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { adminService, logAdminAction, type AdminOverview } from "../../services/admin";
import { deleteClientAccount } from "../../services/serverOps";
import { cn, errorMessage, formatDate, formatRelative, initialsOf } from "../../lib/utils";
import { PageHeader, StatTile } from "../../components/PageHeader";
import { Badge, Panel } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import type { ClientStatus, Profile } from "../../types";

type PendingAction = {
  profile: Profile;
  status?: ClientStatus;
  kind: "status" | "delete" | "promote";
  title: string;
  message: string;
  destructive?: boolean;
  confirmLabel: string;
};

const STATUS_TONE: Record<ClientStatus, "jade" | "amber" | "neutral" | "coral"> = {
  active: "jade",
  pending: "amber",
  suspended: "neutral",
  banned: "coral",
};

const STATUS_LABEL: Record<ClientStatus, string> = {
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
  banned: "Banned",
};

export default function AdminClients() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ClientStatus>("all");
  const [action, setAction] = useState<PendingAction | null>(null);

  useSeo({ title: "Clients — Arian studio", description: "Approve and moderate client accounts.", noIndex: true });

  const clientsQuery = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => adminService.clients(),
    enabled: isSupabaseConfigured,
  });

  const countsQuery = useQuery({
    queryKey: ["admin-clients", "counts"],
    queryFn: () => adminService.messageCounts(),
    enabled: isSupabaseConfigured,
  });

  const overviewQuery = useQuery<AdminOverview>({
    queryKey: ["admin-overview"],
    queryFn: () => adminService.overview(),
    enabled: isSupabaseConfigured,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  const changeStatus = useMutation({
    mutationFn: async ({ profile, next }: { profile: Profile; next: ClientStatus }) => {
      await adminService.updateClientAccess(profile.id, next);
      if (user) {
        await logAdminAction({
          adminUserId: user.id,
          action: `client.${next}`,
          entityType: "profiles",
          entityId: profile.id,
          details: { email: profile.email, previous: profile.status },
        });
      }
    },
    onSuccess: (_data, variables) => {
      invalidate();
      setAction(null);
      push({ title: `Access set to ${STATUS_LABEL[variables.next].toLowerCase()}`, variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not update access", description: errorMessage(error), variant: "error" }),
  });

  const makeAdmin = useMutation({
    mutationFn: async (profile: Profile) => {
      await adminService.promoteToAdmin(profile.id);
      if (user) {
        await logAdminAction({
          adminUserId: user.id,
          action: "client.promoted_to_admin",
          entityType: "profiles",
          entityId: profile.id,
          details: { email: profile.email },
        });
      }
    },
    onSuccess: () => {
      invalidate();
      setAction(null);
      push({
        title: "Promoted to admin",
        description: "They can now open the studio after signing in again.",
        variant: "success",
      });
    },
    onError: (error: Error) =>
      push({ title: "Could not promote", description: errorMessage(error), variant: "error" }),
  });

  const remove = useMutation({
    mutationFn: async (profile: Profile) => {
      await deleteClientAccount(profile.id);
      if (user) {
        await logAdminAction({
          adminUserId: user.id,
          action: "client.deleted",
          entityType: "profiles",
          entityId: profile.id,
          details: { email: profile.email },
        });
      }
    },
    onSuccess: () => {
      invalidate();
      setAction(null);
      push({ title: "Account deleted", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not delete the account", description: errorMessage(error), variant: "error" }),
  });

  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);
  const counts = useMemo(() => countsQuery.data ?? {}, [countsQuery.data]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return clients.filter((client) => {
      if (status !== "all" && client.status !== status) return false;
      if (!needle) return true;
      return (
        client.full_name.toLowerCase().includes(needle) ||
        (client.email ?? "").toLowerCase().includes(needle)
      );
    });
  }, [clients, search, status]);

  const overview = overviewQuery.data;

  const runAction = () => {
    if (!action) return;
    if (action.kind === "delete") remove.mutate(action.profile);
    else if (action.kind === "promote") makeAdmin.mutate(action.profile);
    else if (action.status) changeStatus.mutate({ profile: action.profile, next: action.status });
  };

  const busy = changeStatus.isPending || remove.isPending || makeAdmin.isPending;

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Clients"
        description="Approve new accounts, pause or remove access, and see how active each client is. Every action is written to the audit log."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="All clients" value={overview?.totalClients ?? clients.length} hint="Accounts registered" tone="blue" />
        <StatTile
          label="Pending"
          value={overview?.pendingClients ?? clients.filter((c) => c.status === "pending").length}
          hint="Waiting for approval"
          tone="amber"
        />
        <StatTile
          label="Active"
          value={overview?.activeClients ?? clients.filter((c) => c.status === "active").length}
          hint="Full dashboard access"
          tone="jade"
        />
        <StatTile
          label="Banned"
          value={overview?.bannedClients ?? clients.filter((c) => c.status === "banned").length}
          hint="Blocked from client data"
          tone="coral"
        />
      </div>

      <Panel className="mt-6 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="client-search" className="label">
              Search
            </label>
            <input
              id="client-search"
              type="search"
              className="input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email…"
            />
          </div>
          <div className="sm:w-52">
            <label htmlFor="client-status" className="label">
              Status
            </label>
            <select
              id="client-status"
              className="input"
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
      </Panel>

      <div className="mt-6">
        {clientsQuery.isLoading ? (
          <LoadingState label="Loading clients…" />
        ) : clientsQuery.isError ? (
          <ErrorState title="Clients could not load" onRetry={() => void clientsQuery.refetch()} />
        ) : clients.length === 0 ? (
          <EmptyState
            title="No client accounts yet"
            hint="Sign-ups from the public site appear here for approval."
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="Nobody matches" hint="Try a different search or status." />
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {filtered.map((client) => (
                <li key={client.id}>
                  <Panel className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar profile={client} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{client.full_name || "Unnamed"}</p>
                        <p className="truncate text-xs text-muted">{client.email}</p>
                      </div>
                      <Badge tone={STATUS_TONE[client.status]}>{STATUS_LABEL[client.status]}</Badge>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-hairline pt-3 text-2xs text-faint">
                      <div>
                        <dt>Joined</dt>
                        <dd className="text-muted">{formatDate(client.created_at)}</dd>
                      </div>
                      <div>
                        <dt>Last active</dt>
                        <dd className="text-muted">{client.last_seen_at ? formatRelative(client.last_seen_at) : "—"}</dd>
                      </div>
                      <div>
                        <dt>Messages</dt>
                        <dd className="text-muted">{counts[client.id] ?? 0}</dd>
                      </div>
                      <div>
                        <dt>Access</dt>
                        <dd className="text-muted">Client</dd>
                      </div>
                    </dl>
                    <Actions
                      profile={client}
                      onAction={setAction}
                      className="mt-3 border-t border-hairline pt-3"
                    />
                  </Panel>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="table-scroll hidden rounded-2xl border border-hairline bg-surface/60 md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Client accounts and access controls</caption>
                <thead>
                  <tr className="border-b border-hairline bg-white/[0.03]">
                    {["Client", "Status", "Joined", "Last active", "Messages", "Access", ""].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-4 py-3 font-display text-2xs font-semibold uppercase tracking-[0.14em] text-faint"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr key={client.id} className="border-b border-hairline last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar profile={client} small />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{client.full_name || "Unnamed"}</p>
                            <p className="truncate text-xs text-muted">{client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONE[client.status]}>{STATUS_LABEL[client.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{formatDate(client.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {client.last_seen_at ? formatRelative(client.last_seen_at) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquare className="h-3 w-3" aria-hidden />
                          {counts[client.id] ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize text-muted">Client</td>
                      <td className="px-4 py-3">
                        <Actions profile={client} onAction={setAction} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(action)}
        title={action?.title ?? ""}
        message={action?.message ?? ""}
        confirmLabel={action?.confirmLabel ?? "Confirm"}
        destructive={action?.destructive}
        busy={busy}
        onConfirm={runAction}
        onCancel={() => setAction(null)}
      />
    </div>
  );
}

function Avatar({ profile, small }: { profile: Profile; small?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-gradient-to-br from-blue/30 to-violet/30 font-display font-bold text-ink",
        small ? "h-8 w-8 text-2xs" : "h-10 w-10 text-xs"
      )}
      aria-hidden
    >
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        initialsOf(profile.full_name || profile.email || "?")
      )}
    </span>
  );
}

function Actions({
  profile,
  onAction,
  className,
}: {
  profile: Profile;
  onAction: (action: PendingAction) => void;
  className?: string;
}) {
  const name = profile.full_name || profile.email || "this client";

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {profile.status !== "active" && (
        <Button
          size="sm"
          variant="success"
          onClick={() =>
            onAction({
              profile,
              kind: "status",
              status: "active",
              title: "Approve this client?",
              message: `${name} will get full dashboard access: messaging, sponsorship forms and messages from you.`,
              confirmLabel: "Approve access",
            })
          }
        >
          <UserCheck className="h-3.5 w-3.5" aria-hidden />
          {profile.status === "pending" ? "Approve" : "Restore"}
        </Button>
      )}

      {profile.status === "active" && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onAction({
                profile,
                kind: "status",
                status: "suspended",
                title: "Suspend access?",
                message: `${name} will be signed out of client data and will see a suspended notice. Their messages are kept.`,
                confirmLabel: "Suspend",
              })
            }
          >
            <ShieldOff className="h-3.5 w-3.5" aria-hidden />
            Suspend
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onAction({
                profile,
                kind: "status",
                status: "pending",
                title: "Remove access?",
                message: `${name} goes back to pending — they can sign in and see their status, but messaging is locked again.`,
                confirmLabel: "Remove access",
              })
            }
          >
            <UserX className="h-3.5 w-3.5" aria-hidden />
            Remove access
          </Button>
        </>
      )}

      {profile.status === "banned" ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onAction({
              profile,
              kind: "status",
              status: "pending",
              title: "Unban this client?",
              message: `${name} will be able to sign in again, with pending access until you approve them.`,
              confirmLabel: "Unban",
            })
          }
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Unban
        </Button>
      ) : (
        <Button
          size="sm"
          variant="danger"
          onClick={() =>
            onAction({
              profile,
              kind: "status",
              status: "banned",
              title: "Ban this client?",
              message: `${name} loses all client access immediately, enforced in the database as well as the interface.`,
              confirmLabel: "Ban client",
              destructive: true,
            })
          }
        >
          <Ban className="h-3.5 w-3.5" aria-hidden />
          Ban
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          onAction({
            profile,
            kind: "promote",
            title: "Make this client an admin?",
            message: `${name} will be able to manage videos, the gallery, clients and broadcasts. Only do this for someone who needs full studio access.`,
            confirmLabel: "Promote to admin",
          })
        }
      >
        Make admin
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="text-coral hover:bg-coral/10"
        onClick={() =>
          onAction({
            profile,
            kind: "delete",
            title: "Delete this account permanently?",
            message:
              "This deletes the login and the profile, and cascades to their messages and delivery records. It cannot be undone. Suspending or banning is usually the safer choice.",
            confirmLabel: "Delete permanently",
            destructive: true,
          })
        }
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Delete
      </Button>
    </div>
  );
}
