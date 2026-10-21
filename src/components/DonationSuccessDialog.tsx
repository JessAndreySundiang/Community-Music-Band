import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatReceiptDate, formatUsd, type ConfirmedDonation } from "../lib/donation";
import {
  IconCheck,
  IconCheckCircle,
  IconClose,
  IconCopy,
  IconInfo,
  IconLock,
  IconPrinter,
} from "./Icons";

type DonationSuccessDialogProps = {
  donation: ConfirmedDonation;
  open: boolean;
  onClose: () => void;
  onDonateAgain: () => void;
};

/**
 * The moment after a payment clears. A native <dialog> is used because the
 * browser then gives us the focus trap, Escape handling and an inert page for
 * free; the heading takes focus so the outcome is announced before the actions.
 * Closing leaves the full receipt in the checkout panel, and "Print receipt"
 * prints a clean copy from the portal below rather than the whole page.
 */
function DonationSuccessDialog({
  donation,
  open,
  onClose,
  onDonateAgain,
}: DonationSuccessDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      titleRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // The dialog does not lock the page itself, and a donation page that scrolls
  // behind the receipt reads as two screens fighting for attention.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 2400);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  function closeDialog() {
    setCopyState("idle");
    onClose();
  }

  function donateAgain() {
    setCopyState("idle");
    onDonateAgain();
  }

  async function copyReference() {
    if (!navigator.clipboard) {
      setCopyState("failed");
      return;
    }
    try {
      await navigator.clipboard.writeText(donation.id);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  function printReceipt() {
    closeDialog();
    // Two frames let the dialog leave the top layer before print snapshots the page.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });
  }

  const firstName = donation.name.trim().split(/\s+/)[0] || "friend";

  return (
    <>
      <dialog
        ref={dialogRef}
        aria-labelledby="donation-success-title"
        aria-describedby="donation-success-summary"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClick={(event) => {
          // Clicks on ::backdrop are reported against the dialog element itself.
          if (event.target === dialogRef.current) closeDialog();
        }}
        className="donation-dialog m-auto max-h-[min(92dvh,46rem)] w-[calc(100%-2rem)] max-w-[27rem] overflow-y-auto rounded-3xl p-0 text-ink max-sm:mx-0 max-sm:mb-0 max-sm:mt-auto max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none"
      >
        <div className="relative grid gap-4 px-6 pb-6 pt-7 sm:px-8">
          <button
            type="button"
            onClick={closeDialog}
            aria-label="Close receipt"
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
          >
            <IconClose className="size-4.5" />
          </button>

          <div className="grid justify-items-center gap-3 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-brass/15 text-brass ring-8 ring-brass/5">
              <svg
                viewBox="0 0 24 24"
                className="size-7"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m5 12.6 4.4 4.4L19 7.4" pathLength={100} className="check-stroke" />
              </svg>
            </span>
            <div className="grid gap-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brass">
                Payment complete
              </p>
              <h2
                id="donation-success-title"
                ref={titleRef}
                tabIndex={-1}
                className="font-serif text-2xl font-semibold leading-tight text-ink focus:outline-none"
              >
                Donation successful
              </h2>
              <p id="donation-success-summary" className="text-sm leading-relaxed text-muted">
                Thank you, {firstName} — your gift keeps the music free.
              </p>
            </div>
          </div>

          <div className="grid justify-items-center gap-0.5 rounded-2xl border border-line bg-paper py-3.5">
            <span className="font-serif text-3xl font-semibold tracking-tight text-ink">
              {formatUsd(donation.amount)}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              USD · one-time gift
            </span>
          </div>

          <dl className="grid divide-y divide-line overflow-hidden rounded-2xl border border-line text-sm">
            <div className="flex items-baseline justify-between gap-4 px-4 py-2">
              <dt className="text-muted">Date</dt>
              <dd className="text-right font-medium text-ink">
                {formatReceiptDate(donation.paidAt)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-2">
              <dt className="text-muted">Status</dt>
              <dd>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brass/15 px-2.5 py-0.5 text-xs font-bold text-brass">
                  <IconCheckCircle className="size-3.5" /> Paid
                </span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-2">
              <dt className="shrink-0 text-muted">Receipt</dt>
              <dd className="break-all text-right text-ink">{donation.email}</dd>
            </div>
            <div className="grid gap-1.5 px-4 py-2">
              <dt className="text-muted">Reference</dt>
              <dd className="flex items-start justify-between gap-3">
                <code className="break-all text-xs text-ink">{donation.id}</code>
                <button
                  type="button"
                  onClick={copyReference}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:border-brass hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
                >
                  {copyState === "copied" ? (
                    <IconCheck className="size-3.5" />
                  ) : (
                    <IconCopy className="size-3.5" />
                  )}
                  {copyState === "copied" ? "Copied" : "Copy"}
                </button>
              </dd>
            </div>
          </dl>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <IconInfo className="mt-0.5 size-3.5 shrink-0" />
            <span>A receipt has been emailed to {donation.email}.</span>
          </p>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={closeDialog}
              className="inline-flex w-full items-center justify-center rounded-full bg-brass-bright px-6 py-3 font-bold text-night-950 shadow-lg shadow-amber-500/20 transition-colors duration-200 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
            >
              Done
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={donateAgain}
                className="inline-flex items-center justify-center rounded-full border border-line px-4 py-3 text-sm font-semibold text-ink transition-colors duration-200 hover:border-brass hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
              >
                Donate again
              </button>
              <button
                type="button"
                onClick={printReceipt}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-4 py-3 text-sm font-semibold text-ink transition-colors duration-200 hover:border-brass hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
              >
                <IconPrinter className="size-4" />
                Print
              </button>
            </div>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
            <IconLock className="size-3.5 shrink-0" /> Processed securely by Stripe.
          </p>

          <p role="status" className="sr-only">
            {copyState === "copied"
              ? "Reference copied to clipboard."
              : copyState === "failed"
                ? "Could not copy the reference. Select it and copy manually."
                : ""}
          </p>
        </div>
      </dialog>

      {createPortal(<PrintReceipt donation={donation} />, document.body)}
    </>
  );
}

/**
 * Printed instead of the page: a neutral black-on-white receipt that stays
 * readable in either theme and ignores the checkout layout around it.
 */
function PrintReceipt({ donation }: { donation: ConfirmedDonation }) {
  return (
    <div className="print-receipt">
      <div className="print-receipt-inner">
        <p className="print-eyebrow">Community Music Band</p>
        <h1>Donation receipt</h1>
        <p className="print-lead">
          Thank you, {donation.name}. Your gift supports free lessons, instruments and concerts.
        </p>
        <table>
          <tbody>
            <tr>
              <th scope="row">Amount</th>
              <td>{formatUsd(donation.amount)} USD</td>
            </tr>
            <tr>
              <th scope="row">Date</th>
              <td>{formatReceiptDate(donation.paidAt)}</td>
            </tr>
            <tr>
              <th scope="row">Donor</th>
              <td>{donation.name}</td>
            </tr>
            <tr>
              <th scope="row">Receipt sent to</th>
              <td>{donation.email}</td>
            </tr>
            <tr>
              <th scope="row">Status</th>
              <td>Paid</td>
            </tr>
            <tr>
              <th scope="row">Reference</th>
              <td>{donation.id}</td>
            </tr>
          </tbody>
        </table>
        <p className="print-foot">
          Processed securely by Stripe. Keep this receipt for your records.
        </p>
      </div>
    </div>
  );
}

export default DonationSuccessDialog;
