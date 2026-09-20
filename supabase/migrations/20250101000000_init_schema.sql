-- ============================================================================
-- BOKARO DEFENCE ACADEMY — full Supabase schema
-- Apply with: supabase db push  (or paste into Supabase SQL Editor)
-- Sample content is CLEARLY LABELLED and must be replaced by real academy
-- details via the admin dashboard (Site Settings / CRUD pages).
-- ============================================================================
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ============================== ROLES =======================================
-- Roles are stored in a table separate from auth.users (the recommended
-- Supabase pattern for "use a separate table for role data").
create table if not exists public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('super_admin','admin','teacher','student')),
  created_at  timestamptz not null default now(),
  unique (user_id, role)
);
create index if not exists idx_user_roles_user on public.user_roles(user_id);

create or replace function public.has_role(_user_id uuid, _roles text[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = any(_roles)
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.has_role(auth.uid(), array['super_admin','admin','teacher']);
$$;

-- ============================ PROFILES ======================================
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text unique,
  full_name             text not null default '',
  role                  text not null default 'student'
                          check (role in ('super_admin','admin','teacher','student')),
  is_active             boolean not null default true,
  force_password_change boolean not null default false,
  avatar_url            text,
  phone                 text,
  roll_number           text unique,
  classroom_batch_id    uuid, -- fk added after batches exists
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists idx_profiles_role on public.profiles(role);

-- Keep user_roles in sync with profiles.role (single source of truth for RLS)
create or replace function public.sync_role_on_profile_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.user_roles where user_id = old.id and role = old.role;
    return old;
  end if;
  insert into public.user_roles (user_id, role) values (new.id, new.role)
  on conflict (user_id, role) do nothing;
  -- remove stale roles if the role changed
  if tg_op = 'UPDATE' and old.role is distinct from new.role then
    delete from public.user_roles
    where user_id = new.id and role <> new.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_role_profiles on public.profiles;
create trigger trg_sync_role_profiles
  after insert or update of role or delete on public.profiles
  for each row execute function public.sync_role_on_profile_change();

-- Auto-create a profile for every new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ======================= UPDATED_AT TRIGGER =================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================== COURSES =====================================
create table if not exists public.courses (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  short_description text,
  full_description  text,
  thumbnail_url     text,
  eligibility       text,
  age_criteria      text,
  duration_text     text,
  subjects          text[],
  batch_timings     text,
  fees_text         text,
  mode              text,
  seats_text        text,
  admission_status  text not null default 'open' check (admission_status in ('open','filling_fast','closed')),
  featured          boolean not null default false,
  display_order     int not null default 0,
  prospectus_url    text,
  status            text not null default 'draft' check (status in ('draft','published','archived')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_courses_updated before update on public.courses
  for each row execute function public.set_updated_at();
create index if not exists idx_courses_status on public.courses(status, display_order);

-- ============================== BATCHES =====================================
create table if not exists public.batches (
  id               uuid primary key default gen_random_uuid(),
  course_id        uuid not null references public.courses(id) on delete cascade,
  name             text not null,
  timing_text      text,
  start_date       date,
  end_date         date,
  capacity         int,
  admission_status text not null default 'open' check (admission_status in ('open','filling_fast','closed')),
  faculty_teacher_id uuid references public.profiles(id) on delete set null,
  status           text not null default 'upcoming' check (status in ('upcoming','ongoing','completed','archived')),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_batches_updated before update on public.batches
  for each row execute function public.set_updated_at();
create index if not exists idx_batches_course on public.batches(course_id);
create index if not exists idx_batches_status on public.batches(status);

alter table public.profiles
  add constraint fk_profiles_batch
  foreign key (classroom_batch_id) references public.batches(id) on delete set null;

-- ============================ ENROLLMENTS ===================================
create table if not exists public.enrollments (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  batch_id      uuid not null references public.batches(id) on delete cascade,
  status        text not null default 'active' check (status in ('active','completed','withdrawn','archived')),
  enrolled_on   date not null default current_date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (student_id, batch_id)
);
create trigger trg_enrollments_updated before update on public.enrollments
  for each row execute function public.set_updated_at();
create index if not exists idx_enroll_student on public.enrollments(student_id);
create index if not exists idx_enroll_batch on public.enrollments(batch_id);

-- ============================ ACADEMIC YEAR =================================
create table if not exists public.academic_years (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  start_date date,
  end_date   date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================== SUBJECTS ====================================
create table if not exists public.subjects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text unique,
  created_at timestamptz not null default now()
);

-- ============================== TESTS =======================================
create table if not exists public.tests (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  batch_id        uuid not null references public.batches(id) on delete cascade,
  subject_ids     uuid[] not null default '{}',
  max_marks_per_subject int not null default 100,
  passing_percent int not null default 33,
  test_date       date not null,
  status          text not null default 'scheduled' check (status in ('scheduled','marks_entered','reviewed','published','archived')),
  publish_result  boolean not null default false,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_tests_updated before update on public.tests
  for each row execute function public.set_updated_at();
create index if not exists idx_tests_batch on public.tests(batch_id, test_date desc);

-- ============================== MARKS =======================================
create table if not exists public.marks (
  id              uuid primary key default gen_random_uuid(),
  test_id         uuid not null references public.tests(id) on delete cascade,
  student_id      uuid not null references public.profiles(id) on delete cascade,
  subject_id      uuid not null references public.subjects(id) on delete cascade,
  marks_obtained  numeric,
  is_absent       boolean not null default false,
  remarks         text,
  entered_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (test_id, student_id, subject_id)
);
create trigger trg_marks_updated before update on public.marks
  for each row execute function public.set_updated_at();
create index if not exists idx_marks_test on public.marks(test_id);
create index if not exists idx_marks_student on public.marks(student_id);

-- ============================ ATTENDANCE ====================================
create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  batch_id    uuid not null references public.batches(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  status      text not null check (status in ('present','absent','late','leave')),
  marked_by   uuid references public.profiles(id) on delete set null,
  remarks     text,
  created_at  timestamptz not null default now(),
  unique (batch_id, student_id, date)
);
create index if not exists idx_att_batch_date on public.attendance(batch_id, date);
create index if not exists idx_att_student on public.attendance(student_id, date desc);

-- =========================== ASSIGNMENTS ====================================
create table if not exists public.assignments (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  instructions text,
  batch_id     uuid not null references public.batches(id) on delete cascade,
  due_date     date,
  max_score    int,
  attachment_url text,
  created_by   uuid references public.profiles(id) on delete set null,
  status       text not null default 'active' check (status in ('active','closed','archived')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_assignments_updated before update on public.assignments
  for each row execute function public.set_updated_at();
create index if not exists idx_assign_batch on public.assignments(batch_id, due_date desc);

create table if not exists public.assignment_submissions (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid not null references public.assignments(id) on delete cascade,
  student_id     uuid not null references public.profiles(id) on delete cascade,
  submitted_at   timestamptz not null default now(),
  text_notes     text,
  attachment_url text,
  score          numeric,
  feedback       text,
  status         text not null default 'submitted' check (status in ('submitted','graded','returned')),
  updated_at     timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create trigger trg_submissions_updated before update on public.assignment_submissions
  for each row execute function public.set_updated_at();
create index if not exists idx_sub_assign on public.assignment_submissions(assignment_id);
create index if not exists idx_sub_student on public.assignment_submissions(student_id);

-- ============================ RESOURCES =====================================
create table if not exists public.resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  url         text not null,
  kind        text not null default 'link' check (kind in ('link','pdf','video','image','note')),
  course_id   uuid references public.courses(id) on delete set null,
  batch_id    uuid references public.batches(id) on delete cascade,
  visibility  text not null default 'students' check (visibility in ('public','students','staff')),
  uploaded_by uuid references public.profiles(id) on delete set null,
  status      text not null default 'active' check (status in ('active','archived')),
  created_at  timestamptz not null default now()
);
create index if not exists idx_res_course on public.resources(course_id);
create index if not exists idx_res_batch on public.resources(batch_id);

-- ============================== NOTICES =====================================
create table if not exists public.notices (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  publish_date    date not null default current_date,
  expiry_date     date,
  attachment_url  text,
  audience        text not null default 'public' check (audience in ('public','all_students','course','batch','teachers','admins')),
  course_id       uuid references public.courses(id) on delete set null,
  batch_id        uuid references public.batches(id) on delete set null,
  pinned          boolean not null default false,
  status          text not null default 'draft' check (status in ('draft','published','archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_notices_updated before update on public.notices
  for each row execute function public.set_updated_at();
create index if not exists idx_notices_pub on public.notices(status, audience, publish_date desc);

-- =========================== ACHIEVEMENTS ===================================
-- Published results require recorded student/parent consent (consent_recorded).
create table if not exists public.achievements (
  id               uuid primary key default gen_random_uuid(),
  student_name     text not null,
  photo_url        text,
  examination      text,
  result_text      text,
  course_id        uuid references public.courses(id) on delete set null,
  year             int,
  description      text,
  featured         boolean not null default false,
  consent_recorded boolean not null default false,
  status           text not null default 'draft' check (status in ('draft','published','archived')),
  display_order    int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_achievements_updated before update on public.achievements
  for each row execute function public.set_updated_at();

-- =========================== TESTIMONIALS ===================================
create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  photo_url   text,
  course_text text,
  quote       text not null,
  rating      int not null default 5 check (rating between 1 and 5),
  featured    boolean not null default false,
  status      text not null default 'draft' check (status in ('draft','published','archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_testimonials_updated before update on public.testimonials
  for each row execute function public.set_updated_at();

-- ============================== GALLERY =====================================
create table if not exists public.gallery_albums (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  category        text,
  event_date      date,
  cover_image_url text,
  display_order   int not null default 0,
  status          text not null default 'draft' check (status in ('draft','published','archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_albums_updated before update on public.gallery_albums
  for each row execute function public.set_updated_at();

create table if not exists public.gallery_images (
  id            uuid primary key default gen_random_uuid(),
  album_id      uuid not null references public.gallery_albums(id) on delete cascade,
  url           text not null,
  caption       text,
  alt_text      text,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists idx_gallery_images_album on public.gallery_images(album_id);

-- ================================ FAQS ======================================
create table if not exists public.chatbot_faqs (
  id            uuid primary key default gen_random_uuid(),
  question      text not null,
  answer        text not null,
  category      text,
  featured      boolean not null default false,
  status        text not null default 'draft' check (status in ('draft','published','archived')),
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_faqs_updated before update on public.chatbot_faqs
  for each row execute function public.set_updated_at();

create table if not exists public.chatbot_unanswered_questions (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  created_at timestamptz not null default now()
);

-- ============================= INQUIRIES ====================================
create table if not exists public.inquiries (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  email                text,
  phone                text not null,
  whatsapp             text,
  city                 text,
  interested_course_id uuid references public.courses(id) on delete set null,
  message              text,
  source_page          text,
  utm_source           text,
  utm_medium           text,
  utm_campaign         text,
  status               text not null default 'new' check (status in ('new','contacted','interested','follow_up','admitted','closed','spam')),
  assigned_staff_id    uuid references public.profiles(id) on delete set null,
  follow_up_date       date,
  internal_notes       text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger trg_inquiries_updated before update on public.inquiries
  for each row execute function public.set_updated_at();
create index if not exists idx_inquiries_status on public.inquiries(status, created_at desc);

-- ============================ SITE SETTINGS =================================
create table if not exists public.site_settings (
  id                     uuid primary key default gen_random_uuid(),
  academy_name           text not null default 'Bokaro Defence Academy',
  tagline                text,
  logo_url               text,
  favicon_url            text,
  announcement_text      text,
  announcement_enabled   boolean not null default false,
  admission_status       text not null default 'open' check (admission_status in ('open','filling_fast','closed')),
  hero_eyebrow           text,
  hero_heading           text,
  hero_description       text,
  hero_image_url         text,
  hero_cta_apply_label   text,
  hero_cta_courses_label text,
  about_overview         text,
  about_mission          text,
  about_vision           text,
  about_teaching_approach text,
  director_message       text,
  director_name          text,
  director_title         text,
  director_image_url     text,
  admissions_intro       text,
  admission_process      jsonb not null default '[]'::jsonb,
  required_documents     jsonb not null default '[]'::jsonb,
  eligibility_text       text,
  scholarship_text       text,
  contact_address        text,
  contact_phone          text,
  contact_phone_secondary text,
  contact_whatsapp       text,
  contact_email          text,
  contact_hours          text,
  map_url                text,
  map_embed_url          text,
  facebook_url           text,
  instagram_url          text,
  youtube_url            text,
  twitter_url            text,
  footer_description     text,
  seo_title              text,
  seo_description        text,
  og_image_url           text,
  feature_flags          jsonb not null default '{}'::jsonb,
  updated_at             timestamptz not null default now()
);
create trigger trg_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ============================= AUDIT LOGS ===================================
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  details     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);

-- Generic audit trigger for content tables edited from the admin dashboard
create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_action text := tg_op;
begin
  if v_action = 'DELETE' then
    insert into public.audit_logs (actor_id, action, entity, entity_id, details)
    values (auth.uid(), 'delete', tg_table_name, old.id::text,
            jsonb_build_object('row', to_jsonb(old)));
  else
    insert into public.audit_logs (actor_id, action, entity, entity_id, details)
    values (auth.uid(), v_action, tg_table_name, new.id::text,
            jsonb_build_object('row', to_jsonb(new)));
  end if;
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['courses','batches','notices','achievements','testimonials','gallery_albums','chatbot_faqs','site_settings','inquiries']
  loop
    execute format('drop trigger if exists trg_audit_%1$s on public.%1$s', t);
    execute format('create trigger trg_audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.audit_row_change()', t);
  end loop;
end $$;

-- =============================== RLS ========================================
alter table public.user_roles                     enable row level security;
alter table public.profiles                       enable row level security;
alter table public.courses                        enable row level security;
alter table public.batches                        enable row level security;
alter table public.enrollments                    enable row level security;
alter table public.academic_years                 enable row level security;
alter table public.subjects                       enable row level security;
alter table public.tests                          enable row level security;
alter table public.marks                          enable row level security;
alter table public.attendance                     enable row level security;
alter table public.assignments                    enable row level security;
alter table public.assignment_submissions         enable row level security;
alter table public.resources                      enable row level security;
alter table public.notices                        enable row level security;
alter table public.achievements                   enable row level security;
alter table public.testimonials                   enable row level security;
alter table public.gallery_albums                 enable row level security;
alter table public.gallery_images                 enable row level security;
alter table public.chatbot_faqs                   enable row level security;
alter table public.chatbot_unanswered_questions   enable row level security;
alter table public.inquiries                      enable row level security;
alter table public.site_settings                  enable row level security;
alter table public.audit_logs                     enable row level security;

-- ---------- user_roles / profiles ----------
create policy "roles read own" on public.user_roles
  for select using (user_id = auth.uid());
create policy "roles staff manage" on public.user_roles
  for all using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));

create policy "profiles read own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles staff read all" on public.profiles
  for select using (public.is_staff());
create policy "profiles public read names" on public.profiles
  for select using (true);
create policy "profiles update own" on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and is_active = (select p.is_active from public.profiles p where p.id = auth.uid())
  );
create policy "profiles staff update" on public.profiles
  for update using (public.has_role(auth.uid(), array['super_admin','admin']))
  with check (public.has_role(auth.uid(), array['super_admin','admin']));
create policy "profiles admins insert" on public.profiles
  for insert with check (public.has_role(auth.uid(), array['super_admin','admin']));

-- ---------- Public content: everyone reads published; staff manage ----------
create policy "courses public read" on public.courses
  for select using (status = 'published' or public.has_role(auth.uid(), array['super_admin','admin']));
create policy "courses staff write" on public.courses
  for all using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));

create policy "batches public read" on public.batches
  for select using (true);
create policy "batches staff write" on public.batches
  for all using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));

create policy "notices public read" on public.notices
  for select using (
    (status = 'published' and audience = 'public')
    or public.has_role(auth.uid(), array['super_admin','admin'])
    or (status = 'published' and audience in ('all_students','course','batch') and public.has_role(auth.uid(), array['student']))
  );
create policy "notices staff write" on public.notices
  for all using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));

create policy "achievements public read" on public.achievements
  for select using (
    (status = 'published' and consent_recorded)
    or public.has_role(auth.uid(), array['super_admin','admin'])
  );
create policy "achievements staff write" on public.achievements
  for all using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));

create policy "testimonials public read" on public.testimonials
  for select using (
    status = 'published' or public.has_role(auth.uid(), array['super_admin','admin'])
  );
create policy "testimonials staff write" on public.testimonials
  for all using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));

create policy "albums public read" on public.gallery_albums
  for select using (
    status = 'published' or public.has_role(auth.uid(), array['super_admin','admin'])
  );
create policy "albums staff write" on public.gallery_albums
  for all using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));

create policy "gallery images read" on public.gallery_images
  for select using (
    exists (select 1 from public.gallery_albums a
            where a.id = album_id
              and (a.status = 'published' or public.has_role(auth.uid(), array['super_admin','admin'])))
  );
create policy "gallery images staff write" on public.gallery_images
  for all using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));

create policy "faqs public read" on public.chatbot_faqs
  for select using (
    status = 'published' or public.has_role(auth.uid(), array['super_admin','admin'])
  );
create policy "faqs staff write" on public.chatbot_faqs
  for all using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));

