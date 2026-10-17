import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import Stripe from "stripe";
import { createApp } from "./app.js";
import { createDonationStore } from "./donations.js";

const here = path.dirname(fileURLToPath(import.meta.url));

// Resolve server/.env next to THIS file, not against the caller's cwd.
// Running `node server/server.js` from the project root would otherwise load the
// front-end's root .env (which only has VITE_STRIPE_PUBLISHABLE_KEY), leaving
// STRIPE_SECRET_KEY undefined and killing the server on boot.
const envFile = path.join(here, ".env");
dotenv.config({ path: envFile });

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey || !secretKey.startsWith("sk_test_")) {
  console.error(
    `Missing or invalid STRIPE_SECRET_KEY in ${envFile} (it must start with sk_test_).`,
  );
  console.error("Copy server/.env.example to server/.env and paste a test key from");
  console.error("https://dashboard.stripe.com/test/apikeys, then restart the server.");
  process.exit(1);
}

const store = createDonationStore({
  file: process.env.DONATIONS_FILE || path.join(here, "data", "donations.jsonl"),
});

const app = createApp({
  stripe: new Stripe(secretKey),
  store,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || undefined,
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
