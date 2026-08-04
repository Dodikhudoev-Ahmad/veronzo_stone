import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SectionHeading } from '../components/SectionHeading';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { RowActionsMenu } from '../components/ui/RowActionsMenu';
import { DefinitionFormDialog } from '../features/productAttributes/DefinitionFormDialog';
import { OptionFormDialog } from '../features/productAttributes/OptionFormDialog';
import type { DefinitionFormValues } from '../features/productAttributes/definitionSchema';
import type { OptionFormValues } from '../features/productAttributes/optionSchema';
import { useCategoryOptions } from '../features/products/useCategoryOptions';
import { TranslationEditorModal } from '../features/translations/TranslationEditorModal';
import { TRANSLATION_FIELD_CONFIGS } from '../features/translations/translationFieldConfig';
import {
  useCreateProductAttributeDefinition,
  useDeleteProductAttributeDefinition,
  useProductAttributeDefinitions,
  useUpdateProductAttributeDefinition,
} from '../hooks/useProductAttributeDefinitions';
import {
  useCreateProductAttributeOption,
  useDeleteProductAttributeOption,
  useProductAttributeOptions,
  useUpdateProductAttributeOption,
} from '../hooks/useProductAttributeOptions';
import { getApiErrorMessage } from '../lib/apiError';
import type { ProductAttributeDefinitionResponse, ProductAttributeOptionResponse } from '../api/types';

const LIST_PARAMS = { page: 1, pageSize: 100, sort: 'sortOrder' };

type DefinitionDialogState = { mode: 'create' } | { mode: 'edit'; definition: ProductAttributeDefinitionResponse } | null;
type OptionDialogState = { mode: 'create' } | { mode: 'edit'; option: ProductAttributeOptionResponse } | null;

