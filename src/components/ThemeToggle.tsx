import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "./Icons";

/** Dark-first: falls back to the Evening theme when nothing is stored. */
function getInitialTheme(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = window.localStorage.getItem("cmb-theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
  } catch {
    /* storage may be unavailable */
  }
  return true;
}

function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try {
      window.localStorage.setItem("cmb-theme", dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);

  const label = dark ? "Switch to Daytime theme" : "Switch to Evening theme";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={dark}
      onClick={() => setDark(!dark)}
      className="grid size-10 place-items-center rounded-full border border-nav-line bg-nav-hover text-ink transition-colors duration-200 hover:border-brass-bright hover:bg-brass-bright hover:text-night-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
    >
      {dark ? <IconSun className="size-5" /> : <IconMoon className="size-5" />}
    </button>
  );
}

export default ThemeToggle;
