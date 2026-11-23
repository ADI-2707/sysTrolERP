import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "./DataGrid.module.css";

export interface DataGridColumn<T> {
  id: string;
  header: ReactNode;
  width?: number | string;
  sticky?: boolean;
  isEditable?: (row: T, colIndex: number) => boolean;
  renderCell: (
    row: T,
    rowIndex: number,
    colIndex: number,
    isFocused: boolean,
    isEditing: boolean
  ) => ReactNode;
  renderEdit?: (
    row: T,
    rowIndex: number,
    colIndex: number,
    onCommit: (val: unknown) => void,
    onCancel: () => void
  ) => ReactNode;
}

export interface DataGridProps<T> {
  rows: T[];
  columns: DataGridColumn<T>[];
  rowKey: (row: T, index: number) => string | number;
  onCellChange?: (rowIndex: number, colId: string, value: unknown) => void;
  renderFooter?: () => ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function DataGrid<T>({
  rows,
  columns,
  rowKey,
  onCellChange,
  renderFooter,
  className,
  "aria-label": ariaLabel = "Data Grid",
}: DataGridProps<T>) {
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const isCellEditing = (r: number, c: number) =>
    editingCell?.row === r && editingCell?.col === c;

  const isCellFocused = (r: number, c: number) =>
    focusedCell?.row === r && focusedCell?.col === c;

  const handleCellClick = (r: number, c: number) => {
    setFocusedCell({ row: r, col: c });
    const colDef = columns[c];
    const row = rows[r];
    if (colDef.isEditable?.(row, c) && colDef.renderEdit) {
      setEditingCell({ row: r, col: c });
    } else {
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!focusedCell) return;
    const { row, col } = focusedCell;

    if (editingCell) {
      if (e.key === "Escape") {
        e.preventDefault();
        setEditingCell(null);
      }
      return;
    }

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (row > 0) setFocusedCell({ row: row - 1, col });
        break;
      case "ArrowDown":
        e.preventDefault();
        if (row < rows.length - 1) setFocusedCell({ row: row + 1, col });
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (col > 0) setFocusedCell({ row, col: col - 1 });
        break;
      case "ArrowRight":
        e.preventDefault();
        if (col < columns.length - 1) setFocusedCell({ row, col: col + 1 });
        break;
      case "Enter": {
        e.preventDefault();
        const colDef = columns[col];
        const rowData = rows[row];
        if (colDef.isEditable?.(rowData, col) && colDef.renderEdit) {
          setEditingCell({ row, col });
        }
        break;
      }
      case "Tab":
        if (e.shiftKey) {
          if (col > 0) {
            e.preventDefault();
            setFocusedCell({ row, col: col - 1 });
          } else if (row > 0) {
            e.preventDefault();
            setFocusedCell({ row: row - 1, col: columns.length - 1 });
          }
        } else {
          if (col < columns.length - 1) {
            e.preventDefault();
            setFocusedCell({ row, col: col + 1 });
          } else if (row < rows.length - 1) {
            e.preventDefault();
            setFocusedCell({ row: row + 1, col: 0 });
          }
        }
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={[styles["grid-container"], className].filter(Boolean).join(" ")}
      role="grid"
      aria-label={ariaLabel}
    >
      <table className={styles["grid-table"]}>
        <thead>
          <tr role="row">
            {columns.map((col) => (
              <th
                key={col.id}
                role="columnheader"
                style={col.width ? { width: col.width } : undefined}
                className={[
                  styles["grid-header-cell"],
                  col.sticky && styles["is-sticky-col"],
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => {
            const key = rowKey(row, rIdx);

            return (
              <tr key={key} role="row" aria-rowindex={rIdx + 1}>
                {columns.map((col, cIdx) => {
                  const focused = isCellFocused(rIdx, cIdx);
                  const editing = isCellEditing(rIdx, cIdx);
                  const editable = col.isEditable?.(row, cIdx) ?? false;

                  return (
                    <td
                      key={col.id}
                      role="gridcell"
                      aria-colindex={cIdx + 1}
                      data-focused={focused ? "true" : undefined}
                      data-editing={editing ? "true" : undefined}
                      onClick={() => handleCellClick(rIdx, cIdx)}
                      className={[
                        styles["grid-cell"],
                        col.sticky && styles["is-sticky-col"],
                        focused && styles["is-focused"],
                        !editable && styles["is-readonly"],
                        editing && styles["is-editing"],
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {editing && col.renderEdit
                        ? col.renderEdit(
                            row,
                            rIdx,
                            cIdx,
                            (val) => {
                              onCellChange?.(rIdx, col.id, val);
                              setEditingCell(null);
                            },
                            () => setEditingCell(null)
                          )
                        : col.renderCell(row, rIdx, cIdx, focused, editing)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        {renderFooter && (
          <tfoot className={styles["grid-footer"]}>{renderFooter()}</tfoot>
        )}
      </table>
    </div>
  );
}
