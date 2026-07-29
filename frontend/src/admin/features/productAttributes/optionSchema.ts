import { z } from 'zod';

// Mirrors backend/VeronzoApi/Validators/Admin/ProductAttributeOptionRequestValidator.cs.
// definitionId is not user-editable here — the page scopes the options list to
// one definition at a time (see ProductAttributesPage), same reasoning as
// definitionSchema's categoryId.
export const optionSchema = z.object({
  definitionId: z.number().int().positive(),
  value: z
    .string()
    .trim()
    .min(1, 'Укажите value')
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Только строчные латинские буквы, цифры и подчёркивание'),
  label: z.string().trim().min(1, 'Укажите подпись').max(200),
  sortOrder: z.number().int().min(0, 'Не может быть отрицательным'),
  isVisible: z.boolean(),
});

export type OptionFormValues = z.infer<typeof optionSchema>;