create policy "unanswered questions insert anon" on public.chatbot_unanswered_questions
  for insert with check (true);
create policy "unanswered questions staff read" on public.chatbot_unanswered_questions
  for select using (public.has_role(auth.uid(), array['super_admin','admin']));

create policy "settings public read" on public.site_settings
  for select using (true);
create policy "settings staff write" on public.site_settings
  for all using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));

-- ---------- Inquiries: anyone can submit; staff manage ----------
create policy "inquiries anyone insert" on public.inquiries
  for insert with check (
    char_length(name) between 2 and 100
    and char_length(phone) between 10 and 15
  );
create policy "inquiries staff read" on public.inquiries
  for select using (public.has_role(auth.uid(), array['super_admin','admin','teacher']));
create policy "inquiries staff update" on public.inquiries
  for update using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));
create policy "inquiries admins delete" on public.inquiries
  for delete using (public.has_role(auth.uid(), array['super_admin','admin']));

-- ---------- Audit logs: staff read-only ----------
create policy "audit staff read" on public.audit_logs
  for select using (public.has_role(auth.uid(), array['super_admin','admin']));

-- ---------- Academic data: teacher writes, students read own ----------
create policy "subjects staff read" on public.subjects
  for select using (public.is_staff() or public.has_role(auth.uid(), array['student']));
