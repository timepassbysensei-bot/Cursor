import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, FileText, CalendarDays, UserCheck, Award } from "lucide-react";
import { Section, SectionHeader, Card } from "../../components/ui/Section";
import { Button, ButtonLink } from "../../components/ui/Button";
import { useSeo } from "../../hooks/useSeo";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { inquirySchema, type InquiryInput } from "../../validation/schemas";
import { submitInquiry, fetchPublishedCourses } from "../../services/publicContent";

const PROCESS = [
  { icon: FileText, title: "1. Submit inquiry", text: "Fill the form below or visit the office. Our counsellor will call you back." },
  { icon: UserCheck, title: "2. Counselling", text: "Discuss your target exam, eligibility and the right course for you." },
  { icon: CalendarDays, title: "3. Choose a batch", text: "Pick a batch timing that fits your routine; seats are confirmed at the office." },
  { icon: Award, title: "4. Enrol & begin", text: "Complete enrolment formalities and start your preparation with the batch." },
];

const DOCUMENTS = [
  "Recent passport-size photographs",
  "Aadhaar card (or other photo ID)",
  "Date-of-birth proof (birth certificate / Class 10 certificate)",
  "Previous class marksheet (for foundation courses)",
  "Category certificate, if applicable",
];

function utmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  };
}

