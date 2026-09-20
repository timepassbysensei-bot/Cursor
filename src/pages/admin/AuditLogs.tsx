import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../features/admin/PageHeader";
import { Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { DataTable } from "../../components/ui/DataTable";
import { adminService, type AuditLogRow } from "../../services/admin";
import { formatDateTime } from "../../lib/utils";

export default function AdminAuditLogs() {
  const logsQ = useQuery({ queryKey: ["admin", "audit-logs"], queryFn: () => adminService.auditLogs() });

  const logs = logsQ.data ?? [];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Automatic record of content changes made through the admin dashboard. Retained for accountability."
      />
      {logsQ.isLoading ? (
        <LoadingState />
      ) : logsQ.isError ? (
        <ErrorState onRetry={() => logsQ.refetch()} />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit entries yet" hint="Changes you make in the admin dashboard will be logged here." />
      ) : (
        <DataTable<AuditLogRow>
          data={logs}
          pageSize={20}
          searchKeys={["action", "entity"]}
          searchPlaceholder="Search logs…"
          columns={[
            { key: "time", header: "Time", render: (l) => formatDateTime(l.created_at) },
            {
              key: "action",
              header: "Action",
              render: (l) => (
                <Badge tone={l.action === "delete" ? "red" : l.action === "insert" ? "green" : "navy"}>
                  {l.action}
                </Badge>
              ),
            },
            { key: "entity", header: "Entity", render: (l) => l.entity },
            { key: "id", header: "Record", render: (l) => <span className="font-mono text-xs">{l.entity_id?.slice(0, 8) ?? "—"}</span> },
          ]}
          mobileCard={(l) => (
            <div>
              <div className="flex items-center gap-2">
                <Badge tone={l.action === "delete" ? "red" : l.action === "insert" ? "green" : "navy"}>{l.action}</Badge>
                <span className="text-sm font-semibold text-navy">{l.entity}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{formatDateTime(l.created_at)}</p>
            </div>
          )}
        />
      )}
    </div>
  );
}
