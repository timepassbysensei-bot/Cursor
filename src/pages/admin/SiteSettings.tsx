import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { PageHeader } from "../../features/admin/PageHeader";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { Card } from "../../components/ui/Section";
import { adminService } from "../../services/admin";
import { useSiteSettings, SITE_SETTINGS_KEY } from "../../hooks/useSiteSettings";
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags, type SiteSettings } from "../../types";

type TextKey =
  | "academy_name" | "contact_address" | "contact_phone" | "contact_phone_secondary"
  | "contact_whatsapp" | "contact_email" | "contact_hours" | "map_url" | "map_embed_url"
  | "facebook_url" | "instagram_url" | "youtube_url" | "twitter_url"
  | "logo_url" | "announcement_text" | "og_image_url";

type FlagKey = keyof FeatureFlags;

const CONTACT_FIELDS: { key: TextKey; label: string; hint?: string }[] = [
  { key: "contact_address", label: "Address", hint: "Shown in footer & contact page — enter the real academy address" },
  { key: "contact_phone", label: "Primary phone (10-digit)" },
  { key: "contact_phone_secondary", label: "Secondary phone" },
  { key: "contact_whatsapp", label: "WhatsApp number (10-digit)" },
  { key: "contact_email", label: "Email" },
  { key: "contact_hours", label: "Office hours", hint: "e.g. Mon–Sat, 8 AM – 6 PM" },
  { key: "map_url", label: "Google Maps link" },
  { key: "map_embed_url", label: "Google Maps embed URL" },
];

const SOCIAL_FIELDS: { key: TextKey; label: string }[] = [
  { key: "facebook_url", label: "Facebook URL" },
  { key: "instagram_url", label: "Instagram URL" },
  { key: "youtube_url", label: "YouTube URL" },
  { key: "twitter_url", label: "X (Twitter) URL" },
];

const FLAGS: { key: FlagKey; label: string }[] = [
  { key: "attendance_enabled", label: "Attendance module" },
  { key: "ranking_enabled", label: "Show student rankings to students" },
  { key: "assignment_submissions_enabled", label: "Assignment submissions" },
  { key: "chatbot_enabled", label: "Assistant chatbot widget" },
  { key: "floating_call_enabled", label: "Floating call button" },
  { key: "floating_whatsapp_enabled", label: "Floating WhatsApp button" },
  { key: "floating_apply_enabled", label: "Floating Apply button" },
];

