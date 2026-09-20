import { supabase } from "../lib/supabaseClient";

export interface BatchInfo {
  id: string;
  name: string;
  timing_text: string | null;
  status: string;
  capacity: number | null;
  courses: { title: string } | null;
}

export interface SubjectInfo {
  id: string;
  name: string;
}

export interface RosterStudent {
  id: string;
  full_name: string;
  roll_number: string | null;
}

export interface TestRow {
  id: string;
  title: string;
  description: string | null;
  batch_id: string;
  subject_ids: string[];
  max_marks_per_subject: number;
  passing_percent: number;
  test_date: string;
  status: string;
  publish_result: boolean;
  batches?: { name: string } | null;
}

export interface MarkRow {
  id: string;
  test_id: string;
  student_id: string;
  subject_id: string;
  marks_obtained: number | null;
  is_absent: boolean;
}

export interface AttendanceRow {
  id: string;
  batch_id: string;
  student_id: string;
  date: string;
  status: "present" | "absent" | "late" | "leave";
}

export interface AssignmentRow {
  id: string;
  title: string;
  instructions: string | null;
  batch_id: string;
  due_date: string | null;
  max_score: number | null;
  attachment_url: string | null;
  status: string;
  created_at: string;
  batches?: { name: string } | null;
  assignment_submissions?: {
    id: string;
    student_id: string;
    submitted_at: string;
    text_notes: string | null;
    attachment_url: string | null;
    score: number | null;
    feedback: string | null;
    status: string;
  }[];
}

/** Batches visible to the signed-in teacher (or all batches for admins). */
export async function fetchTeacherBatches(role: string, userId: string): Promise<BatchInfo[]> {
  let q = supabase
    .from("batches")
    .select("id, name, timing_text, status, capacity, courses(title)")
    .neq("status", "archived")
    .order("start_date", { ascending: true });
  if (role === "teacher") q = q.eq("faculty_teacher_id", userId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as BatchInfo[];
}

export async function fetchSubjects(): Promise<SubjectInfo[]> {
  const { data, error } = await supabase.from("subjects").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchRoster(batchId: string): Promise<RosterStudent[]> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("student_id, profiles(full_name, roll_number)")
    .eq("batch_id", batchId)
    .eq("status", "active")
    .order("full_name", { foreignTable: "profiles", ascending: true });
  if (error) throw error;
  return (data ?? [])
    .map((row: Record<string, unknown>) => {
      const p = row.profiles as { full_name: string; roll_number: string | null } | null;
      return p ? { id: row.student_id as string, full_name: p.full_name, roll_number: p.roll_number } : null;
    })
    .filter((s): s is RosterStudent => s !== null);
}

export async function fetchBatchTests(batchId: string): Promise<TestRow[]> {
  const { data, error } = await supabase
    .from("tests")
    .select("*, batches(name)")
    .eq("batch_id", batchId)
    .neq("status", "archived")
    .order("test_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as TestRow[];
}

export interface TestUpsertPayload extends Partial<Omit<TestRow, "batches">> {
  batch_id: string;
  title: string;
  test_date: string;
  created_by?: string | null;
}

export async function upsertTest(payload: TestUpsertPayload) {
  const { data, error } = await supabase.from("tests").upsert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function fetchMarks(testId: string): Promise<MarkRow[]> {
  const { data, error } = await supabase.from("marks").select("*").eq("test_id", testId);
  if (error) throw error;
  return (data ?? []) as MarkRow[];
}

export interface MarkUpsert {
  test_id: string;
  student_id: string;
  subject_id: string;
  marks_obtained: number | null;
  is_absent: boolean;
  entered_by: string;
}

export async function upsertMarks(rows: MarkUpsert[]) {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from("marks")
    .upsert(rows, { onConflict: "test_id,student_id,subject_id" });
  if (error) throw error;
}

export async function markTestPublished(testId: string, publish: boolean) {
  const { error } = await supabase
    .from("tests")
    .update({ status: publish ? "published" : "reviewed", publish_result: publish })
    .eq("id", testId);
  if (error) throw error;
}

export async function fetchAttendance(batchId: string, date: string): Promise<AttendanceRow[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("id, batch_id, student_id, date, status")
    .eq("batch_id", batchId)
    .eq("date", date);
  if (error) throw error;
  return (data ?? []) as AttendanceRow[];
}

export interface AttendanceUpsert {
  batch_id: string;
  student_id: string;
  date: string;
  status: "present" | "absent" | "late" | "leave";
  marked_by: string;
}

export async function upsertAttendance(rows: AttendanceUpsert[]) {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "batch_id,student_id,date" });
  if (error) throw error;
}

export async function fetchBatchAssignments(batchId: string): Promise<AssignmentRow[]> {
  const { data, error } = await supabase
    .from("assignments")
    .select("*, batches(name), assignment_submissions(*)")
    .eq("batch_id", batchId)
    .neq("status", "archived")
    .order("due_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AssignmentRow[];
}

export interface AssignmentUpsertPayload extends Partial<Omit<AssignmentRow, "created_at" | "batches" | "assignment_submissions">> {
  batch_id: string;
  title: string;
  created_by?: string | null;
}

export async function upsertAssignment(payload: AssignmentUpsertPayload) {
  const { data, error } = await supabase.from("assignments").upsert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function gradeSubmission(submissionId: string, score: number | null, feedback: string | null) {
  const { error } = await supabase
    .from("assignment_submissions")
    .update({ score, feedback, status: "graded" })
    .eq("id", submissionId);
  if (error) throw error;
}

export async function uploadResourceFile(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export async function upsertResource(payload: {
  id?: string;
  title: string;
  description?: string | null;
  url: string;
  kind: string;
  batch_id?: string | null;
  visibility: string;
  uploaded_by: string;
}) {
  const { error } = await supabase.from("resources").upsert(payload);
  if (error) throw error;
}

export async function fetchStudentBatchIds(studentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("batch_id")
    .eq("student_id", studentId)
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []).map((r: { batch_id: string }) => r.batch_id);
}

export async function fetchBatchNoticeBoard(batchIds: string[]): Promise<
  { id: string; title: string; description: string | null; publish_date: string; pinned: boolean }[]
> {
  if (batchIds.length === 0) return [];
  const { data, error } = await supabase
    .from("notices")
    .select("id, title, description, publish_date, pinned")
    .eq("status", "published")
    .eq("audience", "batch")
    .in("batch_id", batchIds)
    .order("pinned", { ascending: false })
    .order("publish_date", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}
