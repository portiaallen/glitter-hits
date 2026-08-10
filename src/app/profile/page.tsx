import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { formatCredits } from "@/lib/utils";
import { ProfileEditForm, ChangePasswordForm } from "@/components/profile/ProfileForms";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const level = await prisma.levelDefinition.findUnique({ where: { slug: user.levelSlug } });

  return (
    <AppShell title="Profile" subtitle="Your Glitter Hits identity.">
      <div className="mb-6 grid gap-3 gh-glass max-w-xl p-6 text-sm">
        <p><span className="text-[var(--text-muted)]">Email:</span> {user.email}</p>
        <p><span className="text-[var(--text-muted)]">Role:</span> {user.role}</p>
        <p><span className="text-[var(--text-muted)]">Level:</span> {level?.name || user.levelSlug}</p>
        <p><span className="text-[var(--text-muted)]">Balance:</span> {formatCredits(user.creditBalance)} Hits</p>
        <p><span className="text-[var(--text-muted)]">Referral code:</span> {user.referralCode}</p>
        <p><span className="text-[var(--text-muted)]">Streak:</span> {user.streakDays}d (best {user.longestStreak}d)</p>
      </div>
      <div className="grid max-w-3xl gap-4 lg:grid-cols-2">
        <ProfileEditForm
          name={user.name || ""}
          bio={user.bio || ""}
          countryCode={user.countryCode || ""}
        />
        <ChangePasswordForm />
      </div>
    </AppShell>
  );
}
