import { supabase } from "../lib/supabaseClient";
import type {
  Achievement,
  Batch,
  Course,
  Faq,
  GalleryAlbum,
  GalleryImage,
  Inquiry,
  Notice,
  Profile,
  SiteSettings,
  Testimonial,
} from "../types";

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface UnansweredQuestionRow {
  id: string;
  question: string;
  created_at: string;
}

async function uploadToMedia(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export const mediaUpload = {
  image: (file: File, folder = "gallery") => uploadToMedia(file, folder),
};

async function list<T>(table: string, order: { col: string; asc: boolean } = { col: "created_at", asc: false }): Promise<T[]> {
  const { data, error } = await supabase.from(table).select("*").order(order.col, { ascending: order.asc });
  if (error) throw error;
  return (data ?? []) as T[];
}

export const adminService = {
  // Courses
  async courses() {
    return list<Course>("courses", { col: "display_order", asc: true });
  },
  async upsertCourse(payload: Partial<Course> & { title: string }) {
    const { data, error } = await supabase.from("courses").upsert(payload).select().single();
    if (error) throw error;
    return data as Course;
  },
  async deleteCourse(id: string) {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) throw error;
  },

  // Batches
  async batches() {
    const { data, error } = await supabase
      .from("batches")
      .select("*, courses(title)")
      .order("start_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as (Batch & { courses?: { title: string } })[];
  },
  async upsertBatch(payload: Partial<Batch>) {
    const { data, error } = await supabase.from("batches").upsert(payload).select().single();
    if (error) throw error;
    return data as Batch;
  },
  async deleteBatch(id: string) {
    const { error } = await supabase.from("batches").delete().eq("id", id);
    if (error) throw error;
  },

  // Students (profiles with role=student)
  async students() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("full_name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  async updateStudent(id: string, payload: Record<string, unknown>) {
    const { data, error } = await supabase.from("profiles").update(payload).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  // Teachers (profiles with role=teacher)
  async teachers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "teacher")
      .order("full_name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  // Inquiries
  async inquiries() {
    return list<Inquiry>("inquiries");
  },
  async updateInquiry(id: string, payload: Partial<Inquiry>) {
    const { error } = await supabase.from("inquiries").update(payload).eq("id", id);
    if (error) throw error;
  },

  // Notices
  async notices() {
    return list<Notice>("notices", { col: "publish_date", asc: false });
  },
  async upsertNotice(payload: Partial<Notice>) {
    const { error } = await supabase.from("notices").upsert(payload);
    if (error) throw error;
  },
  async deleteNotice(id: string) {
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) throw error;
  },

  // Achievements
  async achievements() {
    return list<Achievement>("achievements", { col: "display_order", asc: true });
  },
  async upsertAchievement(payload: Partial<Achievement>) {
    const { error } = await supabase.from("achievements").upsert(payload);
    if (error) throw error;
  },
  async deleteAchievement(id: string) {
    const { error } = await supabase.from("achievements").delete().eq("id", id);
    if (error) throw error;
  },

  // Testimonials
  async testimonials() {
    return list<Testimonial>("testimonials");
  },
  async upsertTestimonial(payload: Partial<Testimonial>) {
    const { error } = await supabase.from("testimonials").upsert(payload);
    if (error) throw error;
  },
  async deleteTestimonial(id: string) {
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) throw error;
  },

  // Gallery
  async albums() {
    return list<GalleryAlbum>("gallery_albums", { col: "display_order", asc: true });
  },
  async upsertAlbum(payload: Partial<GalleryAlbum>) {
    const { error } = await supabase.from("gallery_albums").upsert(payload);
    if (error) throw error;
  },
  async deleteAlbum(id: string) {
    const { error } = await supabase.from("gallery_albums").delete().eq("id", id);
    if (error) throw error;
  },

  // FAQs
  async faqs() {
    return list<Faq>("chatbot_faqs", { col: "display_order", asc: true });
  },
  async upsertFaq(payload: Partial<Faq>) {
    const { error } = await supabase.from("chatbot_faqs").upsert(payload);
    if (error) throw error;
  },
  async deleteFaq(id: string) {
    const { error } = await supabase.from("chatbot_faqs").delete().eq("id", id);
    if (error) throw error;
  },

  // Gallery images
  async images(albumId: string) {
    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("album_id", albumId)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as GalleryImage[];
  },
  async insertImage(payload: Partial<GalleryImage> & { album_id: string; url: string }) {
    const { data, error } = await supabase.from("gallery_images").insert(payload).select().single();
    if (error) throw error;
    return data as GalleryImage;
  },
  async deleteImage(id: string) {
    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (error) throw error;
  },

  // Unanswered chatbot questions
  async unansweredQuestions(): Promise<UnansweredQuestionRow[]> {
    const { data, error } = await supabase
      .from("chatbot_unanswered_questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  },

  // Site settings (single row)
  async siteSettings() {
    const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
    if (error) throw error;
    return data as SiteSettings | null;
  },
  /**
   * Updates the single site_settings row. The row is located by primary key
   * first — matching on academy_name would silently fail (0 rows updated)
   * as soon as staff rename the academy.
   */
  async updateSiteSettings(payload: Partial<SiteSettings>) {
    const { data: existing, error: readError } = await supabase
      .from("site_settings")
      .select("id")
      .limit(1)
      .maybeSingle<{ id: string }>();
    if (readError) throw readError;

    if (!existing) {
      const { data, error } = await supabase
        .from("site_settings")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as SiteSettings;
    }

    const { data, error } = await supabase
      .from("site_settings")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as SiteSettings;
  },

  // Student create (admin-created accounts; force password set on first login)
  async createStudentAccount(input: { email: string; full_name: string; roll_number: string }) {
    const { data, error } = await supabase.functions.invoke("create-student", {
      body: input,
    });
    if (error) throw error;
    return data as { ok: boolean; user_id?: string; message?: string };
  },

  // Enrollments
  async enrollments(studentId?: string) {
    let q = supabase
      .from("enrollments")
      .select("*, batches(name, courses(title)), profiles(full_name, roll_number)")
      .order("created_at", { ascending: false });
    if (studentId) q = q.eq("student_id", studentId);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },
  async upsertEnrollment(payload: { student_id: string; batch_id: string; status?: string }) {
    const { error } = await supabase.from("enrollments").upsert(payload, { onConflict: "student_id,batch_id" });
    if (error) throw error;
  },
  async removeEnrollment(id: string) {
    const { error } = await supabase.from("enrollments").delete().eq("id", id);
    if (error) throw error;
  },

  // Audit logs
  async auditLogs(): Promise<AuditLogRow[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as AuditLogRow[];
  },

  async profileById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as Profile) ?? null;
  },
};
