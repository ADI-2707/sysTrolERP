import type { ReactNode } from "react";
import { IconClose } from "../../icons";
import styles from "./Display.module.css";

export interface ChipProps {
  label: ReactNode;
  icon?: ReactNode;
  onDelete?: () => void;
  className?: string;
}

export function Chip({ label, icon, onDelete, className }: ChipProps) {
  return (
    <span className={[styles.chip, className].filter(Boolean).join(" ")}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{label}</span>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={styles["chip-delete-btn"]}
          aria-label="Remove item"
        >
          <IconClose size={12} />
        </button>
      )}
    </span>
  );
}
