import { Skeleton } from "@systrol/ui";
import styles from "./TimesheetGridSkeleton.module.css";

export interface TimesheetGridSkeletonProps {
  rows?: number;
  showCards?: boolean;
  className?: string;
}

export function TimesheetGridSkeleton({
  rows = 3,
  showCards = true,
  className,
}: TimesheetGridSkeletonProps) {
  const rowList = Array.from({ length: rows });

  return (
    <div
      className={[styles.timesheetSkeletonWrapper, className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
      aria-label="Loading timesheet data"
      data-testid="timesheet-grid-skeleton"
    >
      {showCards && (
        <div className={styles.cardsGrid} data-testid="timesheet-cards-skeleton">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className={styles.cardSkeleton}>
              <Skeleton width="45%" height={14} />
              <Skeleton width="70%" height={28} />
              <Skeleton width="35%" height={12} />
            </div>
          ))}
        </div>
      )}

      <div className={styles.gridCard}>
        <div className={styles.navBarSkeleton}>
          <div className={styles.navBarLeft}>
            <Skeleton width={32} height={32} circle />
            <Skeleton width={180} height={20} />
            <Skeleton width={32} height={32} circle />
            <Skeleton width={70} height={22} />
          </div>
          <div className={styles.navBarRight}>
            <Skeleton width={120} height={24} />
            <Skeleton width={130} height={32} />
          </div>
        </div>

        <div className={styles.tableHeaderSkeleton}>
          <Skeleton width="60%" height={16} />
          {Array.from({ length: 7 }).map((_, idx) => (
            <Skeleton key={idx} width="80%" height={16} />
          ))}
          <Skeleton width="70%" height={16} />
        </div>

        {rowList.map((_, rowIdx) => (
          <div key={rowIdx} className={styles.tableRowSkeleton} data-testid="timesheet-row-skeleton">
            <Skeleton width="85%" height={20} />
            {Array.from({ length: 7 }).map((_, cellIdx) => (
              <Skeleton key={cellIdx} width="60%" height={20} />
            ))}
            <Skeleton width="70%" height={20} />
          </div>
        ))}
      </div>
    </div>
  );
}
