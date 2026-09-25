# Known limitations & deliberate decisions

Written so that nothing below is discovered the hard way. Items are grouped by why they
are the way they are.

---

## 1. Needs a live Supabase project to verify end to end

The code is complete and typechecks, and the public site renders and is tested in demo
mode. These flows can only be runtime-verified once the migrations are applied and the
Supabase keys are set:

* data round-trips (add a video → see it publicly; upload → lightbox; approve → inbox
  unlocks);
* storage uploads, including the browser-side WebP compression path;
* the RLS policies under real multi-role sessions. They are written and reviewed but
  should be exercised with the manual plan in `SETUP-AND-TESTING.md`;
* email deliverability. Supabase's default mailer is rate limited, so password reset
  and verification should be tested with custom SMTP configured;
* the Netlify functions. `netlify dev` or a deployed branch is required — `vite dev`
  alone does not serve `/api/*`, which the assistant handles by falling back to Arian's
  brief.

## 2. Features intentionally not built

1. **Email delivery for broadcasts and replies.** The studio stores everything in the
   website inbox and says so in the UI; it never claims an email was sent. Adding
   transactional email (for example outbound replies to contact-form senders) needs a
   provider account and is a contained follow-up inside
   `netlify/functions/`.
2. **Attachments on client messages.** The UI states that attachments are not enabled
   yet. Private file exchange needs a moderation policy and virus scanning before it is
   safe to expose, so it was left out rather than half-built.
3. **Payments.** Sponsorship is an enquiry pipeline, not a checkout. No payment
   provider is integrated and no fee is implied anywhere in the copy.
4. **YouTube Data API sync.** Videos are added by pasting a link; nothing is scraped or
   polled, and view counts and comment totals are deliberately not shown. A YouTube API
   sync would need a project key and quota management.
5. **Image transformation CDN.** Uploads are downscaled in the browser and stored as
   WebP, but there is no server-side responsive-image pipeline (Supabase image
   transformations or similar). Worth adding once the gallery is large.
6. **Bulk client import / export.** Accounts are moderated one at a time.
7. **Multi-language UI.** The interface is English; Arian's videos are Hindi and the
   assistant answers in the language it is asked in. Translating the shell is a
   follow-up.
8. **Rate limiting is best-effort.** Public forms use a honeypot plus a per-browser
   limit; the chat function limits per IP **in memory, per warm instance**. On a busy
   site this should move to a shared store (Upstash, Supabase table) — the code is
   structured so only `checkRateLimit` in `netlify/functions/chat.mjs` changes.

## 3. Placeholder-based content, by design

Every creator-specific string is a placeholder that the studio can edit: brand name,
hero copy, about text, journey timeline, featured message, sponsorship copy, social
links, assistant prompts and SEO metadata. The seed file contains no invented real
name, address, phone number, email, subscriber count, sponsorship, award, team member
or testimonial — and the assistant is explicitly instructed never to invent one.

Demo-mode videos and gallery tiles are generated gradients, visibly labelled `Sample`,
so the layout can be judged without a single fake photograph.

## 4. Deliberate product decisions

* **Sign-up creates a pending client, never an admin.** There is no role control in any
  form; `handle_new_user` sets the role, and a trigger restores `role`/`status` on any
  self-update that is not from a verified admin.
* **Public announcements are broadcasts.** One concept (`audience_type`) covers
  messaging one client, all active clients, and the site-wide banner, so there is one
  delivery record trail rather than three.
* **Music is opt-in and off by default.** No autoplay, mute preference remembered, panel
  dismissible, and the player only appears when a track is set active.
* **Featured video is exclusive.** Marking a video as featured clears the previous one,
  so the homepage never depends on row order.
* **Alt text is required.** Gallery images cannot be saved without a meaningful
  description, because retrofitting alt text across a gallery never happens.
* **Suspended and banned are different.** Suspended reads as a temporary pause with a
  reassurance message; banned reads as removed access. Both are enforced in RLS, not
  only in the route guards.
* **Account deletion is behind a function.** Only an active admin can trigger it, it
  cannot be used on yourself or another admin, and the UI recommends suspend/ban first.
* **Arian's name is used as the brand.** No attempt is made to guess a "real" full name
  for SEO; the wordmark and metadata use "Arian" exactly as the channel does.

## 5. Recommended next steps

1. Connect Supabase, run the three SQL files, deploy the functions, then walk the
   manual test plan in `docs/SETUP-AND-TESTING.md`.
2. Replace every placeholder via **Studio → Settings** and upload real videos, gallery
   images and (optionally) music.
3. Configure custom SMTP in Supabase for reliable verification and reset email.
4. Add a real social share image (PNG or JPG at 1200×630 — `public/og-image.svg` is a
   stopgap because some crawlers do not rasterise SVG) and point `seo.og_image_url` at
   it once storage is connected.
5. Update `public/sitemap.xml`, `public/robots.txt` and the canonical URL in
   `index.html` to the production domain.
