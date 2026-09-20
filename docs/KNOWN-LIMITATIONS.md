# Known Limitations & Honest Gaps

This document exists because several features cannot be *fully verified*
without a live Supabase project connected, and a few things are intentionally
out of scope for this pass. Nothing below is hidden behind fake UI.

## Requires a live Supabase project to verify end-to-end

The code is complete and typechecked, but these flows can only be
runtime-verified once the migrations are applied and `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY` are configured:

- Actual data round-trips (create course → see it publicly, marks → student
  results, attendance sync, submissions/grading).
- Edge functions `create-student` / `create-staff` (unit of logic reviewed,
  deployment not yet run).
- Email deliverability for password resets (depends on the Supabase project's
  SMTP configuration — by default Supabase uses a built-in mailer with strict
  rate limits; production should configure custom SMTP).
- RLS policy behaviour under real multi-role sessions (policies are written
  and reviewed but should be validated with the Supabase Policy linter and
  manual role tests after deploy).

## Known gaps / not yet implemented

1. **Online fee payments.** Enrolment and fee tracking are text-based. A
   payment gateway (Razorpay/UPI) is not integrated — this needs the academy's
   merchant account and KYC, so it was left out rather than mocked.
2. **Two-way messaging.** Student "Messages" is a one-way notice channel.
   True student↔staff messaging needs a moderation policy and notification
   infrastructure the academy hasn't chosen yet.
3. **Push notifications / SMS alerts.** Notice delivery is currently in-app
   only. SMS/WhatsApp broadcast integration requires a provider account.
4. **Bulk student import (CSV).** Accounts are created one at a time; a bulk
   importer is a straightforward follow-up.
5. **Image optimisation pipeline.** Uploaded images go to Storage as-is; a
   resize/WebP transform step (or Supabase image transformation on CDN) is
   recommended once real photos are in use.
6. **Timetable/calendar module.** Exam calendars are handled through notices;
   a structured calendar view was not built.
7. **Multi-language UI.** Copy is English; Hindi translation of the UI shell
   is a follow-up (the chatbot already answers in the question's language).

## Deliberate product decisions

- **Rankings default OFF.** `ranking_enabled` feature flag exists because
  publishing rank lists can be sensitive; staff must opt in.
- **Achievements require consent + publish.** Enforced in RLS, not just UI.
- **Missing marks are never zeros.** Students see "pending", teachers see
  "incomplete" — unit-tested in `marksMath`.
- **Fees text, not numbers.** The DB stores a display string so the academy
  can decide how much to publish; nothing is fabricated.
- **Delete = permanent only for content tables.** Academic records
  (enrollments, marks, attendance, submissions) use status fields
  (`archived`, `withdrawn`, etc.) instead of hard deletion.

## Recommended next steps

1. Connect Supabase, run migrations, deploy functions, then walk the manual
   QA checklist in `docs/SETUP-AND-TESTING.md`.
2. Replace all `[Sample …]` seed content via the admin dashboard and fill in
   real contact details (Site Settings) before going live.
3. Configure custom SMTP in Supabase for reliable password-reset email.
4. Add a CSV student importer and the payment gateway once accounts exist.
