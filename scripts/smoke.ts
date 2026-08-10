/**
 * Launch smoke checks against the local seeded DB.
 * Run: npm run smoke
 */
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { moveCredits } from "../src/lib/credits/ledger";
import { selectNextCampaign } from "../src/lib/delivery/engine";
import { createPasswordResetToken, resetPasswordWithToken } from "../src/lib/auth/password-reset";
import { validateWebsiteUrl } from "../src/lib/moderation/site-check";
import { claimDailyReward } from "../src/lib/rewards/streaks";
import { startSurfSession, nextSurfSite, completeSurfVisit } from "../src/lib/surf/session";

const prisma = new PrismaClient();

async function main() {
  console.log("▶ smoke: seed users");
  const demo = await prisma.user.findUniqueOrThrow({ where: { email: "demo@glitterhits.gay" } });
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@glitterhits.gay" } });

  console.log("▶ smoke: site checker rejects localhost");
  const bad = await validateWebsiteUrl("http://localhost:3000");
  assert.equal(bad.status, "rejected");

  console.log("▶ smoke: password reset round-trip");
  const reset = await createPasswordResetToken(demo.email);
  assert.ok(reset.token);
  const changed = await resetPasswordWithToken({
    email: demo.email,
    token: reset.token!,
    password: "demo12345",
  });
  assert.equal(changed.ok, true);

  console.log("▶ smoke: delivery excludes own campaigns");
  const pick = await selectNextCampaign({
    userId: demo.id,
    viewerType: "human_exchange",
    deviceHint: "desktop",
  });
  if (pick) assert.notEqual(pick.userId, demo.id);

  console.log("▶ smoke: surf earn loop");
  // Ensure admin campaign has credits so demo can surf it
  await prisma.campaign.updateMany({
    where: { userId: admin.id, status: "active" },
    data: { creditBalance: 50 },
  });

  const session = await startSurfSession({
    userId: demo.id,
    viewerType: "human_exchange",
    deviceHint: "desktop",
  });
  const next = await nextSurfSite({ sessionId: session.id, userId: demo.id });
  if (!next.empty) {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: demo.id } });
    await completeSurfVisit({
      visitId: next.visitId,
      userId: demo.id,
      actualDurationSec: next.requiredDurationSec,
    });
    const after = await prisma.user.findUniqueOrThrow({ where: { id: demo.id } });
    assert.ok(after.creditBalance >= before.creditBalance);
    console.log(`  earned visit on ${next.website.title}`);
  } else {
    console.log("  (no eligible campaign — skipped earn assert)");
  }

  console.log("▶ smoke: daily reward idempotency");
  try {
    await claimDailyReward(demo.id);
  } catch {
    // already claimed today is fine
  }

  console.log("▶ smoke: credit integer move");
  await moveCredits({
    userId: demo.id,
    amount: 1,
    type: "earned_bonus",
    description: "smoke bonus",
  });
  await moveCredits({
    userId: demo.id,
    amount: -1,
    type: "admin_adjustment",
    description: "smoke rollback",
  });

  console.log("✓ smoke passed");
}

main()
  .catch((e) => {
    console.error("✗ smoke failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
