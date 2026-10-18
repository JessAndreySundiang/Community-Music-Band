import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import Stripe from "stripe";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DONATION_CURRENCY,
  createApp,
  createRateLimiter,
  describeStripeKey,
  parseAmountToCents,
} from "./app.js";
import { createAlertQueue } from "./alert-queue.js";
import { createDonationStore } from "./donations.js";
import { buildDonationAlert, createMailer, createMailerFromEnv } from "./mailer.js";

const silentLogger = { log() {}, warn() {}, error() {} };

const openServers = [];
const tempDirs = [];

/** Boots the real Express app on a random port; returns its base URL. */
async function startApp(options = {}) {
  const app = createApp({ logger: silentLogger, ...options });
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  openServers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}

afterEach(async () => {
  await Promise.all(openServers.splice(0).map((s) => new Promise((r) => s.close(r))));
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function stripeStub(overrides = {}) {
  return {
    paymentIntents: {
      create: vi.fn(async () => ({ id: "pi_123", client_secret: "pi_123_secret" })),
    },
    webhooks: { constructEvent: vi.fn() },
    ...overrides,
  };
}

function createPaymentIntent(base, body, headers = {}) {
  return fetch(`${base}/create-payment-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function tempLedger() {
  const dir = await mkdtemp(path.join(tmpdir(), "cmb-ledger-"));
  tempDirs.push(dir);
  return path.join(dir, "donations.jsonl");
}

describe("parseAmountToCents", () => {
  it.each([
    [1, 100],
    [25, 2500],
    ["50", 5000],
    [1000, 100000],
    [5.5, 550],
    [19.99, 1999],
    [" 10 ", 1000],
  ])("converts %o to %i cents", (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected);
  });

  it.each([0, -5, 1000.01, 1001, 1e9, "abc", "", "  ", null, undefined, true, NaN, Infinity])(
    "rejects %o",
    (input) => {
      expect(parseAmountToCents(input)).toBeNull();
    },
  );
});

describe("describeStripeKey", () => {
  it("accepts both a test and a live key, so go-live cannot stop the server", () => {
    expect(describeStripeKey("sk_test_123")).toMatchObject({ ok: true, live: false });
    expect(describeStripeKey("sk_live_123")).toMatchObject({ ok: true, live: true });
  });

  it.each([undefined, "", "pk_test_123", "whsec_123", "sk_123", "sk_test"])("refuses %o", (key) => {
    const result = describeStripeKey(key);

    expect(result.ok).toBe(false);
    expect(result.message).toContain("STRIPE_SECRET_KEY");
  });
});

describe("createRateLimiter", () => {
  it("allows requests up to the limit, then answers 429 with Retry-After", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    const req = { ip: "127.0.0.1" };
    const headers = {};
    const res = {
      setHeader: (name, value) => {
        headers[name] = value;
      },
      status(code) {
        this.code = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };

    const next = vi.fn();
    limiter(req, res, next);
    limiter(req, res, next);
    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.code).toBe(429);
    expect(headers["Retry-After"]).toBeDefined();
  });

  it("forgets addresses whose window has passed, so the map cannot grow forever", async () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: 25 });
    const res = {
      setHeader() {},
      status(code) {
        this.code = code;
        return this;
      },
      json() {
        return this;
      },
    };
    const next = vi.fn();

    for (const ip of ["10.0.0.1", "10.0.0.2", "10.0.0.3"]) limiter({ ip }, res, next);
    expect(limiter.trackedAddresses()).toBe(3);

    await new Promise((resolve) => setTimeout(resolve, 40));
    limiter({ ip: "10.0.0.4" }, res, next);

    expect(limiter.trackedAddresses()).toBe(1);
  });
});

describe("donation API", () => {
  it("answers the health check", async () => {
    const base = await startApp({ stripe: stripeStub() });
    const res = await fetch(`${base}/health`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, currency: DONATION_CURRENCY });
  });

  it("creates a PaymentIntent for a valid amount", async () => {
    const stripe = stripeStub();
    const base = await startApp({ stripe });

    const res = await createPaymentIntent(base, { amount: 25, name: "Ada" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.clientSecret).toBe("pi_123_secret");
    expect(stripe.paymentIntents.create).toHaveBeenCalledOnce();
    expect(stripe.paymentIntents.create.mock.calls[0][0]).toMatchObject({
      amount: 2500,
      currency: "usd",
      metadata: { donor_name: "Ada" },
    });
  });

  it("defaults the donor name to Anonymous", async () => {
    const stripe = stripeStub();
    const base = await startApp({ stripe });

    await createPaymentIntent(base, { amount: 5 });

    expect(stripe.paymentIntents.create.mock.calls[0][0].metadata).toEqual({
      donor_name: "Anonymous",
    });
  });

  it.each([0, 1001, "abc", null])("rejects the out-of-range amount %o", async (amount) => {
    const stripe = stripeStub();
    const base = await startApp({ stripe });

    const res = await createPaymentIntent(base, { amount });

    expect(res.status).toBe(400);
    expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("rejects a malformed email", async () => {
    const base = await startApp({ stripe: stripeStub() });

    const res = await createPaymentIntent(base, { amount: 10, email: "not-an-email" });

    expect(res.status).toBe(400);
  });

  it("omits receipt_email when no email is given", async () => {
    const stripe = stripeStub();
    const base = await startApp({ stripe });

    await createPaymentIntent(base, { amount: 10 });

    expect(stripe.paymentIntents.create.mock.calls[0][0].receipt_email).toBeUndefined();
  });

  it("forwards an Idempotency-Key so a retry cannot double charge", async () => {
    const stripe = stripeStub();
    const base = await startApp({ stripe });

    await createPaymentIntent(base, { amount: 10 }, { "Idempotency-Key": "key-abc" });

    expect(stripe.paymentIntents.create.mock.calls[0][1]).toEqual({ idempotencyKey: "key-abc" });
  });

  it("answers 502 when Stripe is unreachable", async () => {
    const stripe = stripeStub({
      paymentIntents: {
        create: vi.fn(async () => {
          throw new Error("network down");
        }),
      },
    });
    const base = await startApp({ stripe });

    const res = await createPaymentIntent(base, { amount: 10 });

    expect(res.status).toBe(502);
  });

  it("rate limits a burst of requests", async () => {
    const base = await startApp({ stripe: stripeStub(), rateLimit: { limit: 2 } });

    const statuses = [];
    for (let i = 0; i < 3; i += 1) {
      const res = await createPaymentIntent(base, { amount: 10 });
      statuses.push(res.status);
    }

    expect(statuses).toEqual([200, 200, 429]);
  });
});

describe("CORS", () => {
  it.each(["http://localhost:5174", "http://127.0.0.1:9999"])("allows %s", async (origin) => {
    const base = await startApp({ stripe: stripeStub() });
    const res = await fetch(`${base}/health`, { headers: { Origin: origin } });

    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(origin);
  });

  it("blocks an unknown origin with JSON, not an HTML error page", async () => {
    const base = await startApp({ stripe: stripeStub() });
    const res = await fetch(`${base}/health`, { headers: { Origin: "https://evil.example" } });

    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining("CORS") });
  });
});

describe("stripe webhook", () => {
  function signedEvent(stripe, event) {
    stripe.webhooks.constructEvent.mockReturnValue(event);
  }

  function postSignedWebhook(base, body = "{}") {
    return fetch(`${base}/stripe-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "stripe-signature": "sig" },
      body,
    });
  }

  it("answers 503 when no webhook secret is configured", async () => {
    const base = await startApp({ stripe: stripeStub() });
    const res = await fetch(`${base}/stripe-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    expect(res.status).toBe(503);
  });

  it("rejects a bad signature", async () => {
    const stripe = stripeStub();
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });
    const base = await startApp({ stripe, webhookSecret: "whsec_test" });

    const res = await fetch(`${base}/stripe-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "stripe-signature": "bad" },
      body: "{}",
    });

    expect(res.status).toBe(400);
  });

  it("records a succeeded payment once, even if Stripe retries", async () => {
    const file = await tempLedger();
    const store = createDonationStore({ file });
    const stripe = stripeStub();
    signedEvent(stripe, {
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_paid",
          amount: 2500,
          currency: "usd",
          status: "succeeded",
          metadata: { donor_name: "Grace" },
          receipt_email: "grace@example.com",
        },
      },
    });
    const base = await startApp({ stripe, store, webhookSecret: "whsec_test" });

    const send = () =>
      fetch(`${base}/stripe-webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "stripe-signature": "sig" },
        body: JSON.stringify({ id: "evt_1" }),
      });

    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(200);

    const lines = (await readFile(file, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({
      paymentIntentId: "pi_paid",
      amountUsd: 25,
      donorName: "Grace",
      email: "grace@example.com",
    });
  });

  it("ignores unrelated event types", async () => {
    const store = { record: vi.fn() };
    const stripe = stripeStub();
    signedEvent(stripe, { type: "charge.refunded", data: { object: {} } });
    const base = await startApp({ stripe, store, webhookSecret: "whsec_test" });

    const res = await fetch(`${base}/stripe-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "stripe-signature": "sig" },
      body: "{}",
    });

    expect(res.status).toBe(200);
    expect(store.record).not.toHaveBeenCalled();
  });

  it("answers 500 when the ledger cannot be written, so Stripe retries", async () => {
    const store = {
      record: vi.fn(async () => {
        throw new Error("disk full");
      }),
    };
    const stripe = stripeStub();
    signedEvent(stripe, {
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_x", amount: 500, currency: "usd", status: "succeeded" } },
    });
    const base = await startApp({ stripe, store, webhookSecret: "whsec_test" });

    const res = await fetch(`${base}/stripe-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "stripe-signature": "sig" },
      body: "{}",
    });

    expect(res.status).toBe(500);
  });

  it.each([
    [false, true],
    [true, false],
  ])("flags a livemode=%s event as testMode=%s", async (livemode, testMode) => {
    const store = createDonationStore({ file: await tempLedger() });
    const alerts = { notify: vi.fn(async () => true) };
    const stripe = stripeStub();
    signedEvent(stripe, {
      type: "payment_intent.succeeded",
      livemode,
      data: { object: { id: "pi_mode", amount: 100, currency: "usd", status: "succeeded" } },
    });
    const base = await startApp({ stripe, store, webhookSecret: "whsec_test", alerts });

    await postSignedWebhook(base);

    expect(alerts.notify).toHaveBeenCalledWith(expect.anything(), { testMode });
  });

  it("alerts once per gift, even when Stripe retries the event", async () => {
    const file = await tempLedger();
    const store = createDonationStore({ file });
    const alerts = { notify: vi.fn(async () => true) };
    const stripe = stripeStub();
    signedEvent(stripe, {
      type: "payment_intent.succeeded",
      livemode: false,
      data: {
        object: {
          id: "pi_mailed",
          amount: 2500,
          currency: "usd",
          status: "succeeded",
          metadata: { donor_name: "Grace" },
          receipt_email: "grace@example.com",
        },
      },
    });
    const base = await startApp({ stripe, store, webhookSecret: "whsec_test", alerts });

    expect((await postSignedWebhook(base)).status).toBe(200);
    // The same event arriving twice is the normal case: Stripe retries.
    expect((await postSignedWebhook(base)).status).toBe(200);

    expect(alerts.notify).toHaveBeenCalledOnce();
    expect(alerts.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentIntentId: "pi_mailed",
        amountUsd: 25,
        donorName: "Grace",
        email: "grace@example.com",
      }),
      { testMode: true },
    );
  });

  it("answers 200 when the alert cannot be handed over, so Stripe does not replay the gift", async () => {
    const file = await tempLedger();
    const store = createDonationStore({ file });
    const alerts = {
      notify: vi.fn(async () => {
        throw new Error("queue exploded");
      }),
    };
    const stripe = stripeStub();
    signedEvent(stripe, {
      type: "payment_intent.succeeded",
      livemode: true,
      data: { object: { id: "pi_nomail", amount: 500, currency: "usd", status: "succeeded" } },
    });
    const base = await startApp({ stripe, store, webhookSecret: "whsec_test", alerts });

    expect((await postSignedWebhook(base)).status).toBe(200);
    // An alert problem must never cost us the record of the gift itself.
    expect((await readFile(file, "utf8")).trim().split("\n")).toHaveLength(1);
  });

  it("says so when the alert had to be queued for a retry", async () => {
    const logs = [];
    const logger = { log: (line) => logs.push(line), warn() {}, error() {} };
    const store = createDonationStore({ file: await tempLedger() });
    const alerts = { notify: vi.fn(async () => false) };
    const stripe = stripeStub();
    signedEvent(stripe, {
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_queued", amount: 500, currency: "usd", status: "succeeded" } },
    });
    const base = await startApp({ stripe, store, webhookSecret: "whsec_test", alerts, logger });

    expect((await postSignedWebhook(base)).status).toBe(200);
    expect(logs.join("\n")).toContain("Queued the donation alert for pi_queued");
  });

  it("does not alert when there is no ledger to deduplicate against", async () => {
    const alerts = { notify: vi.fn() };
    const stripe = stripeStub();
    signedEvent(stripe, {
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_nostore", amount: 500, currency: "usd", status: "succeeded" } },
    });
    // No `store`, so nothing can prove the gift is new and a retry would repeat the alert.
    const base = await startApp({ stripe, webhookSecret: "whsec_test", alerts });

    expect((await postSignedWebhook(base)).status).toBe(200);
    expect(alerts.notify).not.toHaveBeenCalled();
  });
});

describe("donation ledger", () => {
  it("appends one JSON line per donation", async () => {
    const file = await tempLedger();
    const store = createDonationStore({ file });

    await store.record({ paymentIntentId: "pi_1", amountUsd: 5 });
    await store.record({ paymentIntentId: "pi_2", amountUsd: 10 });

    const lines = (await readFile(file, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[1])).toEqual({ paymentIntentId: "pi_2", amountUsd: 10 });
  });

  it("does not write the same PaymentIntent twice", async () => {
    const file = await tempLedger();
    const store = createDonationStore({ file });

    expect(await store.record({ paymentIntentId: "pi_dup", amountUsd: 5 })).toBe(true);
    expect(await store.record({ paymentIntentId: "pi_dup", amountUsd: 5 })).toBe(false);

    expect((await readFile(file, "utf8")).trim().split("\n")).toHaveLength(1);
  });

  it("sees ids written by an earlier process", async () => {
    const file = await tempLedger();
    const first = createDonationStore({ file });
    await first.record({ paymentIntentId: "pi_old", amountUsd: 5 });

    const second = createDonationStore({ file });

    expect(await second.record({ paymentIntentId: "pi_old", amountUsd: 5 })).toBe(false);
  });
});

// The blocks above stub the signature check. This one uses the Stripe SDK to
// sign a payload the same way Stripe does, so the real verification path runs.
describe("webhook signature verification (real Stripe SDK)", () => {
  const secret = "whsec_test_secret";
  const stripe = new Stripe("sk_test_not_a_real_key");

  function signedPayload(payload) {
    const body = JSON.stringify(payload);
    const header = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
    return { body, header };
  }

  async function sendWebhook(base, body, header) {
    return fetch(`${base}/stripe-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "stripe-signature": header },
      body,
    });
  }

  it("accepts a correctly signed event and ledgers it exactly once", async () => {
    const file = await tempLedger();
    const store = createDonationStore({ file });
    const base = await startApp({ stripe, store, webhookSecret: secret });

    const { body, header } = signedPayload({
      id: "evt_signed",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_signed",
          amount: 4200,
          currency: "usd",
          status: "succeeded",
          metadata: { donor_name: "Signed Donor" },
          receipt_email: "signed@example.com",
        },
      },
    });

    expect((await sendWebhook(base, body, header)).status).toBe(200);
    // Stripe retries until it gets a 200, so the same event can arrive twice.
    expect((await sendWebhook(base, body, header)).status).toBe(200);

    const lines = (await readFile(file, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({
      paymentIntentId: "pi_signed",
      amountUsd: 42,
      donorName: "Signed Donor",
      email: "signed@example.com",
    });
  });

  it("rejects a payload signed with a different secret", async () => {
    const store = { record: vi.fn() };
    const base = await startApp({ stripe, store, webhookSecret: secret });

    const body = JSON.stringify({ id: "evt_bad", type: "payment_intent.succeeded", data: {} });
    const header = stripe.webhooks.generateTestHeaderString({
      payload: body,
      secret: "whsec_wrong",
    });

    expect((await sendWebhook(base, body, header)).status).toBe(400);
    expect(store.record).not.toHaveBeenCalled();
  });

  it("rejects a tampered payload", async () => {
    const store = { record: vi.fn() };
    const base = await startApp({ stripe, store, webhookSecret: secret });

    const { header } = signedPayload({ id: "evt_ok", type: "payment_intent.succeeded", data: {} });
    const tampered = JSON.stringify({
      id: "evt_ok",
      type: "payment_intent.succeeded",
      amount: 999,
    });

    expect((await sendWebhook(base, tampered, header)).status).toBe(400);
  });
});

