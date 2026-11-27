import {
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
  type KeyboardEvent,
  type ReactNode,
} from "react";
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
  const listRef = useRef<HTMLUListElement | null>(null);
  const [sliderStyle, setSliderStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    ready: boolean;
  }>({ left: 0, top: 0, width: 0, height: 0, ready: false });

  const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    const activeIndex = tabs.findIndex((t) => t.id === activeTab);
    const activeEl = tabsRef.current[activeIndex];
    const listEl = listRef.current;

    if (activeEl && listEl) {
      setSliderStyle({
        left: activeEl.offsetLeft,
        top: activeEl.offsetTop,
        width: activeEl.offsetWidth,
        height: activeEl.offsetHeight,
        ready: true,
      });
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    const handleResize = () => {
      const activeIndex = tabs.findIndex((t) => t.id === activeTab);
      const activeEl = tabsRef.current[activeIndex];
      if (activeEl) {
        setSliderStyle({
          left: activeEl.offsetLeft,
          top: activeEl.offsetTop,
          width: activeEl.offsetWidth,
          height: activeEl.offsetHeight,
          ready: true,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, tabs]);

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
    <div className={[styles["tabs-container"], className].filter(Boolean).join(" ")}>
      <ul
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        className={styles["tabs-list"]}
      >
        <li
          role="presentation"
          aria-hidden="true"
          className={styles["tab-slider-item"]}
        >
          <span
            className={styles["tab-sliding-box"]}
            style={{
              transform: `translate3d(${sliderStyle.left}px, ${sliderStyle.top}px, 0)`,
              width: `${sliderStyle.width}px`,
              height: `${sliderStyle.height}px`,
              opacity: sliderStyle.ready && sliderStyle.width > 0 ? 1 : 0,
            }}
          />
        </li>

        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTab;

          return (
            <li key={tab.id} role="presentation" className={styles["tab-item"]}>
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
                className={[
                  styles["tab-button"],
                  isActive && styles["is-active"],
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
                <span className={styles["tab-label"]}>{tab.label}</span>
                {tab.badge && <span className={styles["tab-badge"]}>{tab.badge}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
