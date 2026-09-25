-- ===========================================================================
-- Site media — admin-controlled background visuals (hero video, Genshin and
-- Wuthering Waves mood images, section backdrops).
--
-- One row per uploaded file; exactly one row per slot is `active`, enforced by
-- a partial unique index (the same pattern as audio_tracks). Run after the
-- two 2025-06-01 migrations. Idempotent.
-- ===========================================================================

create table if not exists public.site_media (
  id uuid primary key default gen_random_uuid(),
  slot text not null check (slot in ('hero_video', 'genshin', 'wuthering', 'section')),
  media_kind text not null check (media_kind in ('video', 'image')),
  storage_path text not null,
  public_url text not null,
  poster_path text,
  poster_url text,
  title text not null default '',
  alt_text text not null default '',
  file_size_bytes bigint,
  mime_type text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists site_media_slot_active_idx
  on public.site_media (slot, is_active);

-- At most one active visual per slot; activating a new row is done in SQL by
-- the service (deactivate-then-activate in one transaction-like sequence).
create unique index if not exists site_media_single_active_per_slot_idx
  on public.site_media (slot)
  where is_active;

alter table public.site_media enable row level security;

drop policy if exists "site_media_public_read" on public.site_media;
create policy "site_media_public_read"
  on public.site_media
  for select
  using (true);

drop policy if exists "site_media_admin_manage" on public.site_media;
create policy "site_media_admin_manage"
  on public.site_media
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: a dedicated `media` bucket, public-read, admin-write.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read"
  on storage.objects
  for select
  using (bucket_id = 'media');

drop policy if exists "media_admin_write" on storage.objects;
create policy "media_admin_write"
  on storage.objects
  for insert
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update"
  on storage.objects
  for update
  using (bucket_id = 'media' and public.is_admin());

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete"
  on storage.objects
  for delete
  using (bucket_id = 'media' and public.is_admin());
