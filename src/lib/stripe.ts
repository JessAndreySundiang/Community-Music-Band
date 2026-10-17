import { loadStripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;

export const hasStripeKey: boolean = Boolean(
  publishableKey && publishableKey.startsWith("pk_test_"),
);
export const stripePromise = hasStripeKey ? loadStripe(publishableKey as string) : null;

/** Where the Express donation API lives. Override with VITE_API_URL. */
export const API_URL: string = (configuredApiUrl ?? "http://localhost:4242").replace(/\/+$/, "");

/** Host and port only, for error messages a donor can act on. */
export const API_LABEL: string = API_URL.replace(/^https?:\/\//, "");
