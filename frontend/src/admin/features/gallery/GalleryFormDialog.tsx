import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { ImagePreview } from '../../components/ui/ImagePreview';
import { gallerySchema, type GalleryFormValues } from './gallerySchema';
import type { GalleryItemResponse } from '../../api/types';

interface GalleryFormDialogProps {
  open: boolean;
  item: GalleryItemResponse | null; // null = create mode, otherwise edit mode
  busy: boolean;
  onSubmit: (values: GalleryFormValues) => void;
  onClose: () => void;
}

const DEFAULT_VALUES: GalleryFormValues = {
  title: '',
  imageUrl: '',
  sortOrder: 0,
  isVisible: true,
};

function defaultValuesFor(item: GalleryItemResponse | null): GalleryFormValues {
  if (!item) return DEFAULT_VALUES;
  return {
    title: item.title,
    imageUrl: item.imageUrl ?? '',
    sortOrder: item.sortOrder,
    isVisible: item.isVisible,
  };
}

export function GalleryFormDialog({ open, item, busy, onSubmit, onClose }: GalleryFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<GalleryFormValues>({
    resolver: zodResolver(gallerySchema),
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
    <Modal open={open} onClose={handleClose} title={item ? 'Изменить фото галереи' : 'Новое фото галереи'}>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4" noValidate>
        <FormField label="Название" htmlFor="gallery-title" error={errors.title?.message}>
          <input
            id="gallery-title"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.title ? 'true' : undefined}
            {...register('title')}
          />
        </FormField>

        <FormField label="URL изображения (необязательно)" htmlFor="gallery-image-url" error={errors.imageUrl?.message}>
          <input
            id="gallery-image-url"
            type="url"
            placeholder="assets/images/gallery-hall.webp"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.imageUrl ? 'true' : undefined}
            {...register('imageUrl')}
          />
        </FormField>
        <div className="flex justify-center">
          <ImagePreview src={imageUrl || null} alt="Предпросмотр изображения галереи" size="lg" />
        </div>

        <FormField label="Порядок сортировки" htmlFor="gallery-sort-order" error={errors.sortOrder?.message}>
          <input
            id="gallery-sort-order"
            type="number"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.sortOrder ? 'true' : undefined}
            {...register('sortOrder', { valueAsNumber: true })}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" className="h-4 w-4 rounded border-cream-soft" {...register('isVisible')} />
          Показывать на сайте
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
