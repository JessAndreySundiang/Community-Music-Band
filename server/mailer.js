import nodemailer from "nodemailer";

/** Gmail's SMTP endpoint. See createGmailTransport for why this is not `service`. */
const GMAIL = { host: "smtp.gmail.com", port: 465, secure: true };

/** A stalled relay must never hold a webhook open. */
const TIMEOUTS = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000 };

/**
 * Builds the donation alert email. Kept pure so the wording can be asserted in
 * tests without opening an SMTP connection.
 */
export function buildDonationAlert(entry, { testMode = false, from, to } = {}) {
  const amount = `$${Number(entry.amountUsd).toFixed(2)} ${String(entry.currency).toUpperCase()}`;

  return {
    from,
    to,
    // Replying to the alert writes back to the donor, when they left an address.
    replyTo: entry.email || undefined,
    subject: `${testMode ? "[TEST] " : ""}Donation received — ${amount}`,
    text: [
      "A donation was confirmed by Stripe.",
      "",
      `Amount:  ${amount}`,
      `Donor:   ${entry.donorName ?? "Anonymous"}`,
      `Email:   ${entry.email ?? "not provided"}`,
      `Payment: ${entry.paymentIntentId}`,
      `Mode:    ${testMode ? "TEST — sandbox, no real money moved" : "LIVE"}`,
      "",
      `Recorded at ${entry.recordedAt ?? new Date().toISOString()}.`,
    ].join("\n"),
  };
}

/**
 * A transport can legitimately end up with no From address: a test's fallback
 * transport, or a relay-only setup that names no sender at all. Mail needs one,
 * so fall back to a description that cannot be mistaken for a real address
 * rather than throwing on `undefined`.
 */
function formatFrom(address) {
  const value = address?.trim() || "no-reply@localhost";
  return value.includes("<") ? value : `Community Music Band <${value}>`;
}

function createGmailTransport({ user, appPassword }) {
  // Spelled out rather than using `service: "gmail"`: nodemailer 10 dropped its
  // well-known services table, so that shorthand yields a transport with no host
  // at all and only fails at send time.
  return nodemailer.createTransport({
    ...GMAIL,
    auth: { user, pass: appPassword },
    ...TIMEOUTS,
  });
}

/**
 * A second, independent relay — Brevo and Mailjet both speak plain SMTP, so any
 * free provider works through the same settings. Only used when Gmail fails.
 */
function createRelayTransport({ host, port, secure, user, password }) {
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: password },
    ...TIMEOUTS,
  });
}

/**
 * Sends the band an email when a donation is confirmed, trying Gmail first and a
 * configured relay second, so one provider going down cannot silence the alerts.
 *
 * Returns null when no transport is configured, so the rest of the server runs
 * unchanged (the same way a missing webhook secret simply switches the ledger
 * off). Callers must treat a thrown error as "hand it to the retry queue", never
 * as a reason to answer Stripe with a non-2xx: the donation is already recorded,
 * so a non-2xx would only make Stripe replay an event the ledger then discards.
 *
 * `transport` and `fallbackTransport` replace the real nodemailer clients, which
 * is how the tests exercise the chain without opening an SMTP connection.
 */
export function createMailer({
  user,
  appPassword,
  notifyTo,
  fallback,
  transport,
  fallbackTransport,
  logger = console,
} = {}) {
  const chain = [];

  if (user && appPassword) {
    chain.push({
      label: "Gmail",
      from: user,
      client: transport ?? createGmailTransport({ user, appPassword }),
    });
  } else if (user || appPassword) {
    logger.warn("Only one of GMAIL_USER / GMAIL_APP_PASSWORD is set, so Gmail notices stay off.");
  }

  const relay = fallback?.host && fallback?.user && fallback?.password ? fallback : null;
  if (fallbackTransport || relay) {
    chain.push({
      label: relay ? `relay ${relay.host}` : "fallback relay",
      from: relay?.from || user || relay?.user,
      client: fallbackTransport ?? createRelayTransport(relay),
    });
  }

  if (!chain.length) return null;

  const to = notifyTo || user || relay?.user;
  if (!to) {
    logger.warn("No DONATION_NOTIFY_TO (or GMAIL_USER) set, so donation alerts have no recipient.");
    return null;
  }

  return {
    to,
    /** Transport labels in the order they are tried, for logs and /health. */
    transports: chain.map((link) => link.label),

    /** Emails the band about one confirmed donation. Throws when every link fails. */
    async sendDonationAlert(entry, { testMode = false } = {}) {
      const failures = [];

      for (const link of chain) {
        try {
          await link.client.sendMail(
            buildDonationAlert(entry, { testMode, from: formatFrom(link.from), to }),
          );
          if (failures.length) {
            logger.log(
              `Donation alert for ${entry.paymentIntentId} went out via ${link.label} after ${failures.length} earlier failure(s).`,
            );
          }
          return;
        } catch (err) {
          failures.push(`${link.label}: ${err.message}`);
          logger.warn(`Donation alert via ${link.label} failed: ${err.message}`);
        }
      }

      throw new Error(failures.join(" | "));
    },

    /**
     * Asks every transport to log in, without sending a message. Used by
     * `npm run check-mail` so a wrong login or a stale key is obvious at once.
     */
    async verify() {
      const results = [];

      for (const link of chain) {
        try {
          await link.client.verify?.();
          results.push({ label: link.label, ok: true });
        } catch (err) {
          results.push({ label: link.label, ok: false, error: err.response ?? err.message });
        }
      }

      return results;
    },

    /** Releases any open SMTP connections, so a one-shot script can exit. */
    async close() {
      for (const link of chain) await link.client.close?.();
    },
  };
}

/**
 * Builds the mailer from the environment, so the server and `npm run check-mail`
 * can never disagree about what is configured.
 */
export function createMailerFromEnv(env = process.env, logger = console) {
  return createMailer({
    user: env.GMAIL_USER,
    appPassword: env.GMAIL_APP_PASSWORD,
    notifyTo: env.DONATION_NOTIFY_TO,
    fallback: {
      host: env.SMTP_FALLBACK_HOST,
      port: Number(env.SMTP_FALLBACK_PORT) || 587,
      secure: env.SMTP_FALLBACK_SECURE === "true",
      user: env.SMTP_FALLBACK_USER,
      password: env.SMTP_FALLBACK_PASSWORD,
      from: env.SMTP_FALLBACK_FROM,
    },
    logger,
  });
}
