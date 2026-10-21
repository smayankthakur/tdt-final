'use client';

import { createContext, createElement, useContext, useState, type ReactNode } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';

import { LANG_COOKIE, type SiteLanguage } from '@/lib/i18n/langCookie';

export type Language = SiteLanguage;

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}


function persist(lang: Language) {
  try {
    localStorage.setItem('lang', lang);
  } catch {
    /* ignore storage failures */
  }
  try {
    // Read by the server (app/layout.tsx) so the next page is rendered in this
    // language straight away — no English flash before switching.
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    /* ignore */
  }
}

function makeStore(initial: Language): StoreApi<LanguageState> {
  return createStore<LanguageState>((set) => ({
    language: initial,
    setLanguage: (lang: Language) => {
      // Update state first so the UI always switches, even if persistence fails.
      set({ language: lang });
      persist(lang);
    },
  }));
}

// One store per request on the server (via the provider), one per tab in the
// browser. `browserStore` is what getState/setState talk to outside React.
let browserStore: StoreApi<LanguageState> | null = null;
const fallbackStore = makeStore('en'); // only used without a provider (tests)

const LanguageStoreContext = createContext<StoreApi<LanguageState> | null>(null);

/** Wraps the app; `initial` comes from the `lang` cookie on the server. */
export function LanguageProvider({ initial, children }: { initial: Language; children: ReactNode }) {
  const [store] = useState(() => {
    const s = makeStore(initial);
    if (typeof window !== 'undefined') browserStore = s;
    return s;
  });
  return createElement(LanguageStoreContext.Provider, { value: store }, children);
}

const current = () => browserStore ?? fallbackStore;

type Hook = {
  <T = LanguageState>(selector?: (s: LanguageState) => T): T;
  getState: () => LanguageState;
  setState: (partial: Partial<LanguageState>) => void;
};

/** Same API as the old global zustand hook: useLanguageStore(), useLanguageStore(sel), .getState(), .setState(). */
export const useLanguageStore: Hook = Object.assign(
  function useLanguageStoreHook<T = LanguageState>(selector?: (s: LanguageState) => T): T {
    const store = useContext(LanguageStoreContext) ?? fallbackStore;
    return useStore(store, selector ?? ((s: LanguageState) => s as unknown as T));
  },
  {
    getState: () => current().getState(),
    setState: (partial: Partial<LanguageState>) => current().setState(partial),
  }
);
