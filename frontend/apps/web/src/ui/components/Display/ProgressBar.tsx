import styles from "./Display.module.css";

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

export function ProgressBar({ value, max = 100, className }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percentage = Math.round((clamped / max) * 100);

  return (
    <div
      className={[styles["progress-bar-track"], className].filter(Boolean).join(" ")}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={styles["progress-bar-fill"]}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
