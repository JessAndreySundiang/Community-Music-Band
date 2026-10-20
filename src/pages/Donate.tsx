import { useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { Link } from "react-router-dom";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import CheckoutForm from "../components/CheckoutForm";
import DonationReceipt from "../components/DonationReceipt";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import {
  IconAlert,
  IconCap,
  IconCheckCircle,
  IconLock,
  IconMusic,
  IconTicket,
  IconUsers,
} from "../components/Icons";
import { hasStripeKey, stripeMode, stripePromise } from "../lib/stripe";
import { parseDonationAmount, type ConfirmedDonation } from "../lib/donation";
import { usePageTitle } from "../lib/usePageTitle";
import { useResolvedTheme } from "../lib/useResolvedTheme";
import { buildStripeAppearance } from "../lib/stripeAppearance";

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
  const [amountText, setAmountText] = useState("25");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [processing, setProcessing] = useState(false);
  const [donation, setDonation] = useState<ConfirmedDonation | null>(null);
  const theme = useResolvedTheme();

  // Stripe cannot restyle an already-mounted Payment Element, so the Elements
  // instance is rebuilt when the theme changes. The name and email live above it
  // so nothing the donor typed is lost. Never swap it mid-payment: that would
  // cancel the confirmation they are waiting on.
  const [stripeTheme, setStripeTheme] = useState(theme);
  if (!processing && stripeTheme !== theme) {
    setStripeTheme(theme);
  }

  const amount = parseDonationAmount(amountText);

  // Deferred intent: Elements needs an amount to render wallets and payment
  // methods, but the PaymentIntent is still created on submit, so the API,
  // ledger and webhook flow stay exactly as they were.
  const elementsOptions = useMemo<StripeElementsOptions>(
    () => ({
      mode: "payment",
      amount: Math.max(100, Math.round((amount ?? 25) * 100)),
      currency: "usd",
      appearance: buildStripeAppearance(stripeTheme),
    }),
    [amount, stripeTheme],
  );

  const paid = donation !== null;

  return (
    <>
      <PageHero
        eyebrow="Support the band"
        title="Help us keep the music free."
        text="Every lesson and concert is free because of people like you. Your donation goes straight to the instruments, music, and rehearsal space our band needs."
      />

      <section className="band bg-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start lg:gap-14">
          {/* Impact — second on phones so the checkout is one thumb away. */}
          <div className="order-2 lg:order-1">
            <SectionHeading
              eyebrow="Your impact"
              title="Where your gift goes"
              text="We are a volunteer band, so nothing is spent on salaries."
            />
            <ul className="mt-6 space-y-4">
              {impact.map(({ id, title, text, Icon }) => (
                <li
                  key={id}
                  className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm transition-colors duration-200 hover:border-brass/50"
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

            <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
              <h3 className="font-serif text-lg font-semibold text-ink">Other ways to help</h3>
              <ul className="mt-3 grid gap-3 text-sm">
                <li className="flex items-start gap-3">
                  <IconUsers className="mt-0.5 size-4 shrink-0 text-brass" />
                  <p className="text-muted">
                    <a
                      href="mailto:communitymusicband@gmail.com?subject=Volunteering"
                      className="font-semibold text-ink underline decoration-brass/50 underline-offset-2 hover:decoration-brass"
                    >
                      Volunteer
                    </a>{" "}
                    at a rehearsal or on concert day.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <IconMusic className="mt-0.5 size-4 shrink-0 text-brass" />
                  <p className="text-muted">
                    <a
                      href="mailto:communitymusicband@gmail.com?subject=Instrument%20donation"
                      className="font-semibold text-ink underline decoration-brass/50 underline-offset-2 hover:decoration-brass"
                    >
                      Donate an instrument
                    </a>{" "}
                    you no longer play; we lend it to a student.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <IconTicket className="mt-0.5 size-4 shrink-0 text-brass" />
                  <p className="text-muted">
                    <Link
                      to="/"
                      className="font-semibold text-ink underline decoration-brass/50 underline-offset-2 hover:decoration-brass"
                    >
                      Bring a friend
                    </Link>{" "}
                    to the next free concert.
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* Checkout */}
          <aside className="order-1 lg:sticky lg:order-2 lg:top-24">
            <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-xl shadow-night-950/5">
              <div className="border-b border-line bg-paper px-6 py-5 sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brass">
                    {paid ? "Donation complete" : "Secure checkout"}
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted">
                    {paid ? (
                      <>
                        <IconCheckCircle className="size-3.5 text-brass" />
                        Paid
                      </>
                    ) : (
                      <>
                        <IconLock className="size-3.5" />
                        Encrypted
                      </>
                    )}
                  </span>
                </div>
                {!paid && (
                  <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">
                    Complete your donation
                  </h2>
                )}
              </div>

              {donation ? (
                <DonationReceipt
                  donation={donation}
                  onReset={() => {
                    setDonation(null);
                    setAmountText("25");
                  }}
                />
              ) : !hasStripeKey ? (
                <div className="px-6 py-8 sm:px-8">
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-l-4 border-plume/30 border-l-plume bg-plume/10 p-4 font-medium text-plume"
                  >
                    <IconAlert className="mt-0.5 size-4 shrink-0" />
                    Stripe is not set up yet. Add VITE_STRIPE_PUBLISHABLE_KEY (pk_test_… or
                    pk_live_…) to the .env file, then restart npm run dev.
                  </p>
                </div>
              ) : (
                <Elements key={stripeTheme} stripe={stripePromise} options={elementsOptions}>
                  <CheckoutForm
                    amount={amount}
                    amountText={amountText}
                    onAmountTextChange={setAmountText}
                    name={name}
                    onNameChange={setName}
                    email={email}
                    onEmailChange={setEmail}
                    onProcessingChange={setProcessing}
                    onPaid={setDonation}
                    testMode={stripeMode === "test"}
                  />
                </Elements>
              )}
            </div>

            <p className="mt-4 px-1 text-center text-xs text-muted">
              Gifts are processed in USD. Need a hand?{" "}
              <a
                href="mailto:communitymusicband@gmail.com"
                className="font-semibold text-brass underline underline-offset-2 hover:no-underline"
              >
                Email the band
              </a>
              .
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}

export default Donate;
