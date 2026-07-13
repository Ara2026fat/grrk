import { ReactNode } from "react";
import { clsx } from "clsx";
import { Spinner } from "./Spinner";

/**
 * Generic Table primitive. Supports the Design System requirements:
 * sticky header, sortable columns, row highlighting for critical rows
 * (expired documents, restricted professions).
 *
 * This is a *presentation* primitive only. Sorting/filtering/pagination
 * state and data-fetching belong to the Generic Entity Engine
 * (see /modules/entity-engine), not to this component.
 *
 * UX polish pass: rows are keyboard-focusable and activate on Enter/Space
 * when `onRowClick` is provided, and a `loading` state renders skeleton
 * rows instead of an empty table flashing before data arrives.
 */
export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  isRowCritical?: (row: T) => boolean;
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: ReactNode;
}

export function Table<T>({
  columns,
  rows,
  getRowKey,
  isRowCritical,
  onSort,
  onRowClick,
  loading,
  emptyState,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-surface-border">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-surface-subtle text-text-secondary">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx("px-3 py-2 text-start font-medium", col.sortable && "cursor-pointer select-none")}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="border-t border-surface-border">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-3">
                    <div className="h-3 w-full max-w-[10rem] animate-pulse rounded bg-surface-subtle" />
                  </td>
                ))}
              </tr>
            ))}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-text-secondary">
                {emptyState ?? "—"}
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(event) => {
                  if (!onRowClick) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onRowClick(row);
                  }
                }}
                className={clsx(
                  "border-t border-surface-border",
                  isRowCritical?.(row) && "bg-status-expired/5",
                  onRowClick &&
                    "cursor-pointer hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-300 focus-visible:ring-inset"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2 text-tableText text-text-primary">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
      {loading && (
        <div className="flex items-center justify-center gap-2 border-t border-surface-border py-3 text-xs text-text-secondary">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
}
