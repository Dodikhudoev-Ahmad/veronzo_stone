import { z } from 'zod';

// Mirrors backend/VeronzoApi/Validators/Admin/CategoryRequestValidator.cs —
// client-side validation is a UX nicety, the backend remains the source of truth
// (and still returns 400/409 for anything this schema doesn't catch, e.g. a
// duplicate slug, which requires a database round trip).
export const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Укажите slug')
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Только строчные латинские буквы, цифры и дефисы'),
  name: z.string().trim().min(1, 'Укажите название').max(200),
  sortOrder: z.number().int().min(0, 'Не может быть отрицательным'),
  isVisible: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
