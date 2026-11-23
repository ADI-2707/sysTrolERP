import { Button, IconButton, Badge, IconChevronLeft, IconChevronRight } from "@systrol/ui";
import styles from "./WeekNavigator.module.css";

export interface WeekNavigatorProps {
  monday: string;
  sunday: string;
  displayRange: string;
  isCurrent: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onCurrentWeek: () => void;
  className?: string;
}

export function WeekNavigator({
  displayRange,
  isCurrent,
  onPrevious,
  onNext,
  onCurrentWeek,
  className,
}: WeekNavigatorProps) {
  return (
    <nav
      aria-label="Week navigation"
      className={[styles.navigator, className].filter(Boolean).join(" ")}
    >
      <div className={styles.rangeDisplay}>
        <span className={styles.rangeText}>{displayRange}</span>
        {isCurrent && (
          <Badge variant="brand" className={styles.currentBadge}>
            Current Week
          </Badge>
        )}
      </div>

      <div className={styles.controlsGroup}>
        <IconButton
          icon={<IconChevronLeft size={16} />}
          label="Previous week"
          variant="secondary"
          size="sm"
          onClick={onPrevious}
        />
        <Button
          variant={isCurrent ? "ghost" : "secondary"}
          size="sm"
          disabled={isCurrent}
          onClick={onCurrentWeek}
        >
          This Week
        </Button>
        <IconButton
          icon={<IconChevronRight size={16} />}
          label="Next week"
          variant="secondary"
          size="sm"
          onClick={onNext}
        />
      </div>
    </nav>
  );
}
