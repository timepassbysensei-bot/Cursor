/**
 * The taxonomy Arian's content is organised by. Kept in one place so the
 * public filters, the admin pickers and the chatbot all agree.
 */

export const GAMES = ["Genshin Impact", "Wuthering Waves"] as const;

export const VIDEO_CATEGORIES = [
  "Lore",
  "Story",
  "Guide",
  "Build",
  "Banner",
  "Update",
  "Shorts",
  "Reaction",
] as const;

export const GALLERY_CATEGORIES = [
  "Genshin Impact",
  "Wuthering Waves",
  "Character art",
  "Screenshots",
  "Behind the scenes",
] as const;

export const SPONSOR_PLATFORMS = [
  "YouTube long-form",
  "YouTube Shorts",
  "Live stream",
  "Multiple formats",
] as const;

export const SPONSOR_BUDGETS = [
  "Under ₹25,000",
  "₹25,000 – ₹75,000",
  "₹75,000 – ₹2,00,000",
  "₹2,00,000+",
  "Not decided yet",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

/** Options that mean "no filter" in the public toolbars. */
export const ALL_FILTER = "All";

export function categoryOptions(includeAll = true): string[] {
  return includeAll ? [ALL_FILTER, ...VIDEO_CATEGORIES] : [...VIDEO_CATEGORIES];
}

export function gameOptions(includeAll = true): string[] {
  return includeAll ? [ALL_FILTER, ...GAMES] : [...GAMES];
}