create policy "subjects staff write" on public.subjects
  for all using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));

create policy "academic years staff read" on public.academic_years
  for select using (public.is_staff() or public.has_role(auth.uid(), array['student']));
create policy "academic years staff write" on public.academic_years
  for all using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));

create policy "tests staff read" on public.tests
  for select using (public.is_staff() or public.has_role(auth.uid(), array['student']));
create policy "tests teacher write" on public.tests
  for all using (
    public.has_role(auth.uid(), array['super_admin','admin'])
    or (public.has_role(auth.uid(), array['teacher']) and exists (
      select 1 from public.batches b where b.id = batch_id and b.faculty_teacher_id = auth.uid()
    ))
  )
  with check (
    public.has_role(auth.uid(), array['super_admin','admin'])
    or (public.has_role(auth.uid(), array['teacher']) and exists (
      select 1 from public.batches b where b.id = batch_id and b.faculty_teacher_id = auth.uid()
    ))
  );

create policy "marks staff read" on public.marks
  for select using (
    public.is_staff()
    or (public.has_role(auth.uid(), array['student']) and student_id = auth.uid())
  );
create policy "marks teacher write" on public.marks
  for all using (
    public.has_role(auth.uid(), array['super_admin','admin'])
    or (public.has_role(auth.uid(), array['teacher']) and exists (
      select 1 from public.tests t join public.batches b on b.id = t.batch_id
      where t.id = test_id and b.faculty_teacher_id = auth.uid()
    ))
  )
  with check (
    public.has_role(auth.uid(), array['super_admin','admin'])
    or (public.has_role(auth.uid(), array['teacher']) and exists (
      select 1 from public.tests t join public.batches b on b.id = t.batch_id
      where t.id = test_id and b.faculty_teacher_id = auth.uid()
    ))
  );

