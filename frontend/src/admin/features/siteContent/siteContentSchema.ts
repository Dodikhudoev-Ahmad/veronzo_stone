import { z } from 'zod';

// Mirrors backend/VeronzoApi/Validators/Admin/SiteContentRequestValidator.cs exactly.
export const siteContentSchema = z.object({
  key: z.string().trim().min(1, 'Укажите ключ контента').max(150),
  value: z.string().trim().min(1, 'Укажите значение').max(10000),
});

export type SiteContentFormValues = z.infer<typeof siteContentSchema>;
