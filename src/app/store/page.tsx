import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { StoreClient } from "@/components/store/StoreClient";
import { getStoreCatalog } from "@/lib/mail/service";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Store" };

export default async function StorePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [catalog, user] = await Promise.all([
    getStoreCatalog(),
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { membership: true, creditBalance: true },
    }),
  ]);

  return (
    <AppShell
      title="Store"
      subtitle="Membership upgrades, credit packs, and network mail pricing — Glitter Hits first."
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
      />
    </AppShell>
  );
}
