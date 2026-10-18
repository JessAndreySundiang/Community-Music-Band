import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import Stripe from "stripe";
import { createAlertQueue } from "./alert-queue.js";
import { createApp, describeStripeKey } from "./app.js";
import { createDonationStore } from "./donations.js";
import { createMailerFromEnv } from "./mailer.js";

const here = path.dirname(fileURLToPath(import.meta.url));

// Resolve server/.env next to THIS file, not against the caller's cwd.
// Running `node server/server.js` from the project root would otherwise load the
// front-end's root .env (which only has VITE_STRIPE_PUBLISHABLE_KEY), leaving
// STRIPE_SECRET_KEY undefined and killing the server on boot.
const envFile = path.join(here, ".env");
dotenv.config({ path: envFile });

const secretKey = process.env.STRIPE_SECRET_KEY;
const secretKeyStatus = describeStripeKey(secretKey);

if (!secretKeyStatus.ok) {
  console.error(`${secretKeyStatus.message} (in ${envFile}).`);
  console.error("Copy server/.env.example to server/.env and paste a key from");
  console.error("https://dashboard.stripe.com/apikeys, then restart the server.");
  process.exit(1);
}

if (secretKeyStatus.live) {
  console.warn("STRIPE_SECRET_KEY is a LIVE key: completed donations charge real cards.");
  console.warn("Donation alerts are no longer prefixed [TEST].");
}

const store = createDonationStore({
  file: process.env.DONATIONS_FILE || path.join(here, "data", "donations.jsonl"),
});

// Null unless a transport is configured, so an unconfigured server behaves
// exactly as it did before email alerts existed. The same helper backs
// `npm run check-mail`, so the two can never disagree about what is set up.
const mailer = createMailerFromEnv();

// Anything the mailer cannot deliver is kept on disk and retried on a backoff,
// so a mail outage delays an alert instead of losing it.
const alerts = mailer
  ? createAlertQueue({
      file: process.env.PENDING_ALERTS_FILE || path.join(here, "data", "pending-alerts.jsonl"),
      deliver: (entry, options) => mailer.sendDonationAlert(entry, options),
    })
  : null;

// Awaits only the queue file read, never a send, so a mail outage cannot delay
// the API starting.
if (alerts) await alerts.start();

const app = createApp({
  stripe: new Stripe(secretKey),
  store,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || undefined,
  alerts,
});

const port = Number(process.env.PORT) || 4242;
const server = app.listen(port, () => {
  console.log(`Donation server running at http://localhost:${port}`);
  console.log(`Donation ledger: ${store.file}`);
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log(
      "No STRIPE_WEBHOOK_SECRET set — completed gifts will not be written to the ledger.",
    );
  }
  if (alerts) {
    console.log(`Donation alerts: ${mailer.transports.join(" then ")} -> ${mailer.to}.`);
    if (alerts.pending) {
      console.log(`Retrying ${alerts.pending} undelivered alert(s) from ${alerts.file}.`);
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.log(
        "Donation alerts stay silent until STRIPE_WEBHOOK_SECRET is set — the webhook is what confirms a gift.",
      );
    }
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use — another donation server is probably still running.`,
    );
    console.error("Stop it, or start this one on a different port with PORT=4243.");
  } else {
    console.error("Donation server failed to start:", err.message);
  }
  process.exit(1);
});
