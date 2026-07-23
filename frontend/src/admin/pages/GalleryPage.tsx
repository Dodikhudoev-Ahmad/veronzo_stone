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
import { GalleryFormDialog } from '../features/gallery/GalleryFormDialog';
import type { GalleryFormValues } from '../features/gallery/gallerySchema';
import { useCreateGalleryItem, useDeleteGalleryItem, useGalleryItems, useUpdateGalleryItem } from '../hooks/useGalleryItems';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../lib/apiError';
import type { GalleryItemRequest, GalleryItemResponse } from '../api/types';

const PAGE_SIZE = 20;

type DialogState = { mode: 'create' } | { mode: 'edit'; item: GalleryItemResponse } | null;

function toGalleryItemRequest(values: GalleryFormValues): GalleryItemRequest {
  return {
    title: values.title.trim(),
    imageUrl: values.imageUrl.trim() || null,
    sortOrder: values.sortOrder,
    isVisible: values.isVisible,
  };
}

export default function GalleryPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  // Backend sort whitelist for gallery items is id/title/sortOrder only.
  const [sort, setSort] = useState<string>('sortOrder');
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItemResponse | null>(null);

  // A new search/sort invalidates the current page position. Reset during
  // render (React's documented "adjusting state when a dependency changes"
  // pattern), matching Categories/Products/Portfolio, rather than in an effect.
  const [appliedFilters, setAppliedFilters] = useState({ search: debouncedSearch, sort });
  if (appliedFilters.search !== debouncedSearch || appliedFilters.sort !== sort) {
    setAppliedFilters({ search: debouncedSearch, sort });
    setPage(1);
  }

  const { data, isLoading, isError, refetch } = useGalleryItems({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    sort,
  });

  const createMutation = useCreateGalleryItem();
  const updateMutation = useUpdateGalleryItem();
  const deleteMutation = useDeleteGalleryItem();

  function handleSubmit(values: GalleryFormValues) {
    const payload = toGalleryItemRequest(values);
    if (dialogState?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialogState.item.id, payload },
        {
          onSuccess: () => {
            toast.success('Фото галереи обновлено');
            setDialogState(null);
          },
          onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось обновить фото галереи')),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Фото галереи добавлено');
          setDialogState(null);
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось добавить фото галереи')),
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
        toast.success('Фото галереи удалено');
        setDeleteTarget(null);
        if (wasLastItemOnPage) {
          setPage((p) => Math.max(1, p - 1));
        }
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Не удалось удалить фото галереи'));
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<GalleryItemResponse>[] = [
    {
      key: 'image',
      label: '',
      render: (g) => <ImagePreview src={g.imageUrl} alt={`Фото «${g.title}»`} />,
    },
    { key: 'title', label: 'Название', sortable: true, render: (g) => g.title },
    { key: 'sortOrder', label: 'Порядок', sortable: true, render: (g) => g.sortOrder },
    {
      key: 'isVisible',
      label: 'Статус',
      render: (g) => (
        // Text carries the status, not just color — the dot is a decorative
        // accent, not the only signal.
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${g.isVisible ? 'text-accent' : 'text-muted'}`}>
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${g.isVisible ? 'bg-accent' : 'bg-muted'}`} />
          {g.isVisible ? 'Видимый' : 'Скрыто'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (g) => (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            aria-label={`Изменить «${g.title}»`}
            className="text-accent hover:underline"
            onClick={() => setDialogState({ mode: 'edit', item: g })}
          >
            Изменить
          </button>
          <button
            type="button"
            aria-label={`Удалить «${g.title}»`}
            className="text-error hover:underline"
            onClick={() => setDeleteTarget(g)}
          >
            Удалить
          </button>
        </div>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isFiltered = debouncedSearch !== '';

  return (
    <div>
      <SectionHeading
        title="Галерея"
        description="Фотографии, отображаемые в разделе галереи на сайте."
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
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Поиск по названию" />
      </div>

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <TableSkeleton columns={columns.length} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={isFiltered ? 'Ничего не найдено' : 'Галерея пока пуста'}
          description={isFiltered ? 'Попробуйте изменить условия поиска.' : 'Добавьте первое фото галереи.'}
        />
      ) : (
        <>
          <DataTable columns={columns} rows={data.items} getRowId={(g) => g.id} sort={sort} onSortChange={setSort} />
          <Pagination page={data.page} totalPages={data.totalPages} totalItems={data.totalItems} onPageChange={setPage} />
        </>
      )}

      <GalleryFormDialog
        open={dialogState !== null}
        item={dialogState?.mode === 'edit' ? dialogState.item : null}
        busy={isSaving}
        onSubmit={handleSubmit}
        onClose={() => setDialogState(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить фото галереи"
        message={deleteTarget ? `Удалить «${deleteTarget.title}»? Это действие нельзя отменить.` : ''}
        busy={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
