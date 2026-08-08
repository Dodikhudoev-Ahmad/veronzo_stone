import { z } from 'zod';

// Mirrors backend/VeronzoApi/Validators/Admin/HeroStatRequestValidator.cs exactly.
// suffix stays a plain string here (RHF's natural empty-string state) — the
// empty-string-to-null conversion for the nullable HeroStatRequest field
// happens at submit time, same pattern as GalleryPage.toGalleryItemRequest.
export const heroStatSchema = z.object({
  label: z.string().trim().min(1, 'Укажите подпись показателя').max(100),
  value: z.number().int().min(0, 'Не может быть отрицательным'),
  suffix: z.string().max(20, 'Слишком длинный суффикс'),
  sortOrder: z.number().int().min(0, 'Не может быть отрицательным'),
  isVisible: z.boolean(),
});

export type HeroStatFormValues = z.infer<typeof heroStatSchema>;
