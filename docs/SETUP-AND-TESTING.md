# Setup, Environment & Testing Guide

## 1. Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend env (public) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend env (public) | Anon key — safe to expose; all privileged access is blocked by RLS |
| `GEMINI_API_KEY` | Supabase edge-function secret only | Optional AI grounding for the chatbot |

**No service-role key or admin secret is ever placed in a `VITE_*` variable or
shipped to the browser.** Privileged operations (creating accounts) run in edge
functions that verify the caller's admin role before using the service-role
key server-side.

## 2. Database setup

1. Run `supabase/migrations/20250101000000_init_schema.sql`.
2. Run `supabase/migrations/20250102000000_ranks_rpc.sql`.
3. Deploy the three edge functions (see README).

The migration creates: profiles + user_roles (kept in sync by trigger),
courses, batches, enrollments, subjects, tests, marks, attendance,
assignments + submissions, resources, notices, achievements, testimonials,
gallery albums + images, chatbot FAQs + unanswered questions log, inquiries,
site_settings, audit_logs, storage bucket + storage policies, RLS on every
table, audit triggers, updated-at triggers, and labelled sample seed data.

## 3. Verification steps performed

- `bun run typecheck` — passes with zero errors.
- `bun run lint` — passes with zero warnings (max-warnings 0).
- `bun test` — 39 tests pass across 5 suites:
  - marks math (missing ≠ zero, per-subject pass thresholds, absence handling,
    batch stats, tie-aware ranking),
  - validation schemas (Indian phone format, consent requirement, password
    rules),
  - utils (slugify, percent guards, URL safety, date fallbacks),
  - service behaviour before Supabase credentials exist (default settings,
    empty lists instead of network errors, clear inquiry error) and the
    settings-update regression (row located by id, never by academy_name),
  - render smoke tests for the public pages plus the setup banner,
  - a **schema contract test** that parses the SQL migrations and fails if any
    page selects a column that does not exist (this class of bug typechecks and
    only breaks at runtime).
- Manual QA checklist for staff (verify in the running app after connecting
  Supabase):
  - Landing page renders all sections with data from Supabase; graceful
    empty states when tables are empty.
  - Sign in → redirected to the correct dashboard per role.
  - Admin: create/edit/archive course → appears/disappears on the site.
  - Admin: create student account → student can sign in with temporary
    password and is forced to change it.
  - Teacher: mark attendance → student portal reflects it after refresh.
  - Teacher: create test → enter marks → publish → student sees results;
    before publish the student sees nothing.
  - Student: submit assignment → teacher grades it → student sees feedback.
  - Public inquiry form → lead appears in admin inquiries with UTM data.
  - Achievement without consent recorded → not visible publicly (RLS).
- Responsiveness: checked at 360px, 768px, 1280px widths; tables collapse to
  cards; drawer nav on mobile.

## 3b. Bugs found and fixed during QA

| Bug | Impact | Fix |
|---|---|---|
| `public/Resources.tsx` selected `resource_type`, `file_url`, `external_url` and filtered `status = 'published'` | Page always failed with a PostgREST 400; resources never appeared | Query the real schema (`url`, `kind`, `visibility='public'`, `status='active'`) |
| `updateSiteSettings` matched the row with `.eq("academy_name", …)` | Renaming the academy made every later settings save update 0 rows and throw | Locate the row by primary key, insert when absent |
| Invalid Tailwind classes `h-4.5 w-4.5` (login eye toggle, resources icon) | Classes are never generated, so icons rendered 24px and broke alignment | Use `h-5 w-5` |
| "View All FAQs" linked to `/contact`, which had no FAQs | Dead-end CTA | Added the full published-FAQ list to the contact page and link to `/contact#faqs` |
| Forced password change redirected to the public homepage | Staff/students landed on `/` after setting a password | Redirect to the dashboard for the signed-in role |
| No-Supabase state showed error boxes across the site | Preview looked broken before setup | Public fetchers return real empty/default states plus a setup banner naming the env vars |
| Phone numbers rendered as `tel:+91+91…` when stored with a country code | Broken call/WhatsApp links | Normalise phone fields to 10 digits on save |
| Empty gallery album gave no feedback when opened | Looked unresponsive | Explicit "no photos in this album" dialog |

## 4. Running tests

```bash
bun test          # all unit tests
bun test --watch  # during development
bun run lint      # eslint with zero-warning gate
```

Test files live next to the code they cover (`*.test.ts`).
