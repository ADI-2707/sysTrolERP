import type { ReactNode } from "react";
import { IconPanelCollapse, IconPanelExpand } from "../../icons";
import { Tooltip } from "../Overlays";
import styles from "./Layout.module.css";

export interface SidebarItem {
  key: string;
  label: string;
  icon: ReactNode;
  badge?: ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  logo: ReactNode;
  collapsedLogo?: ReactNode;
  items: SidebarItem[];
  bottomSlot?: ReactNode;
  className?: string;
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  logo,
  collapsedLogo,
  items,
  bottomSlot,
  className,
}: SidebarProps) {
  return (
    <aside
      className={[styles.sidebar, collapsed && styles["is-collapsed"], className]
        .filter(Boolean)
        .join(" ")}
      aria-label="Application Sidebar"
    >
      <div className={styles["sidebar-header"]}>
        <div className={styles["sidebar-logo-container"]}>
          {collapsed && collapsedLogo ? collapsedLogo : logo}
        </div>
      </div>

      <nav className={styles["sidebar-nav"]}>
        {items.map((item) => {
          const buttonElement = (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className={[
                styles["nav-item"],
                item.isActive && styles["is-active"],
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={item.isActive ? "page" : undefined}
            >
              <span className={styles["nav-icon"]} aria-hidden="true">
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span className={styles["nav-label"]}>{item.label}</span>
                  {item.badge && <span className={styles["nav-badge"]}>{item.badge}</span>}
                </>
              )}
            </button>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.key} content={item.label} placement="right" delay={100}>
                {buttonElement}
              </Tooltip>
            );
          }

          return buttonElement;
        })}
      </nav>

      <div className={styles["sidebar-bottom"]}>
        {bottomSlot}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={styles["collapse-toggle-btn"]}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <IconPanelExpand size={16} /> : <IconPanelCollapse size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
