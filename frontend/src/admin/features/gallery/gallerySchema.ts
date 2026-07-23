import { z } from 'zod';

// Mirrors backend/VeronzoApi/Validators/Admin/GalleryItemRequestValidator.cs exactly
// — no additional constraints. imageUrl stays a plain string here (RHF's natural
// empty-string state for an untouched text input) — the empty-string-to-null
// conversion for the nullable GalleryItemRequest field happens at submit time in
// GalleryPage.toGalleryItemRequest, not in this schema.
export const gallerySchema = z.object({
  title: z.string().trim().min(1, 'Укажите название').max(200),
  imageUrl: z.string().max(500, 'Слишком длинный URL'),
  sortOrder: z.number().int().min(0, 'Не может быть отрицательным'),
  isVisible: z.boolean(),
});

export type GalleryFormValues = z.infer<typeof gallerySchema>;
