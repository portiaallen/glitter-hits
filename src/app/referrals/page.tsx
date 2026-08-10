import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHero } from "@/components/layout/PageHero";
import { ReferralPanel } from "@/components/referrals/ReferralPanel";
import { getEconomySettings } from "@/lib/settings/economy";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Referrals" };

export default async function ReferralsPage() {
  const session = await auth();
  const economy = await getEconomySettings();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div>
      <PageHero
        title="Invite friends. Earn Glitter Hits."
        description="Configurable referral bonuses for signups and qualified activity — with anti-farming protections."
        eyebrow="Referrals"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            { label: "Signup bonus", value: `${economy.referralSignupBonus} Hits` },
            { label: "Qualified bonus", value: `${economy.referralQualifiedBonus} Hits` },
            {
              label: "Ongoing share",
              value: `${economy.referralPercentOfRefereeEarnings}% of referee earnings`,
            },
          ].map((item) => (
            <div key={item.label} className="gh-glass p-5">
              <p className="text-sm text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold">
                {item.value}
              </p>
            </div>
          ))}
        </div>
        {user ? (
          <ReferralPanel
            referralCode={user.referralCode}
            referralUrl={`${appUrl}/signup?ref=${user.referralCode}`}
            signupBonus={economy.referralSignupBonus}
            qualifiedBonus={economy.referralQualifiedBonus}
          />
        ) : (
          <div className="gh-glass p-6">
            <p className="text-[var(--text-muted)]">
              Create an account to get your personal referral link.
            </p>
            <Link href="/signup" className="gh-btn gh-btn-primary mt-4">
              Join free
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
