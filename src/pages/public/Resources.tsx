import { useQuery } from "@tanstack/react-query";
import { Download, FileText, ExternalLink } from "lucide-react";
import { Section, Card, Badge } from "../../components/ui/Section";
import { ButtonLink } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useSeo } from "../../hooks/useSeo";
import { supabase } from "../../lib/supabaseClient";

interface PublicResource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  kind: string;
}

export default function Resources() {
  useSeo("Resources — Bokaro Defence Academy", "Prospectus, syllabus and preparation material published by the academy.");
  const { data: resources, isLoading, isError, refetch } = useQuery({
    queryKey: ["resources", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("id, title, description, url, kind")
        .eq("status", "active")
        .eq("visibility", "public")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PublicResource[];
    },
  });

  return (
    <>
      <section className="bg-navy py-12 text-white lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron-soft">Resources</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Public resources</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Prospectus, syllabus documents and other material the academy has published openly.
            Enrolled students get additional materials inside the student portal.
          </p>
        </div>
      </section>

      <Section tone="offwhite">
        {isLoading ? (
          <LoadingState label="Loading resources…" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : resources && resources.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <Card as="li" key={r.id} className="flex flex-col p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/[0.06] text-navy">
                    <FileText className="h-5 w-5" aria-hidden />
                  </span>
                  {r.kind && <Badge tone="gray">{r.kind}</Badge>}
                </div>
                <h2 className="mt-3 font-display text-base font-bold text-navy">{r.title}</h2>
                {r.description && <p className="mt-1 flex-1 text-sm text-muted">{r.description}</p>}
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy underline"
                  >
                    {r.kind === "link" ? (
                      <><ExternalLink className="h-4 w-4" aria-hidden /> Open link</>
                    ) : (
                      <><Download className="h-4 w-4" aria-hidden /> Open resource</>
                    )}
                  </a>
                )}
              </Card>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No public resources yet"
            hint="Documents published by the academy will appear here. Enrolled students can access their materials in the portal."
            action={<ButtonLink to="/auth/login" variant="outline" size="sm" className="mt-2">Student Login</ButtonLink>}
          />
        )}
      </Section>
    </>
  );
}
