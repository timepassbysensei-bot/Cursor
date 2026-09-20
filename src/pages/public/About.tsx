import { BookOpen, Dumbbell, UserCheck, ClipboardCheck, Users } from "lucide-react";
import { Section, SectionHeader, Card } from "../../components/ui/Section";
import { ButtonLink } from "../../components/ui/Button";
import { useSeo } from "../../hooks/useSeo";
import { useSiteSettings } from "../../hooks/useSiteSettings";

const APPROACH = [
  { icon: BookOpen, title: "Concept-first teaching", text: "Fundamentals are built before speed — every topic starts from basics." },
  { icon: ClipboardCheck, title: "Testing as a habit", text: "Weekly tests and mocks make exam pressure familiar long before exam day." },
  { icon: Dumbbell, title: "Physical readiness", text: "Fitness routines run alongside academics, aligned to defence standards." },
  { icon: UserCheck, title: "Mentor-led progress", text: "Each student's tests and attendance are tracked, with feedback that resets the plan." },
];

export default function About() {
  const { data: settings } = useSiteSettings();
  useSeo(
    `About Us — ${settings?.academy_name ?? "Bokaro Defence Academy"}`,
    "Learn about our mission, vision and teaching approach for defence exam preparation."
  );

  return (
    <>
      <section className="bg-navy py-12 text-white lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron-soft">About Us</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
            {settings?.academy_name ?? "Bokaro Defence Academy"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            {settings?.tagline ??
              "Disciplined, personal and exam-focused preparation for defence careers."}
          </p>
        </div>
      </section>

      <Section tone="offwhite">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-navy">Overview</h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            {settings?.about_overview ??
              "A defence-exam coaching academy focused on structured preparation: concept-first teaching, regular testing, physical training and personal mentorship for every enrolled student."}
          </p>
        </div>
      </Section>

      <Section tone="white">
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron">Mission</p>
            <p className="mt-3 text-base leading-relaxed text-ink">
              {settings?.about_mission ??
                "To prepare dedicated young aspirants for careers as officers in the Indian Armed Forces through disciplined, honest and personal coaching."}
            </p>
          </Card>
          <Card className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-academy">Vision</p>
            <p className="mt-3 text-base leading-relaxed text-ink">
              {settings?.about_vision ??
                "To be a trusted local academy where students are known by name and prepared for every stage of selection."}
            </p>
          </Card>
        </div>
      </Section>

      <Section tone="offwhite">
        <SectionHeader
          eyebrow="Teaching Approach"
          title="How we prepare students"
          subtitle="Four pillars guide every course we run."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {APPROACH.map((a) => (
            <Card key={a.title} className="p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-saffron/10 text-saffron">
                <a.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-navy">{a.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{a.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="cream">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron">Director's Message</p>
            <blockquote className="mt-4 text-lg leading-relaxed text-ink sm:text-xl">
              “
              {settings?.director_message ??
                "A message from our director will appear here once it is added by the academy team. Every element on this page is editable from the admin dashboard."}
              ”
            </blockquote>
            <p className="mt-4 font-display font-bold text-navy">
              {settings?.director_name ?? "Academy Director"}
              {settings?.director_title ? ` · ${settings.director_title}` : ""}
            </p>
          </div>
          <div className="justify-self-center lg:justify-self-end">
            {settings?.director_image_url ? (
              <img
                src={settings.director_image_url}
                alt={settings.director_name ?? "Academy director"}
                className="h-64 w-64 rounded-2xl border-4 border-white object-cover shadow-lift"
                loading="lazy"
              />
            ) : (
              <div className="flex h-64 w-64 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-lightgray bg-white text-center">
                <Users className="h-10 w-10 text-muted/50" aria-hidden />
                <p className="px-6 text-xs text-muted">Director photograph not yet added</p>
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section tone="navy">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Want to see how we work?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">
            Visit a class, meet the faculty and understand our preparation system before you enrol.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/courses">Explore Courses</ButtonLink>
            <ButtonLink to="/contact" variant="outlineLight">Contact Us</ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
