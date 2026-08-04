import { useEffect, useRef, type ReactNode } from 'react';
import type { LanguageCode } from './useLanguage';
import { useT } from './uiStrings';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  children: ReactNode;
  language: LanguageCode;
}

export const FILTER_DRAWER_ID = 'catalog-filter-drawer';

// Mobile/tablet only (<=1024px, see .catalog-filters-toggle in styles.css).
// Stays mounted at all times so both open and close can actually animate —
// visibility is toggled via the `is-open` class, not conditional rendering.
export function FilterDrawer({ open, onClose, onApply, children, language }: FilterDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const ui = useT(language);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div className="filter-drawer-root">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`filter-drawer-backdrop ${open ? 'is-open' : ''}`}
      />

      <div
        id={FILTER_DRAWER_ID}
        role="dialog"
        aria-modal="true"
        aria-label={ui('filters.title')}
        inert={!open}
        className={`filter-drawer-panel ${open ? 'is-open' : ''}`}
      >
        <div className="filter-drawer-header">
          <h2>{ui('filters.title')}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={ui('filters.close')}
            className="filter-drawer-close"
          >
            ✕
          </button>
        </div>

        <div className="filter-drawer-body">{children}</div>

        <div className="filter-drawer-footer">
          <button type="button" className="btn-primary filter-drawer-apply" onClick={onApply}>
            {ui('filters.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
