-- ===========================================================================
-- Arian — Row Level Security
--
-- Rules implemented here (see README "Security model" for the plain-English
-- version):
--   * browsing the public site needs no account at all;
--   * visitors may insert contact messages and sponsorship inquiries;
--   * clients read only their own profile, inbox and sent messages;
--   * suspended and banned clients lose access to client data;
--   * admins manage everything, and admin status is verified in the database,
--     never from a value the browser sent.
-- ===========================================================================

alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.gallery_items enable row level security;
alter table public.audio_tracks enable row level security;
alter table public.messages enable row level security;
alter table public.broadcasts enable row level security;
alter table public.broadcast_deliveries enable row level security;
alter table public.sponsorship_leads enable row level security;
alter table public.site_content enable row level security;
alter table public.chat_knowledge enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_admin_manage on public.profiles;
create policy profiles_admin_manage on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- videos — public reads published rows only.
-- ---------------------------------------------------------------------------
drop policy if exists videos_public_read on public.videos;
create policy videos_public_read on public.videos
  for select using (is_published);

drop policy if exists videos_admin_manage on public.videos;
create policy videos_admin_manage on public.videos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- gallery_items
-- ---------------------------------------------------------------------------
drop policy if exists gallery_public_read on public.gallery_items;
create policy gallery_public_read on public.gallery_items
  for select using (is_published);

drop policy if exists gallery_admin_manage on public.gallery_items;
create policy gallery_admin_manage on public.gallery_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- audio_tracks — the public player only ever sees the active track.
-- ---------------------------------------------------------------------------
drop policy if exists audio_public_read on public.audio_tracks;
create policy audio_public_read on public.audio_tracks
  for select using (is_active);

drop policy if exists audio_admin_manage on public.audio_tracks;
create policy audio_admin_manage on public.audio_tracks
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------

-- It's Arian's inbox: admins see every message.
drop policy if exists messages_admin_manage on public.messages;
create policy messages_admin_manage on public.messages
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Anonymous visitors may insert a contact message. They cannot choose a
-- recipient, cannot impersonate a signed-in user and cannot use the
-- client/admin message types.
drop policy if exists messages_public_insert on public.messages;
create policy messages_public_insert on public.messages
  for insert to anon, authenticated
  with check (
    message_type = 'contact'
    and sender_user_id is null
    and recipient_user_id is null
  );

-- Approved clients may write to Arian.
drop policy if exists messages_client_insert on public.messages;
create policy messages_client_insert on public.messages
  for insert to authenticated
  with check (
    message_type = 'client'
    and sender_user_id = auth.uid()
    and recipient_user_id is null
    and public.is_client_beta_allowed()
  );

-- Clients read only what they sent or received, and only while their account
-- is in good standing.
drop policy if exists messages_client_read on public.messages;
create policy messages_client_read on public.messages
  for select to authenticated
  using (
    public.is_signed_in_in_good_standing()
    and (sender_user_id = auth.uid() or recipient_user_id = auth.uid())
  );

-- Clients may only mark their own received messages as read/archived.
drop policy if exists messages_client_update on public.messages;
create policy messages_client_update on public.messages
  for update to authenticated
  using (recipient_user_id = auth.uid() and public.is_client_beta_allowed())
  with check (recipient_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- broadcasts
-- ---------------------------------------------------------------------------
drop policy if exists broadcasts_admin_manage on public.broadcasts;
create policy broadcasts_admin_manage on public.broadcasts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists broadcasts_public_read on public.broadcasts;
create policy broadcasts_public_read on public.broadcasts
  for select
  using (audience_type = 'public_announcement' and status = 'sent');

drop policy if exists broadcasts_client_read on public.broadcasts;
create policy broadcasts_client_read on public.broadcasts
  for select to authenticated
  using (
    public.is_client_beta_allowed()
    and (
      recipient_user_id = auth.uid()
      or exists (
        select 1 from public.broadcast_deliveries d
        where d.broadcast_id = public.broadcasts.id
          and d.recipient_user_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- broadcast_deliveries
-- ---------------------------------------------------------------------------
drop policy if exists broadcast_deliveries_admin_manage on public.broadcast_deliveries;
create policy broadcast_deliveries_admin_manage on public.broadcast_deliveries
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists broadcast_deliveries_recipient_read on public.broadcast_deliveries;
create policy broadcast_deliveries_recipient_read on public.broadcast_deliveries
  for select to authenticated
  using (recipient_user_id = auth.uid() and public.is_signed_in_in_good_standing());

drop policy if exists broadcast_deliveries_recipient_update on public.broadcast_deliveries;
create policy broadcast_deliveries_recipient_update on public.broadcast_deliveries
  for update to authenticated
  using (recipient_user_id = auth.uid() and public.is_client_beta_allowed())
  with check (recipient_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- sponsorship_leads — visitors and clients may submit; only admins triage.
-- ---------------------------------------------------------------------------
drop policy if exists sponsorship_public_insert on public.sponsorship_leads;
create policy sponsorship_public_insert on public.sponsorship_leads
  for insert to anon, authenticated
  with check (sender_user_id is null or sender_user_id = auth.uid());

drop policy if exists sponsorship_own_read on public.sponsorship_leads;
create policy sponsorship_own_read on public.sponsorship_leads
  for select to authenticated
  using (sender_user_id = auth.uid() and public.is_signed_in_in_good_standing());

drop policy if exists sponsorship_admin_manage on public.sponsorship_leads;
create policy sponsorship_admin_manage on public.sponsorship_leads
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- site_content — public read (it is the website copy), admin write.
-- ---------------------------------------------------------------------------
drop policy if exists site_content_public_read on public.site_content;
create policy site_content_public_read on public.site_content
  for select using (true);

drop policy if exists site_content_admin_manage on public.site_content;
create policy site_content_admin_manage on public.site_content
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- chat_knowledge — never readable from a browser. The Netlify function reads
-- it with the service role; admins edit it from the studio.
-- ---------------------------------------------------------------------------
drop policy if exists chat_knowledge_admin_manage on public.chat_knowledge;
create policy chat_knowledge_admin_manage on public.chat_knowledge
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_logs — append-only for admins.
-- ---------------------------------------------------------------------------
drop policy if exists audit_logs_admin_read on public.audit_logs;
create policy audit_logs_admin_read on public.audit_logs
  for select to authenticated
  using (public.is_admin());

drop policy if exists audit_logs_admin_insert on public.audit_logs;
create policy audit_logs_admin_insert on public.audit_logs
  for insert to authenticated
  with check (public.is_admin() and admin_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage policies
-- ---------------------------------------------------------------------------

-- Anyone may read gallery, audio and avatar objects (they are linked directly
-- from public pages and the CDN).
drop policy if exists site_media_public_read on storage.objects;
create policy site_media_public_read on storage.objects
  for select
  using (bucket_id in ('gallery', 'audio', 'avatars'));

-- Only verified admins may upload, replace or remove site media.
drop policy if exists site_media_admin_write on storage.objects;
create policy site_media_admin_write on storage.objects
  for all to authenticated
  using (bucket_id in ('gallery', 'audio', 'avatars') and public.is_admin())
  with check (bucket_id in ('gallery', 'audio', 'avatars') and public.is_admin());

-- A client may manage only their own avatar, and only inside their own folder.
drop policy if exists avatars_client_write on storage.objects;
create policy avatars_client_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_client_update on storage.objects;
create policy avatars_client_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
