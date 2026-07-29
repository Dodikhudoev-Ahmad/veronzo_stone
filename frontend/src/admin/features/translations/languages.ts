// Mirrors backend/VeronzoApi/Models/SupportedLanguages.cs exactly — this is
// the one place the frontend lists supported languages; nothing else in the
// admin app should hardcode a second copy.
export const SUPPORTED_LANGUAGES = [
  { code: 'ru', tabLabel: 'RU', name: 'Русский' },
  { code: 'tg', tabLabel: 'TJ', name: 'Тоҷикӣ' },
  { code: 'en', tabLabel: 'EN', name: 'English' },
  { code: 'fa', tabLabel: 'FA', name: 'فارسی' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'ru';
