"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const profileSchema = z.object({
  name: z.string().min(2).max(80),
  bio: z.string().max(500).optional(),
  countryCode: z
    .string()
    .max(2)
    .optional()
    .transform((v) => (v ? v.toUpperCase() : undefined)),
});

export async function updateProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio") || undefined,
    countryCode: formData.get("countryCode") || undefined,
  });
  if (!parsed.success) return { error: "Please check your profile details." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      bio: parsed.data.bio || null,
      countryCode: parsed.data.countryCode || null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { message: "Profile updated." };
}

export async function changePasswordAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const current = String(formData.get("currentPassword") || "");
  const next = String(formData.get("newPassword") || "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!user.passwordHash) return { error: "Password login is not configured for this account." };

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) return { error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(next, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { message: "Password changed." };
}
