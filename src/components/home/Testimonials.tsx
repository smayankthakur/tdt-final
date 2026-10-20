'use client';

import { motion } from 'framer-motion';
import { Star, CirclePlay, Camera } from 'lucide-react';
import PremiumCarousel from '@/components/ui/PremiumCarousel';
import { useLanguage } from '@/hooks/useLanguage';
import { TESTIMONIALS } from '@/data/testimonials';

const COMMUNITY = [
  { name: 'The Divine Tarot on YouTube', href: 'https://youtube.com/@TheDivineTarot', icon: CirclePlay, note: '7 lakh+ subscribers' },
  { name: 'Second YouTube channel', href: 'https://youtube.com/@thedivineetarot', icon: CirclePlay, note: 'More readings and live sessions' },
  { name: 'Instagram', href: 'https://instagram.com/thedivineetarot', icon: Camera, note: '@thedivineetarot' },
];

export default function Testimonials() {
  const { t, isHydrated } = useLanguage();

  return (
    <section className="overflow-hidden bg-background py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="font-heading text-2xl text-foreground md:text-3xl lg:text-4xl">
            {isHydrated ? t('testimonials.title') : 'What Seekers Say'}
          </h2>
          <p className="mt-4 text-foreground-muted">
            {TESTIMONIALS.length
              ? isHydrated
                ? t('testimonials.subtitle')
                : 'What seekers are saying about their journey'
              : 'Join the community where seekers share their readings every day.'}
          </p>
        </motion.div>

        {TESTIMONIALS.length > 0 ? (
          <PremiumCarousel itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }} autoScroll autoScrollInterval={25000}>
            {TESTIMONIALS.map((item) => (
              <div
                key={item.name + item.text.slice(0, 12)}
                className="flex h-full flex-col rounded-2xl border border-gold-10 bg-surface-60 p-6 transition-all duration-300 hover:border-gold-30"
              >
                {item.rating ? (
                  <div className="mb-4 flex gap-1" aria-label={`${item.rating} out of 5`}>
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-gold text-gold" aria-hidden />
                    ))}
                  </div>
                ) : null}
                <p className="mb-6 flex-grow text-sm italic leading-relaxed text-foreground-secondary">&ldquo;{item.text}&rdquo;</p>
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-foreground-muted">via {item.source}</p>
                </div>
              </div>
            ))}
          </PremiumCarousel>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {COMMUNITY.map((c) => (
              <a
                key={c.href}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-[#FFD700]/40"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFD700]/10">
                  <c.icon className="h-6 w-6 text-[#FFD700]" aria-hidden />
                </span>
                <span>
                  <span className="block font-medium text-white">{c.name}</span>
                  <span className="block text-sm text-[#A1A1AA]">{c.note}</span>
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