export default function AdminSiteSettings() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useSiteSettings();
  const [texts, setTexts] = useState<Partial<Record<TextKey, string>>>({});
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [admissionStatus, setAdmissionStatus] = useState<string>("open");
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      const next: Partial<Record<TextKey, string>> = {};
      const record = data as unknown as Record<string, string | null>;
      for (const key of ["academy_name", "contact_address", "contact_phone", "contact_phone_secondary", "contact_whatsapp", "contact_email", "contact_hours", "map_url", "map_embed_url", "facebook_url", "instagram_url", "youtube_url", "twitter_url", "logo_url", "announcement_text", "og_image_url"] as TextKey[]) {
        next[key] = record[key] ?? "";
      }
      setTexts(next);
      setFlags({ ...DEFAULT_FEATURE_FLAGS, ...(data.feature_flags ?? {}) });
      setAdmissionStatus(data.admission_status ?? "open");
      setAnnouncementEnabled(Boolean(data.announcement_enabled));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("Settings not loaded");

      // Normalise phone-like fields to 10 bare digits so every tel:/wa.me link
      // built elsewhere (header, footer, floating buttons) stays correct.
      const digits = (value: string | undefined) => (value ?? "").replace(/\D/g, "");
      const normalise = (value: string | undefined) => {
        const d = digits(value);
        if (!d) return "";
        const last10 = d.slice(-10);
        if (d.length !== 10 && d.length !== 12) return d;
        return last10;
      };
      const phone = normalise(texts.contact_phone);
      if (phone && !/^[6-9]\d{9}$/.test(phone)) {
        throw new Error("Primary phone should be a valid 10-digit Indian mobile number");
      }

      await adminService.updateSiteSettings({
        ...texts,
        contact_phone: phone || null,
        contact_phone_secondary: normalise(texts.contact_phone_secondary) || null,
        contact_whatsapp: normalise(texts.contact_whatsapp) || null,
        admission_status: admissionStatus as SiteSettings["admission_status"],
        announcement_enabled: announcementEnabled,
        feature_flags: flags,
      } as Partial<SiteSettings>);
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
        title="Site Settings"
        description="Academy identity, contact details shown site-wide, announcement bar and feature switches."
        actions={
          <>
            {saved && <span className="self-center text-sm font-semibold text-green-success" role="status">Saved ✓</span>}
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || !data}>
              {save.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Saving…</>
              ) : (
                <><Save className="h-4 w-4" aria-hidden /> Save Settings</>
              )}
            </Button>
          </>
        }
      />

      {save.isError && (
        <p role="alert" className="mb-4 rounded-lg border border-error/25 bg-error/[0.05] px-4 py-3 text-sm text-error">
          {(save.error as Error)?.message ?? "Could not save settings."}
        </p>
      )}

      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-navy">Identity & announcement</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ss-name" className="mb-1.5 block text-sm font-semibold text-ink">Academy name</label>
              <input id="ss-name" className="input" value={texts.academy_name ?? ""} onChange={(e) => setTexts((v) => ({ ...v, academy_name: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="ss-logo" className="mb-1.5 block text-sm font-semibold text-ink">Logo URL</label>
              <input id="ss-logo" className="input" value={texts.logo_url ?? ""} onChange={(e) => setTexts((v) => ({ ...v, logo_url: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="ss-adm" className="mb-1.5 block text-sm font-semibold text-ink">Overall admission status</label>
              <select id="ss-adm" className="input" value={admissionStatus} onChange={(e) => setAdmissionStatus(e.target.value)}>
                <option value="open">Open</option>
                <option value="filling_fast">Filling fast</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label htmlFor="ss-ann" className="mb-1.5 block text-sm font-semibold text-ink">Announcement text</label>
              <input id="ss-ann" className="input" value={texts.announcement_text ?? ""} onChange={(e) => setTexts((v) => ({ ...v, announcement_text: e.target.value }))} />
              <label className="mt-2 flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" className="h-4 w-4 rounded border-lightgray text-saffron focus:ring-saffron" checked={announcementEnabled} onChange={(e) => setAnnouncementEnabled(e.target.checked)} />
                Show announcement bar
              </label>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-navy">Contact details</h2>
          <p className="mt-1 text-xs text-muted">These appear in the header, footer, contact page and floating buttons. Leave blank to hide.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {CONTACT_FIELDS.map((f) => (
              <div key={f.key}>
                <label htmlFor={`ss-${f.key}`} className="mb-1.5 block text-sm font-semibold text-ink">{f.label}</label>
                <input id={`ss-${f.key}`} className="input" value={texts[f.key] ?? ""} onChange={(e) => setTexts((v) => ({ ...v, [f.key]: e.target.value }))} />
                {f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-navy">Social links</h2>
          <p className="mt-1 text-xs text-muted">Only links you fill in are shown in the footer.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((f) => (
              <div key={f.key}>
                <label htmlFor={`ss-${f.key}`} className="mb-1.5 block text-sm font-semibold text-ink">{f.label}</label>
                <input id={`ss-${f.key}`} type="url" className="input" placeholder="https://…" value={texts[f.key] ?? ""} onChange={(e) => setTexts((v) => ({ ...v, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-navy">Feature flags</h2>
          <p className="mt-1 text-xs text-muted">Turn modules on or off without a redeploy.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {FLAGS.map((f) => (
              <li key={f.key}>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-lightgray text-saffron focus:ring-saffron"
                    checked={flags[f.key]}
                    onChange={(e) => setFlags((fl) => ({ ...fl, [f.key]: e.target.checked }))}
                  />
                  {f.label}
                </label>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
