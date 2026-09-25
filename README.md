# Arian — creator website & community platform

A production-ready personal site and community platform for **Arian**, a gaming and
gaming-storytelling YouTube creator working in Hindi
([youtube.com/@youknowArian](https://www.youtube.com/@youknowArian)).

It is not a dashboard template: the public site is an editorial, cinematic presentation
of Arian's videos, artwork and writing, and the signed-in side is a real product —
client inbox, sponsorship pipeline, and an admin studio that manages every pixel of
the public site without a deploy.

```
Public site  →  /  /about  /videos  /gallery  /sponsor  /contact  /chat
Auth         →  /login  /signup  /forgot-password  /auth/reset-password
Client area  →  /dashboard  /dashboard/messages  /dashboard/contact  /dashboard/sponsor  /dashboard/profile
Admin studio →  /admin  /admin/gallery  /admin/videos  /admin/audio
                /admin/clients  /admin/messages  /admin/broadcasts  /admin/settings
```

---

## 1. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| UI | React 18 + TypeScript + Vite | Fast, typed, Netlify-native static build |
| Styling | Tailwind CSS + a small design-token layer in `src/index.css` | One dark editorial theme, no utility soup |
| Motion | Framer Motion | Scroll reveals, page transitions, lightbox, sidebar |
| Icons | Lucide React | Consistent stroke set |
| Backend | Supabase (Postgres + Auth + RLS + Storage) | Auth, data and files in one place, with real row-level security |
| Serverless | Netlify Functions | The only place server secrets live |
| AI | Google Gemini, called from a Netlify Function | The key never reaches the browser |
| Video | YouTube URLs + `i.ytimg.com` thumbnails | Arian pastes a link; nothing is scraped |

---

## 2. Environment variables

The template ships as **`env.example`** (see the note at the top of that file about
why it is not named `.env.example` in this workspace):

```bash
cp env.example .env.local
```

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | browser | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | browser | Public anon key (safe by design — RLS protects data) |
| `VITE_SITE_URL` | browser | Canonical origin for auth redirect links |
| `VITE_YOUTUBE_CHANNEL_URL` | browser | Arian's channel, used by every "Watch on YouTube" CTA |
| `VITE_CHAT_ENDPOINT` | browser | Chat endpoint, defaults to `/api/chat` |
| `SUPABASE_URL` | functions | Project URL for privileged reads |
| `SUPABASE_SERVICE_ROLE_KEY` | functions | Reads `chat_knowledge`; deletes auth users. **Never** expose client-side |
| `GEMINI_API_KEY` | functions | Google AI Studio key |
| `GEMINI_MODEL` | functions | Defaults to `gemini-2.0-flash` |
| `CHAT_RATE_LIMIT_PER_MINUTE` | functions | Per-IP chat limit, default 12 |

Only variables prefixed with `VITE_` are compiled into the frontend bundle.
`SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are read exclusively inside
`netlify/functions/*.mjs` via `process.env`.

---

## 3. Demo mode

Open the site with no environment variables and it still renders — it does not crash and
it does not show a wall of failed requests. Instead:

* a **Demo mode** bar explains that Supabase is not connected yet;
* site copy comes from `DEFAULT_SITE_CONTENT` in `src/lib/siteContent.ts`;
* videos and gallery tiles are **generated placeholder artwork** (`src/lib/placeholderArt.ts`)
  labelled `Sample`, with no fake photographs, no fake subscriber counts and no
  invented sponsorships;
* the assistant answers from Arian's written brief locally, and says so.

Connecting Supabase replaces all of it with Arian's real content.

---

## 4. Setup

The full checklist — Supabase project, migrations, buckets, auth, the first admin user,
Gemini, Netlify, deploy and manual QA — is in **[`docs/SETUP-AND-TESTING.md`](docs/SETUP-AND-TESTING.md)**.
The short version:

```bash
bun install
cp env.example .env.local        # fill in the four required keys
# run supabase/migrations/*.sql then supabase/seed.sql in the Supabase SQL editor
bun run dev                      # or: netlify dev (needed for /api/* functions)
```

First admin, created by hand (never through the sign-up form):

```sql
-- after signing up normally, promote that account in the Supabase SQL editor
update public.profiles
set role = 'admin', status = 'active'
where email = 'you@example.com';
```

---

## 5. Security model

The security story is enforced in the database, not in the React components.

**Roles and status.** `profiles.role` is `visitor | client | admin` and
`profiles.status` is `pending | active | suspended | banned`. Sign-up always creates
`client` + `pending` — there is no role field in the form, and the
`handle_new_user` trigger ignores anything the client sends. Admin access is granted
only by an SQL statement or the studio's "Make admin" action.

**Privilege escalation is blocked by a trigger.** A signed-in client may update their
own profile row, but `guard_profile_privileged_columns` restores `role`, `status`,
`email` and `created_at` from the previous row unless the caller passes `is_admin()`.
Sending `{"role":"admin"}` from the browser does nothing.

**Row Level Security** (see `supabase/migrations/20250601000100_creator_platform_rls.sql`):

| Data | Anonymous | Client | Admin |
| --- | --- | --- | --- |
| Published videos / gallery | read | read | full |
| Active audio track | read | read | full |
| `site_content` (the site copy) | read | read | write |
| Contact message | insert only | — | full |
| Client message | — | insert as self, read own | full |
| Sponsorship lead | insert only | insert as self, read own | full |
| Broadcasts | public announcements only | own deliveries only | full |
| `chat_knowledge` | **no access** | **no access** | full |
| `profiles` | **no access** | own row | full |
| `audit_logs` | **no access** | **no access** | append + read |

Suspended and banned accounts fail `is_signed_in_in_good_standing()`, so client data
reads return nothing even if a page were bypassed.

**Storage.** `gallery`, `audio` and `avatars` are public-read; writes are admin-only
except an avatar inside a client's own `${userId}/` folder.

**Secrets.** `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` exist only in the
functions. `netlify/functions/admin-delete-client.mjs` re-derives the caller's identity
from their JWT against the Supabase auth server and re-checks `role = 'admin' AND
status = 'active'` in Postgres before deleting anything; it also refuses to delete the
caller's own account or another admin.

**Costs and abuse.** Public forms use a honeypot field plus a per-browser submission
limit; the chat function validates shape, length and turn count, rate limits per IP,
and caps output tokens. Chat answers are grounded in the admin-managed knowledge base
rather than open-ended.

---

## 6. Feature map

**Public**

* `/` — cinematic hero, featured video, content pillars, about preview, latest videos,
  featured message from Arian, gallery preview with lightbox, sponsorship explainer,
  assistant teaser, closing CTA.
* `/videos` — search, filter by game and category, sort by newest or featured.
* `/gallery` — masonry grid, category filter, keyboard-navigable lightbox.
* `/about` — identity, games, six content categories, journey timeline, Arian's message.
* `/sponsor`, `/contact` — validated forms with honeypot, rate limiting, success and
  error states. No account required.
* `/chat` — Arian Assistant, plus the floating widget on every public page.
* `/privacy`, `/terms` — honest documents describing what the site actually does.

**Client dashboard**

Overview with real status and activity, an inbox of messages from Arian
(direct replies + delivered broadcasts), a message form, a sponsorship enquiry form
with status tracking, and profile management with avatar upload.

**Admin studio**

Collapsible sidebar, real counts on the overview, and full management of
videos (paste a URL — the id and thumbnail are derived), gallery (drag-and-drop upload
with browser-side compression and progress), audio (one active track), clients
(approve / suspend / ban / unban / promote / delete with confirmations), the unified
inbox (public, client and sponsorship, with reply), broadcasts (one client, all active
clients, or a public announcement — with delivery records), site content, chatbot
knowledge, and the audit log.

---

## 7. Project layout

```
netlify.toml                  build, SPA fallback, /api/* → functions, CSP + security headers
netlify/functions/chat.mjs    Gemini proxy: validation, rate limit, knowledge injection
netlify/functions/admin-delete-client.mjs   service-role account deletion, admin-verified
supabase/migrations/          schema (tables, indexes, triggers) + RLS & storage policies
supabase/seed.sql             editable site copy + chatbot knowledge (no fake content)
public/                       favicon, social card, robots.txt, sitemap.xml
src/components/               design-system primitives and feature components
src/hooks/                    auth provider, site content query, SEO
src/lib/                      youtube parsing, placeholder art, demo data, rate limiting
src/pages/{public,auth,client,admin}/
src/services/                 the only place that talks to Supabase
src/validation/schemas.ts     every form contract, shared by pages and tests
```

---

## 8. Scripts

```bash
bun run dev        # Vite dev server (no /api/* functions — use netlify dev for those)
bun run typecheck  # tsc -b --noEmit
bun run lint       # eslint, zero warnings allowed
bun run test       # vitest: 45 tests
bun run build      # production build → dist/
```

### Tests

| File | Covers |
| --- | --- |
| `src/lib/youtube.test.ts` | every YouTube URL shape, lookalike hosts, thumbnail/watch/embed URLs |
| `src/validation/schemas.test.ts` | public forms, honeypot, signup (including "no role field"), video/duration, broadcast targeting |
| `src/schemaContract.test.ts` | every `.from().select()` in `src/services` resolves to a real table **and** real columns — including column lists held in constants — plus key RLS invariants |
| `src/pages/public/publicPages.smoke.test.tsx` | public pages render in demo mode with labelled, required form fields and alt text on every image |
| `src/App.test.tsx` | the real app shell boots: providers, public routing, redirect-to-login for `/dashboard` and `/admin`, and the 404 route |

The schema contract test is the important one: it catches the PostgREST-400 class of bug
(a column that typechecks but does not exist), which is otherwise only discovered at
runtime.

---

## 9. Accessibility & performance

* Semantic landmarks, one `h1` per page, skip link, visible focus rings in the accent
  colour, 44px minimum interactive targets, and screen-reader-labelled controls.
* Motion is purposeful and `prefers-reduced-motion` is fully respected — reveals,
  parallax, cursor glow and the grain overlay all stand down.
* Routes other than `/` are code-split; gallery images lazy-load; YouTube thumbnails are
  fetched from `i.ytimg.com` at the smallest size that stays sharp.
* Every page sets title, description, Open Graph and Twitter tags, and a canonical URL.
  `public/sitemap.xml` and `public/robots.txt` (which disallows `/dashboard`, `/admin`
  and `/api/`) are included.

---

## 10. Content honesty

Nothing in this project invents a fact about Arian. There is no real name, address,
phone number, email, subscriber count, award, sponsor or testimonial anywhere in the
code or the seed data. Gallery images, music and videos are uploaded by Arian; the
assistant is instructed to refuse personal questions and to say it does not know.
Anything not supplied is a clearly-marked placeholder that the studio can edit.

Game names, characters and assets belong to their respective owners. This site is an
independent creator project and is not affiliated with or endorsed by HoYoverse,
Kuro Games or any other publisher.
