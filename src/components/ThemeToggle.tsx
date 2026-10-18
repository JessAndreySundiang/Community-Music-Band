import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "./Icons";
import { applyTheme, storedTheme } from "../lib/theme";

function ThemeToggle() {
  // Dark-first: storedTheme() falls back to the Evening theme.
  const [dark, setDark] = useState<boolean>(() => storedTheme() === "dark");

  useEffect(() => {
    applyTheme(dark ? "dark" : "light");
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
