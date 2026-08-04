import { useEffect, useRef, useState } from 'react';

export interface RowAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface RowActionsMenuProps {
  actions: RowAction[];
  // Full accessible name for the trigger button, e.g. `Действия: «Гранит»` —
  // a bare "⋮" icon has no accessible name on its own.
  ariaLabel: string;
}

// Collapses a row's action links (Переводы/Изменить/Удалить, ...) into a
// single "⋮" trigger + dropdown menu. Introduced because on narrow viewports
// the previous inline text-link row forced the whole DataTable into
// horizontal scroll just to fit 2-3 links per row — one icon button instead
// removes that pressure regardless of viewport width, so it's used
// everywhere rather than only below some breakpoint (avoids two parallel
// action-rendering paths for the same data).
export function RowActionsMenu({ actions, ariaLabel }: RowActionsMenuProps) {
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

  function select(action: RowAction) {
    setOpen(false);
    triggerRef.current?.focus();
    action.onClick();
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div className="relative inline-block text-left" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-lg leading-none text-muted transition hover:bg-bg-alt hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
      >
        ⋮
      </button>
      {open && (
        <div
          role="menu"
          aria-label={ariaLabel}
          ref={menuRef}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-10 mt-1 min-w-[9rem] overflow-hidden rounded-md border border-cream-soft bg-white py-1 shadow-lg"
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => select(action)}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-bg-alt focus-visible:bg-bg-alt focus-visible:outline-none ${
                action.variant === 'danger' ? 'text-error' : 'text-text'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
