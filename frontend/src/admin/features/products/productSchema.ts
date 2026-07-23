import { z } from 'zod';

// Mirrors backend/VeronzoApi/Validators/Admin/ProductRequestValidator.cs.
// description/badgeText/imageUrl stay plain strings here (RHF's natural
// empty-string state for untouched text inputs) — the empty-string-to-null
// conversion for the nullable ProductRequest fields happens at submit time
// (see ProductsPage.toProductRequest), not in this schema.
export const productSchema = z.object({
  categoryId: z.number().int().positive('Выберите категорию'),
  title: z.string().trim().min(1, 'Укажите название').max(200),
  description: z.string().max(2000, 'Слишком длинное описание'),
  badgeText: z.string().max(100, 'Слишком длинный текст плашки'),
  imageUrl: z.string().max(500, 'Слишком длинный URL'),
  sortOrder: z.number().int().min(0, 'Не может быть отрицательным'),
  isVisible: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
