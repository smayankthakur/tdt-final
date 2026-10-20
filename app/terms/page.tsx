import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, Section } from '@/components/legal/LegalPage';
import { PASS_PRICE_INR, PASS_DAYS } from '@/gkb/lib/pricing';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'The terms for using The Divine Tarot — the Ginni Ki Baatein reading pass, personal readings, courses and Kundli Milan.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="20 October 2026"
      intro={
        <p>
          These terms apply to everything on thedivinetarotonline.com, run by The Divine Tarot (Bharti Singh). By using the site or
          paying for any service you agree to them. Please read the{' '}
          <Link href="/refund-policy" className="text-[#FFD700] underline underline-offset-2">Refund &amp; Cancellation Policy</Link> and{' '}
          <Link href="/privacy" className="text-[#FFD700] underline underline-offset-2">Privacy Policy</Link> as well.
        </p>
      }
    >
      <Section title="Nature of our services">
        <p>
          Tarot, astrology, numerology, Kundli Milan and related readings are offered for guidance and self-reflection. They are
          not a substitute for medical, legal, financial or psychological advice, and you remain responsible for your own decisions.
          We do not provide readings on legal matters or court cases, share market, lottery or gambling, child gender prediction, or
          explicit/sexual questions, and we do not offer Tantra, Vashikaran, black magic or any unethical practice.
        </p>
        <p>Our services are meant for adults aged 18 or above.</p>
      </Section>

      <Section title="Your account (Ginni Ki Baatein)">
        <ul className="list-disc space-y-2 pl-5">
          <li>One account is for one person. Your name is saved on the account and readings are personal to you; accounts may not be shared.</li>
          <li>Keep your password private. You are responsible for activity on your account.</li>
          <li>Accounts that never buy a pass are deleted automatically about 24 hours after sign-up.</li>
          <li>You can ask us to delete your account at any time from the <Link href="/delete-account" className="text-[#FFD700] underline underline-offset-2">Delete your account</Link> page.</li>
        </ul>
      </Section>

      <Section title="The reading pass">
        <p>
          The pass costs ₹{PASS_PRICE_INR} and gives unlimited readings for {PASS_DAYS} days from the moment payment is confirmed. It is a
          one-time payment and does not renew automatically. There are no free readings. Referral bonus readings are granted only
          when the referred person buys their first pass.
        </p>
      </Section>

      <Section title="Personal readings (voice call)">
        <ul className="list-disc space-y-2 pl-5">
          <li>The call is 40 minutes on Google Meet, for up to 3 people whose details you submit in the form after payment.</li>
          <li>A standard booking gets the earliest free slot 7–10 days after payment; an Urgent booking gets a slot within 48 hours. Slot, Meet link and schedule are emailed after you submit the form.</li>
          <li>We wait a maximum of 5 minutes after your slot starts. If you have not joined by then, the appointment is treated as missed.</li>
          <li>Once your slot time is over the appointment cannot be rescheduled.</li>
          <li>Festival offers apply only to payments made within the stated offer period (India time).</li>
        </ul>
      </Section>

      <Section title="Courses">
        <ul className="list-disc space-y-2 pl-5">
          <li>Recorded courses: your login details are emailed within two days of payment, and video access lasts one year. A certificate is emailed on completion.</li>
          <li>Live batches: bookings close at 11:59 PM India time two days before the batch starts, or earlier if the batch is full. Schedules and venues are as shown on each course page and may be updated with notice.</li>
          <li>Course material is for your personal learning only and may not be recorded, copied, shared or resold.</li>
        </ul>
      </Section>

      <Section title="Kundli Milan">
        <p>
          The free Kundli Milan calculator gives an Ashtakoota guna score from approximate Moon positions. It is a guide for
          reflection, not a substitute for a professional jyotishi or your own judgement.
        </p>
      </Section>

      <Section title="Payments">
        <p>
          Payments are processed by Razorpay. Prices are in Indian Rupees and include any applicable taxes unless stated otherwise.
          We never see or store your card or UPI details.
        </p>
      </Section>

      <Section title="Intellectual property">
        <p>
          &ldquo;The Divine Tarot&rdquo; is a registered brand. Site content, readings, course material and images may not be copied or
          republished without written permission.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          To the extent the law allows, our liability for any claim relating to a service is limited to the amount you paid for that
          service.
        </p>
      </Section>

      <Section title="Governing law">
        <p>These terms are governed by the laws of India, and disputes are subject to the jurisdiction of the courts in India.</p>
      </Section>

      <Section title="Changes">
        <p>We may update these terms. The date at the top shows the latest version; continued use means you accept the update.</p>
      </Section>
    </LegalPage>
  );
}