export default function Admissions() {
  useSeo(
    "Admissions — Bokaro Defence Academy",
    "Admission process, eligibility, required documents and inquiry form for defence exam preparation courses."
  );
  const { data: settings } = useSiteSettings();
  const { data: courses } = useQuery({ queryKey: ["courses", "list"], queryFn: fetchPublishedCourses });

  const [startedAt] = useState(() => Date.now());
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { name: "", email: "", phone: "", whatsapp: "", city: "", message: "", interested_course_id: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: InquiryInput) => {
      const utm = utmParams();
      await submitInquiry({
        name: values.name,
        email: values.email || null,
        phone: values.phone,
        whatsapp: values.whatsapp || null,
        city: values.city || null,
        interested_course_id: values.interested_course_id || null,
        message: values.message || null,
        source_page: "/admissions",
        ...utm,
      });
    },
    onSuccess: () => {
      setSuccess(true);
      reset();
    },
    onError: () => {
      setServerError("We could not submit your inquiry right now. Please try again, or call us directly.");
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    // Honeypot field must stay empty; bots typically fill it.
    const honeypot = (document.getElementById("company_hp") as HTMLInputElement | null)?.value;
    if (honeypot) {
      setSuccess(true); // silently drop
      return;
    }
    if (Date.now() - startedAt < 2500) {
      setServerError("Form submitted too quickly — please review and try again.");
      return;
    }
    setServerError(null);
    mutation.mutate(values);
  });

  const docs = useMemo(() => {
    const configured = (settings as unknown as { required_documents?: unknown })?.required_documents;
    if (Array.isArray(configured) && configured.length > 0) return configured as string[];
    return DOCUMENTS;
  }, [settings]);

  return (
    <>
      <section className="bg-navy py-12 text-white lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron-soft">Admissions</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Join the academy</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            {settings?.admissions_intro ??
              "A simple four-step admission process. Our team will guide you from inquiry to enrolment."}
          </p>
        </div>
      </section>

      <Section tone="offwhite">
        <SectionHeader eyebrow="Process" title="How admission works" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((p) => (
            <Card key={p.title} className="p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/[0.06] text-navy">
                <p.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-navy">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-navy">Eligibility</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {settings?.eligibility_text ??
                  "Eligibility depends on your target exam (NDA, CDS, AFCAT, Agniveer). Our counsellor will confirm the exact age and qualification criteria for your chosen entry route during counselling."}
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-navy">Required documents</h2>
              <ul className="mt-3 space-y-2">
                {docs.map((d) => (
                  <li key={d} className="flex gap-2 text-sm text-muted">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-success" aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            {settings?.scholarship_text && (
              <div>
                <h2 className="font-display text-2xl font-bold text-navy">Scholarships &amp; discounts</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{settings.scholarship_text}</p>
              </div>
            )}
          </div>

          {/* Inquiry form */}
          <Card className="scroll-mt-24 p-6 sm:p-8" >
            <div id="apply" className="scroll-mt-24" />
            <h2 className="font-display text-xl font-bold text-navy">Admission inquiry</h2>
            <p className="mt-1 text-sm text-muted">
              Share your details and our team will contact you. We never share your information.
            </p>

            {success ? (
              <div className="mt-6 rounded-xl border border-green-success/25 bg-green-success/[0.06] p-6 text-center" role="status">
                <CheckCircle2 className="mx-auto h-10 w-10 text-green-success" aria-hidden />
                <p className="mt-3 font-display text-lg font-bold text-navy">Inquiry received!</p>
                <p className="mt-1 text-sm text-muted">
                  Thank you. Our admissions team will contact you shortly on the number you provided.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setSuccess(false)}>
                  Submit another inquiry
                </Button>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
                {/* Honeypot — hidden from real users */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="company_hp">Company</label>
                  <input id="company_hp" name="company" tabIndex={-1} autoComplete="off" />
                </div>

                <Field label="Full name *" error={errors.name?.message}>
                  <input
                    {...register("name")}
                    className="input"
                    autoComplete="name"
                    placeholder="Your full name"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone *" error={errors.phone?.message}>
                    <input
                      {...register("phone")}
                      className="input"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="10-digit mobile number"
                    />
                  </Field>
                  <Field label="WhatsApp" error={errors.whatsapp?.message} hint="If different from phone">
                    <input
                      {...register("whatsapp")}
                      className="input"
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit WhatsApp number"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email" error={errors.email?.message}>
                    <input {...register("email")} className="input" type="email" autoComplete="email" placeholder="you@example.com" />
                  </Field>
                  <Field label="City" error={errors.city?.message}>
                    <input {...register("city")} className="input" placeholder="Your city" />
                  </Field>
                </div>

                <Field label="Interested course" error={errors.interested_course_id?.message}>
                  <select {...register("interested_course_id")} className="input">
                    <option value="">Select a course (optional)</option>
                    {courses?.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Message" error={errors.message?.message}>
                  <textarea
                    {...register("message")}
                    rows={3}
                    className="input"
                    placeholder="Anything you want to ask us (optional)"
                  />
                </Field>

                <div>
                  <label className="flex items-start gap-2.5 text-sm text-muted">
                    <input type="checkbox" {...register("consent")} className="mt-0.5 h-4 w-4 rounded border-lightgray text-saffron focus:ring-saffron" />
                    <span>
                      I agree to be contacted by the academy regarding admissions. *
                      {errors.consent && <span role="alert" className="mt-1 block text-xs font-medium text-error">{errors.consent.message}</span>}
                    </span>
                  </label>
                </div>

                {serverError && (
                  <p role="alert" className="rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">
                    {serverError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Submitting…</>
                  ) : (
                    "Submit Inquiry"
                  )}
                </Button>
                <p className="text-center text-xs text-muted">
                  Prefer to talk first?{" "}
                  {settings?.contact_phone ? (
                    <a className="font-semibold text-navy underline" href={`tel:+91${settings.contact_phone}`}>Call us</a>
                  ) : (
                    "Call us during office hours"
                  )}
                </p>
              </form>
            )}
          </Card>
        </div>
      </Section>

      <Section tone="cream">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-navy">Still deciding?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
            Browse our courses or view answers to common questions before you apply.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/courses" variant="navy">Explore Courses</ButtonLink>
            <ButtonLink to="/contact" variant="outline">Contact Us</ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {hint && <span className="ml-1 font-normal text-muted">({hint})</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-error">{error}</p>
      )}
    </div>
  );
}
