import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Check, CheckCircle2, Copy, Loader2, Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useSeo } from "../../hooks/useSeo";
import { useSiteContent } from "../../hooks/useSiteContent";
import { DEFAULT_SITE_CONTENT } from "../../lib/siteContent";
import { contactSchema, type ContactInput } from "../../validation/schemas";
import { submitContactMessage } from "../../services/content";
import { checkRateLimit, rateLimitMessage } from "../../lib/rateLimit";
import { errorMessage } from "../../lib/utils";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Panel } from "../../components/ui/Section";
import { Reveal } from "../../components/Reveal";

export default function Contact() {
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useSeo({
    title: `Contact ${content.brandName}`,
    description:
      "Send Arian a message. No account needed for the contact form — sponsorship enquiries are treated as priority.",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "", honeypot: "" },
  });

  const onSubmit = async (values: ContactInput) => {
    setFormError(null);

    if (values.honeypot) {
      setSent(true);
      reset();
      return;
    }

    const limit = checkRateLimit("contact", 3);
    if (!limit.allowed) {
      setFormError(rateLimitMessage(limit.retryAfterSeconds));
      return;
    }

    try {
      await submitContactMessage({
        name: values.name,
        email: values.email,
        subject: values.subject?.trim() || "Message from the website",
        message: values.message,
      });
      setSent(true);
      reset();
    } catch (error) {
      setFormError(errorMessage(error, "Your message could not be sent. Please try again."));
    }
  };

  return (
    <div className="shell py-14 sm:py-20">
      <Reveal>
        <header className="max-w-3xl">
          <p className="eyebrow mb-5">Contact</p>
          <h1 className="font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.02em] text-ink text-balance sm:text-5xl">
            Send Arian a message.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-muted text-pretty">
            No account needed. Messages land straight in Arian's inbox — the same inbox used for sponsorship
            enquiries, so nothing gets lost.
          </p>
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
                <h2 className="font-display text-xl font-semibold text-ink">Message sent</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                  Thank you — your message is in Arian's inbox. {content.contactResponseTime}
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setSent(false)}>
                    Send another message
                  </Button>
                  <ButtonLink to="/chat" variant="ghost" size="sm">
                    Ask Arian Assistant instead
                  </ButtonLink>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name" htmlFor="contact-name" error={errors.name?.message} required>
                    <input
                      id="contact-name"
                      className="input"
                      autoComplete="name"
                      required
                      aria-required
                      {...register("name")}
                    />
                  </Field>

                  <Field
                    label="Your email"
                    htmlFor="contact-email"
                    error={errors.email?.message}
                    hint="Gmail, Outlook, anything you actually read."
                    required
                  >
                    <input
                      id="contact-email"
                      type="email"
                      className="input"
                      autoComplete="email"
                      required
                      aria-required
                      {...register("email")}
                    />
                  </Field>
                </div>

                <Field
                  label="Subject"
                  htmlFor="contact-subject"
                  error={errors.subject?.message}
                  optionalLabel="optional"
                >
                  <input
                    id="contact-subject"
                    className="input"
                    placeholder="What is this about?"
                    {...register("subject")}
                  />
                </Field>

                <Field
                  label="Message"
                  htmlFor="contact-message"
                  error={errors.message?.message}
                  hint="The more specific you are, the more useful the reply."
                  required
                >
                  <textarea
                    id="contact-message"
                    rows={7}
                    className="input"
                    required
                    aria-required
                    {...register("message")}
                  />
                </Field>

                {/* Honeypot: hidden from humans and assistive tech. */}
                <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden>
                  <label htmlFor="contact-website">Website</label>
                  <input id="contact-website" tabIndex={-1} autoComplete="off" {...register("honeypot")} />
                </div>

                {formError && (
                  <p role="alert" className="rounded-xl border border-coral/25 bg-coral/[0.07] px-4 py-3 text-sm text-coral">
                    {formError}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-5">
                  <p className="max-w-sm text-2xs leading-relaxed text-faint">
                    Your name, email and message are stored so Arian can reply, and are never sold or shared. See
                    the{" "}
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
                      "Send message"
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
              <MessageSquare className="h-5 w-5 text-cyan" aria-hidden />
              <h2 className="mt-4 font-display text-base font-semibold text-ink">What usually gets replied to</h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                <li>Sponsorship and brand collaborations.</li>
                <li>Questions about a video or a build in it.</li>
                <li>Permission requests for artwork or clips.</li>
                <li>Corrections — Arian would rather fix it than leave it wrong.</li>
              </ul>
            </Panel>

            <Panel className="p-6">
              <Bot className="h-5 w-5 text-violet" aria-hidden />
              <h2 className="mt-4 font-display text-base font-semibold text-ink">Arian Assistant</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                For quick questions about the channel, the games covered or how sponsorship works, the assistant
                answers instantly.
              </p>
              <ButtonLink to="/chat" variant="outline" size="sm" className="mt-5">
                Open Arian Assistant
              </ButtonLink>
            </Panel>

            {content.contactEmail && (
              <Panel className="p-6">
                <Mail className="h-5 w-5 text-jade" aria-hidden />
                <h2 className="mt-4 font-display text-base font-semibold text-ink">Business enquiries</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    href={`mailto:${content.contactEmail}`}
                    className="break-all text-sm font-semibold text-cyan underline-offset-2 hover:underline"
                  >
                    {content.contactEmail}
                  </a>
                  <button
                    type="button"
                    aria-label={`Copy ${content.contactEmail} to clipboard`}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline text-muted transition-colors hover:border-jade/50 hover:bg-jade/[0.06] hover:text-jade"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(content.contactEmail ?? "");
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1600);
                      } catch {
                        setCopied(false);
                      }
                    }}
                  >
                    {copied ? <Check className="h-4 w-4 text-jade" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                  </button>
                </div>
              </Panel>
            )}

            <Panel className="p-6">
              <ShieldCheck className="h-5 w-5 text-jade" aria-hidden />
              <h2 className="mt-4 font-display text-base font-semibold text-ink">Spam protection</h2>
              <p className="mt-2 text-2xs leading-relaxed text-faint">
                This form uses a hidden honeypot field and a submission limit, and every entry is validated before
                it reaches the inbox.
              </p>
            </Panel>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
