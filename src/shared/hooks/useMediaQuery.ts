import { useEffect, useState } from "react";

/**
 * Minimal responsive-design hook (Design System: Desktop / Tablet / Mobile).
 * Prefer Tailwind breakpoints in markup; use this only when a component
 * needs to branch its *logic* (not just styling) by viewport.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const listener = () => setMatches(mql.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

export const breakpoints = {
  mobile: "(max-width: 639px)",
  tablet: "(min-width: 640px) and (max-width: 1023px)",
  desktop: "(min-width: 1024px)",
} as const;
