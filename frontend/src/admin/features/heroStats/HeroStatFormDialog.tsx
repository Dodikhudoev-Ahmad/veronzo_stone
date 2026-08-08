import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { heroStatSchema, type HeroStatFormValues } from './heroStatSchema';
import type { HeroStatResponse } from '../../api/types';

interface HeroStatFormDialogProps {
  open: boolean;
  item: HeroStatResponse | null; // null = create mode, otherwise edit mode
  busy: boolean;
  onSubmit: (values: HeroStatFormValues) => void;
  onClose: () => void;
}

const DEFAULT_VALUES: HeroStatFormValues = {
  label: '',
  value: 0,
  suffix: '',
  sortOrder: 0,
  isVisible: true,
};

function defaultValuesFor(item: HeroStatResponse | null): HeroStatFormValues {
  if (!item) return DEFAULT_VALUES;
  return {
    label: item.label,
    value: item.value,
    suffix: item.suffix ?? '',
    sortOrder: item.sortOrder,
    isVisible: item.isVisible,
  };
}

export function HeroStatFormDialog({ open, item, busy, onSubmit, onClose }: HeroStatFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HeroStatFormValues>({
    resolver: zodResolver(heroStatSchema),
    defaultValues: defaultValuesFor(item),
  });

  // Re-seed the form whenever the dialog is (re)opened for a different item
  // (or for "create"), since the same dialog instance is reused.
  useEffect(() => {
    if (open) {
      reset(defaultValuesFor(item));
    }
  }, [open, item, reset]);

  function handleClose() {
    if (!busy) {
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={item ? 'Изменить показатель' : 'Новый показатель'}>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4" noValidate>
        <FormField label="Подпись" htmlFor="hero-stat-label" error={errors.label?.message}>
          <input
            id="hero-stat-label"
            placeholder="лет на рынке, объектов сдано…"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.label ? 'true' : undefined}
            {...register('label')}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Значение" htmlFor="hero-stat-value" error={errors.value?.message}>
            <input
              id="hero-stat-value"
              type="number"
              className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              aria-invalid={errors.value ? 'true' : undefined}
              {...register('value', { valueAsNumber: true })}
            />
          </FormField>

          <FormField label="Суффикс (необязательно)" htmlFor="hero-stat-suffix" error={errors.suffix?.message}>
            <input
              id="hero-stat-suffix"
              placeholder="+"
              className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              aria-invalid={errors.suffix ? 'true' : undefined}
              {...register('suffix')}
            />
          </FormField>
        </div>

        <FormField label="Порядок сортировки" htmlFor="hero-stat-sort-order" error={errors.sortOrder?.message}>
          <input
            id="hero-stat-sort-order"
            type="number"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.sortOrder ? 'true' : undefined}
            {...register('sortOrder', { valueAsNumber: true })}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" className="h-4 w-4 rounded border-cream-soft" {...register('isVisible')} />
          Показывать на сайте
        </label>

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
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
