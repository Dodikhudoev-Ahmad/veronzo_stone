import { useEffect, useRef } from 'react';
import { AdminNavLinks } from './AdminNavLinks';

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

// Below lg (1024px) only — Sidebar itself is `hidden lg:flex`, so the two
// never show at once. Stays mounted at all times (visibility toggled via
// classes, not conditional rendering) so both the open AND close transitions
// can actually play instead of the drawer just popping in/out.
export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
    <div className="lg:hidden">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/45 transition-opacity duration-200 motion-reduce:transition-none ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Меню навигации"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-dark px-5 py-8 shadow-xl transition-[transform,opacity] duration-200 motion-reduce:transition-none ${
          open ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        <div className="mb-10 flex items-center justify-between px-2">
          <img src="/assets/images/logo-veronzo-white.png" alt="VERONZO" className="h-5 w-auto" />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Закрыть меню"
            className="rounded-md p-1 text-nav-muted transition hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
          >
            ✕
          </button>
        </div>
        <AdminNavLinks onNavigate={onClose} />
      </div>
    </div>
  );
}
