"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { generateReferralCode } from "@/lib/utils";
import { getEconomySettings } from "@/lib/settings/economy";
import { moveCredits } from "@/lib/credits/ledger";
import { attachReferralOnSignup } from "@/lib/referrals/service";
import {
  createPasswordResetToken,
  resetPasswordWithToken,
} from "@/lib/auth/password-reset";
import { rateLimit } from "@/lib/anti-abuse/rate-limit";
import { verifyTurnstileToken } from "@/lib/anti-abuse/turnstile";
import { AuthError } from "next-auth";
import { headers } from "next/headers";

const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  referralCode: z.string().optional(),
  company: z.string().max(0).optional(),
  turnstileToken: z.string().optional(),
});

async function clientIp() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null
  );
}

export async function signupAction(formData: FormData) {
  const company = String(formData.get("company") || "");
  if (company) {
    return {};
  }

  const emailRaw = String(formData.get("email") || "").toLowerCase();
  const rl = rateLimit({
    key: `signup:${emailRaw}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return { error: `Too many signup attempts. Try again in ${rl.retryAfterSec}s.` };
  }

  const captcha = await verifyTurnstileToken(
    String(formData.get("cf-turnstile-response") || formData.get("turnstileToken") || ""),
    await clientIp(),
  );
  if (!captcha.ok) return { error: captcha.error };

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    referralCode: formData.get("referralCode") || undefined,
    company: company || undefined,
  });
  if (!parsed.success) {
    return { error: "Please check your details and try again." };
  }

  if (String(formData.get("acceptedTerms") || "") !== "true") {
    return { error: "You must accept the Terms and Privacy Policy." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const economy = await getEconomySettings();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  let referralCode = generateReferralCode(parsed.data.name);
  while (await prisma.user.findUnique({ where: { referralCode } })) {
    referralCode = generateReferralCode(parsed.data.name);
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      referralCode,
    },
  });

  if (economy.signupBonusCredits > 0) {
    await moveCredits({
      userId: user.id,
      amount: economy.signupBonusCredits,
      type: "earned_bonus",
      description: "Welcome bonus — Glitter Hits",
    });
  }

  await attachReferralOnSignup({
    newUserId: user.id,
    code: parsed.data.referralCode,
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Account created but sign-in failed. Please log in." };
    }
    throw err;
  }
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").toLowerCase();
  const rl = rateLimit({
    key: `login:${email}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.ok) {
    return { error: `Too many login attempts. Try again in ${rl.retryAfterSec}s.` };
  }

  try {
    await signIn("credentials", {
      email,
      password: String(formData.get("password") || ""),
      redirectTo: "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw err;
  }
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const rl = rateLimit({
    key: `reset:${email.toLowerCase()}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return { error: `Too many reset requests. Try again in ${rl.retryAfterSec}s.` };
  }

  const captcha = await verifyTurnstileToken(
    String(formData.get("cf-turnstile-response") || formData.get("turnstileToken") || ""),
    await clientIp(),
  );
  if (!captcha.ok) return { error: captcha.error };

  try {
    const result = await createPasswordResetToken(email);
    if (!result.ok) return { error: result.message };
    return {
      message: result.message,
      // Only expose in non-production when email isn't configured
      resetUrl:
        process.env.NODE_ENV !== "production" && result.resetUrl
          ? result.resetUrl
          : undefined,
    };
  } catch (e) {
    console.error("[password-reset]", e);
    return {
      error:
        "Could not send reset email. Please try again later or contact hello@glitterhits.online.",
    };
  }
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = z
    .object({
      email: z.string().email(),
      token: z.string().min(20),
      password: z.string().min(8).max(128),
    })
    .safeParse({
      email: formData.get("email"),
      token: formData.get("token"),
      password: formData.get("password"),
    });
  if (!parsed.success) return { error: "Invalid reset form." };

  const result = await resetPasswordWithToken(parsed.data);
  if (!result.ok) return { error: result.error };
  return { message: "Password updated. You can log in now." };
}
