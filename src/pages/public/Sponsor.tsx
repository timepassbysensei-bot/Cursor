import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useSeo } from "../../hooks/useSeo";
import { useSiteContent } from "../../hooks/useSiteContent";
import { DEFAULT_SITE_CONTENT } from "../../lib/siteContent";
import { sponsorshipSchema, type SponsorshipInput } from "../../validation/schemas";
import { submitSponsorshipLead } from "../../services/content";
import { checkRateLimit, rateLimitMessage } from "../../lib/rateLimit";
import { errorMessage } from "../../lib/utils";
import { SPONSOR_BUDGETS, SPONSOR_PLATFORMS } from "../../lib/options";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Badge, Panel, SectionHeading } from "../../components/ui/Section";
import { Reveal } from "../../components/Reveal";

export default function Sponsor() {
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useSeo({
    title: `Work with ${content.brandName} — sponsorship`,
    description:
      "Sponsorship and brand collaboration enquiries for Arian's gaming channel: campaign objectives, formats, timeline and budget.",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SponsorshipInput>({
    resolver: zodResolver(sponsorshipSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      website: "",
      campaignObjective: "",
      preferredPlatform: "",
      budget: "",
      timeline: "",
      message: "",
      honeypot: "",
    },
  });

  const onSubmit = async (values: SponsorshipInput) => {
    setFormError(null);

    // Honeypot: accept silently, store nothing.
    if (values.honeypot) {
      setSent(true);
      reset();
      return;
    }

    const limit = checkRateLimit("sponsorship", 3);
    if (!limit.allowed) {
      setFormError(rateLimitMessage(limit.retryAfterSeconds));
      return;
    }

    try {
      await submitSponsorshipLead({
        name: values.name,
        email: values.email,
        company: values.company ?? "",
        website: values.website ?? "",
        campaignObjective: values.campaignObjective ?? "",
        preferredPlatform: values.preferredPlatform ?? "",
        budget: values.budget ?? "",
        timeline: values.timeline ?? "",
        message: values.message,
      });
      setSent(true);
      reset();
    } catch (error) {
      setFormError(errorMessage(error, "The enquiry could not be sent. Please try again."));
    }
  };

  return (
    <div className="shell py-14 sm:py-20">
      <Reveal>
        <header className="max-w-3xl">
          <p className="eyebrow mb-5">Sponsorship</p>
          <h1 className="font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.02em] text-ink text-balance sm:text-5xl">
            {content.sponsorHeadline}
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-muted text-pretty">{content.sponsorIntro}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {content.sponsorFormats.map((format) => (
              <Badge key={format} tone="violet">
                {format}
              </Badge>
            ))}
          </div>
        </header>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <Reveal>
          <Panel className="p-6 sm:p-8">
            {sent ? (
              <div className="py-6 text-center" role="status">
                <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-jade/30 bg-jade/10">
                  <CheckCircle2 className="h-6 w-6 text-jade" aria-hidden />
                </span>
                <h2 className="font-display text-xl font-semibold text-ink">Enquiry received</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                  Thank you — your enquiry is now in Arian's inbox and is treated as a priority. Replies go to
                  the email address you provided.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setSent(false)}>
                    Send another enquiry
                  </Button>
                  <Link
                    to="/contact"
                    className="inline-flex h-9 items-center rounded-xl border border-hairline px-3.5 text-xs font-semibold text-ink transition-colors hover:border-cyan/50"
                  >
                    Use the contact form instead
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name" htmlFor="sponsor-name" error={errors.name?.message} required>
                    <input
                      id="sponsor-name"
                      className="input"
                      autoComplete="name"
                      required
                      aria-required
                      {...register("name")}
                    />
                  </Field>

                  <Field label="Work email" htmlFor="sponsor-email" error={errors.email?.message} required>
                    <input
                      id="sponsor-email"
                      type="email"
                      className="input"
                      autoComplete="email"
                      required
                      aria-required
                      {...register("email")}
                    />
                  </Field>

                  <Field label="Brand or company" htmlFor="sponsor-company" error={errors.company?.message}>
                    <input id="sponsor-company" className="input" autoComplete="organization" {...register("company")} />
                  </Field>

                  <Field
                    label="Website"
                    htmlFor="sponsor-website"
                    error={errors.website?.message}
                    hint="Include https://"
                  >
                    <input id="sponsor-website" className="input" placeholder="https://" {...register("website")} />
                  </Field>

                  <Field
                    label="Preferred platform"
                    htmlFor="sponsor-platform"
                    error={errors.preferredPlatform?.message}
                  >
                    <select id="sponsor-platform" className="input" {...register("preferredPlatform")}>
                      <option value="">Not sure yet</option>
                      {SPONSOR_PLATFORMS.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Estimated budget" htmlFor="sponsor-budget" error={errors.budget?.message}>
                    <select id="sponsor-budget" className="input" {...register("budget")}>
                      <option value="">Prefer not to say</option>
                      {SPONSOR_BUDGETS.map((band) => (
                        <option key={band} value={band}>
                          {band}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Proposed timeline" htmlFor="sponsor-timeline" error={errors.timeline?.message}>
                    <input
                      id="sponsor-timeline"
                      className="input"
                      placeholder="e.g. mid-November, one video"
                      {...register("timeline")}
                    />
                  </Field>

                  <Field
                    label="Campaign objective"
                    htmlFor="sponsor-objective"
                    error={errors.campaignObjective?.message}
                    className="sm:col-span-2"
                  >
                    <input
                      id="sponsor-objective"
                      className="input"
                      placeholder="e.g. launch awareness for a mobile game"
                      {...register("campaignObjective")}
                    />
                  </Field>
                </div>

                <Field
                  label="Campaign details"
                  htmlFor="sponsor-message"
                  error={errors.message?.message}
                  hint="What the product is, who it is for, and what a good result looks like."
                  required
                >
                  <textarea
                    id="sponsor-message"
                    rows={6}
                    className="input"
                    required
                    aria-required
                    {...register("message")}
                  />
                </Field>

                {/* Honeypot: hidden from humans and assistive tech, so any value means a bot. */}
                <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden>
                  <label htmlFor="sponsor-company-site">Company site</label>
                  <input
                    id="sponsor-company-site"
                    tabIndex={-1}
                    autoComplete="off"
                    {...register("honeypot")}
                  />
                </div>

                {formError && (
                  <p role="alert" className="rounded-xl border border-coral/25 bg-coral/[0.07] px-4 py-3 text-sm text-coral">
                    {formError}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-5">
                  <p className="max-w-sm text-2xs leading-relaxed text-faint">
                    By sending this you agree that Arian may reply to the email you provided. See the{" "}
                    <Link to="/privacy" className="text-cyan underline-offset-2 hover:underline">
                      privacy policy
                    </Link>
                    .
                  </p>
                  <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Sending…
                      </>
                    ) : (
                      "Send sponsorship enquiry"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Panel>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="space-y-5">
            <Panel className="p-6">
              <ShieldCheck className="h-5 w-5 text-jade" aria-hidden />
              <h2 className="mt-4 font-display text-base font-semibold text-ink">How Arian works</h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                <li>Every enquiry reaches Arian directly — no agency in between.</li>
                <li>Disclosure is non-negotiable: paid partnerships are labelled on screen and in the description.</li>
                <li>Only products Arian would genuinely use on the channel are featured.</li>
                <li>Creative control over the video itself stays with Arian, always.</li>
              </ul>
              <p className="mt-5 border-t border-hairline pt-4 text-xs leading-relaxed text-faint">
                {content.sponsorDisclosure}
              </p>
            </Panel>

            <Panel className="p-6">
              <Sparkles className="h-5 w-5 text-cyan" aria-hidden />
              <h2 className="mt-4 font-display text-base font-semibold text-ink">Prefer a client account?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Create an account to keep your sponsorship enquiries in one place, alongside messages from
                Arian.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to="/signup"
                  className="inline-flex h-9 items-center rounded-xl bg-gradient-to-r from-blue to-cyan px-3.5 text-xs font-semibold text-base"
                >
                  Create an account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-9 items-center rounded-xl border border-hairline px-3.5 text-xs font-semibold text-ink transition-colors hover:border-cyan/50"
                >
                  Sign in
                </Link>
              </div>
            </Panel>

            <Panel className="p-6">
              <Mail className="h-5 w-5 text-violet" aria-hidden />
              <h2 className="mt-4 font-display text-base font-semibold text-ink">Response time</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {content.contactResponseTime}
              </p>
            </Panel>
          </div>
        </Reveal>
      </div>

      <section className="mt-16 border-t border-hairline pt-14" aria-label="What to include in a brief">
        <SectionHeading
          eyebrow="Good to know"
          title="What to include, so the first reply is a useful one."
          subtitle="A clear brief saves a round trip."
        />
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { title: "The product", body: "What it is, and who it is for." },
            { title: "The goal", body: "Awareness, installs, launch window — whatever success means here." },
            { title: "The constraints", body: "Budget range, dates, and any approval process on your side." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-hairline bg-surface/50 p-6">
              <h3 className="font-display text-sm font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
