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
            <Header />
            <main id="main" className="relative min-h-0 flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </ClientProviders>
      </ContentGuard>
    </div>
  );
}
