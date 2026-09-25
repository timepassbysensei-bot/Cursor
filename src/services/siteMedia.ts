import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import type { StorageBucket } from "./uploads";

export type SiteMediaSlot = "hero_video" | "genshin" | "wuthering" | "section";

export interface SiteMedia {
  id: string;
  slot: SiteMediaSlot;
  media_kind: "video" | "image";
  storage_path: string;
  public_url: string;
  poster_path: string | null;
  poster_url: string | null;
  title: string;
  alt_text: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  is_active: boolean;
  created_at: string;
}

export const SITE_MEDIA_COLUMNS =
  "id, slot, media_kind, storage_path, public_url, poster_path, poster_url, title, alt_text, file_size_bytes, mime_type, is_active, created_at";

export const SITE_MEDIA_SLOTS: { value: SiteMediaSlot; label: string; hint: string }[] = [
  { value: "hero_video", label: "Hero background loop", hint: "MP4 or WebM, muted, looping, with a poster image." },
  { value: "genshin", label: "Genshin mood visual", hint: "Botanical, luminous section backdrop image." },
  { value: "wuthering", label: "Wuthering Waves visual", hint: "Atmospheric cyan/teal section backdrop image." },
  { value: "section", label: "General section backdrop", hint: "Any other full-width background image." },
];

export const MEDIA_TYPES = ["video/mp4", "video/webm"];
export const MEDIA_MAX_BYTES = 220 * 1024 * 1024; // 220 MB — Supabase's own default cap.

const MEDIA_COLUMNS =
  "id, slot, media_kind, storage_path, public_url, poster_path, poster_url, title, alt_text, file_size_bytes, mime_type, is_active, created_at";

/** The active visual for one slot (hero video, Genshin, Wuthering Waves…). */
export async function fetchActiveSiteMedia(slot: SiteMediaSlot): Promise<SiteMedia | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("site_media")
    .select(MEDIA_COLUMNS)
    .eq("slot", slot)
    .eq("is_active", true)
    .maybeSingle<SiteMedia>();
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return null;
    throw error;
  }
  return data ?? null;
}

/** Everything in the library, newest first — the admin manager's list. */
export async function fetchSiteMediaLibrary(): Promise<SiteMedia[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("site_media")
    .select(MEDIA_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  return (data ?? []) as SiteMedia[];
}

export interface UploadMediaInput {
  file: File;
  slot: SiteMediaSlot;
  title: string;
  altText: string;
  poster?: File | null;
  onProgress?: (percent: number) => void;
}

/**
 * Uploads a background video or image plus its optional poster into the
 * `media` bucket, then deactivates the previous active row for the slot and
 * activates the new one. The storage upload reuses the authed XHR uploader
 * from `uploads.ts` through a small local wrapper so progress still streams.
 */
export async function uploadSiteMedia(input: UploadMediaInput): Promise<SiteMedia> {
  if (!isSupabaseConfigured) {
    throw new Error("Storage is not connected yet. Add the Supabase keys, then reload.");
  }

  const kind: "video" | "image" = input.file.type.startsWith("video/") ? "video" : "image";
  if (kind === "video" && !MEDIA_TYPES.includes(input.file.type)) {
    throw new Error("Background loops must be MP4 or WebM video files.");
  }
  if (kind === "image" && !input.file.type.startsWith("image/")) {
    throw new Error("Backdrop visuals must be image files.");
  }
  if (input.file.size > MEDIA_MAX_BYTES) {
    throw new Error(`Media files must be under ${Math.round(MEDIA_MAX_BYTES / 1024 / 1024)} MB.`);
  }

  const { uploadWithProgress } = await import("./uploads");
  const stamp = Date.now().toString(36);
  const noise = Math.random().toString(36).slice(2, 8);
  const ext = (input.file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const basePath = `site-media/${slotFolder(input.slot)}/${stamp}-${noise}.${ext || "bin"}`;

  await uploadWithProgress({
    bucket: "media" as StorageBucket,
    path: basePath,
    body: input.file,
    contentType: input.file.type || "application/octet-stream",
    upsert: false,
    onProgress: input.onProgress,
  });

  let posterPath: string | null = null;
  let posterUrl: string | null = null;
  if (input.poster) {
    const posterExt = (input.poster.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    posterPath = `site-media/${slotFolder(input.slot)}/${stamp}-${noise}-poster.${posterExt || "jpg"}`;
    await uploadWithProgress({
      bucket: "media" as StorageBucket,
      path: posterPath,
      body: input.poster,
      contentType: input.poster.type || "image/jpeg",
      upsert: false,
    });
    posterUrl = supabase.storage.from("media").getPublicUrl(posterPath).data.publicUrl;
  }

  const publicUrl = supabase.storage.from("media").getPublicUrl(basePath).data.publicUrl;

  const insert = await supabase
    .from("site_media")
    .insert({
      slot: input.slot,
      media_kind: kind,
      storage_path: basePath,
      public_url: publicUrl,
      poster_path: posterPath,
      poster_url: posterUrl,
      title: input.title,
      alt_text: input.altText,
      file_size_bytes: input.file.size,
      mime_type: input.file.type || null,
      is_active: false,
    })
    .select(SITE_MEDIA_COLUMNS)
    .single<SiteMedia>();
  if (insert.error) throw insert.error;

  await activateSiteMedia(insert.data);
  return insert.data;
}

/** Flips which row is active for a slot: deactivate everything, activate one. */
export async function activateSiteMedia(row: SiteMedia): Promise<void> {
  const { error: deactivateError } = await supabase
    .from("site_media")
    .update({ is_active: false })
    .eq("slot", row.slot)
    .eq("is_active", true);
  if (deactivateError) throw deactivateError;

  const { error: activateError } = await supabase
    .from("site_media")
    .update({ is_active: true })
    .eq("id", row.id);
  if (activateError) throw activateError;
}

export async function updateSiteMedia(
  id: string,
  patch: Partial<Pick<SiteMedia, "title" | "alt_text" | "is_active">>
): Promise<void> {
  const { error } = await supabase.from("site_media").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteSiteMedia(row: SiteMedia): Promise<void> {
  const paths = [row.storage_path, row.poster_path].filter((value): value is string => Boolean(value));
  if (paths.length > 0) {
    try {
      await supabase.storage.from("media").remove(paths);
    } catch {
      // The row is the source of truth; an orphaned object is not fatal.
    }
  }
  const { error } = await supabase.from("site_media").delete().eq("id", row.id);
  if (error) throw error;
}

function slotFolder(slot: SiteMediaSlot): string {
  return slot === "hero_video" ? "hero" : slot;
}
