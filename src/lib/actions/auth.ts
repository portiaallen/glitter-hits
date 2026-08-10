"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { generateReferralCode } from "@/lib/utils";
import { getEconomySettings } from "@/lib/settings/economy";
import { moveCredits } from "@/lib/credits/ledger";
import { attachReferralOnSignup } from "@/lib/referrals/service";
import { AuthError } from "next-auth";

const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  referralCode: z.string().optional(),
});

export async function signupAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    referralCode: formData.get("referralCode") || undefined,
  });
  if (!parsed.success) {
    return { error: "Please check your details and try again." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const economy = await getEconomySettings();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  let referralCode = generateReferralCode(parsed.data.name);
  // Ensure unique
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
  try {
    await signIn("credentials", {
      email: String(formData.get("email") || "").toLowerCase(),
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
