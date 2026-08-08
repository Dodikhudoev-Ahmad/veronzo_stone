import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { contactInfoSchema, type ContactInfoFormValues } from './contactInfoSchema';
import type { ContactInfoResponse } from '../../api/types';

interface ContactInfoFormDialogProps {
  open: boolean;
  item: ContactInfoResponse | null; // null = create mode, otherwise edit mode
  busy: boolean;
  onSubmit: (values: ContactInfoFormValues) => void;
  onClose: () => void;
}

const DEFAULT_VALUES: ContactInfoFormValues = {
  label: '',
  value: '',
  sortOrder: 0,
};

function defaultValuesFor(item: ContactInfoResponse | null): ContactInfoFormValues {
  if (!item) return DEFAULT_VALUES;
  return { label: item.label, value: item.value, sortOrder: item.sortOrder };
}

export function ContactInfoFormDialog({ open, item, busy, onSubmit, onClose }: ContactInfoFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInfoFormValues>({
    resolver: zodResolver(contactInfoSchema),
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
    <Modal open={open} onClose={handleClose} title={item ? 'Изменить контакт' : 'Новый контакт'}>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4" noValidate>
        <FormField label="Подпись" htmlFor="contact-info-label" error={errors.label?.message}>
          <input
            id="contact-info-label"
            placeholder="Телефон, Почта, Шоурум…"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.label ? 'true' : undefined}
            {...register('label')}
          />
        </FormField>

        <FormField label="Значение" htmlFor="contact-info-value" error={errors.value?.message}>
          <input
            id="contact-info-value"
            placeholder="+992 87 270 1515"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.value ? 'true' : undefined}
            {...register('value')}
          />
        </FormField>

        <FormField label="Порядок сортировки" htmlFor="contact-info-sort-order" error={errors.sortOrder?.message}>
          <input
            id="contact-info-sort-order"
            type="number"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.sortOrder ? 'true' : undefined}
            {...register('sortOrder', { valueAsNumber: true })}
          />
        </FormField>

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
