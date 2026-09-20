export type AppRole = "super_admin" | "admin" | "teacher" | "student";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  role: AppRole;
  is_active: boolean;
  force_password_change: boolean;
  avatar_url?: string | null;
  phone?: string | null;
  roll_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  full_description: string | null;
  thumbnail_url: string | null;
  eligibility: string | null;
  age_criteria: string | null;
  duration_text: string | null;
  subjects: string[] | null;
  batch_timings: string | null;
  fees_text: string | null;
  mode: string | null;
  seats_text: string | null;
  admission_status: "open" | "filling_fast" | "closed";
  featured: boolean;
  display_order: number;
  prospectus_url: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  course_id: string;
  name: string;
  timing_text: string | null;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  admission_status: "open" | "filling_fast" | "closed";
  faculty_teacher_id: string | null;
  status: "upcoming" | "ongoing" | "completed" | "archived";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notice {
  id: string;
  title: string;
  description: string | null;
  publish_date: string;
  expiry_date: string | null;
  attachment_url: string | null;
  audience: "public" | "all_students" | "course" | "batch" | "teachers" | "admins";
  course_id: string | null;
  batch_id: string | null;
  pinned: boolean;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  student_name: string;
  photo_url: string | null;
  examination: string | null;
  result_text: string | null;
  course_id: string | null;
  year: number | null;
  description: string | null;
  featured: boolean;
  consent_recorded: boolean;
  status: "draft" | "published" | "archived";
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  photo_url: string | null;
  course_text: string | null;
  quote: string;
  rating: number;
  featured: boolean;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  event_date: string | null;
  cover_image_url: string | null;
  display_order: number;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  album_id: string;
  url: string;
  caption: string | null;
  alt_text: string | null;
  display_order: number;
  created_at: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  featured: boolean;
  status: "draft" | "published" | "archived";
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type InquiryStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "admitted"
  | "closed"
  | "spam";

export interface Inquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  whatsapp: string | null;
  city: string | null;
  interested_course_id: string | null;
  message: string | null;
  source_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: InquiryStatus;
  assigned_staff_id: string | null;
  follow_up_date: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlags {
  attendance_enabled: boolean;
  ranking_enabled: boolean;
  assignment_submissions_enabled: boolean;
  chatbot_enabled: boolean;
  floating_call_enabled: boolean;
  floating_whatsapp_enabled: boolean;
  floating_apply_enabled: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  attendance_enabled: true,
  ranking_enabled: false,
  assignment_submissions_enabled: true,
  chatbot_enabled: true,
  floating_call_enabled: true,
  floating_whatsapp_enabled: true,
  floating_apply_enabled: true,
};

export interface SiteSettings {
  academy_name: string;
  tagline: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  announcement_text: string | null;
  announcement_enabled: boolean;
  admission_status: "open" | "filling_fast" | "closed";
  hero_eyebrow: string | null;
  hero_heading: string | null;
  hero_description: string | null;
  hero_image_url: string | null;
  hero_cta_apply_label: string | null;
  hero_cta_courses_label: string | null;
  about_overview: string | null;
  about_mission: string | null;
  about_vision: string | null;
  about_teaching_approach: string | null;
  director_message: string | null;
  director_name: string | null;
  director_title: string | null;
  director_image_url: string | null;
  admissions_intro: string | null;
  admission_process: unknown;
  required_documents: unknown;
  eligibility_text: string | null;
  scholarship_text: string | null;
  contact_address: string | null;
  contact_phone: string | null;
  contact_phone_secondary: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  contact_hours: string | null;
  map_url: string | null;
  map_embed_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  footer_description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  feature_flags: FeatureFlags;
  updated_at: string;
}
