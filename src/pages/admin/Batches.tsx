import { useQuery } from "@tanstack/react-query";
import { CrudPage } from "../../features/admin/CrudPage";
import { adminService } from "../../services/admin";
import type { Batch } from "../../types";
import { Badge } from "../../components/ui/Section";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { formatDate } from "../../lib/utils";

export default function AdminBatches() {
  const coursesQ = useQuery({ queryKey: ["admin", "courses"], queryFn: () => adminService.courses() });
  const teachersQ = useQuery({ queryKey: ["admin", "teachers"], queryFn: () => adminService.teachers() });

  if (coursesQ.isLoading || teachersQ.isLoading) return <LoadingState label="Loading…" />;
  if (coursesQ.isError || teachersQ.isError) return <ErrorState onRetry={() => { coursesQ.refetch(); teachersQ.refetch(); }} />;

  const courseOptions = (coursesQ.data ?? []).map((c) => ({ value: c.id, label: c.title }));
  const teacherOptions = (teachersQ.data ?? []).map((t) => ({ value: t.id, label: t.full_name || t.email || "Teacher" }));

  return (
    <CrudPage<Batch & { courses?: { title: string } }>
      title="Batches"
      description="Manage batches per course. Assign a faculty teacher so they can mark attendance, create tests and share assignments."
      entityName="Batch"
      queryKey={["admin", "batches"]}
      fetcher={() => adminService.batches()}
      searchKeys={["name", "timing_text", "status"]}
      toPayload={(v, editing) => ({
        ...(editing ? { id: editing.id } : {}),
        course_id: String(v.course_id ?? ""),
        name: String(v.name ?? "").trim(),
        timing_text: v.timing_text || null,
        start_date: v.start_date || null,
        end_date: v.end_date || null,
        capacity: v.capacity == null || v.capacity === "" ? null : Number(v.capacity),
        admission_status: v.admission_status || "open",
        faculty_teacher_id: v.faculty_teacher_id || null,
        status: v.status || "upcoming",
        notes: v.notes || null,
      })}
      upsert={(payload) => adminService.upsertBatch(payload)}
      remove={(id) => adminService.deleteBatch(id)}
      columns={[
        {
          key: "name",
          header: "Batch",
          render: (b) => (
            <div>
              <p className="font-semibold text-navy">{b.name}</p>
              <p className="text-xs text-muted">{b.courses?.title ?? "—"}</p>
            </div>
          ),
        },
        { key: "timing", header: "Timing", render: (b) => b.timing_text ?? "—" },
        { key: "start", header: "Starts", render: (b) => formatDate(b.start_date) },
        { key: "capacity", header: "Capacity", render: (b) => b.capacity ?? "—" },
        {
          key: "status",
          header: "Status",
          render: (b) => (
            <Badge tone={b.status === "ongoing" ? "green" : b.status === "upcoming" ? "saffron" : "gray"}>
              {b.status}
            </Badge>
          ),
        },
      ]}
      fields={[
        {
          name: "course_id",
          label: "Course",
          type: "select",
          required: true,
          options: courseOptions,
          colSpan: 2,
        },
        { name: "name", label: "Batch name", required: true, placeholder: "e.g. NDA Morning — Apr 2026" },
        { name: "timing_text", label: "Timing", placeholder: "e.g. 6:00–9:00 AM" },
        { name: "start_date", label: "Start date", type: "date" },
        { name: "end_date", label: "End date", type: "date" },
        { name: "capacity", label: "Capacity", type: "number" },
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
          name: "faculty_teacher_id",
          label: "Faculty teacher",
          type: "select",
          options: teacherOptions,
          hint: "This teacher manages attendance, tests and assignments for the batch",
        },
        {
          name: "status",
          label: "Batch status",
          type: "select",
          options: [
            { value: "upcoming", label: "Upcoming" },
            { value: "ongoing", label: "Ongoing" },
            { value: "completed", label: "Completed" },
            { value: "archived", label: "Archived" },
          ],
        },
        { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
      ]}
    />
  );
}
