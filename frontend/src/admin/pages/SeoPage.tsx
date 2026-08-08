import { useState } from 'react';
import toast from 'react-hot-toast';
import { SectionHeading } from '../components/SectionHeading';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { RowActionsMenu } from '../components/ui/RowActionsMenu';
import { SeoMetaFormDialog } from '../features/seoMeta/SeoMetaFormDialog';
import { TranslationEditorModal } from '../features/translations/TranslationEditorModal';
import { TRANSLATION_FIELD_CONFIGS } from '../features/translations/translationFieldConfig';
import type { SeoMetaFormValues } from '../features/seoMeta/seoMetaSchema';
import { useSeoMetaList, useCreateSeoMeta, useUpdateSeoMeta, useDeleteSeoMeta } from '../hooks/useSeoMeta';
import { getApiErrorMessage } from '../lib/apiError';
import type { SeoMetaRequest, SeoMetaResponse } from '../api/types';

// One SEO entry per page (home, catalog-stone, ...) — realistically a handful
// of rows, so like ContactInfo/SocialLink this skips search/sort/pagination
// UI and just fetches everything in one page.
const LIST_ALL_PARAMS = { pageSize: 100 };

type DialogState = { mode: 'create' } | { mode: 'edit'; item: SeoMetaResponse } | null;

function toSeoMetaRequest(values: SeoMetaFormValues): SeoMetaRequest {
  return {
    pageKey: values.pageKey.trim(),
    title: values.title.trim(),
    description: values.description.trim() || null,
    ogImageUrl: values.ogImageUrl.trim() || null,
  };
}

export default function SeoPage() {
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<SeoMetaResponse | null>(null);
  const [translationsTarget, setTranslationsTarget] = useState<SeoMetaResponse | null>(null);

  const { data, isLoading, isError, refetch } = useSeoMetaList(LIST_ALL_PARAMS);
  const createMutation = useCreateSeoMeta();
  const updateMutation = useUpdateSeoMeta();
  const deleteMutation = useDeleteSeoMeta();

  function handleSubmit(values: SeoMetaFormValues) {
    const payload = toSeoMetaRequest(values);
    if (dialogState?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialogState.item.id, payload },
        {
          onSuccess: () => {
            toast.success('SEO-запись обновлена');
            setDialogState(null);
          },
          onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось обновить SEO-запись')),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('SEO-запись добавлена');
          setDialogState(null);
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось добавить SEO-запись')),
      });
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('SEO-запись удалена');
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Не удалось удалить SEO-запись'));
        setDeleteTarget(null);
      },
    });
  }

  const columns: DataTableColumn<SeoMetaResponse>[] = [
    { key: 'pageKey', label: 'PageKey', render: (s) => s.pageKey },
    { key: 'title', label: 'Title', render: (s) => s.title },
    { key: 'description', label: 'Description', render: (s) => <span className="line-clamp-2 max-w-md">{s.description}</span> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (s) => (
        <div className="flex justify-end">
          <RowActionsMenu
            ariaLabel={`Действия: «${s.pageKey}»`}
            actions={[
              { label: 'Переводы', onClick: () => setTranslationsTarget(s) },
              { label: 'Изменить', onClick: () => setDialogState({ mode: 'edit', item: s }) },
              { label: 'Удалить', variant: 'danger', onClick: () => setDeleteTarget(s) },
            ]}
          />
        </div>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <SectionHeading
        title="SEO"
        description="Title, description и OG-изображения по страницам."
        action={
          <button
            type="button"
            onClick={() => setDialogState({ mode: 'create' })}
            className="whitespace-nowrap rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
          >
            + Добавить
          </button>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <TableSkeleton columns={columns.length} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="SEO-записей пока нет" description="Добавьте первую запись (например, для главной страницы)." />
      ) : (
        <DataTable columns={columns} rows={data.items} getRowId={(s) => s.id} />
      )}

      <SeoMetaFormDialog
        open={dialogState !== null}
        item={dialogState?.mode === 'edit' ? dialogState.item : null}
        busy={isSaving}
        onSubmit={handleSubmit}
        onClose={() => setDialogState(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить SEO-запись"
        message={deleteTarget ? `Удалить «${deleteTarget.pageKey}»? Это действие нельзя отменить.` : ''}
        busy={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <TranslationEditorModal
        open={translationsTarget !== null}
        onClose={() => setTranslationsTarget(null)}
        entity="seo-meta"
        id={translationsTarget?.id ?? null}
        entityTitle={translationsTarget ? `«${translationsTarget.pageKey}»` : ''}
        fields={TRANSLATION_FIELD_CONFIGS['seo-meta']}
      />
    </div>
  );
}
