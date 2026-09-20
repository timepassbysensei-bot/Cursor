import { useQuery } from "@tanstack/react-query";
import { Megaphone, Paperclip, Pin } from "lucide-react";
import { Section, Card, Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useSeo } from "../../hooks/useSeo";
import { fetchPublicNotices } from "../../services/publicContent";
import { formatDate } from "../../lib/utils";

export default function Notices() {
  useSeo("Notices — Bokaro Defence Academy", "Admission updates, batch announcements and important dates.");
  const { data: notices, isLoading, isError, refetch } = useQuery({
    queryKey: ["notices", "page"],
    queryFn: fetchPublicNotices,
  });

  return (
    <>
      <section className="bg-navy py-12 text-white lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron-soft">Notice Board</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Notices &amp; announcements</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Admission updates, batch announcements and important dates for the current cycle.
          </p>
        </div>
      </section>

      <Section tone="offwhite">
        {isLoading ? (
          <LoadingState label="Loading notices…" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : notices && notices.length > 0 ? (
          <ul className="space-y-4">
            {notices.map((n) => (
              <Card as="li" key={n.id} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {n.pinned && <Badge tone="saffron"><Pin className="h-3 w-3" aria-hidden /> Pinned</Badge>}
                  <span className="text-xs text-muted">{formatDate(n.publish_date)}</span>
                </div>
                <h2 className="mt-2 font-display text-lg font-bold text-navy">{n.title}</h2>
                {n.description && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{n.description}</p>
                )}
                {n.attachment_url && (
                  <a
                    href={n.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy underline hover:text-navy-mid"
                  >
                    <Paperclip className="h-4 w-4" aria-hidden />
                    View attachment
                  </a>
                )}
              </Card>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<Megaphone className="h-8 w-8 text-muted/60" aria-hidden />}
            title="No active notices right now"
            hint="New notices are published here when there are admission or batch updates."
          />
        )}
      </Section>
    </>
  );
}
