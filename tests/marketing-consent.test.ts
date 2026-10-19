import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MARKETING_CONSENT_VERSION,
  MARKETING_CONSENT_COPY,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
} from "../src/lib/marketing-consent";

process.env.AUTH_SECRET = "test-secret-for-unsubscribe-tokens-only";

test("consent version and copy are pinned to the approved wording", () => {
  assert.equal(MARKETING_CONSENT_VERSION, "2026-10-19-v1");
  assert.match(MARKETING_CONSENT_COPY, /Glitter Hits, Glitter Universe, and PK Business Services/);
  assert.match(MARKETING_CONSENT_COPY, /all operated by Portia Allen/);
  // No vague future-brand consent: later brands are covered only after notice updates.
  assert.match(MARKETING_CONSENT_COPY, /Any brand added later/);
  assert.match(MARKETING_CONSENT_COPY, /Unsubscribe anytime/);
});

test("unsubscribe token verifies for the right email only", () => {
  const token = signUnsubscribeToken("Member@Example.com");
  assert.equal(verifyUnsubscribeToken("member@example.com", token), true);
  assert.equal(verifyUnsubscribeToken("someone-else@example.com", token), false);
  assert.equal(verifyUnsubscribeToken("member@example.com", "deadbeef"), false);
  assert.equal(verifyUnsubscribeToken("member@example.com", ""), false);
});