create policy "attendance staff read" on public.attendance
  for select using (
    public.is_staff()
    or (public.has_role(auth.uid(), array['student']) and student_id = auth.uid())
  );
create policy "attendance teacher write" on public.attendance
  for all using (
    public.has_role(auth.uid(), array['super_admin','admin'])
    or (public.has_role(auth.uid(), array['teacher']) and exists (
      select 1 from public.batches b where b.id = batch_id and b.faculty_teacher_id = auth.uid()
    ))
  )
  with check (
    public.has_role(auth.uid(), array['super_admin','admin'])
    or (public.has_role(auth.uid(), array['teacher']) and exists (
      select 1 from public.batches b where b.id = batch_id and b.faculty_teacher_id = auth.uid()
    ))
  );

create policy "enrollments staff read" on public.enrollments
  for select using (
    public.is_staff()
    or (public.has_role(auth.uid(), array['student']) and student_id = auth.uid())
  );
create policy "enrollments staff write" on public.enrollments
  for all using (public.has_role(auth.uid(), array['super_admin','admin']))
    with check (public.has_role(auth.uid(), array['super_admin','admin']));

create policy "assignments staff read" on public.assignments
  for select using (
    public.is_staff()
    or (public.has_role(auth.uid(), array['student']) and exists (
      select 1 from public.enrollments e where e.batch_id = batch_id and e.student_id = auth.uid()
    ))
  );
