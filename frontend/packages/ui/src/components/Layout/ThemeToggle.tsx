import { IconMoon, IconSun } from "../../icons";
import { useTheme } from "../../theme/ThemeProvider";
import styles from "./Layout.module.css";

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={[styles["theme-toggle-btn"], className].filter(Boolean).join(" ")}
      aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`}
      title={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`}
    >
      {resolvedTheme === "light" ? <IconMoon size={18} /> : <IconSun size={18} />}
    </button>
  );
}
