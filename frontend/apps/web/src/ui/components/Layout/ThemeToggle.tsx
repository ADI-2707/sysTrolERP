import { IconMoon, IconSun } from "../../icons";
import { useTheme } from "../../theme/ThemeProvider";
import styles from "./Layout.module.css";

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={[styles["theme-switch"], isDark && styles["is-dark"], className].filter(Boolean).join(" ")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <span className={styles["theme-switch-track"]}>
        <span className={styles["theme-switch-icon-sun"]} aria-hidden="true">
          <IconSun size={12} />
        </span>
        <span className={styles["theme-switch-icon-moon"]} aria-hidden="true">
          <IconMoon size={12} />
        </span>
        <span className={styles["theme-switch-thumb"]} />
      </span>
    </button>
  );
}
