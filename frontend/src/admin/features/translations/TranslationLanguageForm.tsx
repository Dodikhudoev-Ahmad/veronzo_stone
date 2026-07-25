import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { FormField } from '../../components/ui/FormField';
import { getApiErrorMessage } from '../../lib/apiError';
import { useUpsertTranslation } from '../../hooks/useTranslations';
import type { TranslatableEntity, TranslationResponse } from '../../api/translations';
import type { TranslationFieldConfig } from './translationFieldConfig';
import { buildTranslationSchema, type TranslationFormValues } from './translationSchema';
import type { LanguageCode } from './languages';

function valuesFromTranslation(fields: TranslationFieldConfig[], translation: TranslationResponse | undefined): TranslationFormValues {
  const values: TranslationFormValues = {};
  for (const field of fields) {
    values[field.key] = translation?.fields[field.key] ?? '';
  }
  return values;
}

interface TranslationLanguageFormProps {
  entity: TranslatableEntity;
  id: number;
  languageCode: LanguageCode;
  fields: TranslationFieldConfig[];
  translation: TranslationResponse | undefined;
  // Kept mounted-but-hidden when not the active tab (see TranslationEditorModal)
  // so switching tabs never loses in-progress edits.
  active: boolean;
  hasFallback: boolean;
  onDirtyChange: (languageCode: LanguageCode, dirty: boolean) => void;
}

export function TranslationLanguageForm({
  entity,
  id,
  languageCode,
  fields,
  translation,
  active,
  hasFallback,
  onDirtyChange,
}: TranslationLanguageFormProps) {
  const schema = buildTranslationSchema(fields);
  const mutation = useUpsertTranslation(entity, id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TranslationFormValues>({
    // Dynamic per-entity zod shape (see buildTranslationSchema) — every field
    // is a plain string, so this always matches TranslationFormValues at
    // runtime even though zod can't express that generically.
    resolver: zodResolver(schema) as unknown as Resolver<TranslationFormValues>,
    defaultValues: valuesFromTranslation(fields, translation),
  });

  // Re-seed only when the loaded translation for this language actually
  // changes (e.g. first load) — not on every render, and never triggered by
  // switching to/from this tab, so in-progress edits on other tabs survive.
  useEffect(() => {
    reset(valuesFromTranslation(fields, translation));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translation]);

  useEffect(() => {
    onDirtyChange(languageCode, isDirty);
  }, [isDirty, languageCode, onDirtyChange]);

  function onSubmit(values: TranslationFormValues) {
    const trimmedFields: Record<string, string | null> = {};
    for (const field of fields) {
      const trimmed = (values[field.key] ?? '').trim();
      trimmedFields[field.key] = trimmed === '' ? null : trimmed;
    }

    mutation.mutate(
      { languageCode, fields: trimmedFields },
      {
        onSuccess: (saved) => {
          toast.success(`Перевод сохранён (${languageCode.toUpperCase()})`);
          // keepDirty:false clears only this language's dirty flag — the other
          // three TranslationLanguageForm instances are untouched.
          reset(valuesFromTranslation(fields, saved), { keepDirty: false });
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Не удалось сохранить перевод')),
      },
    );
  }

  return (
    <div role="tabpanel" id={`translation-panel-${languageCode}`} aria-labelledby={`translation-tab-${languageCode}`} hidden={!active}>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)} className="flex flex-col gap-4" noValidate>
        {languageCode !== 'ru' && hasFallback && (
          <p className="rounded-md bg-cream-soft/60 px-3 py-2 text-xs text-muted">
            На публичном сайте будет использован русский перевод, пока для этого языка ничего не сохранено.
          </p>
        )}

        {fields.map((field) => {
          const fieldId = `translation-${entity}-${id}-${languageCode}-${field.key}`;
          const error = errors[field.key]?.message as string | undefined;
          return (
            <FormField key={field.key} label={field.label} htmlFor={fieldId} error={error}>
              {field.multiline ? (
                <textarea
                  id={fieldId}
                  rows={3}
                  className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                  aria-invalid={error ? 'true' : undefined}
                  {...register(field.key)}
                />
              ) : (
                <input
                  id={fieldId}
                  className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                  aria-invalid={error ? 'true' : undefined}
                  {...register(field.key)}
                />
              )}
            </FormField>
          );
        })}

        {mutation.isError && (
          <p className="text-xs text-error">{getApiErrorMessage(mutation.error, 'Не удалось сохранить перевод')}</p>
        )}

        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending || isSubmitting}
            className="rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-cream transition hover:brightness-110 disabled:opacity-60"
          >
            {mutation.isPending ? 'Сохранение…' : `Сохранить (${languageCode.toUpperCase()})`}
          </button>
        </div>
      </form>
    </div>
  );
}