create policy "assignments teacher write" on public.assignments
  for all using (
    public.has_role(auth.uid(), array['super_admin','admin'])
    or (public.has_role(auth.uid(), array['teacher']) and exists (
      select 1 from public.batches b where b.id = batch_id and b.faculty_teacher_id = auth.uid()
    ))
  )
  with check (
    public.has_role(auth.uid(), array['super_admin','admin'])
    or (public.has_role(auth.uid(), array['teacher']) and exists (
      select 1 from public.batches b where b.id = batch_id and b.faculty_teacher_id = auth.uid()
    ))
  );

create policy "submissions staff read" on public.assignment_submissions
  for select using (
    public.is_staff()
    or (public.has_role(auth.uid(), array['student']) and student_id = auth.uid())
  );
create policy "submissions student write" on public.assignment_submissions
  for insert with check (
    public.has_role(auth.uid(), array['student']) and student_id = auth.uid()
    and exists (
      select 1 from public.assignments a join public.enrollments e
        on e.batch_id = a.batch_id
      where a.id = assignment_id and e.student_id = auth.uid()
    )
  );
create policy "submissions student update own" on public.assignment_submissions
  for update using (
    public.has_role(auth.uid(), array['student']) and student_id = auth.uid()
  )
  with check (
    public.has_role(auth.uid(), array['student']) and student_id = auth.uid()
  );
