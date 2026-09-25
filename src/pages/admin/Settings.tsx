import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, RotateCcw, Save, ScrollText, Settings2, Trash2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSeo } from "../../hooks/useSeo";
import { adminService } from "../../services/admin";
import { SITE_CONTENT_KEY, useSiteContent } from "../../hooks/useSiteContent";
import { DEFAULT_SITE_CONTENT } from "../../lib/siteContent";
import { chatKnowledgeSchema, type ChatKnowledgeInput } from "../../validation/schemas";
import { cn, errorMessage, formatDateTime } from "../../lib/utils";
import { PageHeader } from "../../components/PageHeader";
import { Badge, Panel } from "../../components/ui/Section";
import { Button, IconButton } from "../../components/ui/Button";
import { ConfirmDialog, Modal } from "../../components/ui/Modal";
import { Field } from "../../components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import type { ChatKnowledgeRow, SiteContent, TimelineEntry } from "../../types";

type Tab = "content" | "chatbot" | "audit";

export default function AdminSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("content");

  useSeo({ title: "Settings — Arian studio", description: "Site content, chatbot knowledge and audit log.", noIndex: true });

  return (
    <div>
      <PageHeader
        eyebrow="Studio"
        title="Content & settings"
        description="Everything on the public site can be rewritten here without touching code. Changes go live as soon as they are saved."
      />

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Settings sections">
        {(
          [
            { key: "content" as const, label: "Site content", icon: Settings2 },
            { key: "chatbot" as const, label: "Chatbot knowledge", icon: Bot },
            { key: "audit" as const, label: "Audit log", icon: ScrollText },
          ]
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors",
              tab === item.key
                ? "border-cyan/50 bg-cyan/[0.1] text-ink"
                : "border-hairline text-muted hover:border-white/20 hover:text-ink"
            )}
          >
            <item.icon className="h-3.5 w-3.5" aria-hidden />
            {item.label}
          </button>
        ))}
      </div>

      {tab === "content" && (
        <ContentTab
          adminId={user?.id}
          onSaved={() => queryClient.invalidateQueries({ queryKey: SITE_CONTENT_KEY })}
          push={push}
        />
      )}
      {tab === "chatbot" && <ChatbotTab push={push} />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}

type PushFn = (toast: { title: string; description?: string; variant?: "success" | "error" | "info" }) => void;

// ---------------------------------------------------------------------------
// Site content
// ---------------------------------------------------------------------------

