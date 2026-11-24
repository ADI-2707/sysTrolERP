import { Skeleton } from "@systrol/ui";
import styles from "./ProjectDetailSkeleton.module.css";

export function ProjectDetailSkeleton() {
  return (
    <div className={styles.container} data-testid="project-detail-loading-skeleton">
      <div className={styles.topBar}>
        <Skeleton width={140} height={32} />
      </div>

      <div className={styles.headerCard}>
        <div className={styles.titleRow}>
          <div className={styles.titleGroup}>
            <Skeleton width="45%" height={32} />
            <Skeleton width="30%" height={18} />
          </div>
          <Skeleton width={90} height={28} />
        </div>

        <Skeleton width="75%" height={16} />

        <div className={styles.statsGrid}>
          <Skeleton width="80%" height={40} />
          <Skeleton width="80%" height={40} />
          <Skeleton width="80%" height={40} />
          <Skeleton width="100%" height={40} />
        </div>
      </div>

      <div className={styles.timelineCard}>
        <Skeleton width={200} height={24} />
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className={styles.stepSkeletonRow}>
            <Skeleton width={24} height={24} circle />
            <Skeleton width="50%" height={16} />
            <Skeleton width={70} height={20} />
          </div>
        ))}
      </div>
    </div>
  );
}
