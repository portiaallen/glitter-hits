import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sha256Hex } from "@/lib/utils";
import {
  emailConfigured,
  passwordResetEmail,
  sendTransactionalEmail,
} from "@/lib/email/send";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function createPasswordResetToken(email: string): Promise<{
  ok: boolean;
  emailed: boolean;
  /** Dev-only helper — never returned to clients in production */
  resetUrl?: string;
  message: string;
}> {
  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  const generic = {
    ok: true as const,
    emailed: false,
    message:
      "If that email exists in Glitter Hits, we sent password reset instructions.",
  };

  if (!user) return generic;

  await prisma.verificationToken.deleteMany({
    where: { identifier: `reset:${normalized}` },
  });

  const raw = randomBytes(32).toString("hex");
  const token = await sha256Hex(raw);
  const expires = new Date(Date.now() + RESET_TTL_MS);

  await prisma.verificationToken.create({
    data: {
      identifier: `reset:${normalized}`,
      token,
      expires,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${raw}&email=${encodeURIComponent(normalized)}`;

  if (emailConfigured()) {
    const content = passwordResetEmail({ name: user.name, resetUrl });
    await sendTransactionalEmail({
      to: normalized,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
    return {
      ...generic,
      emailed: true,
      message: "If that email exists in Glitter Hits, we sent password reset instructions.",
    };
  }

  // Development only — never expose reset URLs in production responses
  if (process.env.NODE_ENV !== "production") {
    console.info("[password-reset:dev]", normalized, resetUrl);
    return {
      ...generic,
      resetUrl,
      message:
        "Email is not configured. Use the development reset link below.",
    };
  }

  console.error(
    "[password-reset] RESEND_API_KEY missing in production — cannot email reset link",
  );
  return {
    ok: false,
    emailed: false,
    message:
      "Password reset is temporarily unavailable. Contact support at hello@glitterhits.online.",
  };
}

export async function resetPasswordWithToken(params: {
  email: string;
  token: string;
  password: string;
}): Promise<{ ok: boolean; error?: string }> {
  const email = params.email.toLowerCase().trim();
  const hashed = await sha256Hex(params.token);

  const record = await prisma.verificationToken.findUnique({
    where: { token: hashed },
  });

  if (!record || record.identifier !== `reset:${email}`) {
    return { ok: false, error: "Invalid or expired reset link." };
  }
  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token: hashed } }).catch(() => undefined);
    return { ok: false, error: "Reset link has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(params.password, 12);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  await prisma.verificationToken.deleteMany({
    where: { identifier: `reset:${email}` },
  });

  return { ok: true };
}
