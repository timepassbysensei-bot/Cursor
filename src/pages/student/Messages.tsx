import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { Card, Badge } from "../../components/ui/Section";
import { ButtonLink } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabaseClient";
import { fetchStudentBatchIds } from "../../services/staff";
import { formatDate } from "../../lib/utils";

interface StudentNotice {
  id: string;
  title: string;
  description: string | null;
  publish_date: string;
  pinned: boolean;
  audience: string;
}

export default function StudentMessages() {
  const { profile } = useAuth();
  const batchIdsQ = useQuery({
    queryKey: ["student", "batches", profile?.id],
    queryFn: () => fetchStudentBatchIds(profile!.id),
    enabled: Boolean(profile),
  });
  const batchIds = batchIdsQ.data ?? [];

  const noticesQ = useQuery({
    queryKey: ["student", "messages", batchIds],
    queryFn: async () => {
      // Batch notices + academy-wide student notices (RLS scopes rows correctly)
      const { data, error } = await supabase
        .from("notices")
        .select("id, title, description, publish_date, pinned, audience")
        .eq("status", "published")
        .in("audience", batchIds.length ? ["all_students", "batch"] : ["all_students"])
        .order("pinned", { ascending: false })
        .order("publish_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as StudentNotice[];
    },
    enabled: batchIdsQ.isSuccess,
  });

  if (batchIdsQ.isLoading) return <LoadingState />;
  if (batchIdsQ.isError) return <ErrorState onRetry={() => batchIdsQ.refetch()} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-navy sm:text-2xl">Messages</h1>
        <p className="mt-1 text-sm text-muted">Notices from the academy office and your teachers.</p>
      </div>

      {noticesQ.isLoading ? (
        <LoadingState />
      ) : noticesQ.isError ? (
        <ErrorState onRetry={() => noticesQ.refetch()} />
      ) : !noticesQ.data || noticesQ.data.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-8 w-8 text-muted/60" aria-hidden />}
          title="No messages yet"
          hint="Academy and batch announcements will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {noticesQ.data.map((n) => (
            <Card as="li" key={n.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-sm font-bold text-navy">{n.pinned ? "📌 " : ""}{n.title}</p>
                <Badge tone={n.audience === "batch" ? "saffron" : "navy"}>
                  {n.audience === "batch" ? "Your batch" : "All students"}
                </Badge>
              </div>
              {n.description && <p className="mt-2 text-sm text-muted">{n.description}</p>}
              <p className="mt-2 text-xs text-muted">{formatDate(n.publish_date)}</p>
            </Card>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-muted">
        Need to reach the office? Use the contact details on the{" "}
        <ButtonLink to="/contact" variant="ghost" size="sm" className="h-auto px-1 py-0 text-xs underline">
          website contact page
        </ButtonLink>
        .
      </p>
    </div>
  );
}
