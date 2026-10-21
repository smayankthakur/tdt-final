// Shared by the server (app/layout.tsx) and the language store.
export type SiteLanguage = 'en' | 'hi' | 'hinglish';
export const LANG_COOKIE = 'lang';
export const isSiteLanguage = (v: unknown): v is SiteLanguage => v === 'en' || v === 'hi' || v === 'hinglish';
