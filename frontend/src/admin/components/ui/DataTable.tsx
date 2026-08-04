import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right';
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  sort?: string;
  onSortChange?: (field: string) => void;
}

// The generic table shell every future admin entity page (Products, Portfolio,
// ...) is meant to reuse — Categories is the reference implementation, not a
// one-off. Sorting only ever toggles between the whitelisted column keys the
// caller passes in via `columns`, mirroring the backend's own sort whitelist.
export function DataTable<T>({ columns, rows, getRowId, sort, onSortChange }: DataTableProps<T>) {
  function sortIndicator(key: string): string {
    if (sort === key) return '↑';
    if (sort === `-${key}`) return '↓';
    return '';
  }

  function handleHeaderClick(column: DataTableColumn<T>) {
    if (!column.sortable || !onSortChange) return;
    if (sort === column.key) {
      onSortChange(`-${column.key}`);
    } else {
      onSortChange(column.key);
    }
  }

  function ariaSortFor(column: DataTableColumn<T>): 'ascending' | 'descending' | 'none' | undefined {
    if (!column.sortable) return undefined;
    if (sort === column.key) return 'ascending';
    if (sort === `-${column.key}`) return 'descending';
    return 'none';
  }

  function nextDirectionLabel(column: DataTableColumn<T>): string {
    // Mirrors handleHeaderClick's own toggle logic: ascending is the only
    // state whose next click goes to descending — every other state (none or
    // already descending) goes to ascending next.
    return sort === column.key ? 'по убыванию' : 'по возрастанию';
  }

  // A wide table (image + title + 3-4 metadata columns + actions) simply
  // cannot fit a phone-width screen without either shrinking text to
  // unreadable sizes or scrolling — and a table that forces the *whole page*
  // to scroll sideways just to reach the last column (found during Stage 24
  // mobile testing) is worse than either. Below `sm` this renders each row as
  // a stacked card instead: the first label-less column (almost always the
  // thumbnail) leads, the first labelled column becomes the card's title, any
  // remaining labelled columns become small "label: value" chips, and the
  // actions column (also label-less) sits in the top-right corner — nothing
  // needs horizontal scrolling because nothing is laid out in a row anymore.
  const leadingColumns = columns.filter((c) => c.label === '' && c.key !== 'actions');
  const actionsColumn = columns.find((c) => c.key === 'actions');
  const fieldColumns = columns.filter((c) => c.label !== '');
  const [titleColumn, ...restColumns] = fieldColumns;

  return (
    <>
      <div className="divide-y divide-cream-soft/60 sm:hidden">
        {rows.map((row) => (
          <div key={getRowId(row)} className="flex items-start gap-3 py-3">
            {leadingColumns.map((column) => (
              <div key={column.key} className="shrink-0">
                {column.render(row)}
              </div>
            ))}
            <div className="min-w-0 flex-1">
              {titleColumn && <div className="truncate text-sm font-medium text-text">{titleColumn.render(row)}</div>}
              {restColumns.length > 0 && (
                <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  {restColumns.map((column) => (
                    <div key={column.key} className="flex gap-1 text-xs text-muted">
                      <dt>{column.label}:</dt>
                      <dd className="text-text">{column.render(row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            {actionsColumn && <div className="shrink-0">{actionsColumn.render(row)}</div>}
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-cream-soft text-left text-xs uppercase tracking-wide text-muted">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={ariaSortFor(column)}
                  className={`py-3 pr-4 font-semibold ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleHeaderClick(column)}
                      aria-label={`Сортировать по «${column.label}» ${nextDirectionLabel(column)}`}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-sm border-0 bg-transparent p-0 font-semibold text-inherit hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light"
                    >
                      {column.label}
                      <span aria-hidden="true">{sortIndicator(column.key)}</span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowId(row)} className="border-b border-cream-soft/60 last:border-0">
                {columns.map((column) => (
                  <td key={column.key} className={`py-3 pr-4 ${column.align === 'right' ? 'text-right' : 'text-left'}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
