import { Section } from "../../components/ui/Section";
import { useSeo } from "../../hooks/useSeo";

export default function RefundPolicy() {
  useSeo("Refund & Cancellation Policy — Bokaro Defence Academy");
  return (
    <Section tone="offwhite">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-extrabold text-navy">Refund &amp; Cancellation Policy</h1>
        <p className="mt-2 text-sm text-muted">
          Last updated: template version — the academy must review and set its actual policy before go-live.
        </p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">1. Fee payments</h2>
            <p className="mt-2">
              Fees are collected at the academy office. The refund policy below is a starting template and must be
              confirmed by the academy management.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">2. Cancellation before batch start</h2>
            <p className="mt-2">
              Requests made before the batch start date may be eligible for a refund as per the academy's written
              policy available at the office.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">3. After batch commencement</h2>
            <p className="mt-2">
              Once classes begin, fees are generally non-refundable, as seats and materials are reserved for the
              student.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">4. Disputes</h2>
            <p className="mt-2">
              Any refund dispute will be resolved by the academy management. Contact the office with your payment
              receipt.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
