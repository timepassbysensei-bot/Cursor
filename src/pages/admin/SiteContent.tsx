import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { PageHeader } from "../../features/admin/PageHeader";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { Card } from "../../components/ui/Section";
import { adminService } from "../../services/admin";
import { useSiteSettings, SITE_SETTINGS_KEY } from "../../hooks/useSiteSettings";
import type { SiteSettings } from "../../types";

type TextKey = keyof Pick<
  SiteSettings,
  | "tagline"
  | "hero_eyebrow" | "hero_heading" | "hero_description" | "hero_image_url"
  | "hero_cta_apply_label" | "hero_cta_courses_label"
  | "about_overview" | "about_mission" | "about_vision" | "about_teaching_approach"
  | "director_message" | "director_name" | "director_title" | "director_image_url"
  | "admissions_intro" | "eligibility_text" | "scholarship_text"
  | "footer_description" | "seo_title" | "seo_description"
>;

const GROUPS: { heading: string; hint?: string; fields: { key: TextKey; label: string; textarea?: boolean; hint?: string }[] }[] = [
  {
    heading: "Hero section",
    fields: [
      { key: "hero_eyebrow", label: "Eyebrow (small text above heading)" },
      { key: "hero_heading", label: "Headline", textarea: true },
      { key: "hero_description", label: "Description", textarea: true },
      { key: "hero_image_url", label: "Hero background image URL" },
      { key: "hero_cta_apply_label", label: "Apply button label" },
      { key: "hero_cta_courses_label", label: "Courses button label" },
    ],
  },
  {
    heading: "About section",
    fields: [
      { key: "about_overview", label: "Overview", textarea: true },
      { key: "about_mission", label: "Mission", textarea: true },
      { key: "about_vision", label: "Vision", textarea: true },
      { key: "about_teaching_approach", label: "Teaching approach", textarea: true },
    ],
  },
  {
    heading: "Director / founder message",
    hint: "Shown on the About page and homepage. Leave blank to hide the section.",
    fields: [
      { key: "director_name", label: "Name" },
      { key: "director_title", label: "Title", hint: "e.g. Director" },
      { key: "director_message", label: "Message", textarea: true },
      { key: "director_image_url", label: "Photo URL" },
    ],
  },
  {
    heading: "Admissions page copy",
    fields: [
      { key: "admissions_intro", label: "Admissions intro", textarea: true },
      { key: "eligibility_text", label: "Eligibility text", textarea: true },
      { key: "scholarship_text", label: "Scholarship text", textarea: true },
    ],
  },
  {
    heading: "Footer & SEO",
    fields: [
      { key: "tagline", label: "Tagline" },
      { key: "footer_description", label: "Footer description", textarea: true },
      { key: "seo_title", label: "SEO title" },
      { key: "seo_description", label: "SEO description", textarea: true },
    ],
  },
];

export default function AdminSiteContent() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useSiteSettings();
  const [values, setValues] = useState<Partial<Record<TextKey, string>>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      const next: Partial<Record<TextKey, string>> = {};
      for (const g of GROUPS) for (const f of g.fields) next[f.key] = (data[f.key] as string | null) ?? "";
      setValues(next);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("Settings not loaded");
      await adminService.updateSiteSettings(values as Partial<SiteSettings>);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SITE_SETTINGS_KEY });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Website Content"
        description="Edit the main public-facing copy. Clear the field and save to fall back to the default text."
        actions={
          <>
            {saved && <span className="self-center text-sm font-semibold text-green-success" role="status">Saved ✓</span>}
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || !data}>
              {save.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Saving…</>
              ) : (
                <><Save className="h-4 w-4" aria-hidden /> Save Changes</>
              )}
            </Button>
          </>
        }
      />

      {save.isError && (
        <p role="alert" className="mb-4 rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">
          {(save.error as Error)?.message ?? "Could not save changes."}
        </p>
      )}

      <div className="space-y-6">
        {GROUPS.map((g) => (
          <Card key={g.heading} className="p-5 sm:p-6">
            <h2 className="font-display text-base font-bold text-navy">{g.heading}</h2>
            {g.hint && <p className="mt-1 text-xs text-muted">{g.hint}</p>}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {g.fields.map((f) => (
                <div key={f.key} className={f.textarea ? "sm:col-span-2" : ""}>
                  <label htmlFor={`sc-${f.key}`} className="mb-1.5 block text-sm font-semibold text-ink">
                    {f.label}
                  </label>
                  {f.textarea ? (
                    <textarea
                      id={`sc-${f.key}`}
                      rows={3}
                      className="input"
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      id={`sc-${f.key}`}
                      className="input"
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  )}
                  {f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
