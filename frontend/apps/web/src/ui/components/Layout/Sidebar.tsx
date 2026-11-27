import type { ReactNode } from "react";
import { IconPanelCollapse, IconLogout } from "../../icons";
import { Tooltip } from "../Overlays";
import packageJson from "../../../../package.json";
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
  logo?: ReactNode;
  collapsedLogo?: ReactNode;
  items: SidebarItem[];
  bottomSlot?: ReactNode;
  onLogout?: () => void;
  version?: string;
  className?: string;
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  logo,
  collapsedLogo,
  items,
  bottomSlot,
  onLogout,
  version = `v${packageJson.version}`,
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
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={styles["logo-badge-collapsed"]}
            aria-label="Expand sidebar"
            title="Click to expand sysTROL sidebar"
          >
            {collapsedLogo || (
              <>
                <img src="/icon.jpeg" alt="sysTrol ERP" className={styles["icon-img"]} />
                <span className={styles["sr-only"]}>sysTrol ERP</span>
              </>
            )}
          </button>
        ) : (
          <>
            <div className={styles["logo-badge-expanded"]}>
              {logo || (
                <>
                  <img src="/logo-full.png" alt="sysTrol ERP" className={styles["logo-full-img"]} />
                  <span className={styles["sr-only"]}>sysTrol ERP</span>
                </>
              )}
            </div>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className={styles["collapse-toggle-btn-top"]}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <IconPanelCollapse size={16} />
              </button>
            )}
          </>
        )}
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
        {onLogout && (
          collapsed ? (
            <Tooltip content="Log Out" placement="right" delay={100}>
              <button
                type="button"
                onClick={onLogout}
                className={styles["sidebar-logout-btn-collapsed"]}
                aria-label="Log Out"
                title="Log Out"
              >
                <IconLogout size={15} />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={onLogout}
              className={styles["sidebar-logout-btn"]}
              aria-label="Log Out"
              title="Log Out"
            >
              <IconLogout size={15} />
              <span>Log Out</span>
            </button>
          )
        )}
        {bottomSlot}
        {collapsed ? (
          <div className={styles["version-row-collapsed"]}>
            <span className={styles["version-text-collapsed"]}>{version}</span>
          </div>
        ) : (
          <div className={styles["version-row"]}>
            <span className={styles["version-text"]}>PORTAL {version}</span>
            <span className={styles["version-dot"]} />
          </div>
        )}
      </div>
    </aside>
  );
}
