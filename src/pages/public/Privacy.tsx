import { Section } from "../../components/ui/Section";
import { useSeo } from "../../hooks/useSeo";

export default function Privacy() {
  useSeo("Privacy Policy — Bokaro Defence Academy");
  return (
    <Section tone="offwhite">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-extrabold text-navy">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: template version — academy to review before go-live.</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">1. What we collect</h2>
            <p className="mt-2">
              When you submit an inquiry, we collect the details you provide: your name, phone number, WhatsApp number,
              email, city, interested course and message. When you use the student portal, we process your profile,
              enrolment, attendance, test results and messages needed to run the academy.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">2. How we use it</h2>
            <p className="mt-2">
              We use your information to respond to inquiries, run admissions, deliver classes and results, and
              communicate notices. We do not sell your data. Public testimonials or results are only published with
              the recorded consent of the student.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">3. Storage and security</h2>
            <p className="mt-2">
              Data is stored in a managed cloud database with row-level security. Access is restricted to authorised
              academy staff based on their role. Passwords are stored only as secure hashes by our authentication
              provider.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">4. Your choices</h2>
            <p className="mt-2">
              You may request correction or removal of your personal data by contacting the academy office. Student
              academic records are retained as required for administration and may be archived rather than deleted.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">5. Contact</h2>
            <p className="mt-2">For privacy questions, contact the academy office using the details on our Contact page.</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
