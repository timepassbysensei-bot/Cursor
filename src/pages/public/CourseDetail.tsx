import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Layers,
  ListChecks,
  Users,
  CalendarDays,
  IndianRupee,
  ChevronRight,
  Download,
  FileText,
} from "lucide-react";
import { Section, Card, Badge } from "../../components/ui/Section";
import { ButtonLink } from "../../components/ui/Button";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { useSeo } from "../../hooks/useSeo";
import { fetchCourseBySlug } from "../../services/publicContent";

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: course, isLoading, isError, refetch } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseBySlug(slug ?? ""),
    enabled: Boolean(slug),
  });

  useSeo(
    course ? `${course.title} — Bokaro Defence Academy` : "Course — Bokaro Defence Academy",
    course?.short_description ?? undefined
  );

  if (isLoading) {
    return (
      <Section><LoadingState label="Loading course…" /></Section>
    );
  }
  if (isError) {
    return <Section><ErrorState onRetry={() => refetch()} /></Section>;
  }
  if (!course) {
    return <Navigate to="/courses" replace />;
  }

  const subjects = course.subjects ?? [];

  return (
    <>
      {/* Hero band */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <nav aria-label="Breadcrumb" className="text-xs text-white/60">
            <ol className="flex flex-wrap items-center gap-1">
              <li><a href="/" className="hover:text-white">Home</a></li>
              <li aria-hidden>/</li>
              <li><a href="/courses" className="hover:text-white">Courses</a></li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-white/90">{course.title}</li>
            </ol>
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {course.featured && <Badge tone="saffron">Featured</Badge>}
            {course.admission_status !== "closed" && (
              <Badge tone="green">Admissions {course.admission_status === "filling_fast" ? "Filling Fast" : "Open"}</Badge>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            {course.title}
          </h1>
          {course.short_description && (
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/75">{course.short_description}</p>
          )}
        </div>
      </section>

      <Section tone="offwhite">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="font-display text-xl font-bold text-navy">About this course</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
                {course.full_description ?? course.short_description ?? "Detailed description will be provided by the academy office."}
              </p>
            </Card>

            {subjects.length > 0 && (
              <Card className="p-6">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold text-navy">
                  <ListChecks className="h-5 w-5 text-saffron" aria-hidden />
                  Subjects covered
                </h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {subjects.map((s) => (
                    <li key={s} className="flex items-center gap-2 rounded-lg bg-navy/[0.04] px-3 py-2 text-sm text-ink">
                      <ChevronRight className="h-4 w-4 text-saffron" aria-hidden />
                      {s}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card className="p-6">
              <h2 className="font-display text-xl font-bold text-navy">How to apply</h2>
              <ol className="mt-4 space-y-3 text-sm text-muted">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-display text-xs font-bold text-saffron">1</span>
                  Submit an inquiry through the admission form or visit the academy office.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-display text-xs font-bold text-saffron">2</span>
                  Our counsellor will explain eligibility, batch options and schedule a counselling session.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron/15 font-display text-xs font-bold text-saffron">3</span>
                  Complete the enrolment formalities at the office and join your batch.
                </li>
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink to="/admissions#apply">Apply for this Course</ButtonLink>
                <ButtonLink to="/contact" variant="outline">Ask a Question</ButtonLink>
              </div>
            </Card>
          </div>

          {/* Facts sidebar */}
          <aside>
            <Card className="sticky top-24 p-6">
              <h2 className="font-display text-base font-bold text-navy">Course facts</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {course.eligibility && (
                  <div className="flex gap-3">
                    <Users className="h-4 w-4 shrink-0 text-saffron" aria-hidden />
                    <div>
                      <dt className="font-semibold text-ink">Eligibility</dt>
                      <dd className="text-muted">{course.eligibility}</dd>
                    </div>
                  </div>
                )}
                {course.age_criteria && (
                  <div className="flex gap-3">
                    <CalendarDays className="h-4 w-4 shrink-0 text-saffron" aria-hidden />
                    <div>
                      <dt className="font-semibold text-ink">Age criteria</dt>
                      <dd className="text-muted">{course.age_criteria}</dd>
                    </div>
                  </div>
                )}
                {course.duration_text && (
                  <div className="flex gap-3">
                    <Clock className="h-4 w-4 shrink-0 text-saffron" aria-hidden />
                    <div>
                      <dt className="font-semibold text-ink">Duration</dt>
                      <dd className="text-muted">{course.duration_text}</dd>
                    </div>
                  </div>
                )}
                {course.batch_timings && (
                  <div className="flex gap-3">
                    <Layers className="h-4 w-4 shrink-0 text-saffron" aria-hidden />
                    <div>
                      <dt className="font-semibold text-ink">Batch timings</dt>
                      <dd className="text-muted">{course.batch_timings}</dd>
                    </div>
                  </div>
                )}
                {course.fees_text && (
                  <div className="flex gap-3">
                    <IndianRupee className="h-4 w-4 shrink-0 text-saffron" aria-hidden />
                    <div>
                      <dt className="font-semibold text-ink">Fees</dt>
                      <dd className="text-muted">{course.fees_text}</dd>
                    </div>
                  </div>
                )}
                {course.mode && (
                  <div className="flex gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-saffron" aria-hidden />
                    <div>
                      <dt className="font-semibold text-ink">Mode</dt>
                      <dd className="text-muted">{course.mode}</dd>
                    </div>
                  </div>
                )}
              </dl>
              {course.prospectus_url && (
                <a
                  href={course.prospectus_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-navy/25 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/[0.04]"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Download Prospectus
                </a>
              )}
              <ButtonLink to="/admissions#apply" className="mt-4 w-full">Apply Now</ButtonLink>
            </Card>
          </aside>
        </div>
      </Section>
    </>
  );
}
