interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message = 'Не удалось загрузить данные', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-error/30 bg-error/5 p-12 text-center">
      <p className="text-sm text-error">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-pill border border-error px-4 py-1.5 text-sm text-error transition hover:bg-error hover:text-cream"
      >
        Повторить
      </button>
    </div>
  );
}
