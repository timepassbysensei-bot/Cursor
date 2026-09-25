import type { GalleryItem, Video } from "../types";
import { placeholderArt, placeholderSquare } from "./placeholderArt";

/**
 * Demo mode content.
 *
 * Shown only while the deployment has no Supabase credentials, so the layout
 * can be reviewed before the database exists. Every item is visibly sample
 * content — there are no real thumbnail URLs, no fake subscriber numbers and
 * no photographs presented as Arian.
 */

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

interface SampleVideo {
  title: string;
  game: string;
  category: string;
  duration: string;
  days: number;
  featured?: boolean;
}

const SAMPLE_VIDEOS: SampleVideo[] = [
  {
    title: "Genshin Impact lore — the story behind the Archon War, explained in Hindi",
    game: "Genshin Impact",
    category: "Lore",
    duration: "18:42",
    days: 2,
    featured: true,
  },
  {
    title: "Wuthering Waves beginner guide — your first week, step by step",
    game: "Wuthering Waves",
    category: "Guide",
    duration: "22:10",
    days: 6,
  },
  {
    title: "How to actually build a DPS character (without wasting resources)",
    game: "Genshin Impact",
    category: "Build",
    duration: "14:05",
    days: 11,
  },
  {
    title: "Banner advice — pull or skip? Everything worth knowing first",
    game: "Genshin Impact",
    category: "Banner",
    duration: "9:58",
    days: 15,
  },
  {
    title: "New patch breakdown — what really changed for how you play",
    game: "Wuthering Waves",
    category: "Update",
    duration: "16:24",
    days: 21,
  },
  {
    title: "The story moment almost everyone walks past",
    game: "Wuthering Waves",
    category: "Story",
    duration: "12:37",
    days: 28,
  },
  {
    title: "Genshin lore in 60 seconds",
    game: "Genshin Impact",
    category: "Shorts",
    duration: "0:58",
    days: 33,
  },
  {
    title: "First reaction to the new region reveal",
    game: "Genshin Impact",
    category: "Reaction",
    duration: "11:03",
    days: 40,
  },
];

export const DEMO_VIDEOS: Video[] = SAMPLE_VIDEOS.map((sample, index) => ({
  id: `demo-video-${index + 1}`,
  youtube_url: "",
  youtube_id: "",
  title: sample.title,
  description:
    "Sample entry — add your real YouTube link in the admin studio and this is replaced instantly.",
  thumbnail_url: placeholderArt(`video-${index}`, 1280, 720),
  game: sample.game,
  category: sample.category,
  duration_text: sample.duration,
  published_at: daysAgo(sample.days),
  sort_order: index,
  is_featured: Boolean(sample.featured),
  is_published: true,
  created_at: daysAgo(sample.days),
  updated_at: daysAgo(sample.days),
}));

const SAMPLE_GALLERY: { title: string; category: string; ratio: "wide" | "square" | "tall" }[] = [
  { title: "Sample gallery tile", category: "Genshin Impact", ratio: "tall" },
  { title: "Sample gallery tile", category: "Wuthering Waves", ratio: "square" },
  { title: "Sample gallery tile", category: "Character art", ratio: "wide" },
  { title: "Sample gallery tile", category: "Screenshots", ratio: "square" },
  { title: "Sample gallery tile", category: "Genshin Impact", ratio: "square" },
  { title: "Sample gallery tile", category: "Behind the scenes", ratio: "tall" },
  { title: "Sample gallery tile", category: "Wuthering Waves", ratio: "wide" },
  { title: "Sample gallery tile", category: "Character art", ratio: "square" },
  { title: "Sample gallery tile", category: "Screenshots", ratio: "square" },
];

const RATIO_DIMENSIONS: Record<"wide" | "square" | "tall", [number, number]> = {
  wide: [1400, 900],
  square: [1000, 1000],
  tall: [900, 1300],
};

export const DEMO_GALLERY: GalleryItem[] = SAMPLE_GALLERY.map((sample, index) => {
  const [width, height] = RATIO_DIMENSIONS[sample.ratio];
  const seed = `gallery-${index}`;
  return {
    id: `demo-gallery-${index + 1}`,
    storage_path: "",
    public_url: sample.ratio === "square" ? placeholderSquare(seed, width) : placeholderArt(seed, width, height),
    title: sample.title,
    caption: "Upload your own image in the admin studio to replace this tile.",
    alt_text:
      "Generated placeholder artwork standing in for a gallery image until Arian uploads his own.",
    category: sample.category,
    width,
    height,
    sort_order: index,
    is_published: true,
    created_at: daysAgo(index + 1),
    updated_at: daysAgo(index + 1),
  };
});
