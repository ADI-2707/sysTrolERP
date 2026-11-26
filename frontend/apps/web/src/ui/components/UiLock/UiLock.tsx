import type { ReactNode } from "react";
import styles from "./UiLock.module.css";

export interface UiLockProps {
  active?: boolean;
  fullScreen?: boolean;
  message?: string;
  size?: "sm" | "md" | "lg";
  dimmed?: boolean;
  blur?: boolean;
  zIndex?: number;
  className?: string;
  children?: ReactNode;
}

export function UiLock({
  active = true,
  fullScreen = true,
  message,
  size = "md",
  dimmed = true,
  blur = true,
  zIndex,
  className,
  children,
}: UiLockProps) {
  if (!active && !children) {
    return null;
  }

  const overlayElement = active ? (
    <div
      className={[
        styles.uilockOverlay,
        fullScreen && !children ? styles.isFullScreen : styles.isContainer,
        dimmed && styles.isDimmed,
        blur && styles.isBlurred,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={zIndex ? { zIndex } : undefined}
      role="status"
      aria-live="polite"
      aria-busy={active}
      data-testid="ui-lock-overlay"
    >
      <div className={[styles.centerStage, styles[`size-${size}`]].join(" ")}>
        <div className={styles.emblemContainer}>
          <img
            src="/logo-collapsed.png"
            alt="sysTrol"
            aria-hidden="true"
            className={styles.rotatingEmblem}
          />
          <div className={styles.orbitalRing} aria-hidden="true" />
        </div>
        {message && <p className={styles.statusMessage}>{message}</p>}
      </div>
    </div>
  ) : null;

  if (children) {
    return (
      <div className={styles.containerWrapper}>
        {children}
        {overlayElement}
      </div>
    );
  }

  return overlayElement;
}
