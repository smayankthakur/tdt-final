import type { Metadata } from 'next';
import '@/components/booking/booking.css';

export const metadata: Metadata = {
  title: 'Book a Personal Reading with Bharti Singh',
  description:
    '40-minute voice-call reading with Bharti Singh on Google Meet — tarot, astrology, numerology and Kundli for up to 3 people. Urgent slots within 48 hours.',
  alternates: { canonical: '/personal-reading' },
  openGraph: {
    title: 'Personal Reading with Bharti Singh | The Divine Tarot',
    description: '40-minute voice-call reading on Google Meet — Tarot, Astro, Numero, Kundli & more.',
    url: '/personal-reading',
    images: [{ url: '/hero-bharti.jpg', alt: 'Bharti Singh — The Divine Tarot' }],
  },
};

export default function PersonalReadingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bk brand-fonts">
      {children}
    </div>
  );
}
