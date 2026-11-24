import type { ReactNode } from "react";
import { IconSortAsc, IconSortDesc } from "../../icons";
import { Spinner } from "../Display";
import styles from "./Table.module.css";

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  render?: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  rowKey: (row: T, index: number) => string | number;
  stickyHeader?: boolean;
  loading?: boolean;
  emptyMessage?: ReactNode;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (columnKey: string, direction: "asc" | "desc") => void;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T>({
  data,
  columns,
  rowKey,
  stickyHeader = false,
  loading = false,
  emptyMessage = "No records found",
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  className,
}: TableProps<T>) {
  const handleHeaderClick = (col: TableColumn<T>) => {
    if (!col.sortable || !onSort) return;
    const isCurrent = sortColumn === col.key;
    const nextDirection = isCurrent && sortDirection === "asc" ? "desc" : "asc";
    onSort(col.key, nextDirection);
  };

  return (
    <div className={[styles["table-container"], className].filter(Boolean).join(" ")}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sortColumn === col.key;
              const alignClass = styles[`align-${col.align ?? "left"}`];

              return (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => handleHeaderClick(col)}
                  className={[
                    styles.th,
                    alignClass,
                    stickyHeader && styles["is-sticky"],
                    col.sortable && styles["is-sortable"],
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className={styles["th-content"]}>
                    <span>{col.header}</span>
                    {col.sortable && isSorted && (
                      <span aria-hidden="true">
                        {sortDirection === "asc" ? (
                          <IconSortAsc size={14} />
                        ) : (
                          <IconSortDesc size={14} />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className={styles["loading-overlay"]}>
                <Spinner size="md" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles["empty-cell"]}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const key = rowKey(row, idx);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={[styles.tr, onRowClick && styles["is-clickable"]].filter(Boolean).join(" ")}
                >
                  {columns.map((col) => {
                    const alignClass = styles[`align-${col.align ?? "left"}`];
                    const content = col.render
                      ? col.render(row, idx)
                      : String((row as Record<string, unknown>)[col.key] ?? "");

                    return (
                      <td key={col.key} className={[styles.td, alignClass].filter(Boolean).join(" ")}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
