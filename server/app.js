import express from "express";
import cors from "cors";

/** Donations are collected in whole US dollars between these bounds. */
export const DONATION_MIN_USD = 1;
export const DONATION_MAX_USD = 1000;
export const DONATION_CURRENCY = "usd";
export const DONATION_DESCRIPTION = "Donation to Community Music Band Organization";

/**
 * Vite falls back to the next free port when 5173 is busy (5173 -> 5174 -> ...),
 * so any loopback origin is accepted. A port change can therefore never make the
 * browser block a donation request.
 */
const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Converts a donation amount from a request into whole cents.
 * Accepts numbers and numeric strings; returns null for anything out of range
 * or not a finite number, so callers can answer with a single 400.
 */
export function parseAmountToCents(value) {
  const dollars = typeof value === "string" ? Number(value.trim()) : value;
  if (typeof dollars !== "number" || !Number.isFinite(dollars)) return null;
  if (dollars < DONATION_MIN_USD || dollars > DONATION_MAX_USD) return null;
  return Math.round(dollars * 100);
}

/**
 * Dependency-free fixed-window rate limiter. Without it a single client can
 * create an unbounded number of PaymentIntents on the Stripe account.
 */
export function createRateLimiter({ limit = 30, windowMs = 60_000 } = {}) {
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now - entry.start >= windowMs) {
      hits.set(key, { start: now, count: 1 });
      return next();
    }

    entry.count += 1;
    if (entry.count > limit) {
      res.setHeader("Retry-After", String(Math.ceil((entry.start + windowMs - now) / 1000)));
      return res.status(429).json({
        error: "Too many donation attempts. Please wait a moment and try again.",
      });
    }

    return next();
  };
}

/** Verifies and stores a Stripe webhook event. */
async function handleWebhook(req, res, { stripe, store, logger, webhookSecret }) {
  if (!webhookSecret) {
    return res.status(503).json({ error: "Webhooks are not configured on this server." });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.get("stripe-signature"), webhookSecret);
  } catch (err) {
    logger.warn("Webhook signature check failed:", err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === "payment_intent.succeeded" && store) {
    const intent = event.data.object;
    const entry = {
      recordedAt: new Date().toISOString(),
      paymentIntentId: intent.id,
      amountUsd: intent.amount / 100,
      currency: intent.currency,
      status: intent.status,
      donorName: intent.metadata?.donor_name ?? "Anonymous",
      email: intent.receipt_email ?? null,
    };

    try {
      const written = await store.record(entry);
      logger.log(
        written
          ? `Recorded donation ${intent.id} ($${entry.amountUsd.toFixed(2)}).`
          : `Donation ${intent.id} was already recorded.`,
      );
    } catch (err) {
      // Returning 500 makes Stripe retry, so a full disk cannot silently lose a gift.
      logger.error("Could not record donation:", err.message);
      return res.status(500).json({ error: "Could not record the donation." });
    }
  }

  return res.json({ received: true });
}

/**
 * Builds the Express app. Environment is read here (not at module scope) so that
 * dotenv has already run by the time this is called.
 */
export function createApp({ stripe, store, logger = console, webhookSecret, rateLimit } = {}) {
  if (!stripe) throw new Error("createApp() needs a Stripe client.");

  const extraOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const app = express();
  app.disable("x-powered-by");

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header means curl, a same-origin request, or a health check.
        if (!origin || LOOPBACK_ORIGIN.test(origin) || extraOrigins.includes(origin)) {
          return callback(null, true);
        }
        const error = new Error(`Origin not allowed by CORS: ${origin}`);
        error.status = 403;
        return callback(error);
      },
    }),
  );

  // Stripe signs the raw bytes, so this route must be mounted before express.json().
  app.post("/stripe-webhook", express.raw({ type: "application/json" }), (req, res) =>
    handleWebhook(req, res, { stripe, store, logger, webhookSecret }),
  );

  app.use(express.json({ limit: "10kb" }));

  app.use((req, res, next) => {
    const started = Date.now();
    res.on("finish", () => {
      logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`);
    });
    next();
  });

  app.get("/", (_req, res) => {
    res.send("Donation server is running.");
  });

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      currency: DONATION_CURRENCY,
      minUsd: DONATION_MIN_USD,
      maxUsd: DONATION_MAX_USD,
      ledger: Boolean(store),
      webhooks: Boolean(webhookSecret),
    });
  });

  app.post("/create-payment-intent", createRateLimiter(rateLimit), async (req, res) => {
    const { amount, name, email } = req.body ?? {};
    const cents = parseAmountToCents(amount);

    if (cents === null) {
      return res.status(400).json({
        error: `Donation must be between $${DONATION_MIN_USD} and $${DONATION_MAX_USD}.`,
      });
    }

    if (email && !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address, or leave it blank." });
    }

    const idempotencyKey = req.get("idempotency-key");

    try {
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: cents,
          currency: DONATION_CURRENCY,
          automatic_payment_methods: { enabled: true, allow_redirects: "never" },
          description: DONATION_DESCRIPTION,
          receipt_email: email || undefined,
          metadata: { donor_name: name || "Anonymous" },
        },
        // A client that retries after a timeout sends the same key, and Stripe
        // returns the original PaymentIntent instead of charging twice.
        idempotencyKey ? { idempotencyKey } : undefined,
      );

      return res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      logger.error("Stripe error:", err.message);
      const message =
        err?.type === "StripeInvalidRequestError"
          ? "Stripe rejected those details. Please check them and try again."
          : "Could not start the payment. Please try again.";
      return res.status(502).json({ error: message });
    }
  });

  // Turns middleware failures (e.g. a blocked CORS origin) into JSON instead of
  // Express's default HTML error page, which the browser client cannot parse.
  app.use((err, _req, res, _next) => {
    const status = Number(err?.status) || 500;
    if (status === 403) {
      logger.warn(err.message);
      return res.status(403).json({ error: err.message });
    }
    logger.error("Unexpected error:", err);
    return res.status(status).json({ error: "Unexpected server error." });
  });

  return app;
}
