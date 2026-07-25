import { z } from 'zod';
import type { TranslationFieldConfig } from './translationFieldConfig';

export type TranslationFormValues = Record<string, string>;

// Built dynamically per entity from TRANSLATION_FIELD_CONFIGS, mirroring how
// the backend's per-entity required/maxLength rules are enforced (required
// fields there are Name/Title/Value/Label — never nullable). Every field in
// every entity's config is a plain string field, so the dynamic shape always
// satisfies TranslationFormValues at runtime even though zod can't express
// that generically — the return type is asserted accordingly at the one call
// site (TranslationLanguageForm), not here.
export function buildTranslationSchema(fields: TranslationFieldConfig[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    shape[field.key] = field.required
      ? z.string().trim().min(1, 'Обязательное поле').max(field.maxLength)
      : z.string().trim().max(field.maxLength).optional().or(z.literal(''));
  }
  return z.object(shape);
}
