import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { useSiteContent } from "../../hooks/useSiteContent";
import { sponsorshipSchema, type SponsorshipInput } from "../../validation/schemas";
import { fetchMySponsorshipLeads, submitClientSponsorshipLead } from "../../services/client";
import { DEFAULT_SITE_CONTENT } from "../../lib/siteContent";
import { errorMessage, formatDate } from "../../lib/utils";
import { SPONSOR_BUDGETS, SPONSOR_PLATFORMS } from "../../lib/options";
import { PageHeader } from "../../components/PageHeader";
import { Badge, Panel } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { PendingAccessNotice } from "../../components/guards";
import { useToast } from "../../components/ui/Toast";
import type { SponsorStatus } from "../../types";

const STATUS_TONE: Record<SponsorStatus, "neutral" | "cyan" | "violet" | "jade" | "coral" | "amber"> = {
  new: "cyan",
  reviewing: "amber",
  in_talks: "violet",
  won: "jade",
  declined: "neutral",
  spam: "coral",
};

const STATUS_LABEL: Record<SponsorStatus, string> = {
  new: "Received",
  reviewing: "Reviewing",
  in_talks: "In talks",
  won: "Confirmed",
  declined: "Declined",
  spam: "Flagged",
};

export default function SponsorArian() {
  const { profile, user, hasClientAccess } = useAuth();
  const { data: content = DEFAULT_SITE_CONTENT } = useSiteContent();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [sent, setSent] = useState(false);

  useSeo({
    title: "Sponsor Arian",
    description: "Submit a sponsorship or collaboration enquiry from your client dashboard.",
    noIndex: true,
  });

  const leadsQuery = useQuery({
    queryKey: ["client-leads", profile?.id],
    queryFn: () => fetchMySponsorshipLeads(profile!.id),
    enabled: Boolean(profile?.id) && hasClientAccess,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SponsorshipInput>({
    resolver: zodResolver(sponsorshipSchema),
    defaultValues: {
      name: profile?.full_name ?? "",
      email: profile?.email ?? "",
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

  const submit = useMutation({
    mutationFn: async (values: SponsorshipInput) => {
      if (!user) throw new Error("You are not signed in.");
      await submitClientSponsorshipLead({
        userId: user.id,
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-leads", profile?.id] });
      reset();
      setSent(true);
      push({ title: "Enquiry submitted", description: "Arian will reply by email.", variant: "success" });
    },
    onError: (error: Error) => {
      push({ title: "Enquiry not submitted", description: errorMessage(error), variant: "error" });
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Sponsorship"
        title={content.sponsorHeadline}
        description="Sponsorship enquiries sent from your account are tracked here, so you can see where each one stands."
      />

      {!hasClientAccess ? (
        <PendingAccessNotice />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <Panel className="p-6">
            {sent ? (
              <div className="py-4 text-center" role="status">
                <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-jade/30 bg-jade/10">
                  <CheckCircle2 className="h-6 w-6 text-jade" aria-hidden />
                </span>
                <h2 className="font-display text-lg font-semibold text-ink">Enquiry received</h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
                  {content.contactResponseTime}
                </p>
                <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
                  Submit another enquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit((values) => submit.mutate(values))} className="space-y-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Contact name" htmlFor="lead-name" error={errors.name?.message} required>
                    <input id="lead-name" className="input" autoComplete="name" {...register("name")} />
                  </Field>
                  <Field label="Email" htmlFor="lead-email" error={errors.email?.message} required>
                    <input
                      id="lead-email"
                      type="email"
                      className="input"
                      autoComplete="email"
                      {...register("email")}
                    />
                  </Field>
                  <Field label="Brand or company" htmlFor="lead-company" error={errors.company?.message}>
                    <input id="lead-company" className="input" {...register("company")} />
                  </Field>
                  <Field label="Website" htmlFor="lead-website" error={errors.website?.message} hint="Include https://">
                    <input id="lead-website" className="input" placeholder="https://" {...register("website")} />
                  </Field>
                  <Field
                    label="Preferred platform"
                    htmlFor="lead-platform"
                    error={errors.preferredPlatform?.message}
                  >
                    <select id="lead-platform" className="input" {...register("preferredPlatform")}>
                      <option value="">Not sure yet</option>
                      {SPONSOR_PLATFORMS.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Budget range" htmlFor="lead-budget" error={errors.budget?.message}>
                    <select id="lead-budget" className="input" {...register("budget")}>
                      <option value="">Prefer not to say</option>
                      {SPONSOR_BUDGETS.map((band) => (
                        <option key={band} value={band}>
                          {band}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Timeline" htmlFor="lead-timeline" error={errors.timeline?.message}>
                    <input id="lead-timeline" className="input" placeholder="e.g. next month" {...register("timeline")} />
                  </Field>
                  <Field
                    label="Campaign objective"
                    htmlFor="lead-objective"
                    error={errors.campaignObjective?.message}
                  >
                    <input id="lead-objective" className="input" {...register("campaignObjective")} />
                  </Field>
                </div>

                <Field
                  label="Campaign details"
                  htmlFor="lead-message"
                  error={errors.message?.message}
                  required
                >
                  <textarea id="lead-message" rows={6} className="input" {...register("message")} />
                </Field>

                <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden>
                  <label htmlFor="lead-company-site">Company site</label>
                  <input id="lead-company-site" tabIndex={-1} autoComplete="off" {...register("honeypot")} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-5">
                  <p className="max-w-sm text-2xs leading-relaxed text-faint">{content.sponsorDisclosure}</p>
                  <Button type="submit" size="lg" disabled={submit.isPending}>
                    {submit.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" aria-hidden />
                        Submit enquiry
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Panel>

          <Panel className="p-6">
            <h2 className="font-display text-base font-semibold text-ink">Your enquiries</h2>
            <p className="mt-1.5 text-xs text-muted">Status is updated by Arian as each one progresses.</p>

            <div className="mt-5">
              {leadsQuery.isLoading ? (
                <LoadingState label="Loading…" />
              ) : leadsQuery.isError ? (
                <ErrorState title="Could not load your enquiries" onRetry={() => void leadsQuery.refetch()} />
              ) : (leadsQuery.data ?? []).length === 0 ? (
                <EmptyState compact title="No enquiries yet" hint="Submitted enquiries and their status appear here." />
              ) : (
                <ul className="space-y-3">
                  {(leadsQuery.data ?? []).map((lead) => (
                    <li key={lead.id} className="rounded-xl border border-hairline bg-white/[0.02] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-medium text-ink">{lead.company || "Enquiry"}</p>
                        <Badge tone={STATUS_TONE[lead.status]}>{STATUS_LABEL[lead.status]}</Badge>
                      </div>
                      {lead.campaign_objective && (
                        <p className="mt-2 text-xs text-muted">{lead.campaign_objective}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-faint">
                        {lead.budget && <span>{lead.budget}</span>}
                        {lead.timeline && <span>{lead.timeline}</span>}
                        <span>{formatDate(lead.created_at)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
