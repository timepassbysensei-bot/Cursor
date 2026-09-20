import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ClipboardCheck,
  Dumbbell,
  UserCheck,
  Users,
  Target,
  Phone,
  MessageCircle,
  MapPin,
  Mail,
  Clock,
  ChevronRight,
  Sparkles,
  CalendarDays,
  Megaphone,
  ArrowRight,
  Images as ImagesIcon,
} from "lucide-react";
import { Section, SectionHeader, Card, Badge } from "../../components/ui/Section";
import { ButtonLink } from "../../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../../components/ui/States";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { useSeo } from "../../hooks/useSeo";
import {
  fetchPublishedCourses,
  fetchUpcomingBatches,
  fetchPublicNotices,
  fetchPublishedAchievements,
  fetchApprovedTestimonials,
  fetchPublishedAlbums,
  fetchPublishedFaqs,
} from "../../services/publicContent";
import { formatDate, safeExternal, cn } from "../../lib/utils";

const HIGHLIGHTS = [
  {
    icon: BookOpen,
    title: "Structured syllabus coverage",
    text: "Every topic from the official notification is mapped to a clear week-by-week plan — no guesswork.",
  },
  {
    icon: ClipboardCheck,
    title: "Regular tests & feedback",
    text: "Weekly tests and full mocks under exam conditions, with written feedback on every paper.",
  },
  {
    icon: Dumbbell,
    title: "Physical fitness preparation",
    text: "Running, endurance and strength routines aligned with defence physical standards.",
  },
  {
    icon: UserCheck,
    title: "Personal guidance",
    text: "Small batches mean mentors track each student's progress and clear doubts one-on-one.",
  },
  {
    icon: Users,
    title: "Small-batch attention",
    text: "Restricted batch sizes so every student is seen, heard and corrected in class.",
  },
  {
    icon: Target,
    title: "Exam-focused preparation",
    text: "Practice built around the actual exam pattern, previous papers and time strategy.",
  },
];

const JOURNEY = [
  { title: "Understand the target exam", text: "We start with the notification, pattern, syllabus and realistic timelines." },
  { title: "Build subject foundations", text: "Concept classes strengthen Maths, English and General Ability basics." },
  { title: "Practise through tests", text: "Weekly tests and full mocks build speed, accuracy and exam temperament." },
  { title: "Improve physical readiness", text: "Structured fitness routines prepare students for physical standards." },
  { title: "Receive feedback", text: "Mentors review every test, highlight weak areas and reset the plan." },
  { title: "Prepare for the next stage", text: "SSB-style guidance, interview practice and personality development." },
];

