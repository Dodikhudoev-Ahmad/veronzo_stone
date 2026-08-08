import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { seoMetaSchema, type SeoMetaFormValues } from './seoMetaSchema';
import type { SeoMetaResponse } from '../../api/types';

interface SeoMetaFormDialogProps {
  open: boolean;
  item: SeoMetaResponse | null; // null = create mode, otherwise edit mode
  busy: boolean;
  onSubmit: (values: SeoMetaFormValues) => void;
  onClose: () => void;
}

const DEFAULT_VALUES: SeoMetaFormValues = { pageKey: '', title: '', description: '', ogImageUrl: '' };

function defaultValuesFor(item: SeoMetaResponse | null): SeoMetaFormValues {
  if (!item) return DEFAULT_VALUES;
  return {
    pageKey: item.pageKey,
    title: item.title,
    description: item.description ?? '',
    ogImageUrl: item.ogImageUrl ?? '',
  };
}

export function SeoMetaFormDialog({ open, item, busy, onSubmit, onClose }: SeoMetaFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SeoMetaFormValues>({
    resolver: zodResolver(seoMetaSchema),
    defaultValues: defaultValuesFor(item),
  });

  // Re-seed the form whenever the dialog is (re)opened for a different item
  // (or for "create"), since the same dialog instance is reused.
  useEffect(() => {
    if (open) {
      reset(defaultValuesFor(item));
    }
  }, [open, item, reset]);

  function handleClose() {
    if (!busy) {
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={item ? 'Изменить SEO-запись' : 'Новая SEO-запись'}>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4" noValidate>
        <FormField label="PageKey" htmlFor="seo-meta-page-key" error={errors.pageKey?.message}>
          <input
            id="seo-meta-page-key"
            placeholder="home, catalog-stone…"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.pageKey ? 'true' : undefined}
            {...register('pageKey')}
          />
        </FormField>

        <FormField label="Title" htmlFor="seo-meta-title" error={errors.title?.message}>
          <input
            id="seo-meta-title"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.title ? 'true' : undefined}
            {...register('title')}
          />
        </FormField>

        <FormField label="Description (необязательно)" htmlFor="seo-meta-description" error={errors.description?.message}>
          <textarea
            id="seo-meta-description"
            rows={3}
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.description ? 'true' : undefined}
            {...register('description')}
          />
        </FormField>

        <FormField label="OG-изображение, URL (необязательно)" htmlFor="seo-meta-og-image-url" error={errors.ogImageUrl?.message}>
          <input
            id="seo-meta-og-image-url"
            placeholder="assets/images/hero-calacatta.webp"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.ogImageUrl ? 'true' : undefined}
            {...register('ogImageUrl')}
          />
        </FormField>

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-pill border border-cream-soft px-4 py-2 text-sm text-text transition hover:border-accent disabled:opacity-60"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
