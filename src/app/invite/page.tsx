import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { ReferralPanel } from "@/components/referrals/ReferralPanel";
import { getEconomySettings } from "@/lib/settings/economy";

export const metadata: Metadata = { title: "Invite friends" };

export default async function InvitePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const economy = await getEconomySettings();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const events = await prisma.referralEvent.findMany({
    where: { referrerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <AppShell title="Invite Friends" subtitle="Share your code. Self-referrals and farming are blocked.">
      <ReferralPanel
        referralCode={user.referralCode}
        referralUrl={`${appUrl}/signup?ref=${user.referralCode}`}
        signupBonus={economy.referralSignupBonus}
        qualifiedBonus={economy.referralQualifiedBonus}
      />
      <div className="gh-glass mt-6 p-5">
        <h2 className="font-semibold">Recent referral events</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {events.length === 0 && (
            <li className="text-[var(--text-muted)]">No referral activity yet.</li>
          )}
          {events.map((e) => (
            <li key={e.id} className="flex justify-between gap-3">
              <span>{e.status}</span>
              <span className="text-[var(--text-muted)]">+{e.creditsAwarded} Hits</span>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
