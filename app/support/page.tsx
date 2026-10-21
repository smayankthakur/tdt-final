import type { Metadata } from 'next';
import SupportBanner from '@/components/support/SupportBanner';
import SupportForm from '@/components/support/SupportForm';

export const metadata: Metadata = {
  title: 'Support — Payments, Login & Bookings',
  description:
    'Locked out after buying a reading pass, double charged, a booking or course question, or found a bug? Open a support ticket and we reply within 24 hours.',
  alternates: { canonical: '/support' },
};

export default function SupportPage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-[#FFD700]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-coral/5 blur-[120px]" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-10 md:py-16">
        <SupportBanner />
        <SupportForm />
      </div>
    </div>
  );
}