function ContentTab({ adminId, onSaved, push }: { adminId?: string; onSaved: () => void; push: PushFn }) {
  const contentQuery = useSiteContent();
  const [draft, setDraft] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [timelineText, setTimelineText] = useState("[]");
  const [timelineError, setTimelineError] = useState<string | null>(null);

  useEffect(() => {
    if (!contentQuery.data) return;
    setDraft(contentQuery.data);
    setTimelineText(JSON.stringify(contentQuery.data.aboutTimeline, null, 2));
  }, [contentQuery.data]);

  const dirty = useMemo(() => {
    if (!contentQuery.data) return false;
    return JSON.stringify(contentQuery.data) !== JSON.stringify(draft) || timelineError !== null;
  }, [contentQuery.data, draft, timelineError]);

  const save = useMutation({
    mutationFn: async () => {
      if (!adminId) throw new Error("You are not signed in.");
      await adminService.saveSiteContent(draft, adminId);
    },
    onSuccess: () => {
      onSaved();
      push({ title: "Site content saved", description: "The public site is updated.", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not save", description: errorMessage(error), variant: "error" }),
  });

  const set = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const applyTimeline = (value: string) => {
    setTimelineText(value);
    try {
      const parsed = JSON.parse(value) as TimelineEntry[];
      if (!Array.isArray(parsed)) throw new Error("not an array");
      setTimelineError(null);
      set("aboutTimeline", parsed);
    } catch {
      setTimelineError("That is not valid JSON. Fix the brackets and commas, or press Reset.");
    }
  };

  if (contentQuery.isLoading) return <LoadingState label="Loading site content…" />;
  if (contentQuery.isError) {
    return <ErrorState title="Site content could not load" onRetry={() => void contentQuery.refetch()} />;
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (timelineError) {
          push({ title: "Fix the timeline first", description: timelineError, variant: "error" });
          return;
        }
        save.mutate();
      }}
    >
      <Panel className="p-6">
        <SectionTitle title="Brand" hint="The name and one-line identity used across the whole site." />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Creator name" htmlFor="c-brand">
            <input id="c-brand" className="input" value={draft.brandName} onChange={(e) => set("brandName", e.target.value)} />
          </Field>
          <Field label="Tagline" htmlFor="c-tagline">
            <input id="c-tagline" className="input" value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label="Footer description" htmlFor="c-footer" className="sm:col-span-2">
            <textarea id="c-footer" rows={3} className="input" value={draft.footerNote} onChange={(e) => set("footerNote", e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionTitle title="Homepage hero" hint="The first thing a visitor reads." />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Eyebrow" htmlFor="c-hero-eyebrow" hint="Small caps line above the name.">
            <input id="c-hero-eyebrow" className="input" value={draft.heroEyebrow} onChange={(e) => set("heroEyebrow", e.target.value)} />
          </Field>
          <Field label="Hero title" htmlFor="c-hero-title">
            <input id="c-hero-title" className="input" value={draft.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
          </Field>
          <Field label="Brand statement" htmlFor="c-hero-statement" className="sm:col-span-2">
            <input id="c-hero-statement" className="input" value={draft.heroStatement} onChange={(e) => set("heroStatement", e.target.value)} />
          </Field>
          <Field label="Description" htmlFor="c-hero-description" className="sm:col-span-2">
            <textarea id="c-hero-description" rows={3} className="input" value={draft.heroDescription} onChange={(e) => set("heroDescription", e.target.value)} />
          </Field>
          <Field label="Primary button label" htmlFor="c-hero-primary">
            <input id="c-hero-primary" className="input" value={draft.heroPrimaryCta} onChange={(e) => set("heroPrimaryCta", e.target.value)} />
          </Field>
          <Field label="Secondary button label" htmlFor="c-hero-secondary">
            <input id="c-hero-secondary" className="input" value={draft.heroSecondaryCta} onChange={(e) => set("heroSecondaryCta", e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionTitle title="About page" hint="One item per line for lists. The timeline is JSON." />
        <div className="mt-5 space-y-5">
          <Field label="Introduction" htmlFor="c-about-intro">
            <textarea id="c-about-intro" rows={3} className="input" value={draft.aboutIntro} onChange={(e) => set("aboutIntro", e.target.value)} />
          </Field>
          <Field label="Creator identity" htmlFor="c-about-identity">
            <textarea id="c-about-identity" rows={3} className="input" value={draft.aboutIdentity} onChange={(e) => set("aboutIdentity", e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Games covered" htmlFor="c-about-games" hint="One per line.">
              <textarea
                id="c-about-games"
                rows={3}
                className="input"
                value={draft.aboutGames.join("\n")}
                onChange={(e) => set("aboutGames", e.target.value.split("\n").map((v) => v.trim()).filter(Boolean))}
              />
            </Field>
            <Field label="Content categories" htmlFor="c-about-categories" hint="One per line.">
              <textarea
                id="c-about-categories"
                rows={6}
                className="input"
                value={draft.aboutCategories.join("\n")}
                onChange={(e) => set("aboutCategories", e.target.value.split("\n").map((v) => v.trim()).filter(Boolean))}
              />
            </Field>
          </div>
          <Field
            label="Journey timeline"
            htmlFor="c-about-timeline"
            hint='JSON array of { "year", "title", "body" } entries.'
            error={timelineError ?? undefined}
          >
            <textarea
              id="c-about-timeline"
              rows={12}
              className="input font-mono text-xs"
              value={timelineText}
              onChange={(e) => applyTimeline(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                set("aboutTimeline", DEFAULT_SITE_CONTENT.aboutTimeline);
                setTimelineText(JSON.stringify(DEFAULT_SITE_CONTENT.aboutTimeline, null, 2));
                setTimelineError(null);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset timeline to the default
            </Button>
          </div>
          <Field label="Message from Arian" htmlFor="c-about-message">
            <textarea id="c-about-message" rows={4} className="input" value={draft.aboutMessage} onChange={(e) => set("aboutMessage", e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionTitle title="Featured message" hint="The prominent announcement on the homepage." />
        <div className="mt-5 space-y-5">
          <label className="flex items-center gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-hairline bg-base/60 accent-cyan"
              checked={draft.featuredMessageActive}
              onChange={(e) => set("featuredMessageActive", e.target.checked)}
            />
            Show this section on the homepage
          </label>
          <Field label="Heading" htmlFor="c-featured-title">
            <input id="c-featured-title" className="input" value={draft.featuredMessageTitle} onChange={(e) => set("featuredMessageTitle", e.target.value)} />
          </Field>
          <Field label="Message" htmlFor="c-featured-body">
            <textarea id="c-featured-body" rows={4} className="input" value={draft.featuredMessageBody} onChange={(e) => set("featuredMessageBody", e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionTitle title="Sponsorship" hint="Shown on the sponsor page and the homepage." />
        <div className="mt-5 space-y-5">
          <Field label="Headline" htmlFor="c-sponsor-headline">
            <input id="c-sponsor-headline" className="input" value={draft.sponsorHeadline} onChange={(e) => set("sponsorHeadline", e.target.value)} />
          </Field>
          <Field label="Introduction" htmlFor="c-sponsor-intro">
            <textarea id="c-sponsor-intro" rows={3} className="input" value={draft.sponsorIntro} onChange={(e) => set("sponsorIntro", e.target.value)} />
          </Field>
          <Field label="Formats offered" htmlFor="c-sponsor-formats" hint="One per line.">
            <textarea
              id="c-sponsor-formats"
              rows={5}
              className="input"
              value={draft.sponsorFormats.join("\n")}
              onChange={(e) => set("sponsorFormats", e.target.value.split("\n").map((v) => v.trim()).filter(Boolean))}
            />
          </Field>
          <Field label="Disclosure note" htmlFor="c-sponsor-disclosure">
            <textarea id="c-sponsor-disclosure" rows={3} className="input" value={draft.sponsorDisclosure} onChange={(e) => set("sponsorDisclosure", e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionTitle title="Contact & social" hint="Leave a social field empty to hide it." />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Business email" htmlFor="c-contact-email" hint="Optional — shown in the footer and contact page.">
            <input id="c-contact-email" type="email" className="input" value={draft.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </Field>
          <Field label="Response time note" htmlFor="c-contact-response">
            <input id="c-contact-response" className="input" value={draft.contactResponseTime} onChange={(e) => set("contactResponseTime", e.target.value)} />
          </Field>
          <Field label="YouTube" htmlFor="c-social-youtube">
            <input id="c-social-youtube" className="input" value={draft.socialYouTube} onChange={(e) => set("socialYouTube", e.target.value)} />
          </Field>
          <Field label="Instagram" htmlFor="c-social-instagram">
            <input id="c-social-instagram" className="input" value={draft.socialInstagram} onChange={(e) => set("socialInstagram", e.target.value)} />
          </Field>
          <Field label="X / Twitter" htmlFor="c-social-x">
            <input id="c-social-x" className="input" value={draft.socialX} onChange={(e) => set("socialX", e.target.value)} />
          </Field>
          <Field label="Discord" htmlFor="c-social-discord">
            <input id="c-social-discord" className="input" value={draft.socialDiscord} onChange={(e) => set("socialDiscord", e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionTitle title="Arian Assistant" hint="The intro, prompts and disclaimer shown in the chat." />
        <div className="mt-5 space-y-5">
          <Field label="Welcome message" htmlFor="c-chat-intro">
            <textarea id="c-chat-intro" rows={3} className="input" value={draft.chatbotIntro} onChange={(e) => set("chatbotIntro", e.target.value)} />
          </Field>
          <Field label="Suggested questions" htmlFor="c-chat-suggestions" hint="One per line.">
            <textarea
              id="c-chat-suggestions"
              rows={4}
              className="input"
              value={draft.chatbotSuggestions.join("\n")}
              onChange={(e) => set("chatbotSuggestions", e.target.value.split("\n").map((v) => v.trim()).filter(Boolean))}
            />
          </Field>
          <Field label="Disclaimer" htmlFor="c-chat-disclaimer">
            <textarea id="c-chat-disclaimer" rows={3} className="input" value={draft.chatbotDisclaimer} onChange={(e) => set("chatbotDisclaimer", e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionTitle title="Search & sharing" hint="Page title, description and the image shown when the site is shared." />
        <div className="mt-5 space-y-5">
          <Field label="Default page title" htmlFor="c-seo-title">
            <input id="c-seo-title" className="input" value={draft.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
          </Field>
          <Field label="Meta description" htmlFor="c-seo-description">
            <textarea id="c-seo-description" rows={3} className="input" value={draft.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
          </Field>
          <Field label="Social share image URL" htmlFor="c-seo-image" hint="Optional https:// link to an image you own.">
            <input id="c-seo-image" className="input" value={draft.ogImageUrl} onChange={(e) => set("ogImageUrl", e.target.value)} />
          </Field>
        </div>
      </Panel>

      <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-elevated/95 p-4 shadow-lift backdrop-blur-xl">
        <p className="text-xs text-muted">
          {dirty ? "You have unsaved changes." : "Everything is saved."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (!contentQuery.data) return;
              setDraft(contentQuery.data);
              setTimelineText(JSON.stringify(contentQuery.data.aboutTimeline, null, 2));
              setTimelineError(null);
            }}
            disabled={!dirty}
          >
            Discard changes
          </Button>
          <Button type="submit" disabled={save.isPending || !dirty}>
            <Save className="h-4 w-4" aria-hidden />
            {save.isPending ? "Saving…" : "Save content"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function SectionTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chatbot knowledge
// ---------------------------------------------------------------------------

function ChatbotTab({ push }: { push: PushFn }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ChatKnowledgeRow | null>(null);
  const [form, setForm] = useState<ChatKnowledgeInput | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<ChatKnowledgeRow | null>(null);

  const knowledgeQuery = useQuery({
    queryKey: ["admin-chat-knowledge"],
    queryFn: () => adminService.chatKnowledge(),
    enabled: isSupabaseConfigured,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-chat-knowledge"] });

  const save = useMutation({
    mutationFn: async (values: ChatKnowledgeInput) => {
      await adminService.upsertChatKnowledge({
        ...(editing ? { id: editing.id } : {}),
        title: values.title,
        content: values.content,
        is_active: values.is_active,
      });
    },
    onSuccess: () => {
      invalidate();
      setForm(null);
      setEditing(null);
      push({ title: "Knowledge saved", description: "The assistant uses it on the next question.", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not save", description: errorMessage(error), variant: "error" }),
  });

  const remove = useMutation({
    mutationFn: (row: ChatKnowledgeRow) => adminService.deleteChatKnowledge(row.id),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      push({ title: "Entry deleted", variant: "success" });
    },
    onError: (error: Error) =>
      push({ title: "Could not delete", description: errorMessage(error), variant: "error" }),
  });

  const rows = knowledgeQuery.data ?? [];

  const submit = () => {
    if (!form) return;
    const parsed = chatKnowledgeSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    save.mutate(parsed.data);
  };

  return (
    <div>
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-display text-base font-semibold text-ink">What the assistant is allowed to say</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              These entries are the assistant's approved source. They are never sent to a browser — the serverless
              function reads them with a service-role key and passes them to the model as context.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setErrors({});
              setForm({ title: "", content: "", is_active: true });
            }}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add entry
          </Button>
        </div>

        <div className="mt-6">
          {knowledgeQuery.isLoading ? (
            <LoadingState label="Loading knowledge…" />
          ) : knowledgeQuery.isError ? (
            <ErrorState title="Knowledge could not load" onRetry={() => void knowledgeQuery.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Bot className="h-5 w-5 text-faint" aria-hidden />}
              title="No knowledge entries"
              hint="Without entries the assistant only has its built-in brief. Add a few to steer its answers."
            />
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li key={row.id} className="rounded-xl border border-hairline bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-ink">{row.title}</p>
                        {row.is_active ? <Badge tone="jade">Active</Badge> : <Badge tone="neutral">Off</Badge>}
                      </div>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted">{row.content}</p>
                      <p className="mt-2 text-2xs text-faint">Updated {formatDateTime(row.updated_at)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(row);
                          setErrors({});
                          setForm({ title: row.title, content: row.content, is_active: row.is_active });
                        }}
                      >
                        Edit
                      </Button>
                      <IconButton label="Delete entry" variant="danger" onClick={() => setDeleting(row)}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </IconButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={editing ? "Edit knowledge entry" : "Add knowledge entry"}
        description="Write it the way you want the assistant to say it, in plain language."
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              Save entry
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-5">
            <Field label="Title" htmlFor="kb-title" error={errors.title} hint="Internal label — not shown to visitors." required>
              <input id="kb-title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Answer" htmlFor="kb-content" error={errors.content} required>
              <textarea id="kb-content" rows={8} className="input" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-hairline bg-base/60 accent-cyan"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active — send this to the assistant
            </label>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this entry?"
        message={`"${deleting?.title ?? ""}" will no longer be available to the assistant.`}
        confirmLabel="Delete entry"
        destructive
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

function AuditTab() {
  const auditQuery = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => adminService.auditLogs(),
    enabled: isSupabaseConfigured,
  });

  const rows = auditQuery.data ?? [];

  return (
    <Panel className="p-6">
      <h2 className="font-display text-base font-semibold text-ink">Audit log</h2>
      <p className="mt-1.5 text-xs text-muted">
        Content changes, client moderation and broadcasts are recorded here with the admin and timestamp.
      </p>

      <div className="mt-5">
        {auditQuery.isLoading ? (
          <LoadingState label="Loading activity…" />
        ) : auditQuery.isError ? (
          <ErrorState title="Activity could not load" onRetry={() => void auditQuery.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title="Nothing recorded yet" hint="Actions taken in the studio show up here." />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Recent admin activity</caption>
              <thead>
                <tr className="border-b border-hairline">
                  {["Action", "Entity", "Details", "When"].map((heading) => (
                    <th key={heading} scope="col" className="px-3 py-2.5 font-display text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-hairline last:border-0">
                    <td className="px-3 py-2.5 font-medium text-ink">{row.action}</td>
                    <td className="px-3 py-2.5 text-xs text-muted">{row.entity_type}</td>
                    <td className="max-w-[18rem] truncate px-3 py-2.5 text-2xs text-faint">
                      {row.details ? JSON.stringify(row.details) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-2xs text-faint">
                      {formatDateTime(row.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Panel>
  );
}