// These never touch the network: buildDonationAlert builds the message as data,
// and createMailer only configures a transport (nodemailer connects on send).
describe("donation alert email", () => {
  const entry = {
    recordedAt: "2026-01-01T00:00:00.000Z",
    paymentIntentId: "pi_alert",
    amountUsd: 25,
    currency: "usd",
    status: "succeeded",
    donorName: "Grace",
    email: "grace@example.com",
  };

  it("addresses the alert to the band and can be replied to the donor", () => {
    const mail = buildDonationAlert(entry, { from: "Band <band@gmail.com>", to: "band@gmail.com" });

    expect(mail).toMatchObject({
      from: "Band <band@gmail.com>",
      to: "band@gmail.com",
      replyTo: "grace@example.com",
      subject: "Donation received — $25.00 USD",
    });
    expect(mail.text).toContain("Payment: pi_alert");
    expect(mail.text).toContain("Mode:    LIVE");
  });

  it("labels a sandbox gift in both the subject and the body", () => {
    const mail = buildDonationAlert(entry, { testMode: true, to: "band@gmail.com" });

    expect(mail.subject).toBe("[TEST] Donation received — $25.00 USD");
    expect(mail.text).toContain("Mode:    TEST — sandbox, no real money moved");
  });

  it("copes with a donor who left no email address", () => {
    const mail = buildDonationAlert({ ...entry, email: null }, { to: "band@gmail.com" });

    expect(mail.replyTo).toBeUndefined();
    expect(mail.text).toContain("Email:   not provided");
  });
});

