import { useEffect } from "react";

const SITE_NAME = "Community Music Band Organization";

/** Keeps the browser tab title in sync with the current route. */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
