/** Donations are collected in whole US dollars; server/app.js enforces the same bounds. */
export const DONATION_MIN_USD = 1;
export const DONATION_MAX_USD = 1000;

/**
 * Parses the "other amount" field.
 * Returns the amount, or null when the value is not a usable donation
 * (empty, non-numeric, or outside the allowed range).
 */
export function parseDonationAmount(text: string): number | null {
  const value = Number(text.trim());
  if (!Number.isFinite(value)) return null;
  if (value < DONATION_MIN_USD || value > DONATION_MAX_USD) return null;
  return value;
}

/** Formats an amount for display: 25 -> "$25.00". */
export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

/**
 * Explains a failure from the request to our own donation API. Used only at
 * that point, so a TypeError here really is an unreachable server or a blocked
 * request rather than a bug further along the checkout — which is why the rest
 * of the checkout reports its own errors instead of borrowing this wording.
 */
export function describeApiError(err: unknown, apiLabel: string): string {
  if (err instanceof DOMException && err.name === "TimeoutError") {
    return `The donation server at ${apiLabel} did not respond in time. Please try again.`;
  }
  if (err instanceof TypeError) {
    return `Cannot reach the donation server at ${apiLabel}. Make sure it is running.`;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong.";
}

/**
 * A unique key for one donation attempt. Stripe returns the original
 * PaymentIntent when it sees the same key again, so a client retry after a
 * timeout cannot charge the donor twice.
 *
 * crypto.randomUUID() needs a secure context (localhost or HTTPS), so over a
 * plain-HTTP LAN address we fall back to a timestamp plus randomness.
 */
export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
