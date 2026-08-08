import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { socialLinkSchema, type SocialLinkFormValues } from './socialLinkSchema';
import type { SocialLinkResponse } from '../../api/types';

interface SocialLinkFormDialogProps {
  open: boolean;
  item: SocialLinkResponse | null; // null = create mode, otherwise edit mode
  busy: boolean;
  onSubmit: (values: SocialLinkFormValues) => void;
  onClose: () => void;
}

const DEFAULT_VALUES: SocialLinkFormValues = {
  platform: '',
  url: '',
  isVisible: true,
};

function defaultValuesFor(item: SocialLinkResponse | null): SocialLinkFormValues {
  if (!item) return DEFAULT_VALUES;
  return { platform: item.platform, url: item.url, isVisible: item.isVisible };
}

export function SocialLinkFormDialog({ open, item, busy, onSubmit, onClose }: SocialLinkFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SocialLinkFormValues>({
    resolver: zodResolver(socialLinkSchema),
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
    <Modal open={open} onClose={handleClose} title={item ? 'Изменить соцсеть' : 'Новая соцсеть'}>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4" noValidate>
        <FormField label="Платформа" htmlFor="social-link-platform" error={errors.platform?.message}>
          <input
            id="social-link-platform"
            placeholder="whatsapp, telegram, instagram…"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.platform ? 'true' : undefined}
            {...register('platform')}
          />
        </FormField>

        <FormField label="Ссылка" htmlFor="social-link-url" error={errors.url?.message}>
          <input
            id="social-link-url"
            type="url"
            placeholder="https://wa.me/992872701515"
            className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            aria-invalid={errors.url ? 'true' : undefined}
            {...register('url')}
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
