import { COURSES, LIVE_COURSES, RECORDED_COURSES, getBookingEnd, isBookingClosed, formatBookingEnd, getCourse } from '@/lib/courses/data';

describe('course catalogue', () => {
  it('publishes exactly the 5 recorded courses (live batches kept unpublished)', () => {
    expect(LIVE_COURSES).toHaveLength(7);
    expect(RECORDED_COURSES).toHaveLength(5);
    expect(COURSES.map((c) => c.slug)).toEqual(RECORDED_COURSES.map((c) => c.slug));
    expect(getCourse('heal-within')).toBeUndefined();
    const slugs = [...COURSES, ...LIVE_COURSES].map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of [...COURSES, ...LIVE_COURSES]) {
      expect(c.payLink).toMatch(/^https:\/\/rzp\.io\//);
      expect(c.image).toMatch(/^\/courses\/.+\.webp$/);
    }
  });

  it('closes bookings at 11:59:59.999 PM IST two days before the start, whatever the server timezone', () => {
    const c = LIVE_COURSES.find((x) => x.slug === 'tarot-beginning-to-advance')!; // starts 23 Oct 2026
    const end = getBookingEnd(c)!;
    expect(end.toISOString()).toBe('2026-10-21T18:29:59.999Z'); // 21 Oct 23:59:59.999 IST
    expect(isBookingClosed(c, new Date('2026-10-21T18:29:00Z'))).toBe(false);
    expect(isBookingClosed(c, new Date('2026-10-21T18:30:00Z'))).toBe(true);
    expect(formatBookingEnd(c)).toBe('21 Oct 2026, 11:59 PM IST');
  });

  it('honours the manual "Booking Closed" override and never closes recorded courses', () => {
    expect(isBookingClosed(LIVE_COURSES.find((x) => x.slug === 'heal-within')!, new Date('2026-01-01T00:00:00Z'))).toBe(true);
    expect(isBookingClosed(getCourse('tarot-for-beginners')!, new Date('2099-01-01T00:00:00Z'))).toBe(false);
  });
});
