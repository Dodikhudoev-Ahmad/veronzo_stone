import { useEffect, useRef, useState } from 'react';
import { SUPPORTED_LANGUAGES, type LanguageCode } from './useLanguage';

const SHORT_LABELS: Record<LanguageCode, string> = { ru: 'RU', tg: 'TG', en: 'EN', fa: 'FA' };
const FULL_LABELS: Record<LanguageCode, string> = { ru: 'Русский', tg: 'Тоҷикӣ', en: 'English', fa: 'فارسی' };

interface LanguageSwitcherProps {
  language: LanguageCode;
  onChange: (lang: LanguageCode) => void;
}

export function LanguageSwitcher({ language, onChange }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  const select = (code: LanguageCode) => {
    onChange(code);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className="lang-switcher" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="lang-switcher-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{SHORT_LABELS[language]}</span>
        <svg className="lang-switcher-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="lang-switcher-menu" role="menu" aria-label="Выбор языка" ref={menuRef} onKeyDown={onMenuKeyDown}>
          {SUPPORTED_LANGUAGES.map((code) => (
            <button
              key={code}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className={code === language ? 'lang-switcher-item is-active' : 'lang-switcher-item'}
              aria-current={code === language ? 'true' : undefined}
              onClick={() => select(code)}
            >
              {FULL_LABELS[code]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