create policy "submissions teacher manage" on public.assignment_submissions
  for all using (
    public.has_role(auth.uid(), array['super_admin','admin'])
    or (public.has_role(auth.uid(), array['teacher']) and exists (
      select 1 from public.assignments a join public.batches b on b.id = a.batch_id
      where a.id = assignment_id and b.faculty_teacher_id = auth.uid()
    ))
  )
  with check (
    public.has_role(auth.uid(), array['super_admin','admin'])
    or (public.has_role(auth.uid(), array['teacher']) and exists (
      select 1 from public.assignments a join public.batches b on b.id = a.batch_id
      where a.id = assignment_id and b.faculty_teacher_id = auth.uid()
    ))
  );

create policy "resources read" on public.resources
  for select using (
    (visibility = 'public' and status = 'active')
    or (visibility = 'students' and public.has_role(auth.uid(), array['student']) and status = 'active')
    or public.is_staff()
  );
create policy "resources staff write" on public.resources
  for all using (
    public.has_role(auth.uid(), array['super_admin','admin'])
    or (public.has_role(auth.uid(), array['teacher']) and (course_id is null or batch_id is null or true))
  )
  with check (
    public.has_role(auth.uid(), array['super_admin','admin'])
    or public.has_role(auth.uid(), array['teacher'])
  );

-- ========================= STORAGE BUCKETS ==================================
insert into storage.buckets (id, name, public)
values ('media','media', true)
on conflict (id) do nothing;

create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');
create policy "media staff upload" on storage.objects
  for insert with check (
    bucket_id = 'media'
    and public.has_role(auth.uid(), array['super_admin','admin','teacher'])
  );
create policy "media staff update" on storage.objects
  for update using (
    bucket_id = 'media'
    and public.has_role(auth.uid(), array['super_admin','admin','teacher'])
  );
create policy "media staff delete" on storage.objects
  for delete using (
    bucket_id = 'media'
    and public.has_role(auth.uid(), array['super_admin','admin'])
  );

