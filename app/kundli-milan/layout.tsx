import type { Metadata } from 'next';
import { KUNDLI_PRICE_INR } from '@/lib/pricing/kundli';

export const metadata: Metadata = {
  title: 'Kundli Milan — 36 Guna Marriage Matching',
  description:
    'Ashtakoota Guna Milan from both birth details: score out of 36, all 8 kootas, Nadi and Bhakoot dosha analysis. Full result with emailed report for ₹99.',
  alternates: { canonical: '/kundli-milan' },
  openGraph: {
    title: 'Kundli Milan — Vedic Marriage Compatibility',
    description:
      'Ashtakoota Guna Milan out of 36 from both birth charts — full result and emailed report for ₹99.',
    url: '/kundli-milan',
  },
};

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://thedivinetarotonline.com';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Kundli Milan (Ashtakoota Guna Milan)',
  serviceType: 'Vedic marriage compatibility',
  description:
    'Ashtakoota Guna Milan from both birth details: score out of 36, all 8 kootas, Nadi and Bhakoot dosha analysis, with a detailed report by email.',
  provider: { '@type': 'Organization', name: 'The Divine Tarot', url: SITE },
  url: `${SITE}/kundli-milan`,
  offers: { '@type': 'Offer', price: KUNDLI_PRICE_INR, priceCurrency: 'INR', url: `${SITE}/kundli-milan` },
};

export default function KundliMilanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
