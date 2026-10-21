'use client';

import ClientProviders from '@/components/ClientProviders';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import UniversalProtectionOverlay from '@/components/security/UniversalProtectionOverlay';
import ContentGuard from '@/components/ContentGuard';
import { usePathname } from 'next/navigation';

const under = (path: string, bases: string[]) => bases.some((b) => path === b || path.startsWith(b + '/'));

// Sections that were their own sites keep their own look:
// - courses and personal reading bring their own header and footer;
// - the "The Divine Tarot" watermark was only ever on the main site.
const OWN_HEADER = ['/courses', '/personal-reading'];
// The reading and support sites loaded the brand fonts for the whole page,
// header and footer included.
const BRAND_FONTS = ['/reading', '/support', '/delete-account', '/reset-password'];
// Line height the old reading / support sites had on <body> (the main site uses 1.7).
const lineHeightFor = (path: string) =>
  under(path, ['/reading', '/reset-password']) ? 'normal' : under(path, ['/support', '/delete-account']) ? 1.5 : undefined;
const NO_WATERMARK = ['/reading', '/courses', '/personal-reading', '/support', '/delete-account', '/reset-password', '/newsletter'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const ownHeader = under(pathname, OWN_HEADER);
  return (
    <div
      className={`min-h-screen text-[rgb(var(--foreground))]${under(pathname, BRAND_FONTS) ? ' brand-fonts' : ''}`}
      style={lineHeightFor(pathname) !== undefined ? { lineHeight: lineHeightFor(pathname) } : undefined}
    >
      {!under(pathname, NO_WATERMARK) && <UniversalProtectionOverlay />}
      <ContentGuard>
        <ClientProviders>
          <div className="flex min-h-screen flex-col">
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-amber-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
            >
              Skip to content
            </a>
            {!ownHeader && <Header />}
            <main id="main" tabIndex={-1} className="relative flex-1 focus:outline-none">
              {children}
            </main>
            {!ownHeader && <Footer />}
          </div>
        </ClientProviders>
      </ContentGuard>
    </div>
  );
}
