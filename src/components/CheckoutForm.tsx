import { useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripePaymentElementOptions } from "@stripe/stripe-js";
import { API_LABEL, API_URL } from "../lib/stripe";
import {
  DONATION_MAX_USD,
  DONATION_MIN_USD,
  createIdempotencyKey,
  describeApiError,
  formatUsd,
  type ConfirmedDonation,
} from "../lib/donation";
import { IconAlert, IconInfo, IconLock, IconSpinner } from "./Icons";
import CardBrands from "./CardBrands";

type CheckoutFormProps = {
  amount: number | null;
  amountText: string;
  onAmountTextChange: (value: string) => void;
  name: string;
  onNameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  onProcessingChange: (value: boolean) => void;
  onPaid: (donation: ConfirmedDonation) => void;
  /** True with a pk_test_ key, so the donor is told no money is moving. */
  testMode: boolean;
};

const presets = [10, 25, 50, 100];

const fieldClass =
  "w-full rounded-xl border border-line bg-paper px-3.5 py-3 text-base font-normal text-ink transition-colors duration-200 placeholder:text-muted/70 focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/25 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-plume";

type FieldKey = "name" | "email" | "amount";
type Problem = { id: string; message: string };

function nameProblem(value: string): string | null {
  return value.trim().length >= 2 ? null : "Enter the name shown on your card.";
}

function emailProblem(value: string): string | null {
  const email = value.trim();
  if (!email) return "Enter an email address so we can send your receipt.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    ? null
    : "Enter a valid email address, like name@example.com.";
}

/**
 * `parseDonationAmount` already enforces the range. This adds the message and
 * the whole-dollar rule, so the donor is never told "invalid" without a reason.
 */
function amountProblem(text: string, amount: number | null): string | null {
  if (!text.trim()) return "Choose an amount to donate.";
  if (!Number.isInteger(amount)) {
    return `Enter a whole dollar amount from $${DONATION_MIN_USD} to $${DONATION_MAX_USD}.`;
  }
  return null;
}

function StepHeading({
  number,
  id,
  children,
}: {
  number: number;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brass/15 text-[11px] font-bold text-brass ring-1 ring-brass/25">
        {number}
      </span>
      <h3 id={id} className="font-serif text-base font-semibold text-ink">
        {children}
      </h3>
    </div>
  );
}

