import type { MetadataRoute } from 'next';
import { COURSES } from '@/lib/courses/data';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://thedivinetarotonline.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  type Freq = MetadataRoute.Sitemap[number]['changeFrequency'];
  const pages: Array<[string, number, Freq]> = [
    ['', 1.0, 'daily'],
    ['/reading', 0.95, 'daily'],
    ['/personal-reading', 0.9, 'weekly'],
    ['/courses', 0.9, 'weekly'],
    ['/kundli-milan', 0.85, 'monthly'],
    ['/premium', 0.8, 'weekly'],
    ['/about', 0.7, 'monthly'],
    ['/support', 0.5, 'monthly'],
    ['/contact', 0.5, 'monthly'],
    ['/privacy', 0.3, 'yearly'],
    ['/terms', 0.3, 'yearly'],
    ['/refund-policy', 0.3, 'yearly'],
    ['/delete-account', 0.2, 'yearly'],
  ];
  return [
    ...pages.map(([path, priority, changeFrequency]) => ({ url: `${BASE_URL}${path}`, lastModified: now, changeFrequency, priority })),
    ...COURSES.map((c) => ({
      url: `${BASE_URL}/courses/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as Freq,
      priority: c.kind === 'live' ? 0.7 : 0.6,
    })),
  ];
}
