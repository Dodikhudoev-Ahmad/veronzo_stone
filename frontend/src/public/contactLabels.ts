import type { PublicContactInfo } from './api';

// PublicContactInfo has no id/key ("Label is the natural key") -- matches
// against the Russian ContactInfo.Label the backend seeds/admin edits
// (the public site is Russian-only, see useLanguage.ts's removal note).
const PHONE_LABEL = 'Телефон';
const EMAIL_LABEL = 'Почта';

export function findContactValue(contactInfo: PublicContactInfo[] | undefined, kind: 'phone' | 'email'): string | undefined {
  const target = kind === 'phone' ? PHONE_LABEL : EMAIL_LABEL;
  return contactInfo?.find((c) => c.label === target)?.value;
}
