import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { formatUsd, type ConfirmedDonation } from "../lib/donation";
import { IconCheckCircle, IconLock } from "./Icons";

type DonationReceiptProps = {
  donation: ConfirmedDonation;
  onReset: () => void;
};

/**
 * The post-payment panel. Focus moves to the heading so a keyboard or screen
 * reader user is told the payment went through instead of being left at the
 * button they pressed.
 */
function DonationReceipt({ donation, onReset }: DonationReceiptProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="grid gap-6 px-6 py-8 sm:px-8">
      <div className="flex flex-col items-start gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-brass/15 text-brass ring-8 ring-brass/5">
          <IconCheckCircle className="size-7" />
        </span>
        <div>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-serif text-2xl font-semibold text-ink focus:outline-none"
          >
            Thank you, {donation.name}!
          </h2>
          <p className="mt-1 text-sm text-muted">
            Your donation was received. The band will put it to work right away.
          </p>
        </div>
      </div>

      <dl className="grid gap-2.5 rounded-2xl border border-line bg-paper p-4 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Amount</dt>
          <dd className="font-serif text-xl font-semibold text-ink">
            {formatUsd(donation.amount)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Status</dt>
          <dd className="inline-flex items-center gap-1.5 rounded-full bg-brass/15 px-2.5 py-0.5 text-xs font-bold text-brass">
            <IconCheckCircle className="size-3.5" /> Paid
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Receipt</dt>
          <dd className="break-all text-right text-ink">{donation.email}</dd>
        </div>
        <div className="grid gap-1 border-t border-line pt-2.5">
          <dt className="text-muted">Reference</dt>
          <dd>
            <code className="break-all text-xs text-ink">{donation.id}</code>
          </dd>
        </div>
      </dl>

      <p className="text-xs leading-relaxed text-muted">
        A receipt has been emailed to {donation.email}. Keep the reference above if you need to
        contact the band about this gift.
      </p>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex w-full items-center justify-center rounded-full bg-brass-bright px-6 py-3.5 font-bold text-night-950 shadow-lg shadow-amber-500/20 transition-colors duration-200 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
        >
          Make another donation
        </button>
        <Link
          to="/"
          className="inline-flex w-full items-center justify-center rounded-full border border-line px-6 py-3 font-semibold text-ink transition-colors duration-200 hover:border-brass hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
        >
          Back to home
        </Link>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-muted">
        <IconLock className="size-3.5 shrink-0" /> Processed securely by Stripe.
      </p>
    </div>
  );
}

export default DonationReceipt;
