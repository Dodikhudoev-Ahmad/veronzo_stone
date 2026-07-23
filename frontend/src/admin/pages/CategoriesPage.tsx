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
import { CategoryFormDialog } from '../features/categories/CategoryFormDialog';
import type { CategoryFormValues } from '../features/categories/categorySchema';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '../hooks/useCategories';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../lib/apiError';
import type { CategoryResponse } from '../api/types';

const PAGE_SIZE = 20;

type DialogState = { mode: 'create' } | { mode: 'edit'; category: CategoryResponse } | null;

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [sort, setSort] = useState<string>('sortOrder');
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryResponse | null>(null);

  // A new search/sort invalidates the current page position. Reset it during
  // render (React's documented "adjusting state when a dependency changes"
  // pattern) rather than in an effect, which would cause an extra commit.
  const [appliedFilters, setAppliedFilters] = useState({ search: debouncedSearch, sort });
  if (appliedFilters.search !== debouncedSearch || appliedFilters.sort !== sort) {
    setAppliedFilters({ search: debouncedSearch, sort });
    setPage(1);
  }

  const { data, isLoading, isError, refetch } = useCategories({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    sort,
  });

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  function handleSubmit(values: CategoryFormValues) {
    if (dialogState?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialogState.category.id, payload: values },
        {
          onSuccess: () => {
            toast.success('Категория обновлена');
            setDialogState(null);
          },
          onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось обновить категорию')),
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Категория создана');
          setDialogState(null);
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось создать категорию')),
      });
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Категория удалена');
        setDeleteTarget(null);
      },
      onError: (error) => {
        // Most commonly a 409 — the category still has products attached.
        toast.error(getApiErrorMessage(error, 'Не удалось удалить категорию'));
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<CategoryResponse>[] = [
    { key: 'name', label: 'Название', sortable: true, render: (c) => c.name },
    { key: 'slug', label: 'Slug', sortable: true, render: (c) => c.slug },
    { key: 'sortOrder', label: 'Порядок', sortable: true, render: (c) => c.sortOrder },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="text-accent hover:underline"
            onClick={() => setDialogState({ mode: 'edit', category: c })}
          >
            Изменить
          </button>
          <button type="button" className="text-error hover:underline" onClick={() => setDeleteTarget(c)}>
            Удалить
          </button>
        </div>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <SectionHeading
        title="Категории"
        description="Управление категориями каталога (камень, двери, лифты, окна)."
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

      <div className="mb-4">
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Поиск по названию или slug" />
      </div>

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <TableSkeleton columns={columns.length} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={debouncedSearch ? 'Ничего не найдено' : 'Категорий пока нет'}
          description={debouncedSearch ? 'Попробуйте изменить условия поиска.' : 'Добавьте первую категорию каталога.'}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data.items}
            getRowId={(c) => c.id}
            sort={sort}
            onSortChange={setSort}
          />
          <Pagination page={data.page} totalPages={data.totalPages} totalItems={data.totalItems} onPageChange={setPage} />
        </>
      )}

      <CategoryFormDialog
        open={dialogState !== null}
        category={dialogState?.mode === 'edit' ? dialogState.category : null}
        busy={isSaving}
        onSubmit={handleSubmit}
        onClose={() => setDialogState(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить категорию"
        message={
          deleteTarget
            ? `Удалить категорию «${deleteTarget.name}»? Это действие нельзя отменить. Если в категории ещё есть товары, удаление будет отклонено.`
            : ''
        }
        busy={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