export default function Home() {
  const { data: settings } = useSiteSettings();
  useSeo(
    settings?.seo_title ?? `${settings?.academy_name ?? "Bokaro Defence Academy"} — Defence Exam Preparation`,
    settings?.seo_description ?? undefined
  );

  const coursesQ = useQuery({ queryKey: ["courses", "home"], queryFn: fetchPublishedCourses });
  const batchesQ = useQuery({ queryKey: ["batches", "home"], queryFn: fetchUpcomingBatches });
  const noticesQ = useQuery({ queryKey: ["notices", "home"], queryFn: fetchPublicNotices });
  const achievementsQ = useQuery({ queryKey: ["achievements", "home"], queryFn: fetchPublishedAchievements });
  const testimonialsQ = useQuery({ queryKey: ["testimonials", "home"], queryFn: fetchApprovedTestimonials });
  const albumsQ = useQuery({ queryKey: ["albums", "home"], queryFn: fetchPublishedAlbums });
  const faqsQ = useQuery({ queryKey: ["faqs", "home"], queryFn: fetchPublishedFaqs });

  const admissionStatus = settings?.admission_status ?? "open";
  const phone = settings?.contact_phone ?? null;
  const whatsapp = settings?.contact_whatsapp ?? null;

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-navy-dark text-white">
        {settings?.hero_image_url && (
          <img
            src={settings.hero_image_url}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, rgba(7,26,43,0.95) 0%, rgba(16,42,67,0.88) 45%, rgba(16,42,67,0.72) 100%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12 lg:px-8 lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-saffron/40 bg-saffron/15 px-3.5 py-1.5 text-xs font-semibold text-saffron-soft">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {admissionStatus === "open" && "Admissions Open"}
              {admissionStatus === "filling_fast" && "Admissions Open — Filling Fast"}
              {admissionStatus === "closed" && "Admissions Currently Closed"}
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {settings?.hero_heading ??
                "Disciplined preparation for India's defence examinations."}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              {settings?.hero_description ??
                "Structured coaching for NDA, CDS, AFCAT and Agniveer aspirants — rigorous academics, physical readiness and personal mentorship, guided by experienced faculty."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/admissions#apply" size="lg">
                {settings?.hero_cta_apply_label ?? "Apply Now"}
              </ButtonLink>
              <ButtonLink to="/courses" size="lg" variant="outlineLight">
                {settings?.hero_cta_courses_label ?? "Explore Courses"}
              </ButtonLink>
              {phone && (
                <a
                  href={`tel:+91${phone}`}
                  className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/25 px-5 font-display text-base font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Phone className="h-5 w-5" aria-hidden />
                  Call Now
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/91${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#1FA855] px-5 font-display text-base font-semibold text-white hover:bg-[#178a44]"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="mt-12 hidden lg:mt-0 lg:block">
            <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-saffron-soft">
                Inside the academy
              </p>
              <ul className="mt-4 space-y-4 text-sm">
                {HIGHLIGHTS.slice(0, 4).map((h) => (
                  <li key={h.title} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-saffron/20 text-saffron-soft">
                      <h.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-display font-semibold text-white">{h.title}</p>
                      <p className="mt-0.5 text-white/65">{h.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                to="/about"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-saffron-soft hover:text-saffron"
              >
                More about the academy <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        {/* Operating highlights strip */}
        <div className="relative border-t border-white/10 bg-navy/60">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
            {[
              { label: "Target exams", value: "NDA · CDS · AFCAT · Agniveer" },
              { label: "Batch mode", value: "Offline batches at the academy" },
              { label: "Doubt support", value: "In-class + mentor guidance" },
              { label: "Tests", value: "Weekly tests & full mocks" },
            ].map((s) => (
              <div key={s.label} className="px-3 py-5 first:pl-0 md:px-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{s.label}</p>
                <p className="mt-1 text-sm font-semibold text-white sm:text-[15px]">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ABOUT PREVIEW ============ */}
      <Section tone="offwhite">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow-rule text-xs font-semibold uppercase tracking-[0.18em] text-saffron">About the Academy</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy text-balance sm:text-4xl">
              {settings?.academy_name ?? "Bokaro Defence Academy"}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              {settings?.about_overview ??
                "A defence-exam coaching academy focused on structured preparation: concept-first teaching, regular testing, physical training and personal mentorship for every enrolled student."}
            </p>
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="border-l-2 border-saffron pl-4">
                <dt className="font-display text-sm font-bold text-navy">Our Mission</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">
                  {settings?.about_mission ??
                    "To prepare dedicated young aspirants for careers as officers in the Indian Armed Forces through disciplined, honest and personal coaching."}
                </dd>
              </div>
              <div className="border-l-2 border-green-academy pl-4">
                <dt className="font-display text-sm font-bold text-navy">Our Vision</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">
                  {settings?.about_vision ??
                    "To be a trusted local academy where students are known by name and prepared for every stage of selection."}
                </dd>
              </div>
            </dl>
            <div className="mt-8">
              <ButtonLink to="/about" variant="outline">Learn More About Us</ButtonLink>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-lightgray shadow-lift">
              {settings?.hero_image_url ? (
                <img src={settings.hero_image_url} alt="Students preparing at the academy" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-navy text-white/80">
                  <ShieldIcon />
                  <p className="px-8 text-center text-sm">
                    Academy photograph not yet added — staff can upload it from the admin dashboard.
                  </p>
                </div>
              )}
            </div>
            {settings?.director_name && (
              <div className="absolute -bottom-6 left-6 right-6 rounded-xl border border-lightgray bg-white p-4 shadow-lift sm:left-10 sm:right-auto sm:w-80">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-saffron">From the Director</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink">
                  “{settings.director_message ?? "Message from our director will appear here."}”
                </p>
                <p className="mt-2 text-xs font-semibold text-navy">
                  {settings.director_name}
                  {settings.director_title ? ` · ${settings.director_title}` : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ============ COURSES ============ */}
      <Section tone="white" id="courses">
        <SectionHeader
          eyebrow="Programmes"
          title="Courses we prepare for"
          subtitle="Focused, exam-oriented programmes for the major defence entry routes. Each course combines classroom teaching, tests, and physical preparation."
        />
        {coursesQ.isLoading ? (
          <LoadingState label="Loading courses…" />
        ) : coursesQ.isError ? (
          <ErrorState onRetry={() => coursesQ.refetch()} />
        ) : coursesQ.data && coursesQ.data.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {coursesQ.data.slice(0, 6).map((course) => (
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
                    <h3 className="mt-3 font-display text-lg font-bold text-navy">{course.title}</h3>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">
                      {course.short_description ?? "Details available on the course page."}
                    </p>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
                      {course.duration_text && (
                        <div><dt className="inline font-semibold text-ink">Duration: </dt><dd className="inline">{course.duration_text}</dd></div>
                      )}
                      {course.mode && (
                        <div><dt className="inline font-semibold text-ink">Mode: </dt><dd className="inline">{course.mode}</dd></div>
                      )}
                    </dl>
                    <div className="mt-5">
                      <ButtonLink to={`/courses/${course.slug}`} variant="outline" size="sm" className="w-full">
                        View Course <ChevronRight className="h-4 w-4" aria-hidden />
                      </ButtonLink>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-10 text-center">
              <ButtonLink to="/courses" variant="navy">Explore All Courses</ButtonLink>
            </div>
          </>
        ) : (
          <EmptyState
            compact
            title="Course details are being finalised"
            hint="Our programmes are being updated. Please check back soon or contact us directly for the latest course list."
            action={<ButtonLink to="/contact" variant="outline" size="sm" className="mt-2">Contact the Academy</ButtonLink>}
          />
        )}
      </Section>

      {/* ============ WHY CHOOSE US ============ */}
      <Section tone="navy" ariaLabel="Why choose us">
        <SectionHeader
          tone="light"
          eyebrow="Why Choose Us"
          title="Preparation that covers every stage"
          subtitle="Written exam, physical standards and personality — each part of selection gets dedicated attention."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((h, i) => (
            <div
              key={h.title}
              className="rounded-xl border border-white/10 bg-white/[0.05] p-5 transition-colors hover:bg-white/[0.08]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-saffron/20 text-saffron-soft">
                  <h.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-display text-xs font-bold text-white/40">0{i + 1}</span>
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-white">{h.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/65">{h.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ============ PREPARATION JOURNEY ============ */}
      <Section tone="offwhite">
        <SectionHeader
          eyebrow="Preparation Journey"
          title="How your preparation unfolds"
          subtitle="A structured path from day one to the final selection stages — every step tracked and supported."
        />
        <ol className="relative mx-auto max-w-3xl space-y-8 border-l-2 border-lightgray pl-8">
          {JOURNEY.map((step, i) => (
            <li key={step.title} className="relative">
              <span className="absolute -left-[42px] flex h-8 w-8 items-center justify-center rounded-full border-2 border-saffron bg-white font-display text-xs font-bold text-navy">
                {i + 1}
              </span>
              <h3 className="font-display text-base font-bold text-navy">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ============ UPCOMING BATCHES ============ */}
      <Section tone="cream">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader
            align="left"
            eyebrow="Admissions"
            title="Upcoming batches"
            subtitle="Planned batches for the current admission cycle. Timings and seats are confirmed by the office at counselling."
            className="mb-0"
          />
          <ButtonLink to="/admissions" variant="navy" className="shrink-0">Request Counselling</ButtonLink>
        </div>
        <div className="mt-10">
          {batchesQ.isLoading ? (
            <LoadingState label="Loading batches…" />
          ) : batchesQ.data && batchesQ.data.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {batchesQ.data.map((batch) => (
                <Card key={batch.id} className="flex flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={batch.admission_status === "open" ? "green" : "saffron"}>
                      {batch.admission_status === "open" ? "Admissions Open" : "Filling Fast"}
                    </Badge>
                    <span className="text-xs text-muted">{batch.timing_text ?? "Timings on request"}</span>
                  </div>
                  <h3 className="mt-3 font-display text-base font-bold text-navy">{batch.name}</h3>
                  <p className="mt-0.5 text-sm text-muted">{batch.course_title ?? "Course details at office"}</p>
                  <dl className="mt-4 space-y-1.5 text-sm text-muted">
                    {batch.start_date && (
                      <div className="flex gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-navy/50" aria-hidden />
                        <span>Starts {formatDate(batch.start_date)}</span>
                      </div>
                    )}
                    {batch.capacity != null && (
                      <div className="flex gap-2">
                        <Users className="h-4 w-4 shrink-0 text-navy/50" aria-hidden />
                        <span>{batch.capacity} seats</span>
                      </div>
                    )}
                  </dl>
                  <div className="mt-5 flex gap-2">
                    <ButtonLink to="/admissions#apply" size="sm" className="flex-1">Apply Now</ButtonLink>
                    <ButtonLink to="/contact" size="sm" variant="outline" className="flex-1">Enquire</ButtonLink>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              title="Batch schedule is being updated"
              hint="New batch dates are announced regularly. Contact us for the latest schedule or request counselling."
              action={<ButtonLink to="/admissions#apply" size="sm" className="mt-2">Request Counselling</ButtonLink>}
            />
          )}
        </div>
      </Section>

      {/* ============ NOTICES ============ */}
      {noticesQ.data && noticesQ.data.length > 0 && (
        <Section tone="offwhite">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="eyebrow-rule text-xs font-semibold uppercase tracking-[0.18em] text-saffron">Notice Board</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy">Latest notices</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Admission updates, batch announcements and important dates for the current cycle.
              </p>
              <div className="mt-6">
                <ButtonLink to="/notices" variant="outline" size="sm">View All Notices</ButtonLink>
              </div>
            </div>
            <ul className="space-y-3">
              {noticesQ.data.slice(0, 4).map((n) => (
                <Card as="li" key={n.id} className="flex gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-saffron/10 text-saffron">
                    <Megaphone className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-navy">{n.title}</p>
                    {n.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{n.description}</p>}
                    <p className="mt-1 text-xs text-muted">{formatDate(n.publish_date)}</p>
                  </div>
                </Card>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {/* ============ RESULTS ============ */}
      {achievementsQ.data && achievementsQ.data.length > 0 && (
        <Section tone="white">
          <SectionHeader
            eyebrow="Results"
            title="Achievements we celebrate"
            subtitle="Published with the consent of each student. Verified results appear here after moderation."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {achievementsQ.data.slice(0, 4).map((a) => (
              <Card key={a.id} className="p-5 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-saffron/40 bg-navy/[0.06]">
                  {a.photo_url ? (
                    <img src={a.photo_url} alt={a.student_name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="font-display text-xl font-bold text-navy">{a.student_name.slice(0, 1)}</span>
                  )}
                </div>
                <p className="mt-3 font-display text-sm font-bold text-navy">{a.student_name}</p>
                <p className="mt-0.5 text-xs text-muted">{a.examination ?? "Defence examination"}</p>
                <p className="mt-2 font-display text-sm font-semibold text-green-success">{a.result_text ?? ""}</p>
                {a.year && <p className="mt-1 text-xs text-muted">{a.year}</p>}
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <ButtonLink to="/results" variant="navy">View All Results</ButtonLink>
          </div>
        </Section>
      )}

      {/* ============ TESTIMONIALS ============ */}
      {testimonialsQ.data && testimonialsQ.data.length > 0 && (
        <Section tone="offwhite">
          <SectionHeader
            eyebrow="Testimonials"
            title="Words from our students"
            subtitle="Shared voluntarily and published after review."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {testimonialsQ.data.slice(0, 3).map((t) => (
              <Card key={t.id} className="flex flex-col p-5">
                <div className="flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} filled={i < t.rating} />
                  ))}
                </div>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink">“{t.quote}”</blockquote>
                <p className="mt-4 font-display text-sm font-bold text-navy">{t.name}</p>
                {t.course_text && <p className="text-xs text-muted">{t.course_text}</p>}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* ============ GALLERY PREVIEW ============ */}
      {albumsQ.data && albumsQ.data.length > 0 && (
        <Section tone="navy">
          <SectionHeader
            tone="light"
            eyebrow="Campus"
            title="Life at the academy"
            subtitle="Classrooms, training sessions and everyday preparation."
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {albumsQ.data.slice(0, 4).map((album) => (
              <Link key={album.id} to="/gallery" className="group overflow-hidden rounded-xl border border-white/10">
                <div className="aspect-[4/3] bg-navy-soft">
                  {album.cover_image_url ? (
                    <img
                      src={album.cover_image_url}
                      alt={album.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/40">
                      <ImagesIcon className="h-8 w-8" aria-hidden />
                    </div>
                  )}
                </div>
                <p className="bg-navy-dark px-3 py-2.5 text-xs font-semibold text-white">{album.title}</p>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <ButtonLink to="/gallery" variant="outlineLight">View Gallery</ButtonLink>
          </div>
        </Section>
      )}

      {/* ============ FAQs ============ */}
      <Section tone="offwhite" id="faqs">
        <SectionHeader
          eyebrow="FAQs"
          title="Questions aspirants ask us"
          subtitle="Cannot find your answer? Use the assistant chat or contact the office directly."
        />
        {faqsQ.data && faqsQ.data.length > 0 ? (
          <div className="mx-auto max-w-3xl divide-y divide-lightgray rounded-xl border border-lightgray bg-white">
            {faqsQ.data.slice(0, 6).map((f) => (
              <details key={f.id} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-sm font-semibold text-navy">
                  {f.question}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-90" aria-hidden />
                </summary>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{f.answer}</p>
              </details>
            ))}
          </div>
        ) : (
          <EmptyState compact title="FAQs are being compiled" hint="Our team is preparing answers to common questions." />
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/contact" variant="outline" size="sm">Ask a Question</ButtonLink>
          <ButtonLink to="/contact#faqs" variant="ghost" size="sm">View All FAQs</ButtonLink>
        </div>
      </Section>

      {/* ============ FINAL CONVERSION ============ */}
      <section className="bg-cream" aria-label="Start your preparation">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-navy px-6 py-12 text-center shadow-lift sm:px-12">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
              Ready to begin your preparation?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
              Talk to our counsellors about the right course, batch timing and preparation plan for your target exam — no pressure, no obligation.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink to="/admissions#apply" size="lg">Apply Now</ButtonLink>
              {phone && (
                <a
                  href={`tel:+91${phone}`}
                  className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/25 px-6 font-display font-semibold text-white hover:bg-white/10"
                >
                  <Phone className="h-5 w-5" aria-hidden />
                  Call Now
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/91${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#1FA855] px-6 font-display font-semibold text-white hover:bg-[#178a44]"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  WhatsApp
                </a>
              )}
              <ButtonLink to="/contact" size="lg" variant="outlineLight">Request Counselling</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CONTACT STRIP ============ */}
      <Section tone="white">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow-rule text-xs font-semibold uppercase tracking-[0.18em] text-saffron">Contact</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy">Visit or reach us</h2>
            <ul className="mt-6 space-y-4 text-sm">
              {settings?.contact_address && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-saffron" aria-hidden />
                  <span className="text-ink">{settings.contact_address}</span>
                </li>
              )}
              {phone && (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-saffron" aria-hidden />
                  <a className="text-ink hover:text-navy" href={`tel:+91${phone}`}>+91 {phone}</a>
                </li>
              )}
              {settings?.contact_email && (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-saffron" aria-hidden />
                  <a className="text-ink hover:text-navy" href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
                </li>
              )}
              {settings?.contact_hours && (
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-saffron" aria-hidden />
                  <span className="text-ink">{settings.contact_hours}</span>
                </li>
              )}
            </ul>
            {settings?.map_url && safeExternal(settings.map_url) && (
              <div className="mt-6">
                <ButtonLink to={settings.map_url} external variant="outline" size="sm">
                  Get Directions
                </ButtonLink>
              </div>
            )}
          </div>
          <Card className="p-6 sm:p-8">
            <h3 className="font-display text-lg font-bold text-navy">Send us a message</h3>
            <p className="mt-1 text-sm text-muted">
              Use the admissions form and our team will call you back — or drop by during office hours.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink to="/admissions#apply">Apply for Admission</ButtonLink>
              <ButtonLink to="/contact" variant="outline">Contact Page</ButtonLink>
            </div>
          </Card>
        </div>
      </Section>
    </>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cn("h-4 w-4", filled ? "text-saffron" : "text-lightgray")}
      aria-hidden
      fill="currentColor"
    >
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-16 w-16">
      <path
        d="M24 4l15 6v10c0 10.5-6.4 18.2-15 24-8.6-5.8-15-13.5-15-24V10l15-6z"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M24 14v14M17 21h14" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
