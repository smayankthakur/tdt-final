'use client';

import ClientProviders from '@/components/ClientProviders';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import UniversalProtectionOverlay from '@/components/security/UniversalProtectionOverlay';
import ContentGuard from '@/components/ContentGuard';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
      <UniversalProtectionOverlay />
      <ContentGuard>
        <ClientProviders>
          <div className="flex min-h-screen flex-col">
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-amber-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
            >
              Skip to content
            </a>
            <Header />
            <main id="main" tabIndex={-1} className="relative min-h-0 flex-1 focus:outline-none">
              {children}
            </main>
            <Footer />
          </div>
        </ClientProviders>
      </ContentGuard>
    </div>
  );
}
