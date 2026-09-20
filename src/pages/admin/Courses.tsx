import { CrudPage } from "../../features/admin/CrudPage";
import { adminService } from "../../services/admin";
import type { Course } from "../../types";
import { Badge } from "../../components/ui/Section";

export default function AdminCourses() {
  return (
    <CrudPage<Course>
      title="Courses"
      description="Programmes shown on the public website. Only published courses appear publicly."
      entityName="Course"
      queryKey={["admin", "courses"]}
      fetcher={() => adminService.courses()}
      searchKeys={["title", "slug", "mode"]}
      toPayload={(v, editing) => ({
        ...(editing ? { id: editing.id } : {}),
        title: String(v.title ?? "").trim(),
        slug: String(v.slug ?? "").trim(),
        short_description: v.short_description || null,
        full_description: v.full_description || null,
        thumbnail_url: v.thumbnail_url || null,
        eligibility: v.eligibility || null,
        age_criteria: v.age_criteria || null,
        duration_text: v.duration_text || null,
        subjects: String(v.subjects_text ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        batch_timings: v.batch_timings || null,
        fees_text: v.fees_text || null,
        mode: v.mode || null,
        seats_text: v.seats_text || null,
        admission_status: v.admission_status || "open",
        featured: Boolean(v.featured),
        display_order: Number(v.display_order ?? 0),
        prospectus_url: v.prospectus_url || null,
        status: v.status || "draft",
      })}
      upsert={(payload) => adminService.upsertCourse(payload as Partial<Course> & { title: string })}
      remove={(id) => adminService.deleteCourse(id)}
      columns={[
        {
          key: "title",
          header: "Course",
          render: (c) => (
            <div>
              <p className="font-semibold text-navy">{c.title}</p>
              <p className="text-xs text-muted">/{c.slug}</p>
            </div>
          ),
        },
        { key: "duration", header: "Duration", render: (c) => c.duration_text ?? "—" },
        { key: "fees", header: "Fees", render: (c) => c.fees_text ?? "Not set" },
        {
          key: "status",
          header: "Status",
          render: (c) => (
            <Badge tone={c.status === "published" ? "green" : c.status === "draft" ? "gray" : "red"}>
              {c.status}
            </Badge>
          ),
        },
        {
          key: "admission",
          header: "Admissions",
          render: (c) => (
            <Badge tone={c.admission_status === "open" ? "green" : c.admission_status === "filling_fast" ? "saffron" : "red"}>
              {c.admission_status.replace("_", " ")}
            </Badge>
          ),
        },
      ]}
      fields={[
        { name: "title", label: "Title", required: true, colSpan: 2 },
        {
          name: "slug",
          label: "URL slug",
          required: true,
          hint: "lowercase-with-hyphens, e.g. nda-foundation",
          defaultValue: () => "",
        },
        { name: "short_description", label: "Short description", type: "textarea", colSpan: 2 },
        { name: "full_description", label: "Full description", type: "textarea", colSpan: 2 },
        { name: "eligibility", label: "Eligibility" },
        { name: "age_criteria", label: "Age criteria" },
        { name: "duration_text", label: "Duration" },
        { name: "batch_timings", label: "Batch timings" },
        { name: "fees_text", label: "Fees (text)", hint: "Leave blank if undecided — never publish invented fees" },
        { name: "mode", label: "Mode", placeholder: "Offline / Online" },
        { name: "seats_text", label: "Seats" },
        { name: "subjects_text", label: "Subjects", hint: "Comma-separated", colSpan: 2 },
        { name: "thumbnail_url", label: "Thumbnail URL", type: "url", colSpan: 2 },
        { name: "prospectus_url", label: "Prospectus URL", type: "url", colSpan: 2 },
        {
          name: "admission_status",
          label: "Admission status",
          type: "select",
          options: [
            { value: "open", label: "Open" },
            { value: "filling_fast", label: "Filling fast" },
            { value: "closed", label: "Closed" },
          ],
        },
        {
          name: "status",
          label: "Publish status",
          type: "select",
          options: [
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "archived", label: "Archived" },
          ],
        },
        { name: "featured", label: "Featured on homepage", type: "checkbox" },
        { name: "display_order", label: "Display order", type: "number" },
      ]}
    />
  );
}
