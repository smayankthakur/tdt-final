import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '₹199 30-Day Tarot Reading Pass',
  description:
    'Unlimited Ginni Ki Baatein tarot readings for 30 days — a one-time ₹199, no auto-renewal. All 16 questions, in Hinglish, Hindi or English.',
  alternates: { canonical: '/premium' },
  openGraph: {
    title: '₹199 30-Day Tarot Reading Pass — The Divine Tarot',
    description:
      'Unlimited tarot readings for 30 days — one-time ₹199, no auto-renewal.',
    url: '/premium',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '30-day tarot reading pass — The Divine Tarot' }],
  },
};

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
