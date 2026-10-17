/**
 * Checks the donation-alert mail setup: `npm run check-mail` inside server/.
 *
 * It prints what is configured (never a secret), asks each transport to log in
 * without sending anything, and says plainly whether the band would get an alert.
 * Add `-- --send` to deliver a real test message through the first working
 * transport.
 *
 * This exists because the providers hide which half of a credential pair is
 * wrong: Brevo answers a wrong login and a wrong key with the same
 * "535 5.7.8 Authentication failed", so guessing wastes time.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createMailerFromEnv } from "./mailer.js";

const here = path.dirname(fileURLToPath(import.meta.url));

// server/.env next to this file, never the front-end's root .env.
dotenv.config({ path: path.join(here, ".env"), quiet: true });

const settings = [
  ["GMAIL_USER", process.env.GMAIL_USER, true],
  ["GMAIL_APP_PASSWORD", process.env.GMAIL_APP_PASSWORD, false],
  ["DONATION_NOTIFY_TO", process.env.DONATION_NOTIFY_TO, true],
  ["SMTP_FALLBACK_HOST", process.env.SMTP_FALLBACK_HOST, true],
  ["SMTP_FALLBACK_PORT", process.env.SMTP_FALLBACK_PORT, true],
  ["SMTP_FALLBACK_USER", process.env.SMTP_FALLBACK_USER, true],
  ["SMTP_FALLBACK_PASSWORD", process.env.SMTP_FALLBACK_PASSWORD, false],
  ["SMTP_FALLBACK_FROM", process.env.SMTP_FALLBACK_FROM, true],
];

console.log("Donation alert mail settings (from server/.env)\n");
for (const [name, value, showValue] of settings) {
  const trimmed = (value ?? "").trim();
  const shown = trimmed ? (showValue ? trimmed : `${trimmed.length} chars`) : "(not set)";
  console.log(`  ${name.padEnd(23)} ${shown}`);
}

const mailer = createMailerFromEnv();

if (!mailer) {
  console.log(
    "\nNo transport is configured, so alerts would be queued rather than delivered.\n" +
      "Fill in the Gmail block, or the Brevo block, in server/.env.",
  );
  process.exitCode = 1;
} else {
  console.log(`\nRecipient:       ${mailer.to}`);
  console.log(`Transport order: ${mailer.transports.join("  then  ")}`);
  console.log("\nChecking each login (no message is sent)...");

  const results = await mailer.verify();
  for (const result of results) {
    console.log(`  ${result.ok ? "OK  " : "FAIL"}  ${result.label}`);
    if (!result.ok) console.log(`        ${result.error}`);
  }

  const working = results.filter((result) => result.ok);

  if (!working.length) {
    console.log(
      "\nNo transport could log in, so alerts would be queued rather than delivered.\n" +
        "The usual causes, in order: the login is not the exact address shown on the\n" +
        "provider's own SMTP page, the account is not activated, or the key has been\n" +
        "regenerated since it was copied into server/.env.",
    );
    process.exitCode = 1;
  } else if (process.argv.includes("--send")) {
    console.log(`\nSending a real test alert through ${working[0].label}...`);
    try {
      await mailer.sendDonationAlert(
        {
          paymentIntentId: "pi_check_mail",
          amountUsd: 1,
          currency: "usd",
          status: "succeeded",
          donorName: "Mail check",
          recordedAt: new Date().toISOString(),
        },
        { testMode: true },
      );
      console.log(`Sent. Look for "[TEST] Donation received — $1.00 USD" in ${mailer.to}.`);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      process.exitCode = 1;
    }
  } else {
    console.log("\nRun `npm run check-mail -- --send` to deliver a real test alert.");
  }

  await mailer.close();
}
