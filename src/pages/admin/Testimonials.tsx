import { CrudPage } from "../../features/admin/CrudPage";
import { adminService } from "../../services/admin";
import type { Testimonial } from "../../types";
import { Badge } from "../../components/ui/Section";

export default function AdminTestimonials() {
  return (
    <CrudPage<Testimonial>
      title="Testimonials"
      description="Quotes from students and parents. Publish only genuine, verified statements shared voluntarily."
      entityName="Testimonial"
      queryKey={["admin", "testimonials"]}
      fetcher={() => adminService.testimonials()}
      searchKeys={["name", "quote", "course_text"]}
      toPayload={(v, editing) => ({
        ...(editing ? { id: editing.id } : {}),
        name: String(v.name ?? "").trim(),
        photo_url: v.photo_url || null,
        course_text: v.course_text || null,
        quote: String(v.quote ?? "").trim(),
        rating: Number(v.rating ?? 5),
        featured: Boolean(v.featured),
        status: v.status || "draft",
      })}
      upsert={(payload) => adminService.upsertTestimonial(payload)}
      remove={(id) => adminService.deleteTestimonial(id)}
      columns={[
        {
          key: "name",
          header: "Person",
          render: (t) => (
            <div>
              <p className="font-semibold text-navy">{t.name}</p>
              <p className="text-xs text-muted">{t.course_text ?? "—"}</p>
            </div>
          ),
        },
        {
          key: "quote",
          header: "Quote",
          render: (t) => <span className="line-clamp-2 text-xs text-muted">“{t.quote}”</span>,
        },
        { key: "rating", header: "Rating", render: (t) => `${t.rating}/5` },
        {
          key: "status",
          header: "Status",
          render: (t) => (
            <Badge tone={t.status === "published" ? "green" : t.status === "draft" ? "gray" : "red"}>{t.status}</Badge>
          ),
        },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "course_text", label: "Course / context", placeholder: "e.g. NDA Foundation batch" },
        { name: "quote", label: "Quote", type: "textarea", required: true, colSpan: 2 },
        {
          name: "rating",
          label: "Rating",
          type: "select",
          options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n > 1 ? "s" : ""}` })),
        },
        { name: "photo_url", label: "Photo URL", type: "url" },
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
      ]}
    />
  );
}
