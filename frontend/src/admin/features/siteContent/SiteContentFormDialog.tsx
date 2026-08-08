import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { siteContentSchema, type SiteContentFormValues } from './siteContentSchema';
import type { SiteContentResponse } from '../../api/types';

interface SiteContentFormDialogProps {
  open: boolean;
  item: SiteContentResponse | null; // null = create mode, otherwise edit mode
  busy: boolean;
  onSubmit: (values: SiteContentFormValues) => void;
  onClose: () => void;
}

const DEFAULT_VALUES: SiteContentFormValues = { key: '', value: '' };

function defaultValuesFor(item: SiteContentResponse | null): SiteContentFormValues {
  if (!item) return DEFAULT_VALUES;
  return { key: item.key, value: item.value };
}

export function SiteContentFormDialog({ open, item, busy, onSubmit, onClose }: SiteContentFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SiteContentFormValues>({
    resolver: zodResolver(siteContentSchema),
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
    <Modal open={open} onClose={handleClose} title={item ? 'Изменить текст' : 'Новый текст'}>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4" noValidate>
        <FormField label="Ключ" htmlFor="site-content-key" error={errors.key?.message}>
          <input
            id="site-content-key"
            placeholder="hero.title, about.paragraph1…"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.key ? 'true' : undefined}
            {...register('key')}
          />
        </FormField>

        <FormField label="Значение" htmlFor="site-content-value" error={errors.value?.message}>
          <textarea
            id="site-content-value"
            rows={4}
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.value ? 'true' : undefined}
            {...register('value')}
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
