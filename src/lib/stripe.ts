import { loadStripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

export const hasStripeKey: boolean = Boolean(publishableKey && publishableKey.startsWith("pk_test_"));
export const stripePromise = hasStripeKey ? loadStripe(publishableKey as string) : null;
export const API_URL = "http://localhost:4242";