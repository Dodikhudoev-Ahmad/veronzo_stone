import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// Built on the native <dialog> element instead of a component library — free
// focus trap, Escape-to-close, and a real modal stacking context, with zero
// new dependencies.
export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        // Native <dialog> has no built-in backdrop-click-to-close — a click
        // that lands on the <dialog> element itself (not its content) means
        // the backdrop was clicked.
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      className="w-full max-w-md rounded-lg border border-cream-soft bg-bg-alt p-0 text-text backdrop:bg-dark/50"
    >
      <div className="flex items-center justify-between border-b border-cream-soft px-6 py-4">
        <h2 className="font-serif text-lg font-semibold text-text">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="text-muted transition hover:text-text"
        >
          ✕
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
