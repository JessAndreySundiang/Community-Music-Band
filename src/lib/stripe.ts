import { loadStripe } from "@stripe/stripe-js";
import { isLivePublishableKey, isUsablePublishableKey } from "./stripeKey";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;

export const hasStripeKey: boolean = isUsablePublishableKey(publishableKey);
export const stripePromise = isUsablePublishableKey(publishableKey)
  ? loadStripe(publishableKey)
  : null;

// A live key means real cards. The band should know that before a donation, not
// after — a warning in the console is enough for the people who run the site.
if (isLivePublishableKey(publishableKey)) {
  console.warn("[donations] Live Stripe key in use: donations will charge real cards.");
}

/** Where the Express donation API lives. Override with VITE_API_URL. */
export const API_URL: string = (configuredApiUrl ?? "http://localhost:4242").replace(/\/+$/, "");

/** Host and port only, for error messages a donor can act on. */
export const API_LABEL: string = API_URL.replace(/^https?:\/\//, "");
