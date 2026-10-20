import type { Metadata } from 'next';
import CourseCard from '@/components/courses/CourseCard';
import { RECORDED_COURSES, priceNumber } from '@/lib/courses/data';

export const metadata: Metadata = {
  title: 'Tarot, Runes, Dice & Candle Wax Courses',
  description:
    'Learn tarot, runes, dice and candle wax reading with Bharti Singh — five self-paced video courses, beginner to advanced, with a certificate on completion.',
  alternates: { canonical: '/courses' },
  openGraph: {
    title: 'Courses | The Divine Tarot',
    description: 'Self-paced divination courses — tarot, runes, dice and candle wax reading.',
    url: '/courses',
  },
};

// Re-checked every 5 minutes so "Booking Closed!" appears on time even for cached copies.
export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://thedivinetarotonline.com';

const ENROL_STEPS = [
  'Click “Enrol Now” and pay the course fee on Razorpay. Your receipt and invoice arrive by email straight away.',
  'Within two days you receive a second email with the course link, your login ID and password.',
  'Log in and start the videos. Access to recorded videos lasts one year, so keep a notebook handy and take notes.',
  'When you finish the course, your certificate is emailed to you.',
];

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
    <div className="pb-16">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(ellipse_at_top,rgba(255,215,0,0.10),transparent_60%)]">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center md:py-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#FFD700]/80">Learn the sacred arts</p>
          <h1 className="font-heading text-4xl font-bold text-white md:text-5xl">Our Courses</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#A1A1AA] md:text-lg">
            From your very first tarot spread to professional readings — learn to read the cards, runes, wax and dice,
            and give guidance that truly resonates.
          </p>
        </div>
      </section>

      <section id="recorded" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-16">
        <div className="mb-8 max-w-3xl">
          <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">Choose your path</h2>
          <p className="mt-2 text-[#A1A1AA]">Five self-paced video courses with one year of access and a certificate on completion.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RECORDED_COURSES.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <h3 className="font-heading text-xl font-semibold text-white">How to enrol</h3>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[#D4D4D8]">
            {ENROL_STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
    </div>
  );
}
