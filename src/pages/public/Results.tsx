import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Section, Card, Badge } from "../../components/ui/Section";
import { ButtonLink } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useSeo } from "../../hooks/useSeo";
import { fetchPublishedAchievements } from "../../services/publicContent";

export default function Results() {
  useSeo(
    "Results & Achievements — Bokaro Defence Academy",
    "Student achievements published with consent after verification."
  );
  const { data: achievements, isLoading, isError, refetch } = useQuery({
    queryKey: ["achievements", "page"],
    queryFn: fetchPublishedAchievements,
  });

  return (
    <>
      <section className="bg-navy py-12 text-white lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron-soft">Results</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Achievements &amp; results</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            We publish only verified student achievements, with each student's recorded consent.
          </p>
        </div>
      </section>

      <Section tone="offwhite">
        {isLoading ? (
          <LoadingState label="Loading results…" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : achievements && achievements.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {achievements.map((a) => (
              <Card key={a.id} className="flex flex-col p-5 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-saffron/40 bg-navy/[0.06]">
                  {a.photo_url ? (
                    <img src={a.photo_url} alt={a.student_name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="font-display text-2xl font-bold text-navy">{a.student_name.slice(0, 1)}</span>
                  )}
                </div>
                <p className="mt-3 font-display text-base font-bold text-navy">{a.student_name}</p>
                <p className="mt-0.5 text-xs text-muted">{a.examination ?? "Defence examination"}</p>
                {a.result_text && (
                  <Badge tone="green" className="mt-2 self-center">{a.result_text}</Badge>
                )}
                {a.description && <p className="mt-2 line-clamp-3 text-xs text-muted">{a.description}</p>}
                {a.year && <p className="mt-auto pt-3 text-xs font-semibold text-muted">{a.year}</p>}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Trophy className="h-8 w-8 text-muted/60" aria-hidden />}
            title="Results will appear here after publication"
            hint="We publish verified student achievements after each selection cycle, with student consent."
            action={<ButtonLink to="/admissions#apply" size="sm" className="mt-2">Begin Your Journey</ButtonLink>}
          />
        )}
      </Section>
    </>
  );
}
