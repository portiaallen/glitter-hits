import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/admin-roles";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { formatCredits } from "@/lib/utils";
import { ProfileEditForm, ChangePasswordForm } from "@/components/profile/ProfileForms";
import { getFoundingNumber } from "@/lib/founding";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const level = await prisma.levelDefinition.findUnique({ where: { slug: user.levelSlug } });
  const foundingNumber = await getFoundingNumber(session.user.id);

  return (
    <AppShell title="Profile" subtitle="Your Glitter Traffic identity.">
      <div className="mb-6 grid gap-3 gh-glass max-w-xl p-6 text-sm">
        {foundingNumber !== null && (
          <p className="gh-theme-chip w-fit" style={{ background: "linear-gradient(120deg, var(--theme-accent), var(--theme-accent-2))", color: "#fff" }}>
            Founding Member #{foundingNumber}
          </p>
        )}
        <p><span className="text-[var(--text-muted)]">Email:</span> {user.email}</p>
        <p><span className="text-[var(--text-muted)]">Role:</span> {user.role}</p>
        {isStaffRole(user.role) && (
          <div>
            <Link href="/admin" prefetch={false} className="gh-btn gh-btn-ghost px-3 py-2 text-sm">
              Admin Console
            </Link>
            {!isStaffRole(session.user.role) && (
              <p className="mt-2 text-[var(--text-muted)]">
                Sign out and back in to refresh your staff access.
              </p>
            )}
          </div>
        )}
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
