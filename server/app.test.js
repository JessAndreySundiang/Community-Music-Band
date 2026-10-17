import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import Stripe from "stripe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DONATION_CURRENCY, createApp, createRateLimiter, parseAmountToCents } from "./app.js";
import { createDonationStore } from "./donations.js";

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
