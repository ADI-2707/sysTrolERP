import { Skeleton } from "./Skeleton";
import styles from "./Display.module.css";

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  columnWidths?: (string | number)[];
  hasAvatar?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  columnWidths,
  hasAvatar = false,
  className,
}: TableSkeletonProps) {
  const rowList = Array.from({ length: rows });
  const colList = Array.from({ length: columns });

  const getColWidth = (index: number) => {
    if (columnWidths && columnWidths[index] !== undefined) {
      return columnWidths[index];
    }
    return "100%";
  };

  return (
    <div
      className={[styles["table-skeleton"], className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
      aria-label="Loading table data"
      data-testid="table-skeleton"
    >
      <div className={styles["table-skeleton-header"]}>
        {colList.map((_, colIdx) => (
          <div
            key={colIdx}
            className={styles["table-skeleton-cell"]}
            style={{ width: getColWidth(colIdx), flex: columnWidths?.[colIdx] ? "none" : 1 }}
          >
            <Skeleton width="70%" height={14} />
          </div>
        ))}
      </div>
      {rowList.map((_, rowIdx) => (
        <div key={rowIdx} className={styles["table-skeleton-row"]} data-testid="table-skeleton-row">
          {colList.map((_, colIdx) => (
            <div
              key={colIdx}
              className={styles["table-skeleton-cell"]}
              style={{ width: getColWidth(colIdx), flex: columnWidths?.[colIdx] ? "none" : 1 }}
            >
              {hasAvatar && colIdx === 0 && (
                <Skeleton width={32} height={32} circle />
              )}
              <Skeleton
                width={colIdx === 0 && hasAvatar ? "60%" : colIdx === 1 ? "85%" : "70%"}
                height={16}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
