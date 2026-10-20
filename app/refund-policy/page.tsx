import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, Section } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'When payments to The Divine Tarot can and cannot be refunded or rescheduled — reading pass, personal readings and courses.',
  alternates: { canonical: '/refund-policy' },
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      updated="20 October 2026"
      intro={
        <p>
          Please read this before you pay. If something went wrong with a payment, open a ticket on the{' '}
          <Link href="/support" className="text-[#FFD700] underline underline-offset-2">Support page</Link> with your registered email and a payment
          screenshot — we reply within 24 hours.
        </p>
      }
    >
      <Section title="Charged but no access, or charged twice">
        <p>
          If you were charged but your pass, booking or course did not unlock, or you were charged twice for the same thing, we will
          either give you the access you paid for or refund the extra charge in full. Approved refunds go back to the original payment
          method through Razorpay, usually within 5–7 working days.
        </p>
      </Section>

      <Section title="Ginni Ki Baatein reading pass">
        <p>
          The pass is a one-time payment that does not renew, so there is nothing to cancel. Once the pass is active and readings are
          unlocked, it is non-refundable.
        </p>
      </Section>

      <Section title="Personal readings">
        <ul className="list-disc space-y-2 pl-5">
          <li>Payments for personal readings are non-refundable.</li>
          <li>We wait 5 minutes after your slot starts; after that the appointment is treated as missed.</li>
          <li>Once your slot time is over, the appointment cannot be rescheduled and no refund is given.</li>
        </ul>
      </Section>

      <Section title="Courses">
        <ul className="list-disc space-y-2 pl-5">
          <li>Recorded courses are non-refundable once your course login details have been sent.</li>
          <li>Live batches are non-refundable once booking has closed for that batch. If we cancel or move a batch, you can join the new dates or get a full refund.</li>
        </ul>
      </Section>
    </LegalPage>
  );
}
