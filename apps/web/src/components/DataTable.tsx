import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  align?: 'right' | 'left';
  render?: (row: T) => ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  empty?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends object = Record<string, any>>({
  columns,
  rows,
  loading,
  empty = '沒有資料',
  onRowClick,
}: Props<T>) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === 'right' ? 'num' : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length} className="muted">
                載入中…
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="muted">
                {empty}
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((r, i) => (
              <tr
                key={(r as { id?: string }).id ?? i}
                className={onRowClick ? 'clickable' : undefined}
                onClick={() => onRowClick?.(r)}
              >
                {columns.map((c) => (
                  <td key={c.key} className={c.align === 'right' ? 'num' : undefined}>
                    {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
