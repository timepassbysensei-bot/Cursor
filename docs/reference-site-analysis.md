# Reference Site Analysis

Reference sites studied for **information-architecture and UX inspiration only**:

- https://mishrainstitute.com/
- https://defenceacademyranchi.in/

> **Copyright confirmation:** No source code, written content, logos, branding,
> photographs, student results, testimonials, exact layouts or exact wording were
> copied from either reference site. Both sites were used only to identify common
> *patterns* (section order, CTA placement, trust-building approaches), after which
> an original visual identity, original copy and an original component structure
> were created for Bokaro Defence Academy. All sample copy in this project is
> clearly labelled `[Sample …]` in the database seed and is editable from the
> admin dashboard.

---

## 1. Patterns observed on the reference sites

### mishrainstitute.com

Useful sections and patterns found:

- **Hero with strong headline + dual CTA** — an admission-focused headline with
  "Apply/Enquire" style actions placed above the fold, plus a phone number.
- **Top bar with contact details** — phone/email visible before the main menu,
  shortening the path to contact on mobile.
- **Course cards in a grid** — each exam (NDA/CDS/AFCAT-type entries) presented
  as a compact card with duration, eligibility highlights and a "view details"
  link.
- **"Why choose us" feature strip** — 4–6 icon+text tiles right after the course
  section to answer "why this academy".
- **Results/selections section** — student photos and exam names used as social
  proof, placed prominently on the homepage.
- **Testimonials slider** — short quotes attributed to students/parents.
- **Notice/update board** — dated announcements near the top or in a sidebar.
- **Footer with quick links + contact block + legal pages.**

### defenceacademyranchi.in

Useful sections and patterns found:

- **Local, trust-first framing** — emphasis on being a trusted local option,
  with address, maps embed and "visit us" messaging repeated in several places.
- **Photo-first hero** — a campus/training photograph behind the headline.
- **Admission process steps** — a numbered, low-anxiety 3–5 step process with a
  form CTA at the end.
- **Batch/timing information** — upcoming batch tables with start dates.
- **Gallery categories** (classroom, physical training, events) rather than one
  undifferentiated photo dump.
- **FAQ accordion** — common parent questions answered inline.
- **Sticky/floating contact buttons** — call and WhatsApp always reachable.
- **Founder/director message** — a signed statement building personal trust.

### Shared admission/conversion patterns

Both sites funnel every section toward the same conversion: **submit an inquiry
form → get a counselling call**. Forms are short (name, phone, course of
interest) and are repeated in more than one place (hero-adjacent, mid-page and
footer-adjacent).

---

## 2. Visual and information-architecture patterns worth keeping

- Section flow: **Hero → About → Courses → Why-us → Journey/Process →
  Batches → Notices → Results → Testimonials → Gallery → FAQs → Final CTA →
  Contact**.
- One primary CTA color (used sparingly), one secondary outline CTA.
- Dated, pinned notices that expire automatically.
- Mobile drawer navigation with the login/apply actions duplicated at the
  bottom of the drawer where the thumb is.

## 3. Course and admission patterns

- Courses presented as **outcome-named cards** (target exam first, not
  internal jargon), each with duration, eligibility and mode.
- Each course has a **detail page** (not just a modal) so it can be shared as a
  link and indexed by search engines.
- Admission reduced to **4 explicit steps** ending in enrolment, with a
  document checklist so families arrive prepared.
- Fee figures are either confirmed at counselling or clearly marked — never
  invented.

## 4. Trust-building techniques observed

- Real, dated notices (not static text).
- Consent-based, exam-specific result mentions.
- Testimonials with name + course context.
- A visible founder/director message.
- Gallery showing real activity, categorised.
- Contact details repeated in header, footer and floating buttons.

## 5. Mobile observations

- Both sites place **call/WhatsApp within one tap at all times** — retained
  here as optional floating buttons controlled by feature flags.
- Dense tables don't work on phones — batch lists become **cards** on mobile.
- Menus need large touch targets and must close after navigation.
- The inquiry form must be usable one-handed: large inputs, numeric keypads
  for phone fields, and the consent checkbox above the submit button.

## 6. Usability problems on the references to avoid

- Wall-of-text sections with no visual hierarchy.
- Results shown as tiny, unverifiable screenshots.
- Broken or missing links in footers (several dead legal links were found).
- One giant image gallery with no categorisation and slow loading.
- Course pages that exist only as PDF downloads.
- No loading/empty states — sections simply blank while data loads.
- Auto-playing carousels and marquee text that harm accessibility.
- No reduced-motion handling for animations.

## 7. What was adapted for Bokaro Defence Academy

- The reference section flow was adopted, then **extended with a
  data-backed notice board, upcoming-batches section and FAQ section that are
  all managed from the admin dashboard** (notices expire automatically;
  FAQs feed the chatbot).
- Course cards link to full **course detail pages** driven by the database.
- The inquiry form captures **UTM parameters and source page** so the office
  can see what is converting, then manages leads through an inquiry CRM with
  statuses, follow-up dates and internal notes.
- The results section is **consent-gated at the database level**: an
  achievement cannot appear publicly unless `consent_recorded` is true and
  status is published.
- Floating call/WhatsApp/apply buttons are **feature-flagged** so staff can
  turn them off without a redeploy.

## 8. How the new website improves on the references

- **Real backend**: every public section renders from Supabase with proper
  loading, error, and empty states instead of hardcoded content.
- **Three dashboards** (admin, teacher, student) for academy operations —
  attendance, tests, marks (with publish gating), assignments, resources,
  notices — none of which the reference sites offer.
- **Honest content model**: fees, address, phone, results and testimonials all
  start blank or clearly-labelled as samples and are meant to be filled in by
  the academy; nothing fabricated can ship to production by default.
- **Accessibility**: keyboard-visible focus states, aria-labelled controls,
  reduced-motion support, semantic landmarks, and mobile card layouts instead
  of squeezed tables.
- **Audit trail**: content changes are logged automatically for accountability.

## 9. Copyright confirmation

As stated at the top: only *patterns* were studied. All code, copy, imagery
placeholders, branding (shield mark, navy/saffron palette), page structures and
wording in this repository are original work created for Bokaro Defence
Academy. Protected content from the reference sites — text, images, logos,
student data — was **not** copied or reproduced.
