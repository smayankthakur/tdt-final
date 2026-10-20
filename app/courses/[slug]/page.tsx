import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EnrolButton from '@/components/courses/EnrolButton';
import { getCourse, isBookingClosed, priceNumber } from '@/lib/courses/data';

// Rendered per request: every page carries the per-request CSP nonce, which
// pre-rendered HTML can't have.
export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://thedivinetarotonline.com';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const course = getCourse(params.slug);
  if (!course) return { title: 'Course not found' };
  return {
    title: course.title,
    description: course.summary,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: {
      title: `${course.title} | The Divine Tarot`,
      description: course.summary,
      url: `/courses/${course.slug}`,
      images: [{ url: course.image, alt: course.title }],
    },
  };
}

export default async function CoursePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const course = getCourse(params.slug);
  if (!course) notFound();
  const closed = isBookingClosed(course);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.summary,
    url: `${SITE}/courses/${course.slug}`,
    image: `${SITE}${course.image}`,
    provider: { '@type': 'Organization', name: 'The Divine Tarot', sameAs: SITE },
    offers: {
      '@type': 'Offer',
      price: priceNumber(course),
      priceCurrency: 'INR',
      url: `${SITE}/courses/${course.slug}`,
      availability: closed ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    },
    ...(course.startDate
      ? { hasCourseInstance: { '@type': 'CourseInstance', courseMode: course.tag.includes('Offline') ? 'Onsite' : 'Online', startDate: course.startDate } }
      : { hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: 'Self-paced' } }),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <nav className="mb-6 text-sm text-[#A1A1AA]" aria-label="Breadcrumb">
        <Link href="/courses" className="hover:text-white">Courses</Link> <span aria-hidden>›</span>{' '}
        <span className="text-white/80">{course.title}</span>
      </nav>
      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10">
          <Image src={course.image} alt={course.title} fill priority sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
        </div>
        <div className="flex flex-col gap-6">
          <div>
            <span className="inline-block rounded-full border border-[#FFD700]/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#FFD700]">
              {course.kind === 'live' ? 'Live batch' : 'Recorded course'} · {course.tag}
            </span>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-white md:text-4xl">{course.title}</h1>
            <p className="mt-2 text-2xl font-bold text-[#FFD700]">{course.price}</p>
            <p className="mt-4 leading-relaxed text-[#D4D4D8]">{course.summary}</p>
          </div>

          <ul className="flex flex-wrap gap-2" aria-label="Schedule and format">
            {course.schedule.map((s) => (
              <li key={s} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/85">{s}</li>
            ))}
          </ul>
          <p className="text-sm text-[#A1A1AA]">{course.formatNote}</p>

          <div className="max-w-sm">
            <EnrolButton course={course} initialClosed={closed} size="lg" showCutoff />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <section>
              <h2 className="mb-3 font-heading text-lg font-semibold text-white">What you will learn</h2>
              <ul className="space-y-2 text-sm text-[#D4D4D8]">
                {course.learn.map((l) => (
                  <li key={l} className="flex gap-2"><span className="text-[#FFD700]" aria-hidden>✦</span>{l}</li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="mb-3 font-heading text-lg font-semibold text-white">What you need</h2>
              <ul className="space-y-2 text-sm text-[#D4D4D8]">
                {course.need.map((l) => (
                  <li key={l} className="flex gap-2"><span className="text-[#FFD700]" aria-hidden>✦</span>{l}</li>
                ))}
              </ul>
            </section>
          </div>

          {course.kind === 'recorded' && (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-[#A1A1AA]">
              After payment you get your receipt by email immediately, and your course login within two days. Video access lasts one year; the certificate is emailed when you finish.
            </p>
          )}
          <p className="text-sm text-[#A1A1AA]">
            Questions before you join? <Link href="/support" className="text-[#FFD700] underline underline-offset-2">Ask us</Link> ·{' '}
            <Link href="/refund-policy" className="text-[#FFD700] underline underline-offset-2">Refund policy</Link>
          </p>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
