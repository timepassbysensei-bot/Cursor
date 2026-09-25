import { supabase } from "../lib/supabaseClient";
import type { Broadcast, BroadcastDelivery, Message, SponsorshipLead } from "../types";

const MESSAGE_COLUMNS =
  "id, sender_user_id, sender_name, sender_email, recipient_user_id, message_type, subject, body, is_read, is_archived, read_at, created_at";
const BROADCAST_COLUMNS =
  "id, title, body, audience_type, recipient_user_id, status, created_by, created_at";
const DELIVERY_COLUMNS = "id, broadcast_id, recipient_user_id, status, read_at, created_at";
const LEAD_COLUMNS =
  "id, sender_user_id, name, email, company, website, campaign_objective, preferred_platform, budget, timeline, message, status, is_archived, created_at";

/** Replies from Arian that landed in this client's inbox. */
export async function fetchReceivedMessages(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .eq("recipient_user_id", userId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Message[];
}

/** Messages this client has sent to Arian. */
export async function fetchSentMessages(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .eq("sender_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function markMessageRead(id: string, isRead: boolean): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .update({ is_read: isRead, read_at: isRead ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function sendMessageToArian(input: {
  userId: string;
  fullName: string;
  email: string;
  subject: string;
  body: string;
}): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    message_type: "client",
    sender_user_id: input.userId,
    sender_name: input.fullName,
    sender_email: input.email,
    subject: input.subject,
    body: input.body,
  });
  if (error) throw error;
}

export async function fetchMySponsorshipLeads(userId: string): Promise<SponsorshipLead[]> {
  const { data, error } = await supabase
    .from("sponsorship_leads")
    .select(LEAD_COLUMNS)
    .eq("sender_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SponsorshipLead[];
}

export async function submitClientSponsorshipLead(input: {
  userId: string;
  name: string;
  email: string;
  company: string;
  website: string;
  campaignObjective: string;
  preferredPlatform: string;
  budget: string;
  timeline: string;
  message: string;
}): Promise<void> {
  const { error } = await supabase.from("sponsorship_leads").insert({
    sender_user_id: input.userId,
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

/**
 * The client inbox is one list: direct replies from Arian plus every broadcast
 * addressed to this client. Broadcasts are only visible through a delivery
 * row, which is what the RLS policy checks as well.
 */
export interface InboxItem {
  id: string;
  kind: "message" | "broadcast";
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  deliveryId?: string;
}

export async function fetchMyDeliveries(userId: string): Promise<BroadcastDelivery[]> {
  const { data, error } = await supabase
    .from("broadcast_deliveries")
    .select(DELIVERY_COLUMNS)
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BroadcastDelivery[];
}

export async function fetchClientInbox(userId: string): Promise<InboxItem[]> {
  const [messages, deliveries] = await Promise.all([
    fetchReceivedMessages(userId),
    fetchMyDeliveries(userId),
  ]);

  const broadcastIds = deliveries.map((d) => d.broadcast_id);
  let broadcasts: Broadcast[] = [];
  if (broadcastIds.length > 0) {
    const { data, error } = await supabase
      .from("broadcasts")
      .select(BROADCAST_COLUMNS)
      .in("id", broadcastIds);
    if (error) throw error;
    broadcasts = (data ?? []) as Broadcast[];
  }

  const byId = new Map(broadcasts.map((b) => [b.id, b]));
  const deliveryByBroadcast = new Map(deliveries.map((d) => [d.broadcast_id, d]));

  const items: InboxItem[] = [];

  for (const message of messages) {
    items.push({
      id: message.id,
      kind: "message",
      title: message.subject || "(no subject)",
      body: message.body,
      createdAt: message.created_at,
      isRead: message.is_read,
    });
  }

  for (const [broadcastId, delivery] of deliveryByBroadcast) {
    const broadcast = byId.get(broadcastId);
    if (!broadcast) continue;
    items.push({
      id: broadcast.id,
      kind: "broadcast",
      title: broadcast.title,
      body: broadcast.body,
      createdAt: broadcast.created_at,
      isRead: delivery.status === "read",
      deliveryId: delivery.id,
    });
  }

  return items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function markBroadcastRead(deliveryId: string): Promise<void> {
  const { error } = await supabase
    .from("broadcast_deliveries")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", deliveryId);
  if (error) throw error;
}

export async function markInboxItemRead(item: InboxItem): Promise<void> {
  if (item.kind === "broadcast") {
    if (item.deliveryId) await markBroadcastRead(item.deliveryId);
    return;
  }
  await markMessageRead(item.id, true);
}
