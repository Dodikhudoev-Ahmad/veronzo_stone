interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-cream-soft px-1 py-4 text-sm text-muted">
      <span>Всего записей: {totalItems}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-pill border border-cream-soft px-3 py-1.5 transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Назад
        </button>
        <span>
          Стр. {page} из {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-pill border border-cream-soft px-3 py-1.5 transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Вперёд
        </button>
      </div>
    </div>
  );
}
