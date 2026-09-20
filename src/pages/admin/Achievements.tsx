import { CrudPage } from "../../features/admin/CrudPage";
import { adminService } from "../../services/admin";
import type { Achievement } from "../../types";
import { Badge } from "../../components/ui/Section";

export default function AdminAchievements() {
  return (
    <CrudPage<Achievement>
      title="Achievements & Results"
      description="Student results shown on the public website. A result is published ONLY after the student/parent has given recorded consent — enforced by the database, not just this screen."
      entityName="Achievement"
      queryKey={["admin", "achievements"]}
      fetcher={() => adminService.achievements()}
      searchKeys={["student_name", "examination", "year"]}
      toPayload={(v, editing) => ({
        ...(editing ? { id: editing.id } : {}),
        student_name: String(v.student_name ?? "").trim(),
        photo_url: v.photo_url || null,
        examination: v.examination || null,
        result_text: v.result_text || null,
        year: v.year == null || v.year === "" ? null : Number(v.year),
        description: v.description || null,
        featured: Boolean(v.featured),
        consent_recorded: Boolean(v.consent_recorded),
        status: v.status || "draft",
        display_order: Number(v.display_order ?? 0),
      })}
      upsert={(payload) => adminService.upsertAchievement(payload)}
      remove={(id) => adminService.deleteAchievement(id)}
      columns={[
        {
          key: "name",
          header: "Student",
          render: (a) => (
            <div>
              <p className="font-semibold text-navy">{a.student_name}</p>
              <p className="text-xs text-muted">{a.examination ?? "—"}{a.year ? ` · ${a.year}` : ""}</p>
            </div>
          ),
        },
        { key: "result", header: "Result", render: (a) => a.result_text ?? "—" },
        {
          key: "consent",
          header: "Consent",
          render: (a) => (
            <Badge tone={a.consent_recorded ? "green" : "red"}>
              {a.consent_recorded ? "Recorded" : "Not recorded"}
            </Badge>
          ),
        },
        {
          key: "status",
          header: "Status",
          render: (a) => (
            <Badge tone={a.status === "published" ? "green" : a.status === "draft" ? "gray" : "red"}>{a.status}</Badge>
          ),
        },
      ]}
      fields={[
        { name: "student_name", label: "Student name", required: true },
        { name: "examination", label: "Examination", placeholder: "e.g. NDA 2026 (written)" },
        { name: "result_text", label: "Result", placeholder: "e.g. Recommended / AIR 123 — must be verified" },
        { name: "year", label: "Year", type: "number" },
        { name: "description", label: "Description", type: "textarea", colSpan: 2 },
        { name: "photo_url", label: "Photo URL", type: "url", colSpan: 2, hint: "Upload photos via Storage → media, then paste the public URL" },
        { name: "consent_recorded", label: "Written consent recorded from student/parent (required before publishing)", type: "checkbox", colSpan: 2 },
        { name: "featured", label: "Featured", type: "checkbox" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "archived", label: "Archived" },
          ],
        },
        { name: "display_order", label: "Display order", type: "number" },
      ]}
    />
  );
}
