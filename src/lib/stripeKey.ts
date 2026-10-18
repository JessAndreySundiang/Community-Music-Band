/**
 * Publishable-key checks, kept apart from lib/stripe.ts so they can be tested
 * without loading Stripe.js.
 *
 * Test and live keys are both usable. Treating live keys as "not configured"
 * would switch the donation form off with a false "Stripe is not set up yet"
 * message on the very day the band starts taking real gifts.
 */
export function isUsablePublishableKey(key: string | undefined): key is string {
  return Boolean(key && /^pk_(test|live)_/.test(key));
}

/** True when the key charges real cards. */
export function isLivePublishableKey(key: string | undefined): boolean {
  return Boolean(key?.startsWith("pk_live_"));
}
