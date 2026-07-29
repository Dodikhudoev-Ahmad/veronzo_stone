import { useCallback, useEffect, useState } from 'react';

// Mirrors backend/VeronzoApi/Models/SupportedLanguages.cs — kept in sync
// manually since there's no shared codegen between the two projects.
export const SUPPORTED_LANGUAGES = ['ru', 'tg', 'en', 'fa'] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'veronzo-lang';

function readStoredLanguage(): LanguageCode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(stored ?? '')
    ? (stored as LanguageCode)
    : 'ru';
}

// Simple localStorage-backed language preference — catalog pages pass this
// through to the public API's ?lang= param (see PublicTranslationHelpers on
// the backend for the ru-fallback rules this relies on).
export function useLanguage() {
  const [language, setLanguageState] = useState<LanguageCode>(readStoredLanguage);

  const setLanguage = useCallback((next: LanguageCode) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLanguageState(next);
  }, []);

  // Keeps <html lang> truthful for screen readers and search engines — every
  // public page reads its language through this one hook, so syncing it here
  // covers all of them without per-page wiring.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return { language, setLanguage };
}
