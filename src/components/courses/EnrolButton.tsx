'use client';

import { useEffect, useState } from 'react';
import type { Course } from '@/lib/courses/data';
import { isBookingClosed, formatBookingEnd } from '@/lib/courses/data';

/**
 * The pay button for a course. The server decides the first state; the
 * browser re-checks the cutoff right after load and every minute, so a page
 * that was rendered (or cached) before the cutoff never keeps selling a
 * batch that has closed.
 */
export default function EnrolButton({
  course,
  initialClosed,
  size = 'md',
  showCutoff = false,
}: {
  course: Course;
  initialClosed: boolean;
  size?: 'md' | 'lg';
  showCutoff?: boolean;
}) {
  const [closed, setClosed] = useState(initialClosed);

  useEffect(() => {
    const check = () => setClosed(isBookingClosed(course));
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [course]);

  const pad = size === 'lg' ? 'min-h-[52px] px-6 text-base' : 'min-h-[44px] px-5 text-sm';
  const cutoff = course.kind === 'live' ? formatBookingEnd(course) : null;

  if (closed) {
    return (
      <div>
        <span
          className={`inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 font-semibold text-white/60 ${pad}`}
          aria-disabled="true"
        >
          Booking Closed!
        </span>
        {showCutoff && (
          <p className="mt-2 text-center text-xs text-[#A1A1AA]">
            This batch is no longer taking bookings. Ask us on the Support page about the next one.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <a
        href={course.payLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex w-full items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-r from-[#FF4D4D] to-[#FFD700] font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95 ${pad}`}
      >
        Enrol Now — {course.price}
      </a>
      {showCutoff && cutoff && (
        <p className="mt-2 text-center text-xs text-[#A1A1AA]">Bookings close {cutoff}.</p>
      )}
    </div>
  );
}
