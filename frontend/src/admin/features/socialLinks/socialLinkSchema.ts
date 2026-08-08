import { z } from 'zod';

// Mirrors backend/VeronzoApi/Validators/Admin/SocialLinkRequestValidator.cs exactly
// — including the absolute-URL check (backend uses Uri.TryCreate(..., UriKind.Absolute, ...)).
export const socialLinkSchema = z.object({
  platform: z.string().trim().min(1, 'Укажите платформу').max(50),
  url: z
    .string()
    .trim()
    .min(1, 'Укажите ссылку')
    .max(500, 'Слишком длинный URL')
    .refine((value) => {
      try {
        return Boolean(new URL(value));
      } catch {
        return false;
      }
    }, 'Некорректный URL'),
  isVisible: z.boolean(),
});

export type SocialLinkFormValues = z.infer<typeof socialLinkSchema>;