-- ============================== SEED ========================================
-- ⚠️ SAMPLE CONTENT — clearly-labelled examples to be replaced with real
-- academy details through the admin dashboard. Not real claims.
insert into public.site_settings (
  academy_name, tagline, announcement_enabled, admission_status,
  hero_heading, hero_description, hero_eyebrow,
  hero_cta_apply_label, hero_cta_courses_label,
  about_overview, about_mission, about_vision, about_teaching_approach,
  admissions_intro,
  admission_process, required_documents,
  eligibility_text, scholarship_text,
  footer_description, seo_title, seo_description,
  feature_flags
) values (
  'Bokaro Defence Academy',
  'Discipline. Preparation. Selection.',
  false, 'open',
  'Disciplined preparation for India''s defence examinations.',
  'Structured coaching for NDA, CDS, AFCAT and Agniveer aspirants — rigorous academics, physical readiness and personal mentorship, guided by experienced faculty. [Sample copy — edit in Site Settings.]',
  'Admissions open',
  'Apply Now', 'Explore Courses',
  'A defence-exam coaching academy focused on structured preparation: concept-first teaching, regular testing, physical training and personal mentorship for every enrolled student. [Sample copy — edit in Site Settings.]',
  'To prepare dedicated young aspirants for careers as officers in the Indian Armed Forces through disciplined, honest and personal coaching.',
  'To be a trusted academy where every student is known by name and prepared for every stage of selection.',
  'Concept-first teaching, weekly testing, dedicated physical training hours and one-on-one mentoring.',
  'A simple four-step admission process. Our team will guide you from inquiry to enrolment.',
  '[{"step":"1. Submit inquiry","detail":"Fill the online form or visit the office."},{"step":"2. Counselling","detail":"Discuss your target exam and eligibility."},{"step":"3. Choose a batch","detail":"Pick a timing that fits your routine."},{"step":"4. Enrol & begin","detail":"Complete formalities and join your batch."}]'::jsonb,
  '["Recent passport-size photographs","Aadhaar card (or other photo ID)","Date-of-birth proof","Previous class marksheet","Category certificate, if applicable"]'::jsonb,
  'Eligibility depends on your target exam. Our counsellor will confirm exact age and qualification criteria during counselling.',
  'Merit and need-based concessions may be available — confirm current details with the office. [Sample text — edit in Site Settings.]',
  'Structured preparation for NDA, CDS, AFCAT and Agniveer aspirants.',
  'Bokaro Defence Academy — Defence Exam Preparation',
  'Structured coaching for NDA, CDS, AFCAT and Agniveer with disciplined academics, physical readiness and personal mentorship.',
  '{"attendance_enabled":true,"ranking_enabled":false,"assignment_submissions_enabled":true,"chatbot_enabled":true,"floating_call_enabled":true,"floating_whatsapp_enabled":true,"floating_apply_enabled":true}'::jsonb
)
on conflict do nothing;

-- Sample courses (labels make clear these are samples; fees deliberately blank)
insert into public.courses
  (slug, title, short_description, full_description, eligibility, age_criteria,
   duration_text, subjects, batch_timings, mode, seats_text,
   admission_status, featured, display_order, status)