describe("createMailer", () => {
  const credentials = { user: "band@gmail.com", appPassword: "sixteencharslong" };

  it("stays switched off while the Gmail credentials are missing", () => {
    expect(createMailer()).toBeNull();
    expect(createMailer({})).toBeNull();
  });

  it("warns when only half of the credentials are present", () => {
    const logger = { warn: vi.fn() };

    expect(createMailer({ user: credentials.user, logger })).toBeNull();
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it("defaults the recipient to the sending account", () => {
    expect(createMailer(credentials).to).toBe("band@gmail.com");
  });

  it("sends to an explicit recipient when one is configured", () => {
    const mailer = createMailer({ ...credentials, notifyTo: "treasurer@gmail.com" });

    expect(mailer.to).toBe("treasurer@gmail.com");
  });

  it("hands the composed alert to the transport, sent from the Gmail account", async () => {
    const transport = { sendMail: vi.fn(async () => ({})) };
    const mailer = createMailer({ ...credentials, transport });

    await mailer.sendDonationAlert(
      {
        recordedAt: "2026-01-01T00:00:00.000Z",
        paymentIntentId: "pi_transport",
        amountUsd: 25,
        currency: "usd",
        donorName: "Grace",
        email: "grace@example.com",
      },
      { testMode: false },
    );

    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Community Music Band <band@gmail.com>",
        to: "band@gmail.com",
        subject: "Donation received — $25.00 USD",
      }),
    );
  });

  // Minimal alert used by the failover tests below.
  const alert = { paymentIntentId: "pi_chain", amountUsd: 25, currency: "usd", donorName: "Grace" };
  const relayConfig = {
    host: "smtp-relay.brevo.com",
    user: "brevo@example.com",
    password: "smtp-key",
  };

  it("stays on Gmail when Gmail works, without touching the relay", async () => {
    const transport = { sendMail: vi.fn(async () => ({})) };
    const fallbackTransport = { sendMail: vi.fn(async () => ({})) };
    const mailer = createMailer({
      ...credentials,
      transport,
      fallback: relayConfig,
      fallbackTransport,
      logger: silentLogger,
    });

    await mailer.sendDonationAlert(alert);

    expect(transport.sendMail).toHaveBeenCalledOnce();
    expect(fallbackTransport.sendMail).not.toHaveBeenCalled();
  });

  it("falls back to the relay when Gmail refuses the message", async () => {
    const transport = { sendMail: vi.fn(async () => Promise.reject(new Error("gmail down"))) };
    const fallbackTransport = { sendMail: vi.fn(async () => ({})) };
    const mailer = createMailer({
      ...credentials,
      transport,
      fallback: relayConfig,
      fallbackTransport,
      logger: silentLogger,
    });

    await expect(mailer.sendDonationAlert(alert)).resolves.toBeUndefined();

    expect(transport.sendMail).toHaveBeenCalledOnce();
    expect(fallbackTransport.sendMail).toHaveBeenCalledOnce();
    expect(fallbackTransport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Community Music Band <band@gmail.com>",
        to: "band@gmail.com",
      }),
    );
  });

  it("still sends when no transport names a From address", async () => {
    const fallbackTransport = { sendMail: vi.fn(async () => ({})) };
    const mailer = createMailer({
      fallbackTransport,
      notifyTo: "band@gmail.com",
      logger: silentLogger,
    });

    await mailer.sendDonationAlert(alert);

    expect(fallbackTransport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: expect.stringContaining("<"), to: "band@gmail.com" }),
    );
  });

  it("reports both failures when the relay fails too", async () => {
    const transport = { sendMail: vi.fn(async () => Promise.reject(new Error("gmail down"))) };
    const fallbackTransport = {
      sendMail: vi.fn(async () => Promise.reject(new Error("relay down"))),
    };
    const mailer = createMailer({
      ...credentials,
      transport,
      fallback: relayConfig,
      fallbackTransport,
      logger: silentLogger,
    });

    await expect(mailer.sendDonationAlert(alert)).rejects.toThrow(
      /Gmail: gmail down.*relay smtp-relay\.brevo\.com: relay down/,
    );
  });

  it("lists the transports in the order it will try them", () => {
    const mailer = createMailer({
      ...credentials,
      fallback: relayConfig,
      fallbackTransport: { sendMail: vi.fn() },
    });

    expect(mailer.transports).toEqual(["Gmail", "relay smtp-relay.brevo.com"]);
  });

  it("can run on the relay alone, with no Gmail account at all", () => {
    const mailer = createMailer({
      notifyTo: "band@gmail.com",
      fallback: relayConfig,
      fallbackTransport: { sendMail: vi.fn() },
    });

    expect(mailer).not.toBeNull();
    expect(mailer.to).toBe("band@gmail.com");
    expect(mailer.transports).toEqual(["relay smtp-relay.brevo.com"]);
  });

  it("reports each login separately for check-mail, and closes every transport", async () => {
    const transport = { sendMail: vi.fn(), verify: vi.fn(async () => true), close: vi.fn() };
    const fallbackTransport = {
      sendMail: vi.fn(),
      verify: vi.fn(async () => Promise.reject(new Error("535 Authentication failed"))),
      close: vi.fn(),
    };
    const mailer = createMailer({
      ...credentials,
      transport,
      fallback: relayConfig,
      fallbackTransport,
      logger: silentLogger,
    });

    expect(await mailer.verify()).toEqual([
      { label: "Gmail", ok: true },
      { label: "relay smtp-relay.brevo.com", ok: false, error: "535 Authentication failed" },
    ]);

    await mailer.close();
    expect(transport.close).toHaveBeenCalledOnce();
    expect(fallbackTransport.close).toHaveBeenCalledOnce();
  });
});

