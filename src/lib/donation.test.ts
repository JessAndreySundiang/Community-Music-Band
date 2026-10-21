import { describe, expect, it } from "vitest";
import {
  DONATION_MAX_USD,
  DONATION_MIN_USD,
  createIdempotencyKey,
  describeApiError,
  formatReceiptDate,
  formatUsd,
  parseDonationAmount,
} from "./donation";

describe("parseDonationAmount", () => {
  it.each([
    ["1", 1],
    ["25", 25],
    [" 50 ", 50],
    ["1000", 1000],
    ["5.5", 5.5],
    ["19.99", 19.99],
  ])("accepts %o", (text, expected) => {
    expect(parseDonationAmount(text)).toBe(expected);
  });

  it.each(["", "   ", "abc", "0", "-5", "1000.01", "1001", "1e9", "NaN"])("rejects %o", (text) => {
    expect(parseDonationAmount(text)).toBeNull();
  });

  it("keeps the bounds the donation server also enforces", () => {
    expect([DONATION_MIN_USD, DONATION_MAX_USD]).toEqual([1, 1000]);
  });
});

describe("formatUsd", () => {
  it.each([
    [25, "$25.00"],
    [5.5, "$5.50"],
    [0, "$0.00"],
    [1000, "$1000.00"],
  ])("formats %o as %s", (value, expected) => {
    expect(formatUsd(value)).toBe(expected);
  });
});

describe("formatReceiptDate", () => {
  // Local time on purpose: the donor reads the clock on their own wall, and the
  // test only pins the shape so it stays correct in any time zone.
  it("reads like the date line on a receipt", () => {
    expect(formatReceiptDate(Date.UTC(2026, 9, 21, 14, 0))).toMatch(
      /^[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2} [AP]M$/,
    );
  });

  it("keeps the year the payment happened", () => {
    expect(formatReceiptDate(Date.UTC(2026, 9, 21, 14, 0))).toContain("2026");
  });
});

describe("createIdempotencyKey", () => {
  it("returns a fresh non-empty key each time", () => {
    const keys = new Set(Array.from({ length: 50 }, () => createIdempotencyKey()));

    expect(keys.size).toBe(50);
    for (const key of keys) expect(key.length).toBeGreaterThan(7);
  });
});

describe("describeApiError", () => {
  it("names a stalled server for what it is", () => {
    const timedOut = new DOMException("The operation timed out.", "TimeoutError");

    expect(describeApiError(timedOut, "localhost:4242")).toContain("did not respond in time");
  });

  it("blames the network only for an actual network failure", () => {
    expect(describeApiError(new TypeError("Failed to fetch"), "localhost:4242")).toContain(
      "Cannot reach the donation server at localhost:4242",
    );
  });

  it("passes the API's own message through", () => {
    const rejection = new Error("Donation must be between $1 and $1000.");

    expect(describeApiError(rejection, "localhost:4242")).toBe(
      "Donation must be between $1 and $1000.",
    );
  });

  it("falls back to something plain for anything that is not an error", () => {
    expect(describeApiError("nonsense", "localhost:4242")).toBe("Something went wrong.");
  });
});
