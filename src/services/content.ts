import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { DEMO_GALLERY, DEMO_VIDEOS } from "../lib/demoData";
import { DEFAULT_SITE_CONTENT, mergeSiteContent } from "../lib/siteContent";
import type { AudioTrack, Broadcast, GalleryItem, SiteContent, SiteContentRow, Video } from "../types";

/**
 * Demo mode is the state before Supabase is connected. Public pages render
 * sample content and a banner explaining it, instead of a wall of empty
 * sections or network errors.
 */
export const DEMO_MODE = !isSupabaseConfigured;

export const NOT_CONNECTED_MESSAGE =
  "This site is not connected to its database yet, so nothing was sent. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then reload.";

const VIDEO_COLUMNS =
  "id, youtube_url, youtube_id, title, description, thumbnail_url, game, category, duration_text, published_at, sort_order, is_featured, is_published, created_at, updated_at";
const GALLERY_COLUMNS =
  "id, storage_path, public_url, title, caption, alt_text, category, width, height, sort_order, is_published, created_at, updated_at";
const AUDIO_COLUMNS = "id, storage_path, public_url, title, artist, file_size_bytes, is_active, created_at";
const BROADCAST_COLUMNS =
  "id, title, body, audience_type, recipient_user_id, status, created_by, created_at";

/** PostgREST reports a missing table with 42P01 or a "does not exist" message. */
export function isMissingRelation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const { code, message } = err as { code?: string; message?: string };
  return code === "42P01" || code === "PGRST205" || /does not exist|schema cache/i.test(message ?? "");
}

export async function fetchSiteContent(): Promise<SiteContent> {
  if (!isSupabaseConfigured) return DEFAULT_SITE_CONTENT;
  const { data, error } = await supabase
    .from("site_content")
    .select("id, content_key, content_value, updated_at");
  if (error) {
    if (isMissingRelation(error)) return DEFAULT_SITE_CONTENT;
    throw error;
  }
  return mergeSiteContent((data ?? []) as SiteContentRow[]);
}

/** Newest first, with Arian's manual ordering taking priority within a group. */
export async function fetchPublishedVideos(): Promise<Video[]> {
  if (!isSupabaseConfigured) return DEMO_VIDEOS;
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) return [];
    throw error;
  }
  return (data ?? []) as Video[];
}

export async function fetchFeaturedVideo(): Promise<Video | null> {
  if (!isSupabaseConfigured) return DEMO_VIDEOS.find((v) => v.is_featured) ?? DEMO_VIDEOS[0] ?? null;
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle<Video>();
  if (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }
  return data ?? null;
}

export async function fetchPublishedGallery(): Promise<GalleryItem[]> {
  if (!isSupabaseConfigured) return DEMO_GALLERY;
  const { data, error } = await supabase
    .from("gallery_items")
    .select(GALLERY_COLUMNS)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) return [];
    throw error;
  }
  return (data ?? []) as GalleryItem[];
}

/** The one background track the public player may offer. */
export async function fetchActiveAudioTrack(): Promise<AudioTrack | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("audio_tracks")
    .select(AUDIO_COLUMNS)
    .eq("is_active", true)
    .maybeSingle<AudioTrack>();
  if (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }
  return data ?? null;
}

/** Latest public announcement, shown in the site-wide bar. */
export async function fetchPublicAnnouncement(): Promise<Broadcast | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("broadcasts")
    .select(BROADCAST_COLUMNS)
    .eq("audience_type", "public_announcement")
    .eq("status", "sent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Broadcast>();
  if (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }
  return data ?? null;
}

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Writes a visitor's message into Arian's inbox. The insert policy allows
 * only `message_type = 'contact'` with no sender/recipient user id, so a
 * crafted request cannot impersonate a client or address another account.
 */
export async function submitContactMessage(input: ContactSubmission): Promise<void> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONNECTED_MESSAGE);
  const { error } = await supabase.from("messages").insert({
    message_type: "contact",
    sender_name: input.name,
    sender_email: input.email,
    subject: input.subject,
    body: input.message,
  });
  if (error) throw error;
}

export interface SponsorshipSubmission {
  name: string;
  email: string;
  company: string;
  website: string;
  campaignObjective: string;
  preferredPlatform: string;
  budget: string;
  timeline: string;
  message: string;
}

export async function submitSponsorshipLead(input: SponsorshipSubmission): Promise<void> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONNECTED_MESSAGE);
  const { error } = await supabase.from("sponsorship_leads").insert({
    name: input.name,
    email: input.email,
    company: input.company || null,
    website: input.website || null,
    campaign_objective: input.campaignObjective || null,
    preferred_platform: input.preferredPlatform || null,
    budget: input.budget || null,
    timeline: input.timeline || null,
    message: input.message || null,
  });
  if (error) throw error;
}
