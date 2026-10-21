import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — Readings, Bookings & Courses',
  description:
    'Message The Divine Tarot about a reading pass, a personal reading with Bharti Singh, a course or Kundli Milan, and we reply by email.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact — The Divine Tarot',
    description: 'Message The Divine Tarot about readings, personal bookings, courses or Kundli Milan.',
    url: '/contact',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Contact The Divine Tarot' }],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
