import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { StoreClient } from "@/components/store/StoreClient";
import { getStoreCatalog } from "@/lib/mail/service";
import { getEarnMembershipProgress } from "@/lib/membership/earn";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Store" };

export default async function StorePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [catalog, user, earnProgress] = await Promise.all([
    getStoreCatalog(),
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { membership: true, creditBalance: true },
    }),
    getEarnMembershipProgress(session.user.id),
  ]);

  return (
    <AppShell
      title="Store"
      subtitle="Earn Pro by exploring — or unlock memberships and packs with Hits."
    >
      <StoreClient
        packs={catalog.packs}
        memberships={catalog.memberships}
        membershipCreditCosts={catalog.membershipCreditCosts}
        cashCheckoutEnabled={catalog.cashCheckoutEnabled}
        membershipCheckoutEnabled={catalog.membershipCheckoutEnabled}
        currentMembership={user.membership}
        balance={user.creditBalance}
        mailEconomy={catalog.mailEconomy}
        earnProgress={earnProgress}
      />
    </AppShell>
  );
}
