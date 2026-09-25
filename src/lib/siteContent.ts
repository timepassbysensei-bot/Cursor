import type { SiteContent, SiteContentRow, TimelineEntry } from "../types";
import { parseBoolean, parseJson, parseStringList } from "./utils";

/**
 * Every editable string on the public site.
 *
 * The database stores one row per key in `site_content` so Arian can rewrite
 * any of it from Admin → Settings without a deploy. These defaults are
 * placeholders, not claims: nothing here invents a statistic, a sponsorship or
 * a personal detail about Arian.
 */
export const DEFAULT_SITE_CONTENT: SiteContent = {
  brandName: "Arian",
  tagline: "Gaming, stories, lore, and the worlds behind the screen.",
  footerNote:
    "Arian explains the games he loves — the lore, the characters and the worlds behind the screen — in Hindi, for players who want the story, not just the stats.",

  heroEyebrow: "Genshin Impact · Wuthering Waves",
  heroTitle: "Arian",
  heroStatement: "Gaming, stories, lore, and the worlds behind the screen.",
  heroDescription:
    "Hindi-first gaming storytelling: lore broken down scene by scene, character builds that actually work, banner advice before you spend, and beginner guides that assume nothing.",
  heroPrimaryCta: "Watch on YouTube",
  heroSecondaryCta: "Explore the world",

  aboutIntro:
    "Arian makes gaming videos about the parts of a game that are easy to miss — the story behind a character, the reason a region looks the way it does, and what a patch actually changes for the way you play.",
  aboutIdentity:
    "A creator working in Hindi, telling the story of a game the way it deserves to be told: patiently, in order, and without spoiling the moment.",
  aboutGames: ["Genshin Impact", "Wuthering Waves"],
  aboutCategories: [
    "Lore explained",
    "Story explanations",
    "Character builds",
    "Beginner guides",
    "Patch & update breakdowns",
    "Reactions & first impressions",
  ],
  aboutTimeline: [
    {
      year: "The start",
      title: "A channel about the story, not the meta",
      body: "Arian began making videos for players who loved the world of the game but could not follow the story in English fast enough.",
    },
    {
      year: "Genshin Impact",
      title: "Lore, region by region",
      body: "Deep dives into Teyvat — the archon quests, the history that sits behind them and the details most players walk past.",
    },
    {
      year: "Wuthering Waves",
      title: "New world, same patience",
      body: "Guides and story breakdowns for a combat-first game, translating its systems and its lore into plain Hindi.",
    },
    {
      year: "Today",
      title: "Guides, banners and beginnings",
      body: "Character builds, banner advice before you pull, and beginner series that get new players comfortable in the first week.",
    },
  ],
  aboutMessage:
    "Placeholder message — replace this in Admin → Settings. Write a short note to your audience here: what you want them to get from the channel, and where to reach you.",

  featuredMessageActive: true,
  featuredMessageTitle: "A note for everyone watching",
  featuredMessageBody:
    "Placeholder announcement — edit this from the admin studio. Use it for a new series, a schedule change, or a thank-you to the people who show up every week.",

  sponsorHeadline: "Work with Arian",
  sponsorIntro:
    "Brands that fit a gaming-and-storytelling audience are welcome. Share the campaign you have in mind and Arian will reply personally — no agency runaround.",
  sponsorFormats: [
    "Dedicated video",
    "Integrated segment",
    "Shorts campaign",
    "Stream segment",
    "Character / build feature",
  ],
  sponsorDisclosure:
    "Paid collaborations are always disclosed on-screen and in the description, and Arian only features products he would use on the channel himself.",

  contactEmail: "",
  contactResponseTime: "Replies usually within a few days. Sponsorship enquiries get priority.",

  socialYouTube: "https://www.youtube.com/@youknowArian",
  socialInstagram: "",
  socialX: "",
  socialDiscord: "",

  chatbotIntro:
    "I am Arian Assistant. Ask me about Arian, the channel, the games covered here, the site, or working with Arian.",
  chatbotSuggestions: [
    "Which games does Arian cover?",
    "What kind of videos does Arian make?",
    "How do I sponsor Arian?",
    "Are the videos in Hindi?",
  ],
  chatbotDisclaimer:
    "Arian Assistant is AI and can be wrong. For anything official — sponsorships, permissions or a reply from Arian himself — use the contact page.",

  seoTitle: "Arian — Gaming, stories, lore, and the worlds behind the screen",
  seoDescription:
    "Hindi gaming storytelling: Genshin Impact and Wuthering Waves lore explained, character builds, banner advice and beginner guides.",
  ogImageUrl: "",
};

