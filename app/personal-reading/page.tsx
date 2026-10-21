import Landing from '@/components/booking/Landing';
import { offerActive, OFFER, REGULAR_PRICE, URGENT_PRICE } from '@/lib/booking/offer';

// Re-rendered at least every 5 minutes, so the festival offer switches off by itself.
export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://thedivinetarotonline.com';

export default async function PersonalReadingPage(props: { searchParams: Promise<{ payment?: string }> }) {
  const searchParams = await props.searchParams;
  const offer = offerActive();
  const failed = searchParams?.payment === 'failed';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Personal Tarot & Astrology Reading (40-minute voice call)',
    provider: { '@type': 'Person', name: 'Bharti Singh', worksFor: { '@type': 'Organization', name: 'The Divine Tarot', url: SITE } },
    areaServed: 'Worldwide',
    url: `${SITE}/personal-reading`,
    offers: [
      {
        '@type': 'Offer',
        name: 'Call Reading',
        price: offer ? OFFER.price : REGULAR_PRICE,
        priceCurrency: 'INR',
        // The festival price ends on its own; tell search engines when.
        ...(offer ? { priceValidUntil: new Date(OFFER.until).toISOString().slice(0, 10) } : {}),
      },
      { '@type': 'Offer', name: 'Urgent Call Reading (within 48 hours)', price: URGENT_PRICE, priceCurrency: 'INR' },
    ],
  };
  return (
    <>
      {failed && (
        <div role="alert" className="pay-failed-banner">
          Payment was not completed, so nothing was charged. You can try again below — or open a ticket on the Support page if money left your account.
        </div>
      )}
      <Landing offer={offer} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
