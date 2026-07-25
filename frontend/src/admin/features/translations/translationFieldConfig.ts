import type { TranslatableEntity } from '../../api/translations';

export interface TranslationFieldConfig {
  // Must match the backend's AllowedFieldsFor(entity) key exactly (PascalCase) —
  // this is what's sent back in the upsert payload's `fields` object.
  key: string;
  label: string;
  multiline?: boolean;
  required?: boolean;
  // Mirrors the column's HasMaxLength(...) in AppDbContext.OnModelCreating.
  maxLength: number;
}

// Deliberately excludes every technical field (id, slug, imageUrl, sortOrder,
// isVisible, isFeatured, categoryId, pageKey, platform, url, and — for
// ContactInfo — the phone/email/address `value`) per the backend's own
// AllowedFieldsFor allowlist; there is nothing to accidentally leak here.
export const TRANSLATION_FIELD_CONFIGS: Record<TranslatableEntity, TranslationFieldConfig[]> = {
  categories: [
    { key: 'Name', label: 'Название', required: true, maxLength: 200 },
    { key: 'Description', label: 'Описание', multiline: true, maxLength: 2000 },
  ],
  products: [
    { key: 'Title', label: 'Название', required: true, maxLength: 200 },
    { key: 'Description', label: 'Описание', multiline: true, maxLength: 2000 },
    { key: 'BadgeText', label: 'Текст плашки', maxLength: 200 },
  ],
  'portfolio-items': [
    { key: 'Title', label: 'Название', required: true, maxLength: 200 },
    { key: 'Meta', label: 'Метаданные', maxLength: 500 },
    { key: 'CategoryTag', label: 'Тег категории', maxLength: 100 },
  ],
  'gallery-items': [
    { key: 'Title', label: 'Название', required: true, maxLength: 200 },
    { key: 'AltText', label: 'Alt-текст', maxLength: 300 },
  ],
  'site-content': [{ key: 'Value', label: 'Значение', multiline: true, required: true, maxLength: 4000 }],
  'hero-stats': [{ key: 'Label', label: 'Подпись', required: true, maxLength: 200 }],
  'seo-meta': [
    { key: 'Title', label: 'Title', required: true, maxLength: 200 },
    { key: 'Description', label: 'Description', multiline: true, maxLength: 500 },
    { key: 'Keywords', label: 'Keywords', maxLength: 500 },
    { key: 'OgTitle', label: 'OG Title', maxLength: 200 },
    { key: 'OgDescription', label: 'OG Description', multiline: true, maxLength: 500 },
  ],
  'contact-info': [{ key: 'Label', label: 'Подпись', required: true, maxLength: 200 }],
};
