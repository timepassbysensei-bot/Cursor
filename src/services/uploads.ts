import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured, supabase } from "../lib/supabaseClient";

export type StorageBucket = "gallery" | "audio" | "avatars";

export interface UploadHandle {
  path: string;
  publicUrl: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export const IMAGE_MAX_BYTES = 12 * 1024 * 1024; // 12 MB before compression
export const AUDIO_MAX_BYTES = 25 * 1024 * 1024; // 25 MB
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];

export class UploadError extends Error {}

export function publicUrlFor(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function safeName(name: string): string {
  const ext = (name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  return ext || "bin";
}

function uniquePath(folder: string, name: string): string {
  const stamp = Date.now().toString(36);
  const noise = Math.random().toString(36).slice(2, 8);
  return `${folder}/${stamp}-${noise}.${safeName(name)}`;
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

/**
 * Uploads straight to the Storage REST endpoint with XMLHttpRequest.
 * supabase-js's upload() is a plain fetch and cannot report progress, and the
 * admin studio needs a real progress bar for a 10 MB photo over mobile data.
 *
 * The session JWT is attached when there is one, which is what makes an
 * admin-only storage policy succeed instead of silently uploading as `anon`.
 */
async function authorisedHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? SUPABASE_ANON_KEY;
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
  };
}

async function uploadWithProgressAuthed(input: {
  bucket: StorageBucket;
  path: string;
  body: Blob;
  contentType: string;
  upsert: boolean;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  let headers: Record<string, string>;
  try {
    headers = await authorisedHeaders();
  } catch {
    throw new UploadError("Your session expired. Please sign in again.");
  }

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/${input.bucket}/${encodePath(input.path)}`;
    xhr.open("POST", url, true);
    for (const [key, value] of Object.entries(headers)) xhr.setRequestHeader(key, value);
    xhr.setRequestHeader("Content-Type", input.contentType);
    xhr.setRequestHeader("cache-control", "3600");
    if (input.upsert) xhr.setRequestHeader("x-upsert", "true");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      input.onProgress?.(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        input.onProgress?.(100);
        resolve();
        return;
      }
      let detail = `Upload failed (${xhr.status})`;
      try {
        const parsed = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        detail = parsed.message || parsed.error || detail;
      } catch {
        /* keep the status-based message */
      }
      if (xhr.status === 401 || xhr.status === 403) {
        detail = "You do not have permission to upload here. Sign in as an admin and try again.";
      }
      reject(new UploadError(detail));
    };
    xhr.onerror = () => reject(new UploadError("Network error while uploading. Check your connection."));
    xhr.send(input.body);
  });
}

/** Downscales and re-encodes large photos in the browser before upload. */
export async function compressImage(
  file: File,
  maxDimension = 2200,
  quality = 0.85
): Promise<{ blob: Blob; width: number; height: number; name: string }> {
  if (typeof createImageBitmap !== "function") {
    return { blob: file, width: 0, height: 0, name: file.name };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { blob: file, width: 0, height: 0, name: file.name };
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  // Already small enough and already a web format — ship it untouched.
  if (scale === 1 && (file.type === "image/webp" || file.size < 400 * 1024)) {
    bitmap.close?.();
    return { blob: file, width, height, name: file.name };
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return { blob: file, width, height, name: file.name };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality)
  );

  if (!blob) return { blob: file, width, height, name: file.name };
  // Never make the file bigger than it started.
  if (blob.size >= file.size) return { blob: file, width, height, name: file.name };

  const base = file.name.replace(/\.[^.]+$/, "");
  return { blob, width, height, name: `${base}.webp` };
}

export async function uploadGalleryImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadHandle> {
  requireConfigured();
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new UploadError("That file type is not supported. Use a JPG, PNG, WebP, AVIF or GIF.");
  }
  if (file.size > IMAGE_MAX_BYTES) {
    throw new UploadError(`Images must be under ${Math.round(IMAGE_MAX_BYTES / 1024 / 1024)} MB.`);
  }

  const { blob, width, height, name } = await compressImage(file);
  const path = uniquePath("gallery", name);
  await uploadWithProgressAuthed({
    bucket: "gallery",
    path,
    body: blob,
    contentType: blob.type || "image/webp",
    upsert: false,
    onProgress,
  });

  return { path, publicUrl: publicUrlFor("gallery", path), sizeBytes: blob.size, width, height };
}

export async function uploadAudioTrack(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadHandle> {
  requireConfigured();
  const isMp3 = file.type === "audio/mpeg" || /\.mp3$/i.test(file.name);
  if (!isMp3 && !AUDIO_TYPES.includes(file.type)) {
    throw new UploadError("Only MP3 (or WAV/OGG) audio files can be uploaded.");
  }
  if (file.size > AUDIO_MAX_BYTES) {
    throw new UploadError(`Audio files must be under ${Math.round(AUDIO_MAX_BYTES / 1024 / 1024)} MB.`);
  }

  // No transcoding: music must be uploaded as Arian wants it heard.
  const path = uniquePath("tracks", file.name);
  await uploadWithProgressAuthed({
    bucket: "audio",
    path,
    body: file,
    contentType: file.type || "audio/mpeg",
    upsert: false,
    onProgress,
  });

  return { path, publicUrl: publicUrlFor("audio", path), sizeBytes: file.size };
}

export async function uploadAvatar(
  file: File,
  userId: string,
  onProgress?: (percent: number) => void
): Promise<UploadHandle> {
  requireConfigured();
  if (!IMAGE_TYPES.includes(file.type)) throw new UploadError("Use a JPG, PNG, WebP or AVIF image.");
  if (file.size > IMAGE_MAX_BYTES) throw new UploadError("Avatar images must be under 12 MB.");

  const { blob, width, height, name } = await compressImage(file, 800, 0.85);
  const path = `${userId}/${uniquePath("avatar", name).split("/").pop()}`;
  await uploadWithProgressAuthed({
    bucket: "avatars",
    path,
    body: blob,
    contentType: blob.type || "image/webp",
    upsert: true,
    onProgress,
  });

  return { path, publicUrl: publicUrlFor("avatars", path), sizeBytes: blob.size, width, height };
}

/** Removes the stored object. Called after the DB row is deleted. */
export async function removeStorageObject(bucket: StorageBucket, path: string): Promise<void> {
  if (!isSupabaseConfigured || !path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new UploadError(error.message);
}

function requireConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new UploadError(
      "Storage is not connected yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then reload."
    );
  }
}
