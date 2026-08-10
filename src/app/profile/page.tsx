import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { formatCredits } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const level = await prisma.levelDefinition.findUnique({ where: { slug: user.levelSlug } });

  return (
    <AppShell title="Profile" subtitle="Your Glitter Hits identity.">
      <div className="gh-glass max-w-xl space-y-3 p-6">
        <p><span className="text-[var(--text-muted)]">Name:</span> {user.name}</p>
        <p><span className="text-[var(--text-muted)]">Email:</span> {user.email}</p>
        <p><span className="text-[var(--text-muted)]">Role:</span> {user.role}</p>
        <p><span className="text-[var(--text-muted)]">Membership:</span> {user.membership}</p>
        <p><span className="text-[var(--text-muted)]">Level:</span> {level?.name || user.levelSlug}</p>
        <p><span className="text-[var(--text-muted)]">Balance:</span> {formatCredits(user.creditBalance)} Hits</p>
        <p><span className="text-[var(--text-muted)]">Referral code:</span> {user.referralCode}</p>
        <p><span className="text-[var(--text-muted)]">Streak:</span> {user.streakDays}d (best {user.longestStreak}d)</p>
      </div>
    </AppShell>
  );
}
