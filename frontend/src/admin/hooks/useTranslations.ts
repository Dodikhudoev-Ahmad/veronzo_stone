import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTranslations, upsertTranslation, type TranslatableEntity, type TranslationResponse } from '../api/translations';

const translationsKey = (entity: TranslatableEntity, id: number | undefined) => ['translations', entity, id] as const;

// `enabled` lets the caller gate the fetch on "the modal is actually open" —
// translations are only ever loaded when the editor is opened, never eagerly
// alongside the main resource list.
export function useTranslations(entity: TranslatableEntity, id: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: translationsKey(entity, id),
    queryFn: () => getTranslations(entity, id!),
    enabled: enabled && id !== undefined,
  });
}

export function useUpsertTranslation(entity: TranslatableEntity, id: number | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ languageCode, fields }: { languageCode: string; fields: Record<string, string | null> }) =>
      upsertTranslation(entity, id!, languageCode, fields),
    onSuccess: (saved) => {
      // Merge the saved row into the cache in place instead of invalidating —
      // keeps every other language's already-loaded data intact and avoids an
      // extra round trip just to re-read what was already just returned.
      client.setQueryData<TranslationResponse[]>(translationsKey(entity, id), (existing) => {
        const list = existing ?? [];
        const index = list.findIndex((t) => t.languageCode === saved.languageCode);
        if (index === -1) return [...list, saved];
        const next = [...list];
        next[index] = saved;
        return next;
      });
    },
  });
}
