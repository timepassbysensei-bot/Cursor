# Bokaro Defence Academy — Website & Academy Management System

A production-ready, mobile-first public website plus a full academy management
system (admin / teacher / student portals) built on **React + Vite +
TypeScript + Tailwind CSS** with **Supabase** (Postgres, Auth, Storage, Edge
Functions, Row Level Security).

## Quick start

```bash
bun install
bun run dev        # dev server on 0.0.0.0
bun run typecheck  # tsc -b --noEmit
bun run lint       # eslint, 0 warnings allowed
bun test           # vitest unit tests
bun run build      # production build to dist/
```

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the schema: run the two files in `supabase/migrations/` in the SQL
   editor (or `supabase db push`). This creates every table, all **Row Level
   Security policies**, triggers, indexes, the storage bucket, and
   clearly-labelled sample seed content.
3. Deploy the edge functions:
   ```bash
   supabase functions deploy create-student
   supabase functions deploy create-staff
   supabase functions deploy academy-chatbot
   ```
4. Set environment variables for the frontend (public, anon key — safe to
   expose, protected by RLS):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Optional: `supabase secrets set GEMINI_API_KEY=...` to enable AI-grounded
   chatbot answers. Without it, the chatbot falls back to keyword matching over
   published FAQs. The key lives only in the edge function.

## First login / bootstrapping the first admin

The schema auto-creates a `student`-role profile for every new auth user.
To create the **first admin**:

1. Sign up normally (email+password) — you get a student profile.
2. In the Supabase dashboard (SQL editor), run:
   ```sql
   select public.has_role(id, array['student']) from auth.users where email = 'you@example.com';
   ```
   then update your role:
   ```sql
   update public.profiles set role = 'super_admin' where email = 'you@example.com';
   ```
   The `user_roles` table is updated automatically by the trigger. All further
   staff/student accounts are created from the admin dashboard.

## Roles

| Role | Portal | Capabilities |
|---|---|---|
| `super_admin` / `admin` | `/admin` | Full content management, students/teachers, batches, inquiries CRM, settings, audit logs |
| `teacher` | `/teacher` | Assigned batches only: attendance, tests, marks entry + publish, assignments, resources |
| `student` | `/student` | Own results (published only), attendance, assignments + submissions, resources, notices, profile |

Permissions are enforced by **Postgres RLS policies**, not just the UI — a
teacher can only write rows for batches assigned to them; students can only
read their own marks/attendance/submissions.

## Content rules baked into the system

- Seeded courses/copy are labelled `[Sample …]` and must be replaced via the
  admin dashboard; fees fields start empty by design.
- Achievements (student results) require a recorded consent checkbox **and**
  published status before RLS exposes them publicly.
- The chatbot answers only from published FAQs and explicitly refuses to
  invent fees/dates/claims; unanswered questions are logged for staff.

## Documentation

- `docs/reference-site-analysis.md` — reference-site study and how the
  patterns were adapted (with copyright confirmation).
- `docs/SETUP-AND-TESTING.md` — environment setup, QA checklist and test plan.
- `docs/KNOWN-LIMITATIONS.md` — honest list of what is not done and how to
  finish it.

## Tech notes

- `src/features/marks/marksMath.ts` — shared, unit-tested marks logic:
  missing marks are never counted as zero; per-subject passing thresholds.
- Audit triggers log admin content changes to `audit_logs`.
- Storage bucket `media` is public-read; only staff can upload (enforced by
  storage policies).
