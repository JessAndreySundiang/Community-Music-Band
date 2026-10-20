import { useEffect, useState } from "react";
import { currentTheme, type Theme } from "./theme";

/**
 * Tracks the theme that is actually applied to <html>. Stripe renders its fields
 * in an iframe, so it has to be told about a theme change instead of inheriting
 * it the way the rest of the page does.
 */
export function useResolvedTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(currentTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}
