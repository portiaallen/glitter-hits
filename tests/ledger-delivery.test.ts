/**
 * Integration-ish tests against the seeded SQLite DB.
 * Run after: npm run db:reset
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { moveCredits } from "../src/lib/credits/ledger";
import { selectNextCampaign } from "../src/lib/delivery/engine";

const prisma = new PrismaClient();

describe("credit ledger", () => {
  let userId: string;

  before(async () => {
    const user = await prisma.user.findUnique({ where: { email: "demo@glitterhits.gay" } });
    assert.ok(user, "seed demo user required — run npm run db:seed");
    userId = user!.id;
  });

  it("records auditable integer movements", async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const { entry, user } = await moveCredits({
      userId,
      amount: 3,
      type: "earned_bonus",
      description: "test bonus",
    });
    assert.equal(entry.amount, 3);
    assert.equal(user.creditBalance, before.creditBalance + 3);
    assert.equal(entry.balanceAfter, user.creditBalance);

    await moveCredits({
      userId,
      amount: -3,
      type: "admin_adjustment",
      description: "test rollback",
    });
  });

  it("blocks overdraft", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await assert.rejects(
      () =>
        moveCredits({
          userId,
          amount: -(user.creditBalance + 1),
          type: "spent_campaign",
          description: "should fail",
        }),
      /Insufficient/,
    );
  });
});

describe("delivery engine", () => {
  it("never returns the viewer their own campaign", async () => {
    const demo = await prisma.user.findUniqueOrThrow({
      where: { email: "demo@glitterhits.gay" },
    });
    const pick = await selectNextCampaign({
      userId: demo.id,
      viewerType: "human_exchange",
      deviceHint: "desktop",
      countryCode: "US",
    });
    if (pick) {
      assert.notEqual(pick.userId, demo.id);
      assert.equal(pick.website.moderationStatus, "approved");
      assert.ok(pick.creditBalance > 0);
    }
  });
});
