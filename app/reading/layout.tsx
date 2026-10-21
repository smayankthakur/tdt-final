import type { Metadata, Viewport } from 'next';
import '@/gkb/styles/gkb.css';
import BrandFonts from '@/components/system/BrandFonts';

export const metadata: Metadata = {
  title: 'Ginni Ki Baatein — Tarot Reading Chat',
  description:
    'Ask Ginni your question and draw your card — private Hinglish, Hindi and English tarot readings for love, marriage, career and life, from The Divine Tarot.',
  alternates: { canonical: '/reading' },
  openGraph: {
    title: 'Ginni Ki Baatein — Tarot Reading Chat | The Divine Tarot',
    description: 'Ask your question, pick your card, get your reading — in Hinglish, Hindi or English.',
    url: '/reading',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Ginni Ki Baatein — The Divine Tarot' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Chrome Android: shrink the layout viewport when the keyboard opens so
  // the chat composer stays above it.
  interactiveWidget: 'resizes-content',
};

export default function ReadingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="brand-fonts">
      <BrandFonts />
      {children}
    </div>
  );
}
