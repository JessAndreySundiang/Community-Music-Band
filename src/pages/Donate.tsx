import { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "../components/CheckoutForm";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import { IconCap, IconMusic, IconTicket } from "../components/Icons";
import { stripePromise, hasStripeKey } from "../lib/stripe";
import {
  DONATION_MAX_USD,
  DONATION_MIN_USD,
  formatUsd,
  parseDonationAmount,
} from "../lib/donation";
import { usePageTitle } from "../lib/usePageTitle";

type Receipt = {
  id: string;
  name: string;
  amount: number;
};

const presets: number[] = [5, 10, 25, 50];

const impact = [
  {
    id: "instruments",
    title: "Instruments and repairs",
    text: "Borrowed instruments for students who cannot buy their own.",
    Icon: IconMusic,
  },
  {
    id: "music",
    title: "Sheet music and materials",
    text: "Music for every section, plus lesson books for new players.",
    Icon: IconCap,
  },
  {
    id: "space",
    title: "Rehearsal space and concerts",
    text: "Hall rental, sound equipment, and the free monthly plaza concert.",
    Icon: IconTicket,
  },
];

function Donate() {
  usePageTitle("Donate");
  const [amountText, setAmountText] = useState<string>("25");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const amount = parseDonationAmount(amountText);

  return (
    <>
      <PageHero
        eyebrow="Support the band"
        title="Help us keep the music free."
        text="Every lesson and concert is free because of people like you. Your donation goes straight to the instruments, music, and rehearsal space our band needs."
      />

      <section className="band bg-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 md:py-24 lg:grid-cols-[1fr_minmax(320px,460px)] lg:items-start">
          {/* Impact */}
          <div>
            <SectionHeading
              eyebrow="Your impact"
              title="Where your gift goes"
              text="We are a volunteer band, so nothing is spent on salaries."
            />
            <ul className="space-y-4">
              {impact.map(({ id, title, text, Icon }) => (
                <li
                  key={id}
                  className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brass/60 hover:shadow-xl"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brass/10 text-brass">
                    <Icon className="size-5.5" />
                  </span>
                  <span>
                    <strong className="block font-serif text-base font-semibold text-ink">
                      {title}
                    </strong>
                    <span className="text-sm text-muted">{text}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-3xl border-l-[6px] border-plume bg-feature p-7 shadow-2xl">
              <p className="font-serif text-xl font-semibold leading-snug text-feature-fg">
                Every gift keeps a seat open for the next student.
              </p>
              <p className="mt-2 text-sm text-feature-muted">
                Run by volunteers, funded by donations and local sponsors.
              </p>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-3xl border border-line border-t-[6px] border-t-brass bg-surface p-6 shadow-xl sm:p-8">
            {/* Always mounted so screen readers announce the result when it changes. */}
            <p role="status" aria-live="polite" className="sr-only">
              {receipt
                ? `Thank you, ${receipt.name}. Your ${formatUsd(receipt.amount)} donation was received.`
                : ""}
            </p>

            {receipt ? (
              <div className="grid justify-items-start gap-3">
                <h2 className="font-serif text-2xl font-semibold text-ink">
                  Thank you, {receipt.name}!
                </h2>
                <p className="text-muted">
                  Your {formatUsd(receipt.amount)} donation was received.
                </p>
                <p className="text-xs text-muted">
                  Payment ID: <code className="break-all">{receipt.id}</code>
                </p>
                <button
                  type="button"
                  onClick={() => setReceipt(null)}
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-brass-bright px-6 py-3 font-bold text-night-950 shadow-lg shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright active:translate-y-0"
                >
                  Make another donation
                </button>
              </div>
            ) : !hasStripeKey ? (
              <p
                role="alert"
                className="rounded-xl border-l-4 border-plume bg-plume/10 p-4 font-medium text-plume"
              >
                Stripe is not set up yet. Add VITE_STRIPE_PUBLISHABLE_KEY (pk_test_… or pk_live_…)
                to the .env file, then restart npm run dev.
              </p>
            ) : (
              <>
                <h2 className="font-serif text-2xl font-semibold text-ink">Make a donation</h2>

                <div
                  className="mt-5 grid grid-cols-4 gap-2"
                  role="group"
                  aria-label="Donation amount"
                >
                  {presets.map((preset) => {
                    const active = amount === preset;
                    return (
                      <button
                        type="button"
                        key={preset}
                        aria-pressed={active}
                        onClick={() => setAmountText(String(preset))}
                        className={`rounded-xl border-2 py-2.5 font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright ${
                          active
                            ? "border-brass-bright bg-brass-bright text-night-950"
                            : "border-brass/40 text-brass hover:bg-brass/10"
                        }`}
                      >
                        ${preset}
                      </button>
                    );
                  })}
                </div>

                <label className="mt-4 grid gap-1.5 text-sm font-bold text-ink">
                  Other amount (USD, {DONATION_MIN_USD} to {DONATION_MAX_USD})
                  <input
                    type="number"
                    min={DONATION_MIN_USD}
                    max={DONATION_MAX_USD}
                    step={1}
                    value={amountText}
                    onChange={(e) => setAmountText(e.target.value)}
                    className="rounded-xl border border-line bg-paper px-3.5 py-3 text-base font-normal text-ink transition-colors duration-200 focus:border-brass focus:outline-none"
                  />
                </label>

                <div className="mt-4">
                  <Elements stripe={stripePromise}>
                    <CheckoutForm amount={amount ?? 0} onPaid={(paid) => setReceipt(paid)} />
                  </Elements>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default Donate;
