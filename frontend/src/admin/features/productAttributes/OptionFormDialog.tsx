import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { optionSchema, type OptionFormValues } from './optionSchema';
import type { ProductAttributeOptionResponse } from '../../api/types';

interface OptionFormDialogProps {
  open: boolean;
  definitionId: number;
  option: ProductAttributeOptionResponse | null; // null = create mode
  busy: boolean;
  onSubmit: (values: OptionFormValues) => void;
  onClose: () => void;
}

function defaultValuesFor(definitionId: number, option: ProductAttributeOptionResponse | null): OptionFormValues {
  if (option) {
    return {
      definitionId: option.definitionId,
      value: option.value,
      label: option.label,
      sortOrder: option.sortOrder,
      isVisible: option.isVisible,
    };
  }
  return { definitionId, value: '', label: '', sortOrder: 0, isVisible: true };
}

export function OptionFormDialog({ open, definitionId, option, busy, onSubmit, onClose }: OptionFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OptionFormValues>({
    resolver: zodResolver(optionSchema),
    defaultValues: defaultValuesFor(definitionId, option),
  });

  useEffect(() => {
    if (open) {
      reset(defaultValuesFor(definitionId, option));
    }
  }, [open, definitionId, option, reset]);

  return (
    <Modal open={open} onClose={onClose} title={option ? 'Изменить значение' : 'Новое значение'}>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4" noValidate>
        <FormField label="Value" htmlFor="option-value" error={errors.value?.message}>
          <input
            id="option-value"
            placeholder="marble"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.value ? 'true' : undefined}
            {...register('value')}
          />
        </FormField>

        <FormField label="Подпись" htmlFor="option-label" error={errors.label?.message}>
          <input
            id="option-label"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.label ? 'true' : undefined}
            {...register('label')}
          />
        </FormField>

        <FormField label="Порядок сортировки" htmlFor="option-sort-order" error={errors.sortOrder?.message}>
          <input
            id="option-sort-order"
            type="number"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.sortOrder ? 'true' : undefined}
            {...register('sortOrder', { valueAsNumber: true })}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" className="h-4 w-4 rounded border-cream-soft" {...register('isVisible')} />
          Видимо (доступно для выбора)
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
