import styles from "./Display.module.css";

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = 16,
  circle = false,
  className,
}: SkeletonProps) {
  return (
    <div
      className={[styles.skeleton, circle && styles["skeleton-circle"], className]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}
