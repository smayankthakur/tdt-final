import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import LearnPage from '@/components/learn/LearnPage';
import { LEARN_KEY_BY_SLUG } from '@/components/learn/learnHtml';
import { getCourse, priceNumber } from '@/lib/courses/data';

// A course's own address: the old course page with that course's details
// open, as when you click "Course Details" there.

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://thedivinetarotonline.com';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const course = getCourse(slug);
  if (!course) return { title: 'Our Courses' };
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
  const { slug } = await props.params;
  const course = getCourse(slug);
  const key = LEARN_KEY_BY_SLUG[slug];
  // Old WordPress course URLs (and retired courses) go to the course list.
  if (!course || !key) permanentRedirect('/courses');

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
      availability: 'https://schema.org/InStock',
    },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: 'Self-paced' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LearnPage openKey={key} />
    </>
  );
}
