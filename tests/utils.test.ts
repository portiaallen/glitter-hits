import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertIntegerCredits, formatCredits, slugify, parseJsonArray } from "../src/lib/utils";
import { DEFAULT_ECONOMY } from "../src/lib/settings/economy";

describe("credit integer safety", () => {
  it("accepts integers", () => {
    assert.equal(assertIntegerCredits(10), 10);
    assert.equal(assertIntegerCredits(-3), -3);
  });

  it("rejects floats", () => {
    assert.throws(() => assertIntegerCredits(1.5), /integers/);
  });

  it("formats without decimals", () => {
    assert.equal(formatCredits(1000), "1,000");
  });
});

describe("economy defaults", () => {
  it("uses integer credit values", () => {
    const numericKeys = Object.entries(DEFAULT_ECONOMY).filter(
      ([, v]) => typeof v === "number",
    );
    for (const [key, value] of numericKeys) {
      assert.equal(Number.isInteger(value), true, `${key} must be integer`);
    }
  });
});

describe("utils", () => {
  it("slugifies names", () => {
    assert.equal(slugify("Glitter Casino!"), "glitter-casino");
  });

  it("parses geo JSON arrays", () => {
    assert.deepEqual(parseJsonArray('["WW","US"]'), ["WW", "US"]);
    assert.deepEqual(parseJsonArray("not-json"), []);
  });
});
