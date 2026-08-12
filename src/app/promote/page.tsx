import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { PromoteClient } from "@/components/promote/PromoteClient";
import { prisma } from "@/lib/db";
import {
  PLACEMENT_OFFERS,
  expireDuePlacements,
  listUserPlacements,
  placementCostForMembership,
} from "@/lib/placements/service";

export const metadata: Metadata = { title: "Promote" };

export default async function PromotePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await expireDuePlacements();

  const [user, websites, placements, feature] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { membership: true, creditBalance: true },
    }),
    prisma.website.findMany({
      where: { userId: session.user.id, moderationStatus: "approved" },
      select: { id: true, title: true, url: true },
      orderBy: { title: "asc" },
    }),
    listUserPlacements(session.user.id),
    prisma.monetizationFeature.findUnique({ where: { key: "featured_placements" } }),
  ]);

  const offers = PLACEMENT_OFFERS.map((o) => ({
    ...o,
    creditCost: placementCostForMembership(o, user.membership),
    listPrice: o.creditCost,
  }));

  return (
    <AppShell
      title="Promote"
      subtitle="Spend Glitter Hits on featured placements, banners, and discovery spotlights — honestly labeled inventory."
    >
      <PromoteClient
        offers={offers}
        websites={websites}
        placements={placements}
        balance={user.creditBalance}
        membership={user.membership}
        enabled={feature?.enabled ?? true}
      />
    </AppShell>
  );
}
