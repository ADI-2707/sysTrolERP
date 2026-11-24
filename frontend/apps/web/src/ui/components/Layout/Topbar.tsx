import type { ReactNode } from "react";
import { IconMenu } from "../../icons";
import styles from "./Layout.module.css";

export interface TopbarProps {
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
  userMenu?: ReactNode;
  onMenuClick?: () => void;
  className?: string;
}

export function Topbar({
  breadcrumbs,
  actions,
  userMenu,
  onMenuClick,
  className,
}: TopbarProps) {
  return (
    <header className={[styles.topbar, className].filter(Boolean).join(" ")}>
      <div className={styles["topbar-left"]}>
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className={styles["menu-trigger"]}
            aria-label="Open navigation drawer"
          >
            <IconMenu size={20} />
          </button>
        )}
        {breadcrumbs}
      </div>
      <div className={styles["topbar-right"]}>
        {actions}
        {userMenu}
      </div>
    </header>
  );
}
