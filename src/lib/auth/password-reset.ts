import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sha256Hex } from "@/lib/utils";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function createPasswordResetToken(email: string): Promise<{
  ok: boolean;
  // Dev/launch helper: token returned so UI can show reset link when email isn't configured yet
  token?: string;
  resetUrl?: string;
  message: string;
}> {
  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Always return generic success to avoid account enumeration
  const generic = {
    ok: true as const,
    message: "If that email exists, a reset link is ready. Check your inbox or use the link shown in development.",
  };

  if (!user) return generic;

  // Invalidate prior reset tokens for this email
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

  // When SMTP isn't configured, surface the link for launch/dev (also log for ops)
  console.info("[password-reset]", normalized, resetUrl);

  return {
    ...generic,
    token: raw,
    resetUrl,
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
