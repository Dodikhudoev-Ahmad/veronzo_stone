import { useState } from 'react';
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
import { PortfolioFormDialog } from '../features/portfolio/PortfolioFormDialog';
import type { PortfolioFormValues } from '../features/portfolio/portfolioSchema';
import {
  useCreatePortfolioItem,
  useDeletePortfolioItem,
  usePortfolioItems,
  useUpdatePortfolioItem,
} from '../hooks/usePortfolioItems';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../lib/apiError';
import type { PortfolioItemRequest, PortfolioItemResponse } from '../api/types';

const PAGE_SIZE = 20;

type DialogState = { mode: 'create' } | { mode: 'edit'; item: PortfolioItemResponse } | null;

// "" -> no filter, "true"/"false" -> backend's `featured` query param.
type FeaturedFilter = '' | 'true' | 'false';

function toPortfolioItemRequest(values: PortfolioFormValues): PortfolioItemRequest {
  return {
    title: values.title.trim(),
    meta: values.meta.trim() || null,
    categoryTag: values.categoryTag.trim() || null,
    imageUrl: values.imageUrl.trim() || null,
    sortOrder: values.sortOrder,
    isVisible: values.isVisible,
    isFeatured: values.isFeatured,
  };
}

export default function PortfolioPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>('');
  // Backend sort whitelist for portfolio items is id/title/sortOrder only —
  // categoryTag/meta are not sortable, so those columns below stay unsortable.
  const [sort, setSort] = useState<string>('sortOrder');
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItemResponse | null>(null);

  // A new search/featured filter/sort invalidates the current page position.
  // Reset during render (React's documented "adjusting state when a dependency
  // changes" pattern), matching CategoriesPage/ProductsPage, rather than in an effect.
  const [appliedFilters, setAppliedFilters] = useState({ search: debouncedSearch, featuredFilter, sort });
  if (
    appliedFilters.search !== debouncedSearch ||
    appliedFilters.featuredFilter !== featuredFilter ||
    appliedFilters.sort !== sort
  ) {
    setAppliedFilters({ search: debouncedSearch, featuredFilter, sort });
    setPage(1);
  }

  const { data, isLoading, isError, refetch } = usePortfolioItems({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    featured: featuredFilter === '' ? undefined : featuredFilter === 'true',
    sort,
  });

  const createMutation = useCreatePortfolioItem();
  const updateMutation = useUpdatePortfolioItem();
  const deleteMutation = useDeletePortfolioItem();

  function handleSubmit(values: PortfolioFormValues) {
    const payload = toPortfolioItemRequest(values);
    if (dialogState?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialogState.item.id, payload },
        {
          onSuccess: () => {
            toast.success('Объект портфолио обновлён');
            setDialogState(null);
          },
          onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось обновить объект портфолио')),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Объект портфолио создан');
          setDialogState(null);
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось создать объект портфолио')),
      });
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    // If this was the only row on a page beyond the first, step back a page
    // so the user isn't left staring at an empty page after the refetch.
    const wasLastItemOnPage = data?.items.length === 1 && page > 1;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Объект портфолио удалён');
        setDeleteTarget(null);
        if (wasLastItemOnPage) {
          setPage((p) => Math.max(1, p - 1));
        }
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Не удалось удалить объект портфолио'));
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<PortfolioItemResponse>[] = [
    {
      key: 'image',
      label: '',
      render: (p) => <ImagePreview src={p.imageUrl} alt={`Фото объекта «${p.title}»`} />,
    },
    { key: 'title', label: 'Название', sortable: true, render: (p) => p.title },
    { key: 'meta', label: 'Подпись', render: (p) => p.meta || '—' },
    { key: 'categoryTag', label: 'Тег', render: (p) => p.categoryTag || '—' },
    { key: 'sortOrder', label: 'Порядок', sortable: true, render: (p) => p.sortOrder },
    {
      key: 'isVisible',
      label: 'Статус',
      render: (p) => (
        // Text carries the status, not just color — the dot is a decorative
        // accent, not the only signal.
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${p.isVisible ? 'text-accent' : 'text-muted'}`}>
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${p.isVisible ? 'bg-accent' : 'bg-muted'}`} />
          {p.isVisible ? 'Видимый' : 'Скрыто'}
        </span>
      ),
    },
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
            onClick={() => setDialogState({ mode: 'edit', item: p })}
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
  const isFiltered = debouncedSearch !== '' || featuredFilter !== '';

  return (
    <div>
      <SectionHeading
        title="Портфолио"
        description="Объекты, отображаемые в разделе портфолио на сайте."
        action={
          <button
            type="button"
            onClick={() => setDialogState({ mode: 'create' })}
            className="rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
          >
            + Добавить
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Поиск по названию или подписи" />

        <select
          value={featuredFilter}
          onChange={(event) => setFeaturedFilter(event.target.value as FeaturedFilter)}
          aria-label="Фильтр по featured"
          className="rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
        >
          <option value="">Все объекты</option>
          <option value="true">Только крупные (featured)</option>
          <option value="false">Только обычные</option>
        </select>

        {featuredFilter !== '' && (
          <button
            type="button"
            onClick={() => setFeaturedFilter('')}
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
          title={isFiltered ? 'Ничего не найдено' : 'Портфолио пока пусто'}
          description={
            isFiltered ? 'Попробуйте изменить условия поиска или фильтр.' : 'Добавьте первый объект портфолио.'
          }
        />
      ) : (
        <>
          <DataTable columns={columns} rows={data.items} getRowId={(p) => p.id} sort={sort} onSortChange={setSort} />
          <Pagination page={data.page} totalPages={data.totalPages} totalItems={data.totalItems} onPageChange={setPage} />
        </>
      )}

      <PortfolioFormDialog
        open={dialogState !== null}
        item={dialogState?.mode === 'edit' ? dialogState.item : null}
        busy={isSaving}
        onSubmit={handleSubmit}
        onClose={() => setDialogState(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить объект портфолио"
        message={deleteTarget ? `Удалить «${deleteTarget.title}»? Это действие нельзя отменить.` : ''}
        busy={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
