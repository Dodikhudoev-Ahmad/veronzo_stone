import type { LanguageCode } from './useLanguage';
import type { PublicContactInfo } from './api';

// PublicContactInfoResponse has no id/key (backend comment: "Label is the
// natural key") -- that was fine while every ContactInfoTranslation.Label
// was Russian, but Stage 24 added real per-language labels, so matching
// against a single hardcoded Russian string breaks for en/tg/fa. Mirrors the
// exact Label translations inserted for ContactInfos #2 (Phone) and #3
// (Email) across all 4 supported languages.
const PHONE_LABEL: Record<LanguageCode, string> = { ru: 'Телефон', tg: 'Телефон', en: 'Phone', fa: 'تلفن' };
const EMAIL_LABEL: Record<LanguageCode, string> = { ru: 'Почта', tg: 'Почтаи электронӣ', en: 'Email', fa: 'ایمیل' };

export function findContactValue(
  contactInfo: PublicContactInfo[] | undefined,
  kind: 'phone' | 'email',
  language: LanguageCode,
): string | undefined {
  const target = kind === 'phone' ? PHONE_LABEL[language] : EMAIL_LABEL[language];
  return contactInfo?.find((c) => c.label === target)?.value;
}
