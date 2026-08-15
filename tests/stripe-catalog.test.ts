import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCreditPackSlug, isPaidMembershipTier } from "../src/lib/stripe/catalog";

describe("stripe catalog helpers", () => {
  it("accepts known pack slugs", () => {
    assert.equal(isCreditPackSlug("starter-100"), true);
    assert.equal(isCreditPackSlug("nope"), false);
  });
  it("accepts paid membership tiers only", () => {
    assert.equal(isPaidMembershipTier("plus"), true);
    assert.equal(isPaidMembershipTier("free"), false);
  });
});
