export type AppRole = "visitor" | "client" | "admin";

/**
 * Access level on a client account. `pending` can sign in but sees an
 * approval notice; `active` has full access; `suspended` and `banned` are
 * blocked from client data by RLS as well as by the route guards.
 */
export type ClientStatus = "pending" | "active" | "suspended" | "banned";

export type MessageType = "contact" | "sponsorship" | "client" | "admin_reply";

export type BroadcastAudience = "single_client" | "all_clients" | "public_announcement";

export type BroadcastStatus = "draft" | "sent";

export type DeliveryStatus = "delivered" | "read";

export type SponsorStatus =
  | "new"
  | "reviewing"
  | "in_talks"
  | "won"
  | "declined"
  | "spam";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  role: AppRole;
  status: ClientStatus;
  avatar_url: string | null;
  bio: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  youtube_url: string;
  youtube_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  game: string | null;
  category: string | null;
  duration_text: string | null;
  published_at: string;
  sort_order: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: string;
  storage_path: string;
  public_url: string;
  title: string;
  caption: string | null;
  alt_text: string;
  category: string | null;
  width: number | null;
  height: number | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AudioTrack {
  id: string;
  storage_path: string;
  public_url: string;
  title: string;
  artist: string | null;
  file_size_bytes: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  sender_user_id: string | null;
  sender_name: string;
  sender_email: string;
  recipient_user_id: string | null;
  message_type: MessageType;
  subject: string;
  body: string;
  is_read: boolean;
  is_archived: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  audience_type: BroadcastAudience;
  recipient_user_id: string | null;
  status: BroadcastStatus;
  created_by: string | null;
  created_at: string;
}

export interface BroadcastDelivery {
  id: string;
  broadcast_id: string;
  recipient_user_id: string;
  status: DeliveryStatus;
  read_at: string | null;
  created_at: string;
}

export interface SponsorshipLead {
  id: string;
  sender_user_id: string | null;
  name: string;
  email: string;
  company: string | null;
  website: string | null;
  campaign_objective: string | null;
  preferred_platform: string | null;
  budget: string | null;
  timeline: string | null;
  message: string | null;
  status: SponsorStatus;
  is_archived: boolean;
  created_at: string;
}

export interface SiteContentRow {
  id: string;
  content_key: string;
  content_value: string;
  updated_at: string;
}

export interface ChatKnowledgeRow {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  updated_at: string;
}

export interface AuditLogRow {
  id: string;
  admin_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface TimelineEntry {
  year: string;
  title: string;
  body: string;
}

/**
 * The typed view of `site_content`. Every field is editable from
 * Admin → Settings, and every default is a placeholder rather than a claim
 * about Arian.
 */
export interface SiteContent {
  brandName: string;
  tagline: string;
  footerNote: string;
  heroEyebrow: string;
  heroTitle: string;
  heroStatement: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  aboutIntro: string;
  aboutIdentity: string;
  aboutGames: string[];
  aboutCategories: string[];
  aboutTimeline: TimelineEntry[];
  aboutMessage: string;
  featuredMessageActive: boolean;
  featuredMessageTitle: string;
  featuredMessageBody: string;
  sponsorHeadline: string;
  sponsorIntro: string;
  sponsorFormats: string[];
  sponsorDisclosure: string;
  contactEmail: string;
  contactResponseTime: string;
  socialYouTube: string;
  socialInstagram: string;
  socialX: string;
  socialDiscord: string;
  chatbotIntro: string;
  chatbotSuggestions: string[];
  chatbotDisclaimer: string;
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
}
