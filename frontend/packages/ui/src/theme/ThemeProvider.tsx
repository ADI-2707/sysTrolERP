import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "systrol_theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function getInitialTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {}
  return "system";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") {
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }
  return preference;
}

export const themeBootstrapScript = `(function() {
  try {
    var stored = localStorage.getItem("${STORAGE_KEY}");
    var mql = window.matchMedia("(prefers-color-scheme: dark)");
    var theme = stored === "dark" || (stored !== "light" && mql.matches) ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();`;

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemePreference>(() => defaultTheme ?? getInitialTheme());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(theme));

  useEffect(() => {
    const active = resolveTheme(theme);
    setResolvedTheme(active);
    document.documentElement.setAttribute("data-theme", active);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}

    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        if (theme === "system") {
          const next = mediaQuery.matches ? "dark" : "light";
          setResolvedTheme(next);
          document.documentElement.setAttribute("data-theme", next);
        }
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
      }
    }
    return undefined;
  }, [theme]);

  const setTheme = (next: ThemePreference) => {
    setThemeState(next);
  };

  const toggleTheme = () => {
    setThemeState((current) => {
      const active = resolveTheme(current);
      return active === "light" ? "dark" : "light";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
