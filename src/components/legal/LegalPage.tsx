import Link from 'next/link';

export function LegalPage({ title, updated, intro, children }: { title: string; updated: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(244,197,66,0.10)_0%,transparent_55%)] opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-6 py-16 md:py-24">
        <header className="mb-10">
          <h1 className="mb-3 font-heading text-3xl text-white md:text-4xl">{title}</h1>
          <p className="text-sm text-[#A1A1AA]">Last updated: {updated}</p>
          <div className="mt-5 h-px w-24 bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent" />
        </header>
        <div className="space-y-8 text-[15px] leading-relaxed text-[#D4D4D8]">
          {intro}
          {children}
        </div>
        <p className="mt-12 text-sm text-[#A1A1AA]">
          Questions? Open a ticket on the <Link href="/support" className="text-[#FFD700] underline underline-offset-2">Support page</Link> or
          write to <a href="mailto:thedivinetarot111@gmail.com" className="text-[#FFD700] underline underline-offset-2">thedivinetarot111@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-heading text-xl text-white">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
