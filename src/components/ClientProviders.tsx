'use client';

import { useEffect } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { getDefaultLanguage } from '@/lib/i18n/getDefaultLanguage';

/**
 * Applies the visitor's saved language AFTER hydration. The store always
 * starts at 'en' so the server HTML and the first client render match
 * (reading localStorage during render was a source of React #418 errors).
 */
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = getDefaultLanguage();
    if (saved !== useLanguageStore.getState().language) {
      useLanguageStore.setState({ language: saved }); // apply without re-persisting
    }
  }, []);
  return <>{children}</>;
}
