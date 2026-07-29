import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { definitionSchema, type DefinitionFormValues } from './definitionSchema';
import type { ProductAttributeDefinitionResponse } from '../../api/types';

interface DefinitionFormDialogProps {
  open: boolean;
  categoryId: number;
  definition: ProductAttributeDefinitionResponse | null; // null = create mode
  busy: boolean;
  onSubmit: (values: DefinitionFormValues) => void;
  onClose: () => void;
}

function defaultValuesFor(categoryId: number, definition: ProductAttributeDefinitionResponse | null): DefinitionFormValues {
  if (definition) {
    return {
      categoryId: definition.categoryId,
      key: definition.key,
      name: definition.name,
      sortOrder: definition.sortOrder,
      isFilterable: definition.isFilterable,
      isVisible: definition.isVisible,
    };
  }
  return { categoryId, key: '', name: '', sortOrder: 0, isFilterable: true, isVisible: true };
}

export function DefinitionFormDialog({ open, categoryId, definition, busy, onSubmit, onClose }: DefinitionFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DefinitionFormValues>({
    resolver: zodResolver(definitionSchema),
    defaultValues: defaultValuesFor(categoryId, definition),
  });

  useEffect(() => {
    if (open) {
      reset(defaultValuesFor(categoryId, definition));
    }
  }, [open, categoryId, definition, reset]);

  return (
    <Modal open={open} onClose={onClose} title={definition ? 'Изменить характеристику' : 'Новая характеристика'}>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4" noValidate>
        <FormField label="Key" htmlFor="definition-key" error={errors.key?.message}>
          <input
            id="definition-key"
            placeholder="stone_type"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.key ? 'true' : undefined}
            {...register('key')}
          />
        </FormField>

        <FormField label="Название" htmlFor="definition-name" error={errors.name?.message}>
          <input
            id="definition-name"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.name ? 'true' : undefined}
            {...register('name')}
          />
        </FormField>

        <FormField label="Порядок сортировки" htmlFor="definition-sort-order" error={errors.sortOrder?.message}>
          <input
            id="definition-sort-order"
            type="number"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.sortOrder ? 'true' : undefined}
            {...register('sortOrder', { valueAsNumber: true })}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" className="h-4 w-4 rounded border-cream-soft" {...register('isFilterable')} />
          Доступна как фильтр на публичном сайте
        </label>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" className="h-4 w-4 rounded border-cream-soft" {...register('isVisible')} />
          Видима (используется в товарах и на сайте)
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
