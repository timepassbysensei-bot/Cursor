import { useQuery } from "@tanstack/react-query";
import { CrudPage } from "../../features/admin/CrudPage";
import { adminService } from "../../services/admin";
import type { Notice } from "../../types";
import { Badge } from "../../components/ui/Section";
import { formatDate } from "../../lib/utils";

export default function AdminNotices() {
  const coursesQ = useQuery({ queryKey: ["admin", "courses"], queryFn: () => adminService.courses() });
  const batchesQ = useQuery({ queryKey: ["admin", "batches"], queryFn: () => adminService.batches() });

  const courseOptions = (coursesQ.data ?? []).map((c) => ({ value: c.id, label: c.title }));
  const batchOptions = (batchesQ.data ?? []).map((b) => ({ value: b.id, label: b.name }));

  return (
    <CrudPage<Notice>
      title="Notices"
      description="Announcements for the public site, students or staff. Public notices appear on the website notice board."
      entityName="Notice"
      queryKey={["admin", "notices"]}
      fetcher={() => adminService.notices()}
      searchKeys={["title", "audience", "status"]}
      toPayload={(v, editing) => ({
        ...(editing ? { id: editing.id } : {}),
        title: String(v.title ?? "").trim(),
        description: v.description || null,
        publish_date: v.publish_date || new Date().toISOString().slice(0, 10),
        expiry_date: v.expiry_date || null,
        attachment_url: v.attachment_url || null,
        audience: v.audience || "public",
        course_id: v.audience === "course" ? (v.course_id || null) : null,
        batch_id: v.audience === "batch" ? (v.batch_id || null) : null,
        pinned: Boolean(v.pinned),
        status: v.status || "draft",
      })}
      upsert={(payload) => adminService.upsertNotice(payload)}
      remove={(id) => adminService.deleteNotice(id)}
      columns={[
        {
          key: "title",
          header: "Notice",
          render: (n) => (
            <div>
              <p className="font-semibold text-navy">{n.pinned ? "📌 " : ""}{n.title}</p>
              <p className="text-xs text-muted">{n.description?.slice(0, 60) ?? ""}</p>
            </div>
          ),
        },
        {
          key: "audience",
          header: "Audience",
          render: (n) => <Badge tone="navy">{n.audience.replace("_", " ")}</Badge>,
        },
        { key: "date", header: "Published", render: (n) => formatDate(n.publish_date) },
        {
          key: "status",
          header: "Status",
          render: (n) => (
            <Badge tone={n.status === "published" ? "green" : n.status === "draft" ? "gray" : "red"}>{n.status}</Badge>
          ),
        },
      ]}
      fields={[
        { name: "title", label: "Title", required: true, colSpan: 2 },
        { name: "description", label: "Description", type: "textarea", colSpan: 2 },
        { name: "publish_date", label: "Publish date", type: "date" },
        { name: "expiry_date", label: "Expiry date", hint: "Optional — notice hides after this date" },
        {
          name: "audience",
          label: "Audience",
          type: "select",
          options: [
            { value: "public", label: "Public website" },
            { value: "all_students", label: "All students" },
            { value: "course", label: "A course" },
            { value: "batch", label: "A batch" },
            { value: "teachers", label: "Teachers" },
            { value: "admins", label: "Admins" },
          ],
        },
        {
          name: "course_id",
          label: "Course (if audience = course)",
          type: "select",
          options: courseOptions,
        },
        {
          name: "batch_id",
          label: "Batch (if audience = batch)",
          type: "select",
          options: batchOptions,
        },
        { name: "attachment_url", label: "Attachment URL", type: "url", colSpan: 2 },
        { name: "pinned", label: "Pinned to top", type: "checkbox" },
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
