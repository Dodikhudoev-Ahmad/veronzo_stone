import { z } from 'zod';

// Mirrors backend/VeronzoApi/Validators/Admin/PortfolioItemRequestValidator.cs.
// meta/categoryTag/imageUrl stay plain strings here (RHF's natural empty-string
// state for untouched text inputs) — the empty-string-to-null conversion for
// the nullable PortfolioItemRequest fields happens at submit time in
// PortfolioPage.toPortfolioItemRequest, not in this schema.
export const portfolioSchema = z.object({
  title: z.string().trim().min(1, 'Укажите название').max(200),
  meta: z.string().max(300, 'Слишком длинный текст'),
  categoryTag: z.string().max(50, 'Слишком длинный тег'),
  imageUrl: z.string().max(500, 'Слишком длинный URL'),
  sortOrder: z.number().int().min(0, 'Не может быть отрицательным'),
  isVisible: z.boolean(),
  isFeatured: z.boolean(),
});

export type PortfolioFormValues = z.infer<typeof portfolioSchema>;
