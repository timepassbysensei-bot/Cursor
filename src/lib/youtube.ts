/**
 * YouTube helpers.
 *
 * The admin pastes a normal YouTube URL and we derive the video id from it.
 * Nothing here calls the YouTube API or scrapes a page: the pasted URL is the
 * source of truth, and the thumbnail is built from the documented
 * `i.ytimg.com` pattern.
 */

const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Hosts the parser accepts. Checked with an exact/subdomain match rather than
 * a substring search, so lookalike domains such as `notyoutube.com` are
 * rejected instead of being treated as YouTube.
 */
const ALLOWED_HOSTS = ["youtube.com", "youtu.be", "youtube-nocookie.com"];

function isYouTubeHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/**
 * Extracts the 11-character video id from any common YouTube URL shape:
 * watch?v=, youtu.be/, /embed/, /shorts/, /live/, and URLs with extra params.
 * Returns null when the input is not a recognisable YouTube video link.
 */
export function extractYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;

  // A bare id is accepted so Arian can paste just the id when in a hurry.
  if (ID_PATTERN.test(raw)) return raw;

  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (!isYouTubeHost(url.hostname)) return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && ID_PATTERN.test(id) ? id : null;
  }

  const vParam = url.searchParams.get("v");
  if (vParam && ID_PATTERN.test(vParam)) return vParam;

  const segments = url.pathname.split("/").filter(Boolean);
  const [first, second] = segments;
  if (first && ["embed", "shorts", "live", "v"].includes(first) && second && ID_PATTERN.test(second)) {
    return second;
  }

  return null;
}

export function isYouTubeUrl(input: string | null | undefined): boolean {
  return extractYouTubeId(input) !== null;
}

export type ThumbnailQuality = "maxresdefault" | "sddefault" | "hqdefault" | "mqdefault";

/**
 * Official thumbnail URL. `hqdefault` is guaranteed to exist for every video,
 * so it is used as the fallback when the max-resolution frame 404s.
 */
export function youtubeThumbnail(
  youtubeId: string,
  quality: ThumbnailQuality = "hqdefault"
): string {
  return `https://i.ytimg.com/vi/${youtubeId}/${quality}.jpg`;
}

export function youtubeWatchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

/** Privacy-friendly embed used by the lightbox player. */
export function youtubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=1`;
}

export function youtubeShortsUrl(youtubeId: string): string {
  return `https://www.youtube.com/shorts/${youtubeId}`;
}

/** Ensures the stored URL always resolves to a canonical watch link. */
export function canonicalYouTubeUrl(input: string): string | null {
  const id = extractYouTubeId(input);
  return id ? youtubeWatchUrl(id) : null;
}

/** Instagram / X / Discord accept their own schemes; keep the same safety net. */
export function looksLikeUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+$/i.test(value.trim());
}
