import { describe, expect, it } from "vitest";
import { isLivePublishableKey, isUsablePublishableKey } from "./stripeKey";

describe("isUsablePublishableKey", () => {
  it.each(["pk_test_abc", "pk_live_abc"])("accepts %s", (key) => {
    expect(isUsablePublishableKey(key)).toBe(true);
  });

  it.each([undefined, "", "sk_test_abc", "pk_abc", "pk_prod_abc"])("rejects %o", (key) => {
    expect(isUsablePublishableKey(key)).toBe(false);
  });

  it("keeps live keys usable, so going live cannot switch the form off", () => {
    expect(isUsablePublishableKey("pk_live_abc")).toBe(true);
  });
});

describe("isLivePublishableKey", () => {
  it("is true only for a live key", () => {
    expect(isLivePublishableKey("pk_live_abc")).toBe(true);
    expect(isLivePublishableKey("pk_test_abc")).toBe(false);
    expect(isLivePublishableKey(undefined)).toBe(false);
  });
});
