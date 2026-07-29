import { apiClient } from './client';

// Must match backend/VeronzoApi/Endpoints/Admin/AdminTranslationEndpoints.cs
// ValidEntities exactly — these are the only entity slugs the backend accepts.
export type TranslatableEntity =
  | 'categories'
  | 'products'
  | 'portfolio-items'
  | 'gallery-items'
  | 'site-content'
  | 'hero-stats'
  | 'seo-meta'
  | 'contact-info'
  | 'product-attribute-definitions'
  | 'product-attribute-options';

export interface TranslationResponse {
  languageCode: string;
  fields: Record<string, string | null>;
}

// Reuses apiClient — same auth header injection + 401/refresh interceptor as
// every other admin request, no separate HTTP client.
export async function getTranslations(entity: TranslatableEntity, id: number): Promise<TranslationResponse[]> {
  const { data } = await apiClient.get<TranslationResponse[]>(`/api/admin/${entity}/${id}/translations`);
  return data;
}

export async function upsertTranslation(
  entity: TranslatableEntity,
  id: number,
  languageCode: string,
  fields: Record<string, string | null>,
): Promise<TranslationResponse> {
  const { data } = await apiClient.put<TranslationResponse>(
    `/api/admin/${entity}/${id}/translations/${languageCode}`,
    { fields },
  );
  return data;
}
