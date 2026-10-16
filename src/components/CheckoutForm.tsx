import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeCardElementOptions } from "@stripe/stripe-js";
import { API_URL } from "../lib/stripe";

type CheckoutFormProps = {
  amount: number;
  onPaid: (paymentId: string, name: string) => void;
};

const fieldClass =
  "rounded-xl border border-line bg-paper px-3.5 py-3 text-base font-normal text-ink transition-colors duration-200 focus:border-brass focus:outline-none";

/** Keep the Stripe iframe's text legible against the active theme. */
function useResolvedTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (document.documentElement.getAttribute("data-theme") as "light" | "dark") ?? "dark",
  );

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() =>
      setTheme((el.getAttribute("data-theme") as "light" | "dark") ?? "dark"),
    );
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

function CheckoutForm({ amount, onPaid }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const theme = useResolvedTheme();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const cardOptions = useMemo<StripeCardElementOptions>(
    () => ({
      disableLink: true,
      style: {
        base: {
          fontSize: "16px",
          color: theme === "dark" ? "#e6ecf8" : "#1c2540",
          fontFamily: "DM Sans, sans-serif",
          "::placeholder": { color: theme === "dark" ? "#8b97b0" : "#8a93a8" },
        },
        invalid: { color: theme === "dark" ? "#ff8a74" : "#cf5138" },
      },
    }),
    [theme],
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    setProcessing(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, name, email }),
      });
      const data: { clientSecret?: string; error?: string } = await res.json();

      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error ?? "Could not start the payment.");
      }

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card,
          billing_details: { name: name || undefined, email: email || undefined },
        },
      });

      if (result.error) {
        setError(result.error.message ?? "The payment failed.");
      } else if (result.paymentIntent.status === "succeeded") {
        onPaid(result.paymentIntent.id, name);
      } else {
        setError(`Payment status: ${result.paymentIntent.status}`);
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Cannot reach the donation server. Make sure it is running on port 4242.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-1.5 text-sm font-bold text-ink">
        Full name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className={fieldClass}
        />
      </label>

      <label className="grid gap-1.5 text-sm font-bold text-ink">
        Email (optional)
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className={fieldClass}
        />
      </label>

      <div className="grid gap-1.5 text-sm font-bold text-ink">
        <span>Card details</span>
        <div className="rounded-xl border border-line bg-paper px-3.5 py-3.5 transition-colors duration-200 focus-within:border-brass">
          <CardElement key={theme} options={cardOptions} />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border-l-4 border-plume bg-plume/10 p-3 font-medium text-plume"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || processing || !(amount >= 1)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brass-bright px-6 py-3.5 font-bold text-night-950 shadow-lg shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-brass-bright"
      >
        {processing ? "Processing..." : `Donate $${amount.toFixed(2)}`}
      </button>
      <p className="text-xs text-muted">Secured by Stripe. Test mode: no real money is charged.</p>
    </form>
  );
}

export default CheckoutForm;
