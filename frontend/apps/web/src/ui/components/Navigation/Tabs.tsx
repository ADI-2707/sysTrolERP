import { useRef, type KeyboardEvent, type ReactNode } from "react";
import styles from "./Navigation.module.css";

export interface TabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  "aria-label"?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  "aria-label": ariaLabel = "Tabs",
}: TabsProps) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    let targetIndex = -1;
    if (e.key === "ArrowRight") {
      targetIndex = index < tabs.length - 1 ? index + 1 : 0;
    } else if (e.key === "ArrowLeft") {
      targetIndex = index > 0 ? index - 1 : tabs.length - 1;
    } else if (e.key === "Home") {
      targetIndex = 0;
    } else if (e.key === "End") {
      targetIndex = tabs.length - 1;
    }

    if (targetIndex >= 0) {
      e.preventDefault();
      const targetTab = tabs[targetIndex];
      if (targetTab && !targetTab.disabled) {
        onChange(targetTab.id);
        tabsRef.current[targetIndex]?.focus();
      }
    }
  };

  return (
    <ul
      role="tablist"
      aria-label={ariaLabel}
      className={[styles["tabs-list"], className].filter(Boolean).join(" ")}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;

        return (
          <li key={tab.id} role="presentation">
            <button
              ref={(el) => {
                tabsRef.current[idx] = el;
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={[styles["tab-button"], isActive && styles["is-active"]].filter(Boolean).join(" ")}
            >
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && <span>{tab.badge}</span>}
              {isActive && <span className={styles["tab-indicator"]} aria-hidden="true" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
