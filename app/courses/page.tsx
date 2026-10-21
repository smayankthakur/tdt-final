import type { Metadata } from 'next';
import LearnPage from '@/components/learn/LearnPage';
import { RECORDED_COURSES, priceNumber } from '@/lib/courses/data';

// Same title and description as the old learn.thedivinetarotonline.com page.
export const metadata: Metadata = {
  title: 'Our Courses',
  description:
    'Learn tarot, runes, candle wax and dice reading with The Divine Tarot. Beginner to advanced spiritual courses to master divination and give accurate readings.',
  alternates: { canonical: '/courses' },
  openGraph: {
    title: 'Our Courses | The Divine Tarot',
    description: 'Master tarot, runes, candle wax and dice reading — beginner to advanced spiritual courses.',
    url: '/courses',
    type: 'website',
  },
};

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://thedivinetarotonline.com';

export default function CoursesPage() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: RECORDED_COURSES.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Course',
        name: c.title,
        description: c.summary,
        url: `${SITE}/courses/${c.slug}`,
        provider: { '@type': 'Organization', name: 'The Divine Tarot', sameAs: SITE },
        offers: { '@type': 'Offer', price: priceNumber(c), priceCurrency: 'INR', category: 'Recorded course' },
      },
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <LearnPage />
    </>
  );
}
