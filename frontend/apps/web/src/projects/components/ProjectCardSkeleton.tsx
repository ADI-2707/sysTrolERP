import { Skeleton } from "@systrol/ui";
import styles from "./ProjectCardSkeleton.module.css";

export function ProjectCardSkeleton() {
  return (
    <div className={styles.skeletonCard} data-testid="project-card-skeleton">
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <Skeleton width="40%" height={12} />
          <Skeleton width="85%" height={20} />
          <Skeleton width="55%" height={14} />
        </div>
        <Skeleton width={80} height={24} />
      </div>

      <div className={styles.statsArea}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="100%" height={8} />
      </div>

      <div className={styles.footerRow}>
        <Skeleton width={90} height={14} />
        <Skeleton width={110} height={14} />
      </div>
    </div>
  );
}
