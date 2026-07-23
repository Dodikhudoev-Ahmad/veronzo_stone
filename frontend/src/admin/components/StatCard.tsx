interface StatCardProps {
  label: string;
  value: number | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function StatCard({ label, value, isLoading, isError, onRetry }: StatCardProps) {
  return (
    <div className="rounded-lg border border-cream-soft bg-bg-alt p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      {isError ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-error">Ошибка</span>
          <button type="button" onClick={onRetry} className="text-sm text-accent underline hover:no-underline">
            Повторить
          </button>
        </div>
      ) : isLoading ? (
        <div className="mt-3 h-9 w-16 animate-pulse rounded bg-cream-soft" aria-label="Загрузка" />
      ) : (
        <p className="mt-3 font-serif text-3xl font-semibold text-text">{value}</p>
      )}
    </div>
  );
}
