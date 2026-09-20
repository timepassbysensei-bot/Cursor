import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import type {
  Achievement,
  Course,
  Faq,
  GalleryAlbum,
  GalleryImage,
  Notice,
  SiteSettings,
  Testimonial,
  Batch,
} from "../types";
import { DEFAULT_FEATURE_FLAGS } from "../types";

/**
 * Before the deployment has Supabase credentials the public pages render their
 * real empty/default states instead of a wall of network errors. Once
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set these guards are inert.
 */
export const NOT_CONNECTED_MESSAGE =
  "The website is not connected to its database yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then reload.";

export interface PublicBatchView extends Batch {
  course_title: string | null;
}

const DEFAULT_SETTINGS: SiteSettings = {
  academy_name: "Bokaro Defence Academy",
  tagline: null,
  logo_url: null,
  favicon_url: null,
  announcement_text: null,
  announcement_enabled: false,
  admission_status: "open",
  hero_eyebrow: null,
  hero_heading: null,
  hero_description: null,
  hero_image_url: null,
  hero_cta_apply_label: null,
  hero_cta_courses_label: null,
  about_overview: null,
  about_mission: null,
  about_vision: null,
  about_teaching_approach: null,
  director_message: null,
  director_name: null,
  director_title: null,
  director_image_url: null,
  admissions_intro: null,
  admission_process: [],
  required_documents: [],
  eligibility_text: null,
  scholarship_text: null,
  contact_address: null,
  contact_phone: null,
  contact_phone_secondary: null,
  contact_whatsapp: null,
  contact_email: null,
  contact_hours: null,
  map_url: null,
  map_embed_url: null,
  facebook_url: null,
  instagram_url: null,
  youtube_url: null,
  twitter_url: null,
  footer_description: null,
  seo_title: null,
  seo_description: null,
  og_image_url: null,
  feature_flags: DEFAULT_FEATURE_FLAGS,
  updated_at: new Date(0).toISOString(),
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle<SiteSettings>();

  if (error) {
    if (isMissingTable(error)) return DEFAULT_SETTINGS;
    throw error;
  }
  if (!data) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...data,
    feature_flags: { ...DEFAULT_FEATURE_FLAGS, ...(data.feature_flags ?? {}) },
  };
}

function isMissingTable(err: { code?: string; message?: string }): boolean {
  return err.code === "42P01" || /does not exist/i.test(err.message ?? "");
}

export async function fetchPublishedCourses(): Promise<Course[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("status", "published")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Course[];
}

export async function fetchCourseBySlug(slug: string): Promise<Course | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<Course>();
  if (error) throw error;
  return data;
}

export async function fetchUpcomingBatches(): Promise<PublicBatchView[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("batches")
    .select("*, courses(title, slug)")
    .neq("status", "archived")
    .in("admission_status", ["open", "filling_fast"])
    .order("start_date", { ascending: true })
    .limit(6);
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return (data ?? []).map((row: Record<string, unknown>) => {
    const course = row.courses as { title: string } | null;
    return { ...row, course_title: course?.title ?? null } as PublicBatchView;
  });
}

export async function fetchPublicNotices(): Promise<Notice[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .eq("status", "published")
    .eq("audience", "public")
    .or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString().slice(0, 10)}`)
    .order("pinned", { ascending: false })
    .order("publish_date", { ascending: false })
    .limit(6);
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return (data ?? []) as Notice[];
}

export async function fetchPublishedAchievements(): Promise<Achievement[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("status", "published")
    .eq("consent_recorded", true)
    .order("featured", { ascending: false })
    .order("year", { ascending: false })
    .order("display_order", { ascending: true })
    .limit(12);
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return (data ?? []) as Achievement[];
}

export async function fetchApprovedTestimonials(): Promise<Testimonial[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .limit(9);
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return (data ?? []) as Testimonial[];
}

export async function fetchPublishedAlbums(): Promise<GalleryAlbum[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("gallery_albums")
    .select("*")
    .eq("status", "published")
    .order("display_order", { ascending: true });
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return (data ?? []) as GalleryAlbum[];
}

export async function fetchAlbumImages(albumId: string): Promise<GalleryImage[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("album_id", albumId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GalleryImage[];
}

export async function fetchPublishedFaqs(): Promise<Faq[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("chatbot_faqs")
    .select("id, question, answer, category")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true });
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return (data ?? []) as Faq[];
}

export async function submitInquiry(input: {
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
}): Promise<void> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONNECTED_MESSAGE);
  const { error } = await supabase.from("inquiries").insert({
    name: input.name,
    email: input.email || null,
    phone: input.phone,
    whatsapp: input.whatsapp || null,
    city: input.city || null,
    interested_course_id: input.interested_course_id || null,
    message: input.message || null,
    source_page: input.source_page,
    utm_source: input.utm_source,
    utm_medium: input.utm_medium,
    utm_campaign: input.utm_campaign,
  });
  if (error) throw error;
}

export async function logUnansweredQuestion(question: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("chatbot_unanswered_questions").insert({ question });
  if (error) {
    console.warn("Failed to log unanswered question", error.message);
  }
}