function CheckoutForm({
  amount,
  amountText,
  onAmountTextChange,
  name,
  onNameChange,
  email,
  onEmailChange,
  onProcessingChange,
  onPaid,
  testMode,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const baseId = useId();
  const amountId = `${baseId}-amount`;
  const nameId = `${baseId}-name`;
  const emailId = `${baseId}-email`;
  const paymentId = `${baseId}-payment`;
  const amountHintId = `${baseId}-amount-hint`;
  const amountErrorId = `${baseId}-amount-error`;
  const nameErrorId = `${baseId}-name-error`;
  const emailErrorId = `${baseId}-email-error`;
  const summaryTitleId = `${baseId}-summary-title`;

  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [error, setError] = useState("");
  const alertRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const idempotencyRef = useRef<{ fingerprint: string; key: string } | null>(null);

  const reveals = (key: FieldKey) => submitted || touched[key];
  const amountError = reveals("amount") ? amountProblem(amountText, amount) : null;
  const nameError = reveals("name") ? nameProblem(name) : null;
  const emailError = reveals("email") ? emailProblem(email) : null;

  // Name and email are collected above, so Stripe should not ask twice. The
  // values are attached to the payment method on confirm instead. Link is not
  // activated on the band's account; in test mode it would otherwise expand a
  // tall signup panel for a method that disappears in live mode.
  const paymentOptions = useMemo<StripePaymentElementOptions>(
    () => ({
      layout: "tabs",
      wallets: { link: "never" },
      fields: { billingDetails: { name: "never", email: "never" } },
      readOnly: processing,
    }),
    [processing],
  );

  function focusAlert() {
    // The alert is rendered by this same update; wait for it to exist.
    requestAnimationFrame(() => alertRef.current?.focus());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;
    if (submittingRef.current) return;

    setSubmitted(true);
    setError("");

    const found: Problem[] = [];
    const amountIssue = amountProblem(amountText, amount);
    if (amountIssue) found.push({ id: amountId, message: amountIssue });
    const nameIssue = nameProblem(name);
    if (nameIssue) found.push({ id: nameId, message: nameIssue });
    const emailIssue = emailProblem(email);
    if (emailIssue) found.push({ id: emailId, message: emailIssue });

    if (found.length > 0) {
      setProblems(found);
      focusAlert();
      return;
    }

    if (amount === null) return;

    setProblems([]);
    submittingRef.current = true;
    setProcessing(true);
    onProcessingChange(true);

    // Reuse the key while the donation details are unchanged, so a retry after a
    // timeout cannot charge twice, but start a new one as soon as anything moves.
    const fingerprint = [amount, name, email].join("|");
    let key = idempotencyRef.current?.key;
    if (idempotencyRef.current?.fingerprint !== fingerprint || !key) {
      key = createIdempotencyKey();
      idempotencyRef.current = { fingerprint, key };
    }

    // The two stages are told apart so that only a failure of the request below
    // is described as a network problem. Once Stripe is talking to the donor,
    // its own message is the honest one.
    let stage: "request" | "payment" = "request";

    try {
      // Validate the card fields first. Stripe's inline errors are more precise
      // than anything we could say about a card number or expiry date.
      const validation = await elements.submit();
      if (validation.error) {
        setError(validation.error.message ?? "Check your payment details and try again.");
        focusAlert();
        return;
      }

      const res = await fetch(`${API_URL}/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify({ amount, name: name.trim(), email: email.trim() }),
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
      const result = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/donate`,
          payment_method_data: {
            billing_details: { name: name.trim(), email: email.trim() },
          },
        },
        redirect: "if_required",
      });

      if (result.error) {
        setError(result.error.message ?? "The payment failed.");
        focusAlert();
      } else if (result.paymentIntent?.status === "succeeded") {
        // Read the amount back from Stripe so the receipt can never disagree with
        // what was actually charged if the form was edited mid-payment.
        idempotencyRef.current = null;
        onPaid({
          id: result.paymentIntent.id,
          name: name.trim(),
          amount: result.paymentIntent.amount / 100,
          email: email.trim(),
        });
      } else if (result.paymentIntent) {
        setError(`Payment status: ${result.paymentIntent.status}`);
        focusAlert();
      }
    } catch (err) {
      setError(
        stage === "request"
          ? describeApiError(err, API_LABEL)
          : err instanceof Error && err.message
            ? err.message
            : "The payment could not be completed.",
      );
      focusAlert();
    } finally {
      submittingRef.current = false;
      setProcessing(false);
      onProcessingChange(false);
    }
  }

  const total = amount !== null ? formatUsd(amount) : "—";

  return (
    <form
      className="grid gap-6 px-6 py-7 sm:px-8"
      aria-busy={processing}
      noValidate
      onSubmit={handleSubmit}
    >
      {problems.length > 0 && (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby={summaryTitleId}
          className="rounded-2xl border border-l-4 border-plume/30 border-l-plume bg-plume/10 p-4 focus:outline-none"
        >
          <p id={summaryTitleId} className="flex items-center gap-2 font-bold text-plume">
            <IconAlert className="size-4 shrink-0" />
            Please check the form
          </p>
          <ul className="mt-1.5 grid gap-1 text-sm">
            {problems.map((problem) => (
              <li key={problem.id}>
                <a
                  href={`#${problem.id}`}
                  className="font-medium text-plume underline underline-offset-2 hover:no-underline"
                >
                  {problem.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section aria-labelledby={`${baseId}-amount-heading`} className="grid gap-3">
        <StepHeading number={1} id={`${baseId}-amount-heading`}>
          Choose an amount
        </StepHeading>

        <div className="grid grid-cols-4 gap-2">
          {presets.map((preset) => {
            const active = amount === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={active}
                disabled={processing}
                onClick={() => onAmountTextChange(String(preset))}
                className={`rounded-xl border-2 px-2 py-2.5 text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? "border-brass-bright bg-brass-bright text-night-950"
                    : "border-line bg-paper text-ink hover:border-brass/60 hover:text-brass"
                }`}
              >
                ${preset}
              </button>
            );
          })}
        </div>

        <label htmlFor={amountId} className="grid gap-1.5 text-sm font-bold text-ink">
          Other amount (USD)
          <span className="relative block">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-normal text-muted"
            >
              $
            </span>
            <input
              id={amountId}
              value={amountText}
              onChange={(event) =>
                onAmountTextChange(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              onBlur={() => setTouched((state) => ({ ...state, amount: true }))}
              inputMode="numeric"
              autoComplete="off"
              disabled={processing}
              maxLength={4}
              aria-invalid={Boolean(amountError)}
              aria-describedby={`${amountHintId}${amountError ? ` ${amountErrorId}` : ""}`}
              className={`${fieldClass} pl-8 pr-14 font-normal`}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wide text-muted"
            >
              USD
            </span>
          </span>
        </label>

        <p id={amountHintId} className="flex items-start gap-1.5 text-xs text-muted">
          <IconInfo className="mt-px size-3.5 shrink-0" />
          One-time gift, charged once. Between ${DONATION_MIN_USD} and ${DONATION_MAX_USD}.
        </p>
        {amountError && (
          <p id={amountErrorId} className="text-xs font-medium text-plume">
            {amountError}
          </p>
        )}
      </section>

      <section aria-labelledby={`${baseId}-details-heading`} className="grid gap-3">
        <StepHeading number={2} id={`${baseId}-details-heading`}>
          Your details
        </StepHeading>

        <label htmlFor={nameId} className="grid gap-1.5 text-sm font-bold text-ink">
          Full name
          <input
            id={nameId}
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            onBlur={() => setTouched((state) => ({ ...state, name: true }))}
            autoComplete="name"
            disabled={processing}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? nameErrorId : undefined}
            className={fieldClass}
          />
        </label>
        {nameError && (
          <p id={nameErrorId} className="text-xs font-medium text-plume">
            {nameError}
          </p>
        )}

        <label htmlFor={emailId} className="grid gap-1.5 text-sm font-bold text-ink">
          Email
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            onBlur={() => setTouched((state) => ({ ...state, email: true }))}
            autoComplete="email"
            disabled={processing}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? emailErrorId : `${baseId}-email-hint`}
            className={fieldClass}
          />
        </label>
        {emailError ? (
          <p id={emailErrorId} className="text-xs font-medium text-plume">
            {emailError}
          </p>
        ) : (
          <p id={`${baseId}-email-hint`} className="flex items-start gap-1.5 text-xs text-muted">
            <IconInfo className="mt-px size-3.5 shrink-0" />
            We&apos;ll email your receipt. The band only uses your address for this donation.
          </p>
        )}
      </section>

      <section aria-labelledby={`${baseId}-payment-heading`} className="grid gap-3">
        <StepHeading number={3} id={`${baseId}-payment-heading`}>
          Payment
        </StepHeading>
        {/* Reserve the height Stripe needs so the panel does not jump when the
            card fields finish loading. */}
        <div id={paymentId} className="min-h-44 rounded-2xl border border-line bg-surface p-3.5">
          <PaymentElement options={paymentOptions} onReady={() => setPaymentReady(true)} />
        </div>
      </section>

      {error && (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          className="rounded-2xl border border-l-4 border-plume/30 border-l-plume bg-plume/10 p-4 focus:outline-none"
        >
          <p className="flex items-start gap-2 font-bold text-plume">
            <IconAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
          <p className="mt-1 text-xs text-muted">
            Your card has not been charged. Check the details and try again.
          </p>
        </div>
      )}

      <div className="grid gap-1.5 border-t border-dashed border-line pt-5">
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-muted">One-time donation</span>
          <span className="font-semibold text-ink">{total}</span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-bold text-ink">Total today</span>
          <span className="font-serif text-2xl font-semibold text-ink">{total}</span>
        </div>
        <p className="text-xs text-muted">Charged once in US dollars. No recurring billing.</p>
      </div>

      <button
        type="submit"
        disabled={!stripe || !paymentReady || processing || amount === null}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brass-bright px-6 py-4 font-bold text-night-950 shadow-lg shadow-amber-500/20 transition-colors duration-200 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:hover:bg-brass-bright"
      >
        {processing ? (
          <>
            <IconSpinner className="size-4 animate-spin motion-reduce:animate-none" />
            Processing…
          </>
        ) : (
          <>
            <IconLock className="size-4" />
            Donate {total}
          </>
        )}
      </button>

      <div className="grid gap-2.5 rounded-2xl border border-line bg-paper px-4 py-3.5">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
          <IconLock className="mt-px size-3.5 shrink-0 text-brass" />
          <span>
            Payments are encrypted and processed by Stripe. We never see or store your card number.
          </span>
        </p>
        <CardBrands />
        {testMode && (
          <div className="rounded-lg bg-brass/10 px-2.5 py-2 text-[11px] leading-relaxed text-brass">
            <p className="font-semibold">Test mode — no real money is charged.</p>
            <p className="mt-0.5 tabular-nums">
              Use card 4242 4242 4242 4242, any future date, any CVC.
            </p>
          </div>
        )}
      </div>
    </form>
  );
}

export default CheckoutForm;
