import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeCardElementOptions } from "@stripe/stripe-js";
import { API_LABEL, API_URL } from "../lib/stripe";
import { createIdempotencyKey, describeApiError, formatUsd } from "../lib/donation";
import { currentTheme, type Theme } from "../lib/theme";

type CheckoutFormProps = {
  amount: number;
  /** Called with the amount Stripe actually confirmed, not what the form showed. */
  onPaid: (payment: { id: string; name: string; amount: number }) => void;
};

const fieldClass =
  "rounded-xl border border-line bg-paper px-3.5 py-3 text-base font-normal text-ink transition-colors duration-200 focus:border-brass focus:outline-none";

/** Keep the Stripe iframe's text legible against the active theme. */
function useResolvedTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => setTheme(currentTheme()));
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
  const [postal, setPostal] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const submittingRef = useRef<boolean>(false);
  const idempotencyRef = useRef<{ fingerprint: string; key: string } | null>(null);

  const cardOptions = useMemo<StripeCardElementOptions>(
    () => ({
      disableLink: true,
      // Stripe lays its own ZIP field out at a width it measured earlier, which
      // can exceed the iframe and push the field out of view — leaving it
      // invisible and impossible to fill ("Your postal code is incomplete.").
      // We collect the ZIP in our own always-visible field instead and pass it
      // through billing_details.address.
      hidePostalCode: true,
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

    // A second submit arriving before React re-renders would create a second PaymentIntent.
    if (submittingRef.current) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    submittingRef.current = true;
    setProcessing(true);
    setError("");

    // Reuse the key while the details are unchanged, so a retry after a timeout
    // cannot charge twice, but start a new one as soon as anything changes.
    const fingerprint = [amount, name, email, postal].join("|");
    if (idempotencyRef.current?.fingerprint !== fingerprint) {
      idempotencyRef.current = { fingerprint, key: createIdempotencyKey() };
    }

    // The two stages are told apart so that only a failure of the request below
    // is described as a network problem. Once Stripe is talking to the donor,
    // its own message is the honest one.
    let stage: "request" | "payment" = "request";

    try {
      const res = await fetch(`${API_URL}/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyRef.current.key,
        },
        body: JSON.stringify({ amount, name, email }),
        // Without a timeout a stalled server leaves the button on "Processing..."
        // forever. Browsers without AbortSignal.timeout get no timeout rather
        // than a fabricated "Cannot reach the server" message.
        signal: globalThis.AbortSignal?.timeout?.(20_000),
      });

      // The API always answers with JSON, but a crash or proxy can return HTML.
      const data = (await res.json().catch(() => null)) as {
        clientSecret?: string;
        error?: string;
      } | null;

      if (!res.ok || !data?.clientSecret) {
        throw new Error(
          data?.error ?? `The donation server rejected the request (HTTP ${res.status}).`,
        );
      }

      stage = "payment";
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: name || undefined,
            email: email || undefined,
            address: { postal_code: postal.trim() },
          },
        },
      });

      if (result.error) {
        setError(result.error.message ?? "The payment failed.");
      } else if (result.paymentIntent.status === "succeeded") {
        // Read the amount back from Stripe so the receipt can never disagree with
        // what was actually charged if the form was edited mid-payment.
        idempotencyRef.current = null;
        onPaid({
          id: result.paymentIntent.id,
          name,
          amount: result.paymentIntent.amount / 100,
        });
      } else {
        setError(`Payment status: ${result.paymentIntent.status}`);
      }
    } catch (err) {
      setError(
        stage === "request"
          ? describeApiError(err, API_LABEL)
          : err instanceof Error && err.message
            ? err.message
            : "The payment could not be completed.",
      );
    } finally {
      submittingRef.current = false;
      setProcessing(false);
    }
  }

  return (
    <form className="grid gap-4" aria-busy={processing} onSubmit={handleSubmit}>
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

      <label className="grid gap-1.5 text-sm font-bold text-ink">
        ZIP / Postal code
        <input
          required
          value={postal}
          onChange={(event) => setPostal(event.target.value)}
          autoComplete="postal-code"
          maxLength={12}
          className={fieldClass}
        />
      </label>

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
        {processing ? "Processing..." : `Donate ${formatUsd(amount)}`}
      </button>
      <p className="text-xs text-muted">Secured by Stripe. Test mode: no real money is charged.</p>
    </form>
  );
}

export default CheckoutForm;
