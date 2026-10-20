import { create } from "zustand"

export type Language = "en" | "hi" | "hinglish"

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
}

export const useLanguageStore = create<LanguageState>((set) => ({
  // Always "en" on first render (server and client agree); ClientProviders
  // applies the saved choice right after hydration.
  language: "en",

  setLanguage: (lang: Language) => {
    // Update state first so the UI always switches, even if persistence fails
    // (private mode, storage disabled, etc.).
    set({ language: lang })
    try {
      localStorage.setItem("lang", lang)
    } catch {
      /* ignore storage failures */
    }
  },
}))