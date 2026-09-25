import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { siteContentRows } from "../lib/siteContent";
import type {
  AppRole,
  AuditLogRow,
  AudioTrack,
  Broadcast,
  BroadcastAudience,
  BroadcastDelivery,
  ChatKnowledgeRow,
  ClientStatus,
  GalleryItem,
  Message,
  Profile,
  SiteContent,
  SponsorStatus,
  SponsorshipLead,
  Video,
} from "../types";

const PROFILE_COLUMNS =
  "id, email, full_name, role, status, avatar_url, bio, last_seen_at, created_at, updated_at";
const VIDEO_COLUMNS =
  "id, youtube_url, youtube_id, title, description, thumbnail_url, game, category, duration_text, published_at, sort_order, is_featured, is_published, created_at, updated_at";
const GALLERY_COLUMNS =
  "id, storage_path, public_url, title, caption, alt_text, category, width, height, sort_order, is_published, created_at, updated_at";
const AUDIO_COLUMNS = "id, storage_path, public_url, title, artist, file_size_bytes, is_active, created_at";
const MESSAGE_COLUMNS =
  "id, sender_user_id, sender_name, sender_email, recipient_user_id, message_type, subject, body, is_read, is_archived, read_at, created_at";
const BROADCAST_COLUMNS =
  "id, title, body, audience_type, recipient_user_id, status, created_by, created_at";
const DELIVERY_COLUMNS = "id, broadcast_id, recipient_user_id, status, read_at, created_at";
const LEAD_COLUMNS =
  "id, sender_user_id, name, email, company, website, campaign_objective, preferred_platform, budget, timeline, message, status, is_archived, created_at";

export interface AdminOverview {
  totalClients: number;
  pendingClients: number;
  activeClients: number;
  bannedClients: number;
  unreadMessages: number;
  galleryCount: number;
  videoCount: number;
  activeTrack: AudioTrack | null;
  recentLeads: SponsorshipLead[];
}

