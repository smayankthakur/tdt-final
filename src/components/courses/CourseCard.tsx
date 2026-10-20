import Image from 'next/image';
import Link from 'next/link';
import type { Course } from '@/lib/courses/data';
import { isBookingClosed } from '@/lib/courses/data';
import EnrolButton from './EnrolButton';

export default function CourseCard({ course, priority = false }: { course: Course; priority?: boolean }) {
  const closed = isBookingClosed(course);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] transition-colors hover:border-[#FFD700]/40">
      <Link href={`/courses/${course.slug}`} className="relative block aspect-[4/5] overflow-hidden" aria-label={`${course.title} — details`}>
        <Image
          src={course.image}
          alt={course.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={priority}
        />
        <span className="absolute left-3 top-3 rounded-full border border-[#FFD700]/40 bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#FFD700]">
          {course.tag}
        </span>
        {closed && course.kind === 'live' && (
          <span className="absolute right-3 top-3 rounded-full bg-black/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80">
            Booking closed
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-heading text-lg font-semibold leading-snug text-white">
            <Link href={`/courses/${course.slug}`} className="hover:text-[#FFD700]">
              {course.title}
            </Link>
          </h3>
          <span className="shrink-0 text-lg font-bold text-[#FFD700]">{course.price}</span>
        </div>
        <p className="text-sm leading-relaxed text-[#A1A1AA]">{course.summary}</p>
        {course.kind === 'live' && (
          <ul className="flex flex-wrap gap-2" aria-label="Schedule">
            {course.schedule.map((s) => (
              <li key={s} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/80">
                {s}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <EnrolButton course={course} initialClosed={closed} />
          <Link
            href={`/courses/${course.slug}`}
            className="inline-flex min-h-[40px] items-center justify-center text-sm font-medium text-white/70 hover:text-white"
          >
            Course details →
          </Link>
        </div>
      </div>
    </article>
  );
}
