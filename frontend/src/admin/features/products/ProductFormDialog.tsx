import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { ImagePreview } from '../../components/ui/ImagePreview';
import { ErrorState } from '../../components/ui/ErrorState';
import { productSchema, type ProductFormValues } from './productSchema';
import { useCategoryOptions } from './useCategoryOptions';
import type { CategoryResponse, ProductResponse } from '../../api/types';

interface ProductFormDialogProps {
  open: boolean;
  product: ProductResponse | null; // null = create mode, otherwise edit mode
  busy: boolean;
  onSubmit: (values: ProductFormValues) => void;
  onClose: () => void;
}

function defaultValuesFor(product: ProductResponse | null, fallbackCategoryId: number): ProductFormValues {
  if (product) {
    return {
      categoryId: product.categoryId,
      title: product.title,
      description: product.description ?? '',
      badgeText: product.badgeText ?? '',
      imageUrl: product.imageUrl ?? '',
      sortOrder: product.sortOrder,
      isVisible: product.isVisible,
    };
  }
  return {
    categoryId: fallbackCategoryId,
    title: '',
    description: '',
    badgeText: '',
    imageUrl: '',
    sortOrder: 0,
    isVisible: true,
  };
}

export function ProductFormDialog({ open, product, busy, onSubmit, onClose }: ProductFormDialogProps) {
  const categoryOptions = useCategoryOptions();
  const categories: CategoryResponse[] = categoryOptions.data?.items ?? [];

  // Read via ref inside the reset effect below so the effect only re-seeds the
  // form when the dialog opens or the target product changes — not every time
  // the categories list itself re-renders/refetches.
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValuesFor(product, categories[0]?.id ?? 0),
  });

  useEffect(() => {
    if (open) {
      reset(defaultValuesFor(product, categoriesRef.current[0]?.id ?? 0));
    }
  }, [open, product, reset]);

  const imageUrl = watch('imageUrl');
  const title = product ? 'Изменить товар' : 'Новый товар';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {categoryOptions.isLoading ? (
        <p className="py-8 text-center text-sm text-muted">Загрузка категорий…</p>
      ) : categoryOptions.isError ? (
        <ErrorState message="Не удалось загрузить категории" onRetry={() => void categoryOptions.refetch()} />
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-text">Сначала создайте хотя бы одну категорию.</p>
          <p className="text-sm text-muted">Товар нельзя создать без категории каталога.</p>
          <Link
            to="/admin/categories"
            onClick={onClose}
            className="rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
          >
            Перейти в «Категории»
          </Link>
        </div>
      ) : (
        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4" noValidate>
          <FormField label="Название" htmlFor="product-title" error={errors.title?.message}>
            <input
              id="product-title"
              className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              aria-invalid={errors.title ? 'true' : undefined}
              {...register('title')}
            />
          </FormField>

          <FormField label="Категория" htmlFor="product-category" error={errors.categoryId?.message}>
            <select
              id="product-category"
              className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              aria-invalid={errors.categoryId ? 'true' : undefined}
              {...register('categoryId', { valueAsNumber: true })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Описание" htmlFor="product-description" error={errors.description?.message}>
            <textarea
              id="product-description"
              rows={3}
              className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              aria-invalid={errors.description ? 'true' : undefined}
              {...register('description')}
            />
          </FormField>

          <FormField label="Текст плашки (необязательно)" htmlFor="product-badge-text" error={errors.badgeText?.message}>
            <input
              id="product-badge-text"
              placeholder="например, 60+ ВИДОВ В НАЛИЧИИ →"
              className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              aria-invalid={errors.badgeText ? 'true' : undefined}
              {...register('badgeText')}
            />
          </FormField>

          <FormField label="URL изображения (необязательно)" htmlFor="product-image-url" error={errors.imageUrl?.message}>
            <input
              id="product-image-url"
              type="url"
              placeholder="assets/images/catalog-stone.webp"
              className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              aria-invalid={errors.imageUrl ? 'true' : undefined}
              {...register('imageUrl')}
            />
          </FormField>
          <div className="flex justify-center">
            <ImagePreview src={imageUrl || null} alt="Предпросмотр изображения товара" size="lg" />
          </div>

          <FormField label="Порядок сортировки" htmlFor="product-sort-order" error={errors.sortOrder?.message}>
            <input
              id="product-sort-order"
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
      )}
    </Modal>
  );
}