values
  ('nda-foundation', 'NDA Foundation (Sample)', 'Two-year structured preparation for Class 11–12 students targeting the NDA written exam and SSB. Sample course — replace with real details.',
   'The NDA Foundation programme covers Mathematics and General Ability over two academic years alongside school studies. Weekly tests, doubt sessions and physical training are part of the routine. This is SAMPLE content — edit or replace via the admin dashboard.',
   'Class 11–12 students', 'As per NDA notification (sample)', '2 years (sample)',
   array['Mathematics','English','Physics','Chemistry','History','Geography','Current Affairs'],
   'Morning + evening batches (sample)', 'Offline', 'Limited seats per batch (sample)',
   'open', true, 1, 'published'),
  ('nda-target', 'NDA Target Batch (Sample)', 'One-year intensive programme for 12th pass/appearing aspirants. Sample course — replace with real details.',
   'An intensive one-year course completing the NDA syllabus with weekly testing, previous-paper practice and SSB guidance. SAMPLE content.',
   '12th pass or appearing', 'As per NDA notification (sample)', '1 year (sample)',
   array['Mathematics','English','General Ability'],
   'Full-day batches (sample)', 'Offline', 'Limited seats (sample)',
   'open', true, 2, 'published'),
  ('cds-preparation', 'CDS Preparation (Sample)', 'Combined Defence Services written exam coaching for graduates. Sample course.',
   'Covers English, General Knowledge and Elementary Mathematics with regular mocks. SAMPLE content.',
   'Graduates', 'As per CDS notification (sample)', '6–12 months (sample)',
   array['English','General Knowledge','Elementary Mathematics'],
   'Evening batches (sample)', 'Offline', 'Limited seats (sample)',
   'open', false, 3, 'published'),
  ('afcat-ground', 'AFCAT Preparation (Sample)', 'Air Force Common Admission Test coaching for flying and ground duty entries. Sample course.',
   'AFCAT syllabus coverage with mock tests and SSB guidance. SAMPLE content.',
   'Graduates', 'As per AFCAT notification (sample)', '4–6 months (sample)',
   array['General Awareness','Verbal Ability','Numerical Ability','Reasoning','Military Aptitude'],
   'Evening batches (sample)', 'Offline', 'Limited seats (sample)',
   'filling_fast', false, 4, 'published'),
  ('agniveer-prep', 'Agniveer Preparation (Sample)', 'Agniveer (Army/Air Force/Navy) CEE and physical preparation. Sample course.',
   'Combined written + physical preparation for Agniveer entries. SAMPLE content.',
   '10th/12th pass as applicable', 'As per Agniveer notification (sample)', '6 months (sample)',
   array['General Knowledge','Mathematics','English','Physical Training'],
   'Morning batches (sample)', 'Offline', 'Limited seats (sample)',
   'open', false, 5, 'published'),
  ('ssb-guidance', 'SSB Guidance Module (Sample)', 'Five-day SSB orientation: screening, psychology, GTO tasks and interview practice. Sample module.',
   'Structured SSB orientation sessions run between batches. SAMPLE content.',
   'Written-exam qualified aspirants', 'Per entry requirements (sample)', '2 weeks (sample)',
   array['Psychology tests','GTO tasks','Interview practice'],
   'Announced per batch (sample)', 'Offline', 'Small groups (sample)',
   'closed', false, 6, 'published')
on conflict (slug) do nothing;

-- Sample subjects
insert into public.subjects (name, code) values
  ('Mathematics', 'MATH'),
  ('English', 'ENG'),
  ('General Ability', 'GA'),
  ('General Knowledge', 'GK'),
  ('Physics', 'PHY')
on conflict (code) do nothing;

-- Sample academic year
insert into public.academic_years (name, is_current)
values ('2025-26 (Sample)', true)
on conflict (name) do nothing;

-- Sample FAQs (generic, non-claim answers)
insert into public.chatbot_faqs (question, answer, category, featured, status, display_order) values
  ('How do I apply for admission?', 'Fill the inquiry form on the Admissions page or visit the academy office. Our counsellor will call you back to complete the process.', 'Admissions', true, 'published', 1),
  ('What are the batch timings?', 'Batch timings vary by course and are confirmed at counselling. Contact the office for the current schedule.', 'Batches', true, 'published', 2),
  ('What is the fee structure?', 'Fees differ by course and duration. Please contact the office for the current fee structure — published figures are confirmed only at admission.', 'Fees', true, 'published', 3),
  ('Which exams do you prepare students for?', 'Preparation focuses on NDA, CDS, AFCAT and Agniveer entries, including written exam and physical readiness guidance.', 'Courses', true, 'published', 4),
  ('What documents are needed for admission?', 'Typically photo ID, date-of-birth proof, photographs and previous marksheets. The exact list is confirmed during counselling.', 'Admissions', false, 'published', 5),
  ('Do you provide study material?', 'Yes — course material and test series are included in the programme. Details are shared at enrolment.', 'Academics', false, 'published', 6)
on conflict do nothing;

-- ============================ STORAGE NOTES =================================
-- Storage bucket 'media' is public-read; only staff can upload/update.
-- For production, consider signed URLs and a private bucket if sensitive
-- student photos will be stored.

-- ============================== GRANTS ======================================
-- Lock down the defaultanon schema visibility where possible
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
