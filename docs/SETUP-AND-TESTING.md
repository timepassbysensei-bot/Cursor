# Setup checklist & manual test plan

Everything in this document is written to be followed in order. Steps 1–7 take a new
Supabase project from empty to a working site; step 8 adds the assistant; steps 9–10
deploy and verify.

---

## 1. Create the Supabase project

1. <https://supabase.com/dashboard> → **New project**. Pick a region close to Arian's
   audience (Mumbai / Singapore for India).
2. Save the database password somewhere safe — it is not needed by the app.
3. **Project Settings → API** and copy:
   * Project URL → `VITE_SUPABASE_URL` and `SUPABASE_URL`
   * `anon` public key → `VITE_SUPABASE_ANON_KEY`
   * `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY` (**server-side only**)

## 2. Run the database migrations

In the Supabase dashboard → **SQL Editor**, run these files in order, in full:

1. `supabase/migrations/20250601000000_creator_platform_schema.sql`
   Tables, indexes, `updated_at` triggers, the role helpers (`is_admin()`,
   `is_client_beta_allowed()`, `is_signed_in_in_good_standing()`), the
   `handle_new_user` trigger and the privilege guard, and the three storage buckets.
2. `supabase/migrations/20250601000100_creator_platform_rls.sql`
   Enables RLS on every table, adds the policies and the storage policies.
3. `supabase/seed.sql`
   Editable site copy and the assistant's knowledge base. Safe to re-run.

Verify with `select tablename, rowsecurity from pg_tables where schemaname = 'public';`
— every row should read `true`.

## 3. Create the storage buckets

Step 2 already creates them. Confirm in **Storage** that `gallery`, `audio` and
`avatars` exist and are marked **public** (the site links to their files directly).
If you create them by hand instead, tick "Public bucket" and re-run the two storage
policy blocks from the RLS migration.

## 4. Configure Supabase Auth

1. **Authentication → Providers → Email**: enable it. Keep *Confirm email* **on** so
   the verification flow is exercised; turn it off only for local testing.
2. **Authentication → URL configuration**:
   * Site URL: `https://your-site.netlify.app`
   * Redirect URLs: add `https://your-site.netlify.app/**`, `http://localhost:5173/**`
     and `http://localhost:8888/**` (the last is `netlify dev`).
   These must match `VITE_SITE_URL`, otherwise password-reset and magic-link
   redirects are rejected.
3. **Authentication → Settings**: set a minimum password length of 8 to match the
   form validation.
4. Optional but recommended for production: add custom SMTP. The built-in mailer is
   rate limited and is not suitable for real password resets.

## 5. Create the first admin user — securely

Admin is never selectable in the UI. Create it in SQL:

```sql
-- 1. Sign up once through /signup with the real address (it becomes a pending client).
-- 2. Promote exactly that row:
update public.profiles
set role = 'admin', status = 'active'
where email = 'you@example.com';

-- 3. Confirm there is exactly one admin:
select id, email, role, status from public.profiles where role = 'admin';
```

The account now passes `RequireAdmin` and `is_admin()`. Everyone else who signs up
stays a `client` with `pending` access until approved in **Studio → Clients**.
Someone else can be promoted later from the studio's "Make admin" action, which is
recorded in the audit log.

## 6. Configure Gemini

1. <https://aistudio.google.com/apikey> → **Create API key**.
2. Put it in `GEMINI_API_KEY` (browser env vars must never contain it).
3. Optionally set `GEMINI_MODEL` (default `gemini-2.0-flash`) and
   `CHAT_RATE_LIMIT_PER_MINUTE` (default `12`).
4. Without a key the assistant still works — it answers from Arian's brief locally and
   tells the visitor it is in offline mode.

## 7. Configure Netlify

1. **Add new site → Import an existing project** and pick this repository.
2. Build settings come from `netlify.toml`: `npm run build`, publish `dist`,
   functions `netlify/functions`. Nothing needs changing in the UI.
3. `netlify.toml` also sets the `/api/*` → functions redirect, the SPA fallback,
   the security headers and the Content-Security-Policy. If you connect a custom
   domain or a different Supabase project, extend the CSP's `img-src`, `media-src`
   and `connect-src` accordingly.

## 8. Add the environment variables

Netlify → **Site configuration → Environment variables**. Add all ten from
`env.example`. Scopes:

