"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/anti-abuse/rate-limit";
import { verifyTurnstileToken } from "@/lib/anti-abuse/turnstile";
import { emailConfigured, sendTransactionalEmail } from "@/lib/email/send";
import { sha256Hex } from "@/lib/utils";
import { headers } from "next/headers";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  message: z.string().min(10).max(5000),
  company: z.string().max(0).optional(),
});

export async function submitContactAction(formData: FormData) {
  if (String(formData.get("company") || "")) {
    return { ok: true as const, message: "Thanks — we received your note." };
  }

  const email = String(formData.get("email") || "").toLowerCase();
  const rl = rateLimit({
    key: `contact:${email}`,
    limit: 5,
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
  });
  if (!parsed.success) {
    return { error: "Please check your details and try again." };
  }

  const ipHash = ip ? await sha256Hex(ip) : null;
  await prisma.contactMessage.create({
    data: {
      name: parsed.data.name.trim(),
      email: parsed.data.email.toLowerCase(),
      message: parsed.data.message.trim(),
      ipHash: ipHash ?? undefined,
    },
  });

  const supportTo =
    process.env.SUPPORT_EMAIL ||
    process.env.SEED_ADMIN_EMAIL ||
    "hello@glitterhits.gay";

  if (emailConfigured()) {
    try {
      await sendTransactionalEmail({
        to: supportTo,
        subject: `Contact: ${parsed.data.name}`,
        text: `From: ${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`,
        html: `<p><strong>From:</strong> ${parsed.data.name} &lt;${parsed.data.email}&gt;</p><pre style="white-space:pre-wrap;font-family:system-ui">${parsed.data.message}</pre>`,
      });
    } catch (e) {
      console.error("[contact-email]", e);
      // Message is stored; email failure should not block the user.
    }
  }

  return {
    ok: true as const,
    message: "Thanks — we received your note and will reply when we can.",
  };
}
