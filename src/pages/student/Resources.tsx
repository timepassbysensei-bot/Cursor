import { useQuery } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import { Card, Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import { fetchStudentBatchIds } from "../../services/staff";
import { formatDate } from "../../lib/utils";

interface ResourceRow {
  id: string;
  title: string;
  description: string | null;
  url: string;
  kind: string;
  batch_id: string | null;
  course_id: string | null;
  created_at: string;
  batches: { name: string } | null;
  courses: { title: string } | null;
}

export default function StudentResources() {
  const { profile } = useAuth();
  const batchIdsQ = useQuery({
    queryKey: ["student", "batches", profile?.id],
    queryFn: () => fetchStudentBatchIds(profile!.id),
    enabled: Boolean(profile),
  });
  const batchIds = batchIdsQ.data ?? [];

  const resourcesQ = useQuery({
    queryKey: ["student", "resources", batchIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*, batches(name), courses(title)")
        .eq("status", "active")
        .in("visibility", ["students", "public"])
        .or(`batch_id.in.(${batchIds.length ? batchIds.join(",") : "00000000-0000-0000-0000-000000000000"}),and(batch_id.is.null,visibility.eq.public)`)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as ResourceRow[];
    },
    enabled: batchIdsQ.isSuccess,
  });

  if (batchIdsQ.isLoading) return <LoadingState />;
  if (batchIdsQ.isError) return <ErrorState onRetry={() => batchIdsQ.refetch()} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-navy sm:text-2xl">Resources</h1>
        <p className="mt-1 text-sm text-muted">Study material, notes and links shared by your teachers.</p>
      </div>

      {resourcesQ.isLoading ? (
        <LoadingState />
      ) : resourcesQ.isError ? (
        <ErrorState onRetry={() => resourcesQ.refetch()} />
      ) : !resourcesQ.data || resourcesQ.data.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-8 w-8 text-muted/60" aria-hidden />}
          title="No resources yet"
          hint="Material shared by your teachers will appear here."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {resourcesQ.data.map((r) => (
            <Card as="li" key={r.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-navy">{r.title}</p>
                <Badge tone="navy">{r.kind}</Badge>
              </div>
              {r.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{r.description}</p>}
              <div className="mt-3 flex items-center justify-between border-t border-lightgray pt-3">
                <span className="text-xs text-muted">
                  {r.batches?.name ?? r.courses?.title ?? "General"} · {formatDate(r.created_at)}
                </span>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-saffron underline">
                  Open
                </a>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
