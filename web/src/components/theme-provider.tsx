import * as React from "react";

/**
 * Lightweight theme provider (drop-in replacement for next-themes in a Vite
 * SPA). Persists the choice to localStorage and toggles the `dark` class on
 * <html>. The initial theme is applied by an inline script in index.html
 * (before paint) to avoid a flash of the wrong theme.
 */

type Theme = "light" | "dark";

interface ThemeContextValue {
  resolvedTheme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [resolvedTheme, setResolvedTheme] = React.useState<Theme>(getInitialTheme);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, resolvedTheme);
    } catch {
      // localStorage may be unavailable (private mode); ignore.
    }
  }, [resolvedTheme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ resolvedTheme, setTheme: setResolvedTheme }),
    [resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
