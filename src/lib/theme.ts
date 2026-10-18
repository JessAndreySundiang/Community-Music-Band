/**
 * One place that knows how the theme is stored and applied.
 *
 * The inline script in index.html cannot import this (it has to run before any
 * module loads), so it keeps its own copy of the default and the key: keep the
 * two in step.
 */
export const THEME_STORAGE_KEY = "cmb-theme";
export const DEFAULT_THEME = "dark";

export type Theme = "light" | "dark";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** The theme the page is showing right now. */
export function currentTheme(): Theme {
  const attribute = document.documentElement.getAttribute("data-theme");
  return isTheme(attribute) ? attribute : DEFAULT_THEME;
}

/** The theme to start from, preferring the visitor's last choice. */
export function storedTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(saved)) return saved;
  } catch {
    /* storage can be blocked (private mode, cookie settings) */
  }
  return DEFAULT_THEME;
}

/** Applies the theme to the document and remembers it. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}
