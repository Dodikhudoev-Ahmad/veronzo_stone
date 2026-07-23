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

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-cream-soft text-left text-xs uppercase tracking-wide text-muted">
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={`py-3 pr-4 font-semibold ${column.align === 'right' ? 'text-right' : 'text-left'} ${
                column.sortable ? 'cursor-pointer select-none hover:text-text' : ''
              }`}
              onClick={() => handleHeaderClick(column)}
            >
              {column.label}
              {column.sortable && <span className="ml-1">{sortIndicator(column.key)}</span>}
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
  );
}
