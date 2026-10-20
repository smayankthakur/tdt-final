import Link from 'next/link';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">404</p>
      <h1 className="mt-3 font-heading text-3xl text-white md:text-4xl">This page could not be found</h1>
      <p className="mt-4 text-gray-300">The link may be old. Everything now lives on one site.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400">Home</Link>
        <Link href="/reading" className="rounded-full border border-amber-500/40 px-5 py-2.5 text-sm text-amber-300 hover:border-amber-400">Ginni Ki Baatein</Link>
        <Link href="/support" className="rounded-full border border-amber-500/40 px-5 py-2.5 text-sm text-amber-300 hover:border-amber-400">Support</Link>
      </div>
    </section>
  );
}
