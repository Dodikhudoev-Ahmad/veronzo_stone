import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { ImagePreview } from '../../components/ui/ImagePreview';
import { ErrorState } from '../../components/ui/ErrorState';
import { productSchema, type ProductFormValues } from './productSchema';
import { useCategoryOptions } from './useCategoryOptions';
import { AttributeFields } from './AttributeFields';
import type { AttributeSelection } from './attributeSelection';
import { useProductAttributeValues } from '../../hooks/useProductAttributeValues';
import type { CategoryResponse, ProductResponse } from '../../api/types';

interface ProductFormDialogProps {
  open: boolean;
  product: ProductResponse | null; // null = create mode, otherwise edit mode
  busy: boolean;
  onSubmit: (values: ProductFormValues, attributeSelections: AttributeSelection[]) => void;
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

  // Pending ProductAttributeValue selections for the currently selected
  // category — a separate backend resource from Product itself (Stage 23a),
  // reconciled into real rows by ProductsPage only after the product save
  // succeeds (see useSyncProductAttributeValues.ts).
  const [attributeSelections, setAttributeSelections] = useState<AttributeSelection[]>([]);

  // Only fetched in edit mode — a new product can't have attribute values yet.
  const existingValuesQuery = useProductAttributeValues(
    product ? { productId: product.id, pageSize: 100 } : {},
    { enabled: product !== null },
  );

  // Tracks what the form's categoryId was the last time it was deliberately
  // set (by opening the dialog, or by a confirmed category change) — read
  // synchronously inside the <select>'s own onChange below, not via a watch
  // effect, so there's no risk of racing react-hook-form's own reset/update commits.
  const currentCategoryIdRef = useRef(defaultValuesFor(product, categories[0]?.id ?? 0).categoryId);

  useEffect(() => {
    if (open) {
      const seeded = defaultValuesFor(product, categoriesRef.current[0]?.id ?? 0);
      reset(seeded);
      currentCategoryIdRef.current = seeded.categoryId;
      // Existing values are seeded by the effect below once they've loaded;
      // a brand-new product simply starts with none.
      if (!product) {
        setAttributeSelections([]);
      }
    }
  }, [open, product, reset]);

  useEffect(() => {
    if (open && product && existingValuesQuery.data) {
      setAttributeSelections(
        existingValuesQuery.data.items.map((row) => ({
          definitionId: row.definitionId,
          optionId: row.optionId,
          textValue: row.textValue,
        })),
      );
    }
    // Re-seeds whenever the loaded rows for this product change (e.g. first
    // load) — mirrors TranslationLanguageForm's own reset-on-data-change effect.
  }, [open, product, existingValuesQuery.data]);

  const imageUrl = watch('imageUrl');
  const categoryId = watch('categoryId');
  const title = product ? 'Изменить товар' : 'Новый товар';

  // Destructured (rather than spread directly onto the <select>) so the
  // category-change confirm below can run its own logic first and decide
  // whether to call react-hook-form's onChange at all.
  const { onChange: categoryFieldOnChange, ...categoryFieldRest } = register('categoryId', { valueAsNumber: true });

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
        <form
          onSubmit={(event) => void handleSubmit((values) => onSubmit(values, attributeSelections))(event)}
          className="flex flex-col gap-4"
          noValidate
        >
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
              {...categoryFieldRest}
              onChange={(event) => {
                const next = Number(event.target.value);
                const previous = currentCategoryIdRef.current;
                if (next !== previous && attributeSelections.length > 0) {
                  const confirmed = window.confirm(
                    'При смене категории текущие значения характеристик будут сброшены. Продолжить?',
                  );
                  if (!confirmed) {
                    // Revert the DOM selection — react-hook-form's own state
                    // is never touched below, since categoryFieldOnChange
                    // isn't called in this branch.
                    event.target.value = String(previous);
                    return;
                  }
                  setAttributeSelections([]);
                }
                currentCategoryIdRef.current = next;
                void categoryFieldOnChange(event);
              }}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>

          <AttributeFields categoryId={categoryId} selections={attributeSelections} onChange={setAttributeSelections} />

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
