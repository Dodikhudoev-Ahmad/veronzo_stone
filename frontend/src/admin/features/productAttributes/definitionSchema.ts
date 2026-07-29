import { z } from 'zod';

// Mirrors backend/VeronzoApi/Validators/Admin/ProductAttributeDefinitionRequestValidator.cs.
// categoryId is not user-editable here — the page scopes the whole definitions
// list to one category at a time, so it's carried through as a fixed value
// rather than a form field (see ProductAttributesPage).
export const definitionSchema = z.object({
  categoryId: z.number().int().positive(),
  key: z
    .string()
    .trim()
    .min(1, 'Укажите key')
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Только строчные латинские буквы, цифры и подчёркивание'),
  name: z.string().trim().min(1, 'Укажите название').max(200),
  sortOrder: z.number().int().min(0, 'Не может быть отрицательным'),
  isFilterable: z.boolean(),
  isVisible: z.boolean(),
});

export type DefinitionFormValues = z.infer<typeof definitionSchema>;