export default function ProductAttributesPage() {
  const categoryOptions = useCategoryOptions();
  const categories = categoryOptions.data?.items ?? [];

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<number | undefined>(undefined);
  const categoryId = selectedCategoryId ?? categories[0]?.id;

  const [definitionDialog, setDefinitionDialog] = useState<DefinitionDialogState>(null);
  const [deleteDefinitionTarget, setDeleteDefinitionTarget] = useState<ProductAttributeDefinitionResponse | null>(null);
  const [definitionTranslationsTarget, setDefinitionTranslationsTarget] = useState<ProductAttributeDefinitionResponse | null>(null);

  const [optionDialog, setOptionDialog] = useState<OptionDialogState>(null);
  const [deleteOptionTarget, setDeleteOptionTarget] = useState<ProductAttributeOptionResponse | null>(null);
  const [optionTranslationsTarget, setOptionTranslationsTarget] = useState<ProductAttributeOptionResponse | null>(null);

  const definitionsQuery = useProductAttributeDefinitions(
    categoryId !== undefined ? { ...LIST_PARAMS, categoryId } : LIST_PARAMS,
  );
  const definitions = categoryId !== undefined ? (definitionsQuery.data?.items ?? []) : [];
  const definitionId = selectedDefinitionId ?? definitions[0]?.id;
  const selectedDefinition = definitions.find((d) => d.id === definitionId) ?? null;

  const optionsQuery = useProductAttributeOptions(definitionId !== undefined ? { ...LIST_PARAMS, definitionId } : LIST_PARAMS);
  const options = definitionId !== undefined ? (optionsQuery.data?.items ?? []) : [];

  const createDefinition = useCreateProductAttributeDefinition();
  const updateDefinition = useUpdateProductAttributeDefinition();
  const deleteDefinition = useDeleteProductAttributeDefinition();

  const createOption = useCreateProductAttributeOption();
  const updateOption = useUpdateProductAttributeOption();
  const deleteOption = useDeleteProductAttributeOption();

  function handleCategoryChange(nextCategoryId: number) {
    setSelectedCategoryId(nextCategoryId);
    // A definition selected under the previous category has no meaning here —
    // let it re-derive to the new category's first definition.
    setSelectedDefinitionId(undefined);
  }

  function handleDefinitionSubmit(values: DefinitionFormValues) {
    if (definitionDialog?.mode === 'edit') {
      updateDefinition.mutate(
        { id: definitionDialog.definition.id, payload: values },
        {
          onSuccess: () => {
            toast.success('Характеристика обновлена');
            setDefinitionDialog(null);
          },
          onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось обновить характеристику')),
        },
      );
    } else {
      createDefinition.mutate(values, {
        onSuccess: (created) => {
          toast.success('Характеристика создана');
          setDefinitionDialog(null);
          setSelectedDefinitionId(created.id);
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось создать характеристику')),
      });
    }
  }

  function handleDeleteDefinitionConfirm() {
    if (!deleteDefinitionTarget) return;
    deleteDefinition.mutate(deleteDefinitionTarget.id, {
      onSuccess: () => {
        toast.success('Характеристика удалена');
        if (selectedDefinitionId === deleteDefinitionTarget.id) {
          setSelectedDefinitionId(undefined);
        }
        setDeleteDefinitionTarget(null);
      },
      onError: (error) => {
        // Most commonly a 409 — the definition still has options or product values.
        toast.error(getApiErrorMessage(error, 'Не удалось удалить характеристику'));
        setDeleteDefinitionTarget(null);
      },
    });
  }

  function handleOptionSubmit(values: OptionFormValues) {
    if (optionDialog?.mode === 'edit') {
      updateOption.mutate(
        { id: optionDialog.option.id, payload: values },
        {
          onSuccess: () => {
            toast.success('Значение обновлено');
            setOptionDialog(null);
          },
          onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось обновить значение')),
        },
      );
    } else {
      createOption.mutate(values, {
        onSuccess: () => {
          toast.success('Значение создано');
          setOptionDialog(null);
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось создать значение')),
      });
    }
  }

  function handleDeleteOptionConfirm() {
    if (!deleteOptionTarget) return;
    deleteOption.mutate(deleteOptionTarget.id, {
      onSuccess: () => {
        toast.success('Значение удалено');
        setDeleteOptionTarget(null);
      },
      onError: (error) => {
        // Most commonly a 409 — the option is still assigned to a product.
        toast.error(getApiErrorMessage(error, 'Не удалось удалить значение'));
        setDeleteOptionTarget(null);
      },
    });
  }

  const definitionColumns: DataTableColumn<ProductAttributeDefinitionResponse>[] = [
    { key: 'key', label: 'Key', render: (d) => <code className="text-xs">{d.key}</code> },
    { key: 'name', label: 'Название', render: (d) => d.name },
    { key: 'sortOrder', label: 'Порядок', render: (d) => d.sortOrder },
    { key: 'isFilterable', label: 'Фильтр', render: (d) => (d.isFilterable ? '✓' : '—') },
    { key: 'isVisible', label: 'Видима', render: (d) => (d.isVisible ? '✓' : '—') },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (d) => (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            aria-label={`Значения «${d.name}»`}
            aria-current={d.id === definitionId ? 'true' : undefined}
            className={`hover:underline ${d.id === definitionId ? 'font-semibold text-text' : 'text-accent'}`}
            onClick={() => setSelectedDefinitionId(d.id)}
          >
            Значения →
          </button>
          <RowActionsMenu
            ariaLabel={`Действия: «${d.name}»`}
            actions={[
              { label: 'Переводы', onClick: () => setDefinitionTranslationsTarget(d) },
              { label: 'Изменить', onClick: () => setDefinitionDialog({ mode: 'edit', definition: d }) },
              { label: 'Удалить', variant: 'danger', onClick: () => setDeleteDefinitionTarget(d) },
            ]}
          />
        </div>
      ),
    },
  ];

  const optionColumns: DataTableColumn<ProductAttributeOptionResponse>[] = [
    { key: 'value', label: 'Value', render: (o) => <code className="text-xs">{o.value}</code> },
    { key: 'label', label: 'Подпись', render: (o) => o.label },
    { key: 'sortOrder', label: 'Порядок', render: (o) => o.sortOrder },
    { key: 'isVisible', label: 'Видимо', render: (o) => (o.isVisible ? '✓' : '—') },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (o) => (
        <div className="flex justify-end">
          <RowActionsMenu
            ariaLabel={`Действия: «${o.label}»`}
            actions={[
              { label: 'Переводы', onClick: () => setOptionTranslationsTarget(o) },
              { label: 'Изменить', onClick: () => setOptionDialog({ mode: 'edit', option: o }) },
              { label: 'Удалить', variant: 'danger', onClick: () => setDeleteOptionTarget(o) },
            ]}
          />
        </div>
      ),
    },
  ];

  const isSavingDefinition = createDefinition.isPending || updateDefinition.isPending;
  const isSavingOption = createOption.isPending || updateOption.isPending;

  return (
    <div>
      <SectionHeading
        title="Характеристики"
        description="Фильтруемые характеристики товаров по категориям каталога (тип камня, материал, цвет и т.д.)."
      />

      {categoryOptions.isError ? (
        <ErrorState message="Не удалось загрузить категории" onRetry={() => void categoryOptions.refetch()} />
      ) : categoryOptions.isLoading ? (
        <p className="text-sm text-muted">Загрузка категорий…</p>
      ) : categories.length === 0 ? (
        <EmptyState
          title="Сначала создайте категорию"
          description="Характеристики привязаны к категории каталога."
          action={
            <Link
              to="/admin/categories"
              className="whitespace-nowrap rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
            >
              Перейти в «Категории»
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <label htmlFor="attributes-category" className="text-xs font-semibold uppercase tracking-wide text-muted">
              Категория
            </label>
            <select
              id="attributes-category"
              value={categoryId ?? ''}
              onChange={(event) => handleCategoryChange(Number(event.target.value))}
              className="rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <section className="mb-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-text">Характеристики категории</h2>
              <button
                type="button"
                onClick={() => setDefinitionDialog({ mode: 'create' })}
                className="whitespace-nowrap rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
              >
                + Добавить характеристику
              </button>
            </div>

            {definitionsQuery.isError ? (
              <ErrorState onRetry={() => void definitionsQuery.refetch()} />
            ) : definitionsQuery.isLoading ? (
              <TableSkeleton columns={definitionColumns.length} />
            ) : definitions.length === 0 ? (
              <EmptyState
                title="Характеристик пока нет"
                description="Добавьте первую характеристику для этой категории (например, «Тип камня»)."
              />
            ) : (
              <DataTable columns={definitionColumns} rows={definitions} getRowId={(d) => d.id} />
            )}
          </section>

          {selectedDefinition && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-text">
                  Значения: «{selectedDefinition.name}» ({selectedDefinition.key})
                </h2>
                <button
                  type="button"
                  onClick={() => setOptionDialog({ mode: 'create' })}
                  className="whitespace-nowrap rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110"
                >
                  + Добавить значение
                </button>
              </div>

              {optionsQuery.isError ? (
                <ErrorState onRetry={() => void optionsQuery.refetch()} />
              ) : optionsQuery.isLoading ? (
                <TableSkeleton columns={optionColumns.length} />
              ) : options.length === 0 ? (
                <EmptyState title="Значений пока нет" description="Добавьте первое значение (например, «Мрамор»)." />
              ) : (
                <DataTable columns={optionColumns} rows={options} getRowId={(o) => o.id} />
              )}
            </section>
          )}
        </>
      )}

      {categoryId !== undefined && (
        <DefinitionFormDialog
          open={definitionDialog !== null}
          categoryId={categoryId}
          definition={definitionDialog?.mode === 'edit' ? definitionDialog.definition : null}
          busy={isSavingDefinition}
          onSubmit={handleDefinitionSubmit}
          onClose={() => setDefinitionDialog(null)}
        />
      )}

      <ConfirmDialog
        open={deleteDefinitionTarget !== null}
        title="Удалить характеристику"
        message={
          deleteDefinitionTarget
            ? `Удалить характеристику «${deleteDefinitionTarget.name}»? Если для неё ещё есть значения или она присвоена товарам, удаление будет отклонено.`
            : ''
        }
        busy={deleteDefinition.isPending}
        onConfirm={handleDeleteDefinitionConfirm}
        onCancel={() => setDeleteDefinitionTarget(null)}
      />

      <TranslationEditorModal
        open={definitionTranslationsTarget !== null}
        onClose={() => setDefinitionTranslationsTarget(null)}
        entity="product-attribute-definitions"
        id={definitionTranslationsTarget?.id ?? null}
        entityTitle={definitionTranslationsTarget ? `«${definitionTranslationsTarget.name}»` : ''}
        fields={TRANSLATION_FIELD_CONFIGS['product-attribute-definitions']}
      />

      {definitionId !== undefined && (
        <OptionFormDialog
          open={optionDialog !== null}
          definitionId={definitionId}
          option={optionDialog?.mode === 'edit' ? optionDialog.option : null}
          busy={isSavingOption}
          onSubmit={handleOptionSubmit}
          onClose={() => setOptionDialog(null)}
        />
      )}

      <ConfirmDialog
        open={deleteOptionTarget !== null}
        title="Удалить значение"
        message={
          deleteOptionTarget
            ? `Удалить значение «${deleteOptionTarget.label}»? Если оно ещё присвоено товару, удаление будет отклонено.`
            : ''
        }
        busy={deleteOption.isPending}
        onConfirm={handleDeleteOptionConfirm}
        onCancel={() => setDeleteOptionTarget(null)}
      />

      <TranslationEditorModal
        open={optionTranslationsTarget !== null}
        onClose={() => setOptionTranslationsTarget(null)}
        entity="product-attribute-options"
        id={optionTranslationsTarget?.id ?? null}
        entityTitle={optionTranslationsTarget ? `«${optionTranslationsTarget.label}»` : ''}
        fields={TRANSLATION_FIELD_CONFIGS['product-attribute-options']}
      />
    </div>
  );
}
