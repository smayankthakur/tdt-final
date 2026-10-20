'use client';

import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function SupportBanner() {
  const { t } = useLanguage();
  return (
    <section className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex flex-col md:flex-row items-start gap-4 relative z-10">
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl shrink-0">
          <AlertCircle className="w-7 h-7 text-gold" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 font-serif">{t('support.title')}</h1>
          <p className="text-slate-400 leading-relaxed text-sm md:text-base max-w-2xl">{t('support.intro')}</p>
        </div>
      </div>
    </section>
  );
}
