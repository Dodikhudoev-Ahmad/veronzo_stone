import { useEffect, useRef, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ErrorState } from '../../components/ui/ErrorState';
import { useTranslations } from '../../hooks/useTranslations';
import type { TranslatableEntity } from '../../api/translations';
import { SUPPORTED_LANGUAGES, type LanguageCode } from './languages';
import type { TranslationFieldConfig } from './translationFieldConfig';
import { TranslationLanguageForm } from './TranslationLanguageForm';

interface TranslationEditorModalProps {
  open: boolean;
  onClose: () => void;
  entity: TranslatableEntity;
  id: number | null;
  entityTitle: string;
  fields: TranslationFieldConfig[];
}

// Reusable across every translatable entity: Categories/Products/Portfolio/
// Gallery today, and Site Content/Hero Stats/SEO Meta/Contact Info once those
// get real admin pages (see final report — those pages are still placeholders).
export function TranslationEditorModal({ open, onClose, entity, id, entityTitle, fields }: TranslationEditorModalProps) {
  const [activeLang, setActiveLang] = useState<LanguageCode>('ru');
  const dirtyRef = useRef<Record<LanguageCode, boolean>>({ ru: false, tg: false, en: false, zh: false });
  const tabRefs = useRef<Record<LanguageCode, HTMLButtonElement | null>>({ ru: null, tg: null, en: null, zh: null });

  const query = useTranslations(entity, id ?? undefined, open);
  const translations = query.data;

  // Reset to the RU tab each time the editor is opened for a (possibly
  // different) row. Adjusted synchronously during render (React's documented
  // pattern) rather than in an effect, matching CategoriesPage's
  // page-reset-on-filter-change — avoids an extra commit.
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setActiveLang('ru');
    }
  }

  // Ref mutation (not part of render output) belongs in an effect, unlike the
  // setActiveLang above.
  useEffect(() => {
    if (open) {
      dirtyRef.current = { ru: false, tg: false, en: false, zh: false };
    }
  }, [open]);

  function handleDirtyChange(languageCode: LanguageCode, dirty: boolean) {
    dirtyRef.current[languageCode] = dirty;
  }

  function requestClose() {
    const hasUnsaved = Object.values(dirtyRef.current).some(Boolean);
    if (hasUnsaved && !window.confirm('Есть несохранённые изменения. Закрыть без сохранения?')) {
      return;
    }
    onClose();
  }

  function moveFocus(from: LanguageCode, direction: 1 | -1) {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    const index = codes.indexOf(from);
    const next = codes[(index + direction + codes.length) % codes.length];
    setActiveLang(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <Modal
      open={open}
      onClose={requestClose}
      onCancel={(event) => {
        // Escape closes the native <dialog> before our onClose fires — if
        // there are unsaved changes, stop that native close and run the same
        // confirm-then-close flow as the X button/backdrop instead, so the
        // dialog element and React's `open` state can't fall out of sync.
        const hasUnsaved = Object.values(dirtyRef.current).some(Boolean);
        if (hasUnsaved) {
          event.preventDefault();
          requestClose();
        }
      }}
      title={`Переводы: ${entityTitle}`}
    >
      {query.isLoading ? (
        <p className="py-8 text-center text-sm text-muted">Загрузка переводов…</p>
      ) : query.isError ? (
        <ErrorState message="Не удалось загрузить переводы" onRetry={() => void query.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <div role="tablist" aria-label="Языки перевода" className="flex flex-wrap gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isActive = activeLang === lang.code;
              const hasOwn = translations?.some((t) => t.languageCode === lang.code) ?? false;
              return (
                <button
                  key={lang.code}
                  ref={(el) => {
                    tabRefs.current[lang.code] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`translation-tab-${lang.code}`}
                  aria-controls={`translation-panel-${lang.code}`}
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveLang(lang.code)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowRight') {
                      event.preventDefault();
                      moveFocus(lang.code, 1);
                    } else if (event.key === 'ArrowLeft') {
                      event.preventDefault();
                      moveFocus(lang.code, -1);
                    }
                  }}
                  title={lang.name}
                  className={`flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-2 focus-visible:outline-accent ${
                    isActive
                      ? 'border-transparent bg-accent text-cream'
                      : 'border-cream-soft text-muted hover:border-accent hover:text-text'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full ${hasOwn ? 'bg-accent-light' : 'bg-cream-soft'} ${isActive ? 'bg-cream!' : ''}`}
                  />
                  {lang.tabLabel}
                </button>
              );
            })}
          </div>

          {id !== null &&
            SUPPORTED_LANGUAGES.map((lang) => (
              <TranslationLanguageForm
                key={lang.code}
                entity={entity}
                id={id}
                languageCode={lang.code}
                fields={fields}
                translation={translations?.find((t) => t.languageCode === lang.code)}
                active={activeLang === lang.code}
                hasFallback={!(translations?.some((t) => t.languageCode === lang.code) ?? false)}
                onDirtyChange={handleDirtyChange}
              />
            ))}
        </div>
      )}
    </Modal>
  );
}
