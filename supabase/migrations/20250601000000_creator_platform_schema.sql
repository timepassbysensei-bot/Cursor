-- ===========================================================================
-- Arian — creator platform schema
--
-- Run order: this file, then 20250601000100_creator_platform_rls.sql, then
-- supabase/seed.sql. Every statement is idempotent so the migration can be
-- re-run safely.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enum-ish domains are enforced with CHECK constraints so the migration stays
-- plain SQL (no enum types to migrate later).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- profiles — one row per authenticated user. Visitors never get a row; the
-- public site is readable without an account.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  role text not null default 'client' check (role in ('visitor', 'client', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'banned')),
  avatar_url text,
  bio text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Client and admin accounts. Status drives dashboard access: pending sees an approval notice, active has full access, suspended and banned are blocked.';

-- ---------------------------------------------------------------------------
-- videos — YouTube links pasted by Arian; the URL is the source of truth.
-- ---------------------------------------------------------------------------
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  youtube_url text not null,
  youtube_id text not null,
  title text not null,
  description text,
  thumbnail_url text,
  game text,
  category text,
  duration_text text,
  published_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- gallery_items — uploaded artwork / screenshots in the `gallery` bucket.
-- ---------------------------------------------------------------------------
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  public_url text not null,
  title text not null default '',
  caption text,
  alt_text text not null default '',
  category text,
  width integer,
  height integer,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- audio_tracks — optional background music. Only one row is active at a time,
-- enforced by a partial unique index below.
-- ---------------------------------------------------------------------------
create table if not exists public.audio_tracks (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  public_url text not null,
  title text not null default '',
  artist text,
  file_size_bytes bigint,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Only one active track: a partial unique index makes that a database rule
-- rather than something the UI has to remember.
create unique index if not exists audio_tracks_single_active_idx
  on public.audio_tracks (is_active)
  where is_active;

-- ---------------------------------------------------------------------------
-- messages — the single inbox: public contact form, sponsorship inquiries,
-- client → Arian messages and Arian → client replies.
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid references public.profiles(id) on delete set null,
  sender_name text not null default '',
  sender_email text not null default '',
  recipient_user_id uuid references public.profiles(id) on delete cascade,
  message_type text not null default 'contact'
    check (message_type in ('contact', 'sponsorship', 'client', 'admin_reply')),
  subject text not null default '',
  body text not null default '',
  is_read boolean not null default false,
  is_archived boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- broadcasts — Arian writing out to one client, every active client, or the
-- public announcement bar.
-- ---------------------------------------------------------------------------
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  audience_type text not null default 'all_clients'
    check (audience_type in ('single_client', 'all_clients', 'public_announcement')),
  recipient_user_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'sent' check (status in ('draft', 'sent')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Per-recipient delivery record so the admin can see who actually received a
-- broadcast. Without a configured email provider this reflects "stored in the
-- website inbox", not email delivery.
create table if not exists public.broadcast_deliveries (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references public.broadcasts(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'delivered' check (status in ('delivered', 'read')),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (broadcast_id, recipient_user_id)
);

-- ---------------------------------------------------------------------------
-- sponsorship_leads — the public /sponsor form and the client dashboard form.
-- ---------------------------------------------------------------------------
create table if not exists public.sponsorship_leads (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid references public.profiles(id) on delete set null,
  name text not null default '',
  email text not null default '',
  company text,
  website text,
  campaign_objective text,
  preferred_platform text,
  budget text,
  timeline text,
  message text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'in_talks', 'won', 'declined', 'spam')),
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- site_content — every editable string on the public site, keyed by name.
-- ---------------------------------------------------------------------------
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  content_key text not null unique,
  content_value text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- chat_knowledge — Arian's approved answers for "Arian Assistant". Read only
-- by the serverless function (service role), never by the browser.
-- ---------------------------------------------------------------------------
create table if not exists public.chat_knowledge (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content text not null default '',
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- audit_logs — who changed what, for the admin studio.
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.profiles(id) on delete set null,
  action text not null default '',
  entity_type text not null default '',
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists profiles_role_status_idx on public.profiles (role, status);
create index if not exists videos_published_idx on public.videos (is_published, sort_order);
create index if not exists videos_game_idx on public.videos (game);
create index if not exists videos_category_idx on public.videos (category);
create index if not exists gallery_items_published_idx on public.gallery_items (is_published, sort_order);
create index if not exists gallery_items_category_idx on public.gallery_items (category);
create index if not exists messages_recipient_idx on public.messages (recipient_user_id, is_read);
create index if not exists messages_sender_idx on public.messages (sender_user_id);
create index if not exists messages_type_idx on public.messages (message_type, created_at desc);
create index if not exists messages_created_idx on public.messages (created_at desc);
create index if not exists broadcasts_audience_idx on public.broadcasts (audience_type, status, created_at desc);
create index if not exists broadcast_deliveries_recipient_idx on public.broadcast_deliveries (recipient_user_id);
create index if not exists sponsorship_leads_status_idx on public.sponsorship_leads (status, created_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists videos_set_updated_at on public.videos;
create trigger videos_set_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

drop trigger if exists gallery_items_set_updated_at on public.gallery_items;
create trigger gallery_items_set_updated_at
  before update on public.gallery_items
  for each row execute function public.set_updated_at();

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

drop trigger if exists chat_knowledge_set_updated_at on public.chat_knowledge;
create trigger chat_knowledge_set_updated_at
  before update on public.chat_knowledge
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER so policies can read profiles without
-- recursing back into the profiles policy.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_client_beta_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'client' and status = 'active'
  );
$$;

-- True for any signed-in user whose account is not suspended or banned. Used
-- for reads a pending client still needs (their own profile row).
create or replace function public.is_signed_in_in_good_standing()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status in ('pending', 'active')
  );
$$;

-- ---------------------------------------------------------------------------
-- New auth user -> profile row. Role is never taken from client input:
-- everyone starts as a client with pending access and must be approved.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    'client',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Privilege guard: a signed-in client may edit their own display name and
-- avatar, but role, status and timestamps are restored from the old row
-- unless the caller is a verified admin. This is what makes "never trust role
-- values sent by the client" a database guarantee instead of a UI convention.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  new.role := old.role;
  new.status := old.status;
  new.email := old.email;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_columns on public.profiles;
create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

-- ---------------------------------------------------------------------------
-- Storage buckets. `gallery` and `audio` are public-read because the site
-- serves them directly; uploads are still admin-only through the policies in
-- the RLS migration.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('gallery', 'gallery', true),
  ('audio', 'audio', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;
