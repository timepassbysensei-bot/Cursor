import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, Clock, Users, CalendarDays } from "lucide-react";
import { Section, Card, Badge } from "../../components/ui/Section";
import { ButtonLink } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useSeo } from "../../hooks/useSeo";
import { fetchPublishedCourses } from "../../services/publicContent";

export default function Courses() {
  useSeo("Courses — Bokaro Defence Academy", "Defence exam preparation programmes: NDA, CDS, AFCAT, Agniveer and foundation courses.");
  const { data: courses, isLoading, isError, refetch } = useQuery({
    queryKey: ["courses", "list"],
    queryFn: fetchPublishedCourses,
  });

  return (
    <>
      <section className="bg-navy py-12 text-white lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron-soft">Programmes</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Our Courses</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Structured programmes for the major defence entry routes. Every course combines classroom teaching,
            regular testing and physical preparation.
          </p>
        </div>
      </section>

      <Section tone="offwhite">
        {isLoading ? (
          <LoadingState label="Loading courses…" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : courses && courses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col overflow-hidden">
                <div className="aspect-[16/9]">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt="" aria-hidden className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-navy/[0.06] text-navy/40">
                      <BookOpen className="h-10 w-10" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {course.featured && <Badge tone="saffron">Featured</Badge>}
                    {course.admission_status !== "closed" && (
                      <Badge tone="green">
                        Admissions {course.admission_status === "filling_fast" ? "Filling Fast" : "Open"}
                      </Badge>
                    )}
                  </div>
                  <h2 className="mt-3 font-display text-lg font-bold text-navy">{course.title}</h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">
                    {course.short_description ?? "Details available on the course page."}
                  </p>
                  <ul className="mt-4 space-y-1.5 text-xs text-muted">
                    {course.eligibility && (
                      <li className="flex gap-2"><Users className="h-3.5 w-3.5 shrink-0 text-navy/50" aria-hidden />{course.eligibility}</li>
                    )}
                    {course.duration_text && (
                      <li className="flex gap-2"><Clock className="h-3.5 w-3.5 shrink-0 text-navy/50" aria-hidden />{course.duration_text}</li>
                    )}
                    {course.batch_timings && (
                      <li className="flex gap-2"><CalendarDays className="h-3.5 w-3.5 shrink-0 text-navy/50" aria-hidden />{course.batch_timings}</li>
                    )}
                  </ul>
                  <div className="mt-5 flex gap-2">
                    <ButtonLink to={`/courses/${course.slug}`} size="sm" className="flex-1">
                      View Course <ChevronRight className="h-4 w-4" aria-hidden />
                    </ButtonLink>
                    <ButtonLink to="/admissions#apply" size="sm" variant="outline" className="flex-1">
                      Apply
                    </ButtonLink>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Course details are being finalised"
            hint="Our programmes are being updated. Please contact us directly for the latest course list and admission status."
            action={<ButtonLink to="/contact" variant="outline" size="sm" className="mt-2">Contact the Academy</ButtonLink>}
          />
        )}
      </Section>
    </>
  );
}
