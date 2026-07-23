import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { categorySchema, type CategoryFormValues } from './categorySchema';
import type { CategoryResponse } from '../../api/types';

interface CategoryFormDialogProps {
  open: boolean;
  category: CategoryResponse | null; // null = create mode, otherwise edit mode
  busy: boolean;
  onSubmit: (values: CategoryFormValues) => void;
  onClose: () => void;
}

const DEFAULT_VALUES: CategoryFormValues = { slug: '', name: '', sortOrder: 0, isVisible: true };

export function CategoryFormDialog({ open, category, busy, onSubmit, onClose }: CategoryFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Re-seed the form whenever the dialog is (re)opened for a different
  // category (or for "create"), since the same dialog instance is reused.
  useEffect(() => {
    if (open) {
      reset(category ? { slug: category.slug, name: category.name, sortOrder: category.sortOrder, isVisible: category.isVisible } : DEFAULT_VALUES);
    }
  }, [open, category, reset]);

  return (
    <Modal open={open} onClose={onClose} title={category ? 'Изменить категорию' : 'Новая категория'}>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4" noValidate>
        <FormField label="Название" htmlFor="category-name" error={errors.name?.message}>
          <input
            id="category-name"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.name ? 'true' : undefined}
            {...register('name')}
          />
        </FormField>

        <FormField label="Slug" htmlFor="category-slug" error={errors.slug?.message}>
          <input
            id="category-slug"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.slug ? 'true' : undefined}
            {...register('slug')}
          />
        </FormField>

        <FormField label="Порядок сортировки" htmlFor="category-sort-order" error={errors.sortOrder?.message}>
          <input
            id="category-sort-order"
            type="number"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.sortOrder ? 'true' : undefined}
            {...register('sortOrder', { valueAsNumber: true })}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" className="h-4 w-4 rounded border-cream-soft" {...register('isVisible')} />
          Видима на сайте
        </label>

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
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
