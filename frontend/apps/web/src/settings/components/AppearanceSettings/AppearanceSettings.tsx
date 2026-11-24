import { useState, useEffect } from "react";
import { Badge, useTheme, type ThemePreference } from "@systrol/ui";
import styles from "./AppearanceSettings.module.css";

const SIDEBAR_STORAGE_KEY = "systrol_sidebar_collapsed";

export function AppearanceSettings() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [sidebarPreference, setSidebarPreference] = useState<"expanded" | "collapsed">(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true" ? "collapsed" : "expanded";
    } catch {
      return "expanded";
    }
  });

  const handleSidebarChange = (pref: "expanded" | "collapsed") => {
    setSidebarPreference(pref);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(pref === "collapsed"));
    } catch {}
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SIDEBAR_STORAGE_KEY) {
        setSidebarPreference(e.newValue === "true" ? "collapsed" : "expanded");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const themeOptions: { key: ThemePreference; title: string; desc: string; icon: string }[] = [
    {
      key: "light",
      title: "Light Mode",
      desc: "Clean high-contrast theme optimized for bright environments.",
      icon: "☀️",
    },
    {
      key: "dark",
      title: "Dark Mode",
      desc: "Low-light theme designed to reduce glare and eye fatigue.",
      icon: "🌙",
    },
    {
      key: "system",
      title: "System Match",
      desc: "Automatically synchronize with your operating system preferences.",
      icon: "💻",
    },
  ];

  return (
    <div className={styles.container} data-testid="appearance-settings">
      <div className={styles.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className={styles.sectionTitle}>Theme Appearance</h2>
          <Badge variant="brand">Active: {resolvedTheme.toUpperCase()}</Badge>
        </div>
        <p className={styles.sectionDescription}>
          Choose how sysTrol ERP appears on your device.
        </p>

        <div className={styles.themeGrid} data-testid="theme-selector-grid">
          {themeOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={[
                styles.themeCard,
                theme === opt.key && styles.themeCardActive,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setTheme(opt.key)}
              data-testid={`theme-card-${opt.key}`}
            >
              <span className={styles.themeIcon}>{opt.icon}</span>
              <span className={styles.themeCardLabel}>{opt.title}</span>
              <span className={styles.themeCardDesc}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sidebar Default Layout</h2>
        <p className={styles.sectionDescription}>
          Configure how the primary navigation menu opens when starting new sessions.
        </p>

        <div className={styles.sidebarOptions} data-testid="sidebar-preference-options">
          <label className={styles.radioOption} data-testid="sidebar-opt-expanded">
            <input
              type="radio"
              name="sidebarPref"
              value="expanded"
              checked={sidebarPreference === "expanded"}
              onChange={() => handleSidebarChange("expanded")}
              className={styles.radioInput}
            />
            <div className={styles.optionText}>
              <span className={styles.optionTitle}>Expanded Sidebar (Standard)</span>
              <span className={styles.optionDesc}>
                Always display full navigation drawer with icon symbols and menu titles.
              </span>
            </div>
          </label>

          <label className={styles.radioOption} data-testid="sidebar-opt-collapsed">
            <input
              type="radio"
              name="sidebarPref"
              value="collapsed"
              checked={sidebarPreference === "collapsed"}
              onChange={() => handleSidebarChange("collapsed")}
              className={styles.radioInput}
            />
            <div className={styles.optionText}>
              <span className={styles.optionTitle}>Collapsed Rail (Compact)</span>
              <span className={styles.optionDesc}>
                Start in space-saving icon-only rail mode for maximum screen workspace.
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className={styles.statusNotice}>
        <span>⚙️ Changes are persisted locally across all windows in your current browser.</span>
      </div>
    </div>
  );
}
