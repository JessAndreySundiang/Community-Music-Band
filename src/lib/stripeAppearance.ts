import type { Appearance } from "@stripe/stripe-js";
import type { Theme } from "./theme";

/**
 * Reads one of the site's CSS custom properties. Stripe's iframe is a separate
 * document with no access to our stylesheet, so the values have to be copied
 * into the appearance object; reading them at runtime keeps a single source of
 * truth for the palette instead of duplicating hex codes here.
 */
function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * Styles Stripe's fields like the rest of the checkout: 16px text, the band's
 * brass focus ring, and the current light or dark surface. The hex fallbacks
 * only apply before the stylesheet has loaded.
 */
export function buildStripeAppearance(theme: Theme): Appearance {
  const dark = theme === "dark";
  const ink = token("--ink", dark ? "#f3f7ff" : "#0d1b34");
  const surface = token("--surface", dark ? "#131e37" : "#fffdf8");
  const paper = token("--paper", dark ? "#080f1f" : "#f8f2e6");
  const line = token("--line", dark ? "rgba(232,237,248,0.14)" : "rgba(13,27,52,0.14)");
  const muted = token("--muted", dark ? "#a3b0c9" : "#55607a");
  const brass = token("--brass", dark ? "#e9ba55" : "#8a5f12");
  const brassBright = token("--brass-bright", dark ? "#e0a92e" : "#c9962b");
  const plume = token("--plume", dark ? "#ff8a74" : "#a63a22");
  const ring = dark ? "rgba(224,169,46,0.35)" : "rgba(201,150,43,0.25)";

  return {
    theme: dark ? "night" : "stripe",
    labels: "floating",
    variables: {
      colorPrimary: brassBright,
      colorBackground: surface,
      colorText: ink,
      colorTextSecondary: muted,
      colorTextPlaceholder: muted,
      colorDanger: plume,
      colorIcon: muted,
      fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
      fontSizeBase: "16px",
      borderRadius: "12px",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": {
        backgroundColor: paper,
        border: `1px solid ${line}`,
        boxShadow: "none",
        padding: "12px 14px",
        color: ink,
      },
      ".Input:focus": {
        border: `1px solid ${brass}`,
        boxShadow: `0 0 0 3px ${ring}`,
        outline: "none",
      },
      ".Input--invalid": {
        border: `1px solid ${plume}`,
      },
      ".Label": {
        color: ink,
        fontWeight: "600",
        fontSize: "13px",
      },
      ".Label--floating": {
        color: muted,
      },
      ".Tab": {
        backgroundColor: paper,
        border: `1px solid ${line}`,
        boxShadow: "none",
        color: ink,
      },
      ".Tab:hover": {
        borderColor: brass,
        color: ink,
      },
      ".Tab--selected": {
        backgroundColor: surface,
        border: `1px solid ${brass}`,
        boxShadow: `0 0 0 3px ${ring}`,
        color: ink,
      },
      ".Block": {
        backgroundColor: "transparent",
      },
      ".PickerItem": {
        color: ink,
      },
      ".RedirectText": {
        color: muted,
      },
    },
  };
}
