interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="animate-pulse" role="status" aria-label="Загрузка данных">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 border-b border-cream-soft/60 py-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 flex-1 rounded bg-cream-soft" />
          ))}
        </div>
      ))}
    </div>
  );
}