* `VITE_*` → build-time, visible to the browser (that is intended);
* `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
  `CHAT_RATE_LIMIT_PER_MINUTE` → server-side only.

Locally, `cp env.example .env.local` and fill in the same values.

## 9. Deploy

```bash
bun install
bun run test        # 45 tests
bun run typecheck
bun run build       # must produce dist/
git push            # Netlify builds and deploys
```

For a local end-to-end run including the functions, use `netlify dev` (port 8888)
rather than `bun run dev` — Vite alone does not serve `/api/*`.

## 10. Test the flows

Work through the table below on the deployed URL. Anything you cannot complete is a
bug; the "Expected" column is the contract.

### Public, no account

| # | Flow | Expected |
| --- | --- | --- |
| 1 | Browse `/`, `/about`, `/videos`, `/gallery`, `/sponsor`, `/contact`, `/chat` | All render; no console errors; no horizontal scroll at 390px |
| 2 | `/videos` filters and search | Filters combine; "Clear filters" resets; empty result shows an empty state |
| 3 | Gallery lightbox | Click opens; ←/→ navigate; Esc closes; focus returns; images have alt text |
| 4 | Contact form | Empty submit shows inline errors; honeypot left blank; success confirmation; the row appears in **Studio → Messages** as *Public* |
| 5 | Sponsor form | Same, and the row appears under *Sponsorships* with budget and timeline |
| 6 | Spam guard | Submitting 4 times in a row shows the rate-limit notice |
| 7 | Assistant | Suggested question answers; off-topic question is declined; reset clears the thread; with no key it says it is in offline mode |
| 8 | Background music | Hidden until a track is set active; never autoplays; mute choice survives a reload |
| 9 | 404 | An unknown URL renders the 404 page with working links |

### Accounts and roles

| # | Flow | Expected |
| --- | --- | --- |
| 10 | Sign up at `/signup` | Verification email arrives; account is `client` + `pending`; no role control anywhere |
| 11 | Email login | Lands on `/dashboard` with the pending notice |
| 12 | Password reset | `/forgot-password` sends a link; `/auth/reset-password` accepts a new password; old one stops working |
| 13 | `/dashboard` while pending | Readable, but messaging and sponsorship show "access pending" |
| 14 | Approve in **Studio → Clients** | Status becomes Active; the client's inbox and forms unlock |
| 15 | Make a message as a client | Appears in **Studio → Messages** as *Client*; the admin reply appears in the client's inbox |
| 16 | Suspend | Client sees the suspended notice; inbox reads come back empty |
| 17 | Ban | Client sees the removed-access notice; `messages` reads return nothing |
| 18 | Unban, then Remove access | Returns to pending, then normal |
| 19 | Studio authorization | Signing in as a client and visiting `/admin` shows "Admin access only" |

### Studio

| # | Flow | Expected |
| --- | --- | --- |
| 20 | Add a video from a YouTube URL | Id and thumbnail are derived; it appears on `/videos` and the homepage |
| 21 | Feature a video | Only one featured at a time; the homepage hero card updates |
| 22 | Reorder videos | Up/down arrows persist through a reload |
| 23 | Delete a video | Confirmation dialog first; gone from both studio and site |
| 24 | Upload gallery images | Drag-and-drop works; progress bar advances; a 12 MB photo is compressed in the browser |
| 25 | Edit image details | Title, alt text and category save; hiding it removes it from the public gallery |
| 26 | Delete an image | Confirmation first; the file is removed from Storage as well as the row |
| 27 | Upload an MP3 | Track appears with its file size; "Set active" adds the player to the site; preview plays in the studio |
| 28 | Replace / remove the active track | Only one active track is possible — the database enforces it |
| 29 | Broadcast to all clients | Delivery records show `n delivered`; each client sees it in their inbox |
| 30 | Broadcast to one client | Only that client sees it |
| 31 | Public announcement | Appears in the banner on every public page and can be dismissed |
| 32 | Save a draft | Stored, not delivered |
| 33 | Edit site content | Saving updates the public pages without a redeploy |
| 34 | Chatbot knowledge | Adding an entry changes what the assistant answers on the next question |
| 35 | Audit log | Every action above is recorded with a timestamp |

### Cross-cutting

| # | Flow | Expected |
| --- | --- | --- |
| 36 | Mobile at 390px | No horizontal scroll; sidebar becomes a drawer; tap targets ≥ 44px |
| 37 | Keyboard only | Skip link works; every control reachable; focus is always visible |
| 38 | Reduced motion | With the OS setting on, reveals/parallax/cursor glow are disabled |
| 39 | Empty states | Deleting all videos/images/audio shows the designed empty states, not blank space |
| 40 | Error states | With the network throttled or Supabase paused, pages show retry affordances rather than blank screens |
| 41 | Unconfigured build | With the env vars removed the site still renders in demo mode with the Demo mode banner instead of crashing |

---

## Quick reset

To start the content over without touching accounts:

```sql
truncate public.videos, public.gallery_items, public.audio_tracks,
         public.messages, public.broadcasts, public.broadcast_deliveries,
         public.sponsorship_leads, public.audit_logs;
-- keep profiles and site_content, or truncate those too and re-run supabase/seed.sql
```

Storage objects must be deleted from **Storage → gallery / audio** in the dashboard.
