import { Section } from "../../components/ui/Section";
import { useSeo } from "../../hooks/useSeo";

export default function Terms() {
  useSeo("Terms & Conditions — Bokaro Defence Academy");
  return (
    <Section tone="offwhite">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-extrabold text-navy">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-muted">Last updated: template version — academy to review before go-live.</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">1. Use of this website</h2>
            <p className="mt-2">
              This website provides information about the academy's courses and services, and a portal for enrolled
              students and staff. Content may not be reproduced without permission.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">2. Admissions and schedules</h2>
            <p className="mt-2">
              Course availability, batch timings and fees are confirmed at the academy office. Information on this
              website is indicative and updated by the academy team.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">3. Student accounts</h2>
            <p className="mt-2">
              Student portal accounts are created by the academy. Keep your password confidential; you are
              responsible for activity under your account. Accounts may be deactivated by the academy.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">4. Published results</h2>
            <p className="mt-2">
              Student achievements and testimonials are published only with the student's consent. Results published
              on this site reflect academy records.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">5. Contact</h2>
            <p className="mt-2">Questions about these terms can be sent via the Contact page.</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
