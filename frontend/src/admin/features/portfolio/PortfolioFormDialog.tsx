import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { ImagePreview } from '../../components/ui/ImagePreview';
import { portfolioSchema, type PortfolioFormValues } from './portfolioSchema';
import type { PortfolioItemResponse } from '../../api/types';

interface PortfolioFormDialogProps {
  open: boolean;
  item: PortfolioItemResponse | null; // null = create mode, otherwise edit mode
  busy: boolean;
  onSubmit: (values: PortfolioFormValues) => void;
  onClose: () => void;
}

const DEFAULT_VALUES: PortfolioFormValues = {
  title: '',
  meta: '',
  categoryTag: '',
  imageUrl: '',
  sortOrder: 0,
  isVisible: true,
  isFeatured: false,
};

function defaultValuesFor(item: PortfolioItemResponse | null): PortfolioFormValues {
  if (!item) return DEFAULT_VALUES;
  return {
    title: item.title,
    meta: item.meta ?? '',
    categoryTag: item.categoryTag ?? '',
    imageUrl: item.imageUrl ?? '',
    sortOrder: item.sortOrder,
    isVisible: item.isVisible,
    isFeatured: item.isFeatured,
  };
}

export function PortfolioFormDialog({ open, item, busy, onSubmit, onClose }: PortfolioFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: defaultValuesFor(item),
  });

  // Re-seed the form whenever the dialog is (re)opened for a different item
  // (or for "create"), since the same dialog instance is reused.
  useEffect(() => {
    if (open) {
      reset(defaultValuesFor(item));
    }
  }, [open, item, reset]);

  const imageUrl = watch('imageUrl');

  // A mutation in flight must not be interruptible via backdrop click, Escape,
  // or the Cancel button — all three routes go through this single guard.
  function handleClose() {
    if (!busy) {
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={item ? 'Изменить объект портфолио' : 'Новый объект портфолио'}>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4" noValidate>
        <FormField label="Название" htmlFor="portfolio-title" error={errors.title?.message}>
          <input
            id="portfolio-title"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.title ? 'true' : undefined}
            {...register('title')}
          />
        </FormField>

        <FormField label="Подпись (необязательно)" htmlFor="portfolio-meta" error={errors.meta?.message}>
          <input
            id="portfolio-meta"
            placeholder="например, Мрамор Calacatta · частный дом · 2025"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.meta ? 'true' : undefined}
            {...register('meta')}
          />
        </FormField>

        <FormField label="Тег категории (необязательно)" htmlFor="portfolio-category-tag" error={errors.categoryTag?.message}>
          <input
            id="portfolio-category-tag"
            placeholder="например, КАМЕНЬ"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.categoryTag ? 'true' : undefined}
            {...register('categoryTag')}
          />
        </FormField>

        <FormField label="URL изображения (необязательно)" htmlFor="portfolio-image-url" error={errors.imageUrl?.message}>
          <input
            id="portfolio-image-url"
            type="url"
            placeholder="assets/images/portfolio-ostozhenka.webp"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.imageUrl ? 'true' : undefined}
            {...register('imageUrl')}
          />
        </FormField>
        <div className="flex justify-center">
          <ImagePreview src={imageUrl || null} alt="Предпросмотр изображения объекта портфолио" size="lg" />
        </div>

        <FormField label="Порядок сортировки" htmlFor="portfolio-sort-order" error={errors.sortOrder?.message}>
          <input
            id="portfolio-sort-order"
            type="number"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.sortOrder ? 'true' : undefined}
            {...register('sortOrder', { valueAsNumber: true })}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" className="h-4 w-4 rounded border-cream-soft" {...register('isVisible')} />
          Видим на сайте
        </label>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" className="h-4 w-4 rounded border-cream-soft" {...register('isFeatured')} />
          Крупная карточка (featured)
        </label>

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
