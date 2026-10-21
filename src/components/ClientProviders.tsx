'use client';

import { useEffect } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { getDefaultLanguage } from '@/lib/i18n/getDefaultLanguage';

/**
 * The server renders the language from the `lang` cookie. Visitors who chose a
 * language before that cookie existed (saved only in localStorage), or whose
 * phone is set to Hindi, get it applied once here — and the cookie is written,
 * so from the next page on it is rendered by the server with no switch.
 */
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const hasCookie = /(?:^|;\s*)lang=(en|hi|hinglish)/.test(document.cookie);
    if (hasCookie) return;
    const saved = getDefaultLanguage();
    useLanguageStore.getState().setLanguage(saved); // also writes the cookie
  }, []);
  return <>{children}</>;
}
