import { useLanguageStore } from '@/store/languageStore'
import { getTranslationSync, loadTranslations } from '@/lib/i18n/loader'
import { useCallback, useEffect } from 'react'

// A key with no translation renders as a readable label ("nameHelper" ->
// "Name helper") instead of the raw key. Pure: never sets state during render.
function humanize(path: string): string {
  const last = path.split('.').pop() || path
  const readable = last.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim().toLowerCase()
  return readable.charAt(0).toUpperCase() + readable.slice(1)
}

export function useTranslation() {
  const { language } = useLanguageStore()

  useEffect(() => {
    loadTranslations(language)
  }, [language])

  const t = useCallback(
    (path: string, vars?: Record<string, string>) => {
      const found = getTranslationSync(path, language)
      let value = found === path ? humanize(path) : found
      if (vars) {
        for (const [k, v] of Object.entries(vars)) value = value.split('{' + k + '}').join(v)
      }
      return value
    },
    [language]
  )

  return { t, language }
}
