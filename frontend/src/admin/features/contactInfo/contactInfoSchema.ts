import { z } from 'zod';

// Mirrors backend/VeronzoApi/Validators/Admin/ContactInfoRequestValidator.cs exactly.
export const contactInfoSchema = z.object({
  label: z.string().trim().min(1, 'Укажите подпись').max(100),
  value: z.string().trim().min(1, 'Укажите значение').max(500),
  sortOrder: z.number().int().min(0, 'Не может быть отрицательным'),
});

export type ContactInfoFormValues = z.infer<typeof contactInfoSchema>;
