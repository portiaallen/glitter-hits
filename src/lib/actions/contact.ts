"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/anti-abuse/rate-limit";
import { verifyTurnstileToken } from "@/lib/anti-abuse/turnstile";
import { emailConfigured, sendTransactionalEmail } from "@/lib/email/send";
import { moveCredits } from "@/lib/credits/ledger";
import { sha256Hex } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { FEEDBACK_REWARD_HITS } from "@/lib/feedback/categories";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  message: z.string().min(10).max(5000),
  category: z.enum([
    "bug",
    "suggestion",
    "feature",
    "theme",
    "website",
    "love",
    "other",
    "contact",
  ]),
  company: z.string().max(0).optional(),
});

export async function submitContactAction(formData: FormData) {
  if (String(formData.get("company") || "")) {
    return { ok: true as const, message: "Thanks — we received your note." };
  }

  const email = String(formData.get("email") || "").toLowerCase();
  const rl = rateLimit({
    key: `contact:${email}`,
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return { error: `Too many messages. Try again in ${rl.retryAfterSec}s.` };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;

  const captcha = await verifyTurnstileToken(
    String(formData.get("cf-turnstile-response") || ""),
    ip,
  );
  if (!captcha.ok) return { error: captcha.error };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    category: formData.get("category") || "contact",
  });
  if (!parsed.success) {
    return { error: "Please check your details and try again." };
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const ipHash = ip ? await sha256Hex(ip) : null;

  // Qualifying feedback: not generic contact, meaningful length
  const qualifying =
    parsed.data.category !== "contact" && parsed.data.message.trim().length >= 24;

  let rewarded = false;
  if (qualifying && userId) {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const alreadyRewarded = await prisma.contactMessage.findFirst({
      where: {
        userId,
        rewarded: true,
        createdAt: { gte: startOfDay },
      },
    });
    if (!alreadyRewarded) {
      rewarded = true;
    }
  }

  await prisma.contactMessage.create({
    data: {
      name: parsed.data.name.trim(),
      email: parsed.data.email.toLowerCase(),
      message: parsed.data.message.trim(),
      category: parsed.data.category,
      userId: userId ?? undefined,
      rewarded,
      ipHash: ipHash ?? undefined,
    },
  });

  if (rewarded && userId) {
    try {
      await moveCredits({
        userId,
        amount: FEEDBACK_REWARD_HITS,
        type: "earned_bonus",
        description: "Thanks for feedback — small Hits reward",
      });
    } catch (e) {
      console.error("[feedback-reward]", e);
      rewarded = false;
    }
  }

  const supportTo =
    process.env.SUPPORT_EMAIL ||
    process.env.SEED_ADMIN_EMAIL ||
    "hello@glitterhits.gay";

  if (emailConfigured()) {
    try {
      await sendTransactionalEmail({
        to: supportTo,
        subject: `[${parsed.data.category}] Feedback from ${parsed.data.name}`,
        text: `From: ${parsed.data.name} <${parsed.data.email}>\nCategory: ${parsed.data.category}\n\n${parsed.data.message}`,
        html: `<p><strong>From:</strong> ${parsed.data.name} &lt;${parsed.data.email}&gt;</p><p><strong>Category:</strong> ${parsed.data.category}</p><pre style="white-space:pre-wrap;font-family:system-ui">${parsed.data.message}</pre>`,
      });
    } catch (e) {
      console.error("[contact-email]", e);
    }
  }

  return {
    ok: true as const,
    message: rewarded
      ? `Thanks — we got it, and added ${FEEDBACK_REWARD_HITS} Hits for your feedback today.`
      : "Thanks — we received your note and will read it.",
    rewarded,
  };
}