/** content_key ↔ SiteContent field. Anything unmapped is ignored on read. */
const KEY_MAP: Record<keyof SiteContent, string> = {
  brandName: "brand.name",
  tagline: "brand.tagline",
  footerNote: "brand.footer_note",
  heroEyebrow: "hero.eyebrow",
  heroTitle: "hero.title",
  heroStatement: "hero.statement",
  heroDescription: "hero.description",
  heroPrimaryCta: "hero.primary_cta_label",
  heroSecondaryCta: "hero.secondary_cta_label",
  aboutIntro: "about.intro",
  aboutIdentity: "about.identity",
  aboutGames: "about.games",
  aboutCategories: "about.categories",
  aboutTimeline: "about.timeline",
  aboutMessage: "about.message",
  featuredMessageActive: "featured_message.active",
  featuredMessageTitle: "featured_message.title",
  featuredMessageBody: "featured_message.body",
  sponsorHeadline: "sponsor.headline",
  sponsorIntro: "sponsor.intro",
  sponsorFormats: "sponsor.formats",
  sponsorDisclosure: "sponsor.disclosure",
  contactEmail: "contact.email",
  contactResponseTime: "contact.response_time",
  socialYouTube: "social.youtube",
  socialInstagram: "social.instagram",
  socialX: "social.x",
  socialDiscord: "social.discord",
  chatbotIntro: "chatbot.intro",
  chatbotSuggestions: "chatbot.suggestions",
  chatbotDisclaimer: "chatbot.disclaimer",
  seoTitle: "seo.default_title",
  seoDescription: "seo.default_description",
  ogImageUrl: "seo.og_image_url",
};

const LIST_FIELDS: (keyof SiteContent)[] = ["aboutGames", "aboutCategories", "sponsorFormats", "chatbotSuggestions"];
const BOOLEAN_FIELDS: (keyof SiteContent)[] = ["featuredMessageActive"];

/** Fields the settings form edits as a textarea of JSON or one-per-line text. */
export const TIMELINE_FIELD: keyof SiteContent = "aboutTimeline";

export function contentKeyFor(field: keyof SiteContent): string {
  return KEY_MAP[field];
}

export function siteContentKeys(): { key: string; field: keyof SiteContent }[] {
  return (Object.keys(KEY_MAP) as (keyof SiteContent)[]).map((field) => ({
    field,
    key: KEY_MAP[field],
  }));
}

function rowValue(key: string, rows: Map<string, string>): string | null {
  return rows.has(key) ? (rows.get(key) ?? "") : null;
}

/** Merges `site_content` rows over the defaults; empty rows never blank a page. */
export function mergeSiteContent(rows: SiteContentRow[] | null | undefined): SiteContent {
  const map = new Map<string, string>();
  for (const row of rows ?? []) map.set(row.content_key, row.content_value);

  const merged: SiteContent = { ...DEFAULT_SITE_CONTENT };
  for (const field of Object.keys(KEY_MAP) as (keyof SiteContent)[]) {
    const value = rowValue(KEY_MAP[field], map);
    if (value === null || value === "") continue;

    if (LIST_FIELDS.includes(field)) {
      (merged as unknown as Record<string, unknown>)[field] = parseStringList(
        value,
        DEFAULT_SITE_CONTENT[field] as unknown as string[]
      );
      continue;
    }
    if (BOOLEAN_FIELDS.includes(field)) {
      (merged as unknown as Record<string, unknown>)[field] = parseBoolean(value, false);
      continue;
    }
    if (field === TIMELINE_FIELD) {
      (merged as unknown as Record<string, unknown>)[field] = parseJson<TimelineEntry[]>(
        value,
        DEFAULT_SITE_CONTENT.aboutTimeline
      );
      continue;
    }
    (merged as unknown as Record<string, unknown>)[field] = value;
  }
  return merged;
}

/** Turns the typed object back into rows for an upsert. */
export function siteContentRows(content: SiteContent): { content_key: string; content_value: string }[] {
  return (Object.keys(KEY_MAP) as (keyof SiteContent)[]).map((field) => {
    const value = content[field];
    const serialized = Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : String(value);
    return { content_key: KEY_MAP[field], content_value: serialized };
  });
}