describe("createMailerFromEnv", () => {
  const env = {
    GMAIL_USER: "band@gmail.com",
    GMAIL_APP_PASSWORD: "sixteencharslong",
    DONATION_NOTIFY_TO: "treasurer@gmail.com",
    SMTP_FALLBACK_HOST: "smtp-relay.brevo.com",
    SMTP_FALLBACK_PORT: "587",
    SMTP_FALLBACK_USER: "band@gmail.com",
    SMTP_FALLBACK_PASSWORD: "xsmtpsib-key",
    SMTP_FALLBACK_FROM: "band@gmail.com",
  };

  it("wires Gmail first and the relay second", () => {
    const mailer = createMailerFromEnv(env, silentLogger);

    expect(mailer.transports).toEqual(["Gmail", "relay smtp-relay.brevo.com"]);
    expect(mailer.to).toBe("treasurer@gmail.com");
  });

  it("supports the relay on its own, which is the Brevo-only setup", () => {
    const mailer = createMailerFromEnv(
      { ...env, GMAIL_USER: "", GMAIL_APP_PASSWORD: "" },
      silentLogger,
    );

    expect(mailer.transports).toEqual(["relay smtp-relay.brevo.com"]);
  });

  it("treats an empty environment as no mail at all", () => {
    expect(createMailerFromEnv({}, silentLogger)).toBeNull();
  });
});

