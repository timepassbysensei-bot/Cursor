import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MapPin, Phone, Mail, Clock, MessageCircle, ExternalLink, ChevronRight } from "lucide-react";
import { Section, Card } from "../../components/ui/Section";
import { Button, ButtonLink } from "../../components/ui/Button";
import { useSeo } from "../../hooks/useSeo";
import { useSiteSettings } from "../../hooks/useSiteSettings";
import { contactSchema, type ContactInput } from "../../validation/schemas";
import { submitInquiry, fetchPublishedFaqs } from "../../services/publicContent";
import { safeExternal } from "../../lib/utils";

export default function Contact() {
  useSeo("Contact Us — Bokaro Defence Academy", "Address, phone, WhatsApp, email and inquiry form.");
  const { data: settings } = useSiteSettings();
  const faqsQ = useQuery({ queryKey: ["faqs", "contact"], queryFn: fetchPublishedFaqs });

  const [startedAt] = useState(() => Date.now());
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: ContactInput) => {
      await submitInquiry({
        name: values.name,
        email: values.email,
        phone: values.phone,
        whatsapp: null,
        city: null,
        interested_course_id: null,
        message: values.message,
        source_page: "/contact",
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
      });
    },
    onSuccess: () => {
      setSuccess(true);
      reset();
    },
    onError: () =>
      setServerError("We could not send your message right now. Please try again or call us directly."),
  });

  const onSubmit = handleSubmit(async (values) => {
    const honeypot = (document.getElementById("contact_hp") as HTMLInputElement | null)?.value;
    if (honeypot) {
      setSuccess(true);
      return;
    }
    if (Date.now() - startedAt < 2500) {
      setServerError("Form submitted too quickly — please review and try again.");
      return;
    }
    setServerError(null);
    mutation.mutate(values);
  });

  const phone = settings?.contact_phone ?? null;
  const whatsapp = settings?.contact_whatsapp ?? null;
  const mapLink = safeExternal(settings?.map_url ?? null);

  return (
    <>
      <section className="bg-navy py-12 text-white lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron-soft">Contact</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Get in touch</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Have questions about courses, batches or admissions? Reach us by phone, WhatsApp or visit the academy.
          </p>
        </div>
      </section>

      <Section tone="offwhite">
        <div className="grid gap-10 lg:grid-cols-[380px_1fr] lg:gap-16">
          {/* Contact info */}
          <div className="space-y-4">
            {settings?.contact_address && (
              <Card className="flex gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-saffron/10 text-saffron">
                  <MapPin className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-navy">Address</h2>
                  <p className="mt-1 text-sm text-muted">{settings.contact_address}</p>
                  {mapLink && (
                    <a
                      href={mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-navy underline"
                    >
                      Get Directions <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  )}
                </div>
              </Card>
            )}
            {phone && (
              <Card className="flex gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-saffron/10 text-saffron">
                  <Phone className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-navy">Phone</h2>
                  <a href={`tel:+91${phone}`} className="mt-1 block text-sm text-muted hover:text-navy">+91 {phone}</a>
                  {settings?.contact_phone_secondary && (
                    <a href={`tel:+91${settings.contact_phone_secondary}`} className="block text-sm text-muted hover:text-navy">
                      +91 {settings.contact_phone_secondary}
                    </a>
                  )}
                </div>
              </Card>
            )}
            {whatsapp && (
              <Card className="flex gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1FA855]/10 text-[#1FA855]">
                  <MessageCircle className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-navy">WhatsApp</h2>
                  <a
                    href={`https://wa.me/91${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-muted hover:text-navy"
                  >
                    Chat with us
                  </a>
                </div>
              </Card>
            )}
            {settings?.contact_email && (
              <Card className="flex gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-saffron/10 text-saffron">
                  <Mail className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-navy">Email</h2>
                  <a href={`mailto:${settings.contact_email}`} className="mt-1 block text-sm text-muted hover:text-navy">
                    {settings.contact_email}
                  </a>
                </div>
              </Card>
            )}
            {settings?.contact_hours && (
              <Card className="flex gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-saffron/10 text-saffron">
                  <Clock className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-navy">Office hours</h2>
                  <p className="mt-1 text-sm text-muted">{settings.contact_hours}</p>
                </div>
              </Card>
            )}

            {/* Compact map — never a giant empty placeholder */}
            {settings?.map_embed_url && safeExternal(settings.map_embed_url) && (
              <div className="overflow-hidden rounded-xl border border-lightgray">
                <iframe
                  src={settings.map_embed_url}
                  title="Academy location map"
                  loading="lazy"
                  className="h-56 w-full"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>

          {/* Form */}
          <Card className="h-fit p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-navy">Send a message</h2>
            <p className="mt-1 text-sm text-muted">We usually respond within one working day.</p>

            {success ? (
              <div className="mt-6 rounded-xl border border-green-success/25 bg-green-success/[0.06] p-6 text-center" role="status">
                <CheckCircle2 className="mx-auto h-10 w-10 text-green-success" aria-hidden />
                <p className="mt-3 font-display text-lg font-bold text-navy">Message sent!</p>
                <p className="mt-1 text-sm text-muted">Thank you for reaching out. We will reply shortly.</p>
                <Button variant="outline" className="mt-4" onClick={() => setSuccess(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="contact_hp">Organisation</label>
                  <input id="contact_hp" name="organisation" tabIndex={-1} autoComplete="off" />
                </div>

                <div>
                  <label htmlFor="c-name" className="mb-1.5 block text-sm font-semibold text-ink">Full name *</label>
                  <input id="c-name" {...register("name")} className="input" autoComplete="name" placeholder="Your name" />
                  {errors.name && <p role="alert" className="mt-1 text-xs font-medium text-error">{errors.name.message}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="c-email" className="mb-1.5 block text-sm font-semibold text-ink">Email *</label>
                    <input id="c-email" {...register("email")} type="email" className="input" autoComplete="email" placeholder="you@example.com" />
                    {errors.email && <p role="alert" className="mt-1 text-xs font-medium text-error">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="c-phone" className="mb-1.5 block text-sm font-semibold text-ink">Phone *</label>
                    <input id="c-phone" {...register("phone")} type="tel" inputMode="numeric" className="input" autoComplete="tel" placeholder="10-digit mobile" />
                    {errors.phone && <p role="alert" className="mt-1 text-xs font-medium text-error">{errors.phone.message}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="c-msg" className="mb-1.5 block text-sm font-semibold text-ink">Message *</label>
                  <textarea id="c-msg" {...register("message")} rows={5} className="input" placeholder="How can we help?" />
                  {errors.message && <p role="alert" className="mt-1 text-xs font-medium text-error">{errors.message.message}</p>}
                </div>

                <div>
                  <label className="flex items-start gap-2.5 text-sm text-muted">
                    <input type="checkbox" {...register("consent")} className="mt-0.5 h-4 w-4 rounded border-lightgray text-saffron focus:ring-saffron" />
                    <span>
                      I agree to be contacted about my enquiry. *
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
                    <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending…</>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 border-t border-lightgray pt-5">
              <p className="text-sm text-muted">Looking to apply for a course?</p>
              <ButtonLink to="/admissions#apply" variant="navy" size="sm" className="mt-2">
                Go to Admission Form
              </ButtonLink>
            </div>
          </Card>
        </div>
      </Section>

      {/* All published FAQs — the homepage links here for the complete list */}
      <Section tone="white" id="faqs" className="scroll-mt-24" ariaLabel="Frequently asked questions">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-sm text-muted">
            Cannot find what you need? Send us a message above and we will reply.
          </p>
          {faqsQ.data && faqsQ.data.length > 0 ? (
            <div className="mt-6 divide-y divide-lightgray rounded-xl border border-lightgray bg-white">
              {faqsQ.data.map((f) => (
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
            <p className="mt-6 rounded-xl border border-dashed border-lightgray bg-white px-5 py-8 text-center text-sm text-muted">
              Our FAQ list is being compiled. Please send us a message and we will answer your question directly.
            </p>
          )}
        </div>
      </Section>
    </>
  );
}
