import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

/**
 * Theme system (Stage 0 requirement).
 * Deliberately small: "mode" (light/dark — dark reserved for future) and
 * "direction" (rtl/ltr) are the two axes the Design System doc requires
 * every primitive to be tested against before being used in a page.
 *
 * Direction is derived from the active language (07_LANGUAGE_LOCALIZATION_POLICY:
 * "Users should be able to switch the interface language without affecting
 * stored data") but is exposed independently so non-i18n code (e.g. a
 * printed report) can read it without depending on i18next directly.
 */
export type ThemeMode = "light" | "dark";
export type Direction = "rtl" | "ltr";

interface ThemeContextValue {
  mode: ThemeMode;
  direction: Direction;
  setMode: (mode: ThemeMode) => void;
  setDirection: (direction: Direction) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [direction, setDirection] = useState<Direction>("rtl"); // Arabic-first default per Vision doc

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [direction, mode]);

  const value = useMemo(() => ({ mode, direction, setMode, setDirection }), [mode, direction]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