describe("alert retry queue", () => {
  const alert = {
    paymentIntentId: "pi_waiting",
    amountUsd: 10,
    currency: "usd",
    donorName: "Grace",
  };

  async function tempQueueFile() {
    const dir = await mkdtemp(path.join(tmpdir(), "cmb-alerts-"));
    tempDirs.push(dir);
    return path.join(dir, "pending-alerts.jsonl");
  }

  it("delivers straight away and leaves no file behind when the mailer works", async () => {
    const file = await tempQueueFile();
    const deliver = vi.fn(async () => {});
    const queue = createAlertQueue({ file, deliver, logger: silentLogger });

    expect(await queue.notify(alert, { testMode: true })).toBe(true);
    expect(deliver).toHaveBeenCalledWith(alert, { testMode: true });
    expect(queue.pending).toBe(0);
    await expect(readFile(file, "utf8")).rejects.toThrow();
  });

  it("keeps the alert on disk when delivery fails", async () => {
    const file = await tempQueueFile();
    const deliver = vi.fn(async () => {
      throw new Error("smtp down");
    });
    const queue = createAlertQueue({ file, deliver, logger: silentLogger });

    expect(await queue.notify(alert, { testMode: false })).toBe(false);
    expect(queue.pending).toBe(1);

    const [saved] = (await readFile(file, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(saved).toMatchObject({
      attempts: 0,
      lastError: "smtp down",
      entry: alert,
      options: { testMode: false },
    });
    expect(saved.queuedAt).toBeTruthy();
  });

  it("drains the queue by itself once the mailer recovers", async () => {
    const file = await tempQueueFile();
    let working = false;
    const deliver = vi.fn(async () => {
      if (!working) throw new Error("smtp down");
    });
    const queue = createAlertQueue({ file, deliver, logger: silentLogger });

    await queue.notify(alert, {});
    expect(queue.pending).toBe(1);

    working = true;

    expect(await queue.retryPending()).toBe(0);
    expect(queue.pending).toBe(0);
    await expect(readFile(file, "utf8")).rejects.toThrow();
  });

  it("counts the attempts and remembers why it is still failing", async () => {
    const file = await tempQueueFile();
    const deliver = vi.fn(async () => {
      throw new Error("still down");
    });
    const queue = createAlertQueue({ file, deliver, logger: silentLogger });

    await queue.notify(alert, {});
    expect(await queue.retryPending()).toBe(1);
    expect(await queue.retryPending()).toBe(1);

    const [saved] = (await readFile(file, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(saved).toMatchObject({ attempts: 2, lastError: "still down" });
  });

  it("picks up alerts left behind by an earlier process", async () => {
    const file = await tempQueueFile();
    const first = createAlertQueue({
      file,
      deliver: async () => {
        throw new Error("down");
      },
      logger: silentLogger,
    });
    await first.notify(alert, {});

    const deliver = vi.fn(async () => {});
    const restarted = createAlertQueue({ file, deliver, logger: silentLogger });
    await restarted.load();
    expect(restarted.pending).toBe(1);

    expect(await restarted.retryPending()).toBe(0);
    expect(deliver).toHaveBeenCalledOnce();
  });

  it("retries on its own after start(), then stops cleanly", async () => {
    const file = await tempQueueFile();
    let working = false;
    const deliver = vi.fn(async () => {
      if (!working) throw new Error("down");
    });
    const queue = createAlertQueue({
      file,
      deliver,
      logger: silentLogger,
      retryDelaysMs: [5],
    });

    await queue.notify(alert, {});
    expect(queue.pending).toBe(1);

    working = true;
    await queue.start();
    await new Promise((resolve) => setTimeout(resolve, 60));
    queue.stop();

    expect(queue.pending).toBe(0);
  });

  it("refuses to be built without a file or a deliver function", () => {
    expect(() => createAlertQueue({})).toThrow();
    expect(() => createAlertQueue({ file: "pending.jsonl" })).toThrow();
  });
});
