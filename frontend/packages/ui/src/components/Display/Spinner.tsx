import styles from "./Display.module.css";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg" | number;
  color?: string;
  className?: string;
}

export function Spinner({ size = "md", color = "currentColor", className }: SpinnerProps) {
  const pixelSize =
    typeof size === "number"
      ? size
      : size === "sm"
        ? 16
        : size === "lg"
          ? 32
          : 24;

  return (
    <span
      className={[styles.spinner, className].filter(Boolean).join(" ")}
      style={{ width: pixelSize, height: pixelSize, color }}
      role="status"
      aria-label="Loading"
    />
  );
}