/** Records an admin action so the studio has an audit trail. */
export async function logAdminAction(input: {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("audit_logs").insert({
    admin_user_id: input.adminUserId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    details: input.details ?? null,
  });
  if (error) console.warn("Could not write audit log", error.message);
}

export const adminService = {
  /**
   * Every figure on the overview is a real count from Postgres. `head: true`
   * asks PostgREST for the count header only, so no rows travel to the browser.
   */
  async overview(): Promise<AdminOverview> {
    const [
      totalRes,
      pendingRes,
      activeRes,
      bannedRes,
      unreadRes,
      galleryRes,
      videoRes,
      activeTrack,
      recentLeads,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "client")
        .eq("status", "pending"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "client")
        .eq("status", "active"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "client")
        .eq("status", "banned"),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
        .eq("is_archived", false),
      supabase.from("gallery_items").select("id", { count: "exact", head: true }),
      supabase.from("videos").select("id", { count: "exact", head: true }),
      this.activeAudioTrack(),
      this.sponsorshipLeads("new"),
    ]);

    const firstError = [totalRes, pendingRes, activeRes, bannedRes, unreadRes, galleryRes, videoRes].find(
      (result) => result.error
    )?.error;
    if (firstError) throw firstError;

    return {
      totalClients: totalRes.count ?? 0,
      pendingClients: pendingRes.count ?? 0,
      activeClients: activeRes.count ?? 0,
      bannedClients: bannedRes.count ?? 0,
      unreadMessages: unreadRes.count ?? 0,
      galleryCount: galleryRes.count ?? 0,
      videoCount: videoRes.count ?? 0,
      activeTrack,
      recentLeads: recentLeads.slice(0, 5),
    };
  },

  // ---------------------------------------------------------------- videos
  async videos(): Promise<Video[]> {
    const { data, error } = await supabase
      .from("videos")
      .select(VIDEO_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Video[];
  },
  async upsertVideo(payload: Partial<Video> & { id?: string }): Promise<Video> {
    const { data, error } = await supabase.from("videos").upsert(payload).select(VIDEO_COLUMNS).single();
    if (error) throw error;
    return data as Video;
  },
  async reorderVideos(ordered: { id: string; sort_order: number }[]): Promise<void> {
    await Promise.all(
      ordered.map(({ id, sort_order }) => supabase.from("videos").update({ sort_order }).eq("id", id))
    );
  },
  async deleteVideo(id: string): Promise<void> {
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) throw error;
  },
  async setFeaturedBatch(id: string, featured: boolean): Promise<void> {
    if (featured) {
      // Only one featured video at a time, so the homepage hero stays stable.
      const { error: clearError } = await supabase
        .from("videos")
        .update({ is_featured: false })
        .eq("is_featured", true)
        .neq("id", id);
      if (clearError) throw clearError;
    }
    const { error } = await supabase.from("videos").update({ is_featured: featured }).eq("id", id);
    if (error) throw error;
  },

  // --------------------------------------------------------------- gallery
  async gallery(): Promise<GalleryItem[]> {
    const { data, error } = await supabase
      .from("gallery_items")
      .select(GALLERY_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as GalleryItem[];
  },
  async insertGalleryItem(payload: {
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
  }): Promise<GalleryItem> {
    const { data, error } = await supabase
      .from("gallery_items")
      .insert(payload)
      .select(GALLERY_COLUMNS)
      .single();
    if (error) throw error;
    return data as GalleryItem;
  },
  async updateGalleryItem(id: string, payload: Partial<GalleryItem>): Promise<void> {
    const { error } = await supabase.from("gallery_items").update(payload).eq("id", id);
    if (error) throw error;
  },
  async reorderGallery(ordered: { id: string; sort_order: number }[]): Promise<void> {
    await Promise.all(
      ordered.map(({ id, sort_order }) => supabase.from("gallery_items").update({ sort_order }).eq("id", id))
    );
  },
  async deleteGalleryItem(id: string): Promise<void> {
    const { error } = await supabase.from("gallery_items").delete().eq("id", id);
    if (error) throw error;
  },

  // ----------------------------------------------------------------- audio
  async audioTracks(): Promise<AudioTrack[]> {
    const { data, error } = await supabase
      .from("audio_tracks")
      .select(AUDIO_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AudioTrack[];
  },
  async activeAudioTrack(): Promise<AudioTrack | null> {
    const { data, error } = await supabase
      .from("audio_tracks")
      .select(AUDIO_COLUMNS)
      .eq("is_active", true)
      .maybeSingle<AudioTrack>();
    if (error) throw error;
    return data ?? null;
  },
  async insertAudioTrack(payload: {
    storage_path: string;
    public_url: string;
    title: string;
    artist: string | null;
    file_size_bytes: number | null;
  }): Promise<AudioTrack> {
    const { data, error } = await supabase
      .from("audio_tracks")
      .insert({ ...payload, is_active: false })
      .select(AUDIO_COLUMNS)
      .single();
    if (error) throw error;
    return data as AudioTrack;
  },
  /** Deactivates everything else first: the DB has a partial unique index. */
  async setActiveTrack(id: string): Promise<void> {
    const { error: clearError } = await supabase
      .from("audio_tracks")
      .update({ is_active: false })
      .eq("is_active", true)
      .neq("id", id);
    if (clearError) throw clearError;
    const { error } = await supabase.from("audio_tracks").update({ is_active: true }).eq("id", id);
    if (error) throw error;
  },
  async clearActiveTrack(): Promise<void> {
    const { error } = await supabase.from("audio_tracks").update({ is_active: false }).eq("is_active", true);
    if (error) throw error;
  },
  async deleteAudioTrack(id: string): Promise<void> {
    const { error } = await supabase.from("audio_tracks").delete().eq("id", id);
    if (error) throw error;
  },

  // --------------------------------------------------------------- clients
  async clients(): Promise<(Profile & { message_count?: number })[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("role", "client")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Profile[];
  },
  /** Message counts per client, so the table can show real activity. */
  async messageCounts(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from("messages")
      .select("sender_user_id")
      .eq("message_type", "client");
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { sender_user_id: string | null }[]) {
      if (!row.sender_user_id) continue;
      counts[row.sender_user_id] = (counts[row.sender_user_id] ?? 0) + 1;
    }
    return counts;
  },
  async updateClientAccess(id: string, status: ClientStatus): Promise<void> {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) throw error;
  },
  async promoteToAdmin(id: string): Promise<void> {
    const { error } = await supabase.from("profiles").update({ role: "admin" as AppRole }).eq("id", id);
    if (error) throw error;
  },

  // -------------------------------------------------------------- messages
  async messages(): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select(MESSAGE_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Message[];
  },
  async setMessageFlags(id: string, flags: { is_read?: boolean; is_archived?: boolean }): Promise<void> {
    const payload: Record<string, unknown> = { ...flags };
    if (flags.is_read !== undefined) {
      payload.read_at = flags.is_read ? new Date().toISOString() : null;
    }
    const { error } = await supabase.from("messages").update(payload).eq("id", id);
    if (error) throw error;
  },
  async deleteMessage(id: string): Promise<void> {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) throw error;
  },
  async replyToMessage(input: {
    adminUserId: string;
    recipientUserId: string | null;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    body: string;
  }): Promise<void> {
    // With no recipient account there is nowhere to store an in-app reply, so
    // the studio says so instead of pretending an email went out.
    const { error } = await supabase.from("messages").insert({
      message_type: "admin_reply",
      sender_user_id: input.adminUserId,
      sender_name: "Arian",
      sender_email: input.recipientEmail,
      recipient_user_id: input.recipientUserId,
      subject: input.subject,
      body: input.body,
    });
    if (error) throw error;
  },

  // ------------------------------------------------------------ broadcasts
  async broadcasts(): Promise<Broadcast[]> {
    const { data, error } = await supabase
      .from("broadcasts")
      .select(BROADCAST_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Broadcast[];
  },
  async deliveries(): Promise<BroadcastDelivery[]> {
    const { data, error } = await supabase
      .from("broadcast_deliveries")
      .select(DELIVERY_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as BroadcastDelivery[];
  },
  /**
   * Stores the broadcast and one delivery row per recipient. In-app delivery
   * only: nothing here claims an email was sent.
   */
  async createBroadcast(input: {
    title: string;
    body: string;
    audienceType: BroadcastAudience;
    recipientUserIds: string[];
    createdBy: string;
    status?: "sent" | "draft";
  }): Promise<Broadcast> {
    const { data, error } = await supabase
      .from("broadcasts")
      .insert({
        title: input.title,
        body: input.body,
        audience_type: input.audienceType,
        recipient_user_id: input.audienceType === "single_client" ? (input.recipientUserIds[0] ?? null) : null,
        status: input.status ?? "sent",
        created_by: input.createdBy,
      })
      .select(BROADCAST_COLUMNS)
      .single();
    if (error) throw error;

    const broadcast = data as Broadcast;
    if (broadcast.status === "sent" && input.recipientUserIds.length > 0) {
      const rows = input.recipientUserIds.map((recipientId) => ({
        broadcast_id: broadcast.id,
        recipient_user_id: recipientId,
        status: "delivered" as const,
      }));
      const { error: deliveryError } = await supabase
        .from("broadcast_deliveries")
        .upsert(rows, { onConflict: "broadcast_id,recipient_user_id" });
      if (deliveryError) throw deliveryError;
    }
    return broadcast;
  },
  async deleteBroadcast(id: string): Promise<void> {
    const { error } = await supabase.from("broadcasts").delete().eq("id", id);
    if (error) throw error;
  },

  // ------------------------------------------------------- sponsorship leads
  async sponsorshipLeads(status?: SponsorStatus): Promise<SponsorshipLead[]> {
    let query = supabase
      .from("sponsorship_leads")
      .select(LEAD_COLUMNS)
      .order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as SponsorshipLead[];
  },
  async updateLeadStatus(id: string, status: SponsorStatus): Promise<void> {
    const { error } = await supabase.from("sponsorship_leads").update({ status }).eq("id", id);
    if (error) throw error;
  },
  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase.from("sponsorship_leads").delete().eq("id", id);
    if (error) throw error;
  },

  // ---------------------------------------------------------- site content
  async saveSiteContent(content: SiteContent, updatedBy: string): Promise<void> {
    const rows = siteContentRows(content).map((row) => ({ ...row, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from("site_content").upsert(rows, { onConflict: "content_key" });
    if (error) throw error;
    await logAdminAction({
      adminUserId: updatedBy,
      action: "site_content.updated",
      entityType: "site_content",
      details: { keys: rows.length },
    });
  },

  // -------------------------------------------------------- chat knowledge
  async chatKnowledge(): Promise<ChatKnowledgeRow[]> {
    const { data, error } = await supabase
      .from("chat_knowledge")
      .select("id, title, content, is_active, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ChatKnowledgeRow[];
  },
  async upsertChatKnowledge(payload: Partial<ChatKnowledgeRow> & { title: string; content: string }) {
    const { data, error } = await supabase
      .from("chat_knowledge")
      .upsert(payload)
      .select("id, title, content, is_active, updated_at")
      .single();
    if (error) throw error;
    return data as ChatKnowledgeRow;
  },
  async deleteChatKnowledge(id: string): Promise<void> {
    const { error } = await supabase.from("chat_knowledge").delete().eq("id", id);
    if (error) throw error;
  },

  // ------------------------------------------------------------ audit logs
  async auditLogs(): Promise<AuditLogRow[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, admin_user_id, action, entity_type, entity_id, details, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as AuditLogRow[];
  },
};
