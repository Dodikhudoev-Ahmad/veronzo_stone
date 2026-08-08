import { z } from 'zod';

// Mirrors backend/VeronzoApi/Validators/Admin/SeoMetaRequestValidator.cs exactly.
// description/ogImageUrl stay plain strings here (RHF's natural empty-string
// state) — the empty-string-to-null conversion for the nullable SeoMetaRequest
// fields happens at submit time, same pattern as GalleryPage.toGalleryItemRequest.
export const seoMetaSchema = z.object({
  pageKey: z.string().trim().min(1, 'Укажите PageKey').max(100),
  title: z.string().trim().min(1, 'Укажите title').max(200),
  description: z.string().max(500, 'Слишком длинное описание'),
  ogImageUrl: z.string().max(500, 'Слишком длинный URL'),
});

export type SeoMetaFormValues = z.infer<typeof seoMetaSchema>;
