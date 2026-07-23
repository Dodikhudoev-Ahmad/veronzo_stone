import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { SectionHeading } from '../components/SectionHeading';
import { SearchInput } from '../components/ui/SearchInput';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ImagePreview } from '../components/ui/ImagePreview';
import { ProductFormDialog } from '../features/products/ProductFormDialog';
import type { ProductFormValues } from '../features/products/productSchema';
import { useCategoryOptions } from '../features/products/useCategoryOptions';
import { useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from '../hooks/useProducts';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../lib/apiError';
import type { ProductRequest, ProductResponse } from '../api/types';

const PAGE_SIZE = 20;

type DialogState = { mode: 'create' } | { mode: 'edit'; product: ProductResponse } | null;

function toProductRequest(values: ProductFormValues): ProductRequest {
  return {
    categoryId: values.categoryId,
    title: values.title.trim(),
    description: values.description.trim() || null,
    badgeText: values.badgeText.trim() || null,
    imageUrl: values.imageUrl.trim() || null,
    sortOrder: values.sortOrder,
    isVisible: values.isVisible,
  };
}

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(undefined);
  // "title"/"sortOrder" are the only columns shown that are also in the backend's
  // Product sort whitelist (id, title, sortOrder, categoryId) where sorting is
  // actually meaningful to an admin — categoryId is deliberately not exposed as a
  // sortable column here: sorting by the raw numeric FK wouldn't match the
  // category names shown in the table and would just confuse the ordering.
  const [sort, setSort] = useState<string>('sortOrder');
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductResponse | null>(null);

  // A new search/category filter/sort invalidates the current page position.
  // Reset during render (React's documented "adjusting state when a dependency
  // changes" pattern), matching CategoriesPage, rather than in an effect.
  const [appliedFilters, setAppliedFilters] = useState({ search: debouncedSearch, categoryFilter, sort });
  if (
    appliedFilters.search !== debouncedSearch ||
    appliedFilters.categoryFilter !== categoryFilter ||
    appliedFilters.sort !== sort
  ) {
    setAppliedFilters({ search: debouncedSearch, categoryFilter, sort });
    setPage(1);
  }

  const { data, isLoading, isError, refetch } = useProducts({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    categoryId: categoryFilter,
    sort,
  });

  const categoryOptions = useCategoryOptions();
  const categoryItems = categoryOptions.data?.items;
  const categories = categoryItems ?? [];
  // Depend on `categoryItems` (stable reference from query data) rather than
  // `categories` (a fresh `[]` literal on every render until data loads).
  const categoryNameById = useMemo(() => new Map((categoryItems ?? []).map((c) => [c.id, c.name])), [categoryItems]);
  const hasCategories = categoryOptions.isSuccess && categories.length > 0;

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  function handleSubmit(values: ProductFormValues) {
    const payload = toProductRequest(values);
    if (dialogState?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialogState.product.id, payload },
        {
          onSuccess: () => {
            toast.success('Товар обновлён');
            setDialogState(null);
          },
          onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось обновить товар')),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Товар создан');
          setDialogState(null);
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось создать товар')),
      });
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    // If this was the only row on a page beyond the first, stepping back a
    // page avoids landing on a now-empty page after the list refetches.
    const wasLastItemOnPage = data?.items.length === 1 && page > 1;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Товар удалён');
        setDeleteTarget(null);
        if (wasLastItemOnPage) {
          setPage((p) => Math.max(1, p - 1));
        }
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Не удалось удалить товар'));
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<ProductResponse>[] = [
    {
      key: 'image',
      label: '',
      render: (p) => <ImagePreview src={p.imageUrl} alt={`Фото товара «${p.title}»`} />,
    },
    { key: 'title', label: 'Название', sortable: true, render: (p) => p.title },
    {
      key: 'category',
      label: 'Категория',
      render: (p) => categoryNameById.get(p.categoryId) ?? `#${p.categoryId}`,
    },
    { key: 'badgeText', label: 'Плашка', render: (p) => p.badgeText || '—' },
    { key: 'sortOrder', label: 'Порядок', sortable: true, render: (p) => p.sortOrder },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            aria-label={`Изменить «${p.title}»`}
            className="text-accent hover:underline"
            onClick={() => setDialogState({ mode: 'edit', product: p })}
          >
            Изменить
          </button>
          <button
            type="button"
            aria-label={`Удалить «${p.title}»`}
            className="text-error hover:underline"
            onClick={() => setDeleteTarget(p)}
          >
            Удалить
          </button>
        </div>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isFiltered = debouncedSearch !== '' || categoryFilter !== undefined;

  return (
    <div>
      <SectionHeading
        title="Товары"
        description="Карточки товаров внутри каждой категории каталога."
        action={
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={() => setDialogState({ mode: 'create' })}
              disabled={!hasCategories}
              className="rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Добавить
            </button>
            {categoryOptions.isSuccess && categories.length === 0 && (
              <p className="text-xs text-muted">Сначала создайте категорию</p>
            )}
          </div>
        }
      />

      {categoryOptions.isError && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-error/30 bg-error/5 px-4 py-2 text-sm text-error">
          <span>Не удалось загрузить категории — названия и фильтр могут быть недоступны.</span>
          <button type="button" onClick={() => void categoryOptions.refetch()} className="underline hover:no-underline">
            Повторить
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Поиск по названию или описанию" />

        <select
          value={categoryFilter ?? ''}
          onChange={(event) => setCategoryFilter(event.target.value ? Number(event.target.value) : undefined)}
          disabled={categoryOptions.isLoading}
          aria-label="Фильтр по категории"
          className="rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none disabled:opacity-60"
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {categoryFilter !== undefined && (
          <button
            type="button"
            onClick={() => setCategoryFilter(undefined)}
            className="text-sm text-muted underline hover:text-text hover:no-underline"
          >
            Сбросить фильтр
          </button>
        )}
      </div>

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <TableSkeleton columns={columns.length} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={isFiltered ? 'Ничего не найдено' : 'Товаров пока нет'}
          description={
            isFiltered ? 'Попробуйте изменить условия поиска или фильтр по категории.' : 'Добавьте первый товар каталога.'
          }
        />
      ) : (
        <>
          <DataTable columns={columns} rows={data.items} getRowId={(p) => p.id} sort={sort} onSortChange={setSort} />
          <Pagination page={data.page} totalPages={data.totalPages} totalItems={data.totalItems} onPageChange={setPage} />
        </>
      )}

      <ProductFormDialog
        open={dialogState !== null}
        product={dialogState?.mode === 'edit' ? dialogState.product : null}
        busy={isSaving}
        onSubmit={handleSubmit}
        onClose={() => setDialogState(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить товар"
        message={deleteTarget ? `Удалить товар «${deleteTarget.title}»? Это действие нельзя отменить.` : ''}
        busy={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
