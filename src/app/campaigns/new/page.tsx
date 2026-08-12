import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { CampaignCreateForm } from "@/components/campaigns/CampaignCreateForm";
import { getMembershipEntitlements } from "@/lib/membership/entitlements";

export const metadata: Metadata = { title: "Create Campaign" };

export default async function NewCampaignPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [websites, entitlements] = await Promise.all([
    prisma.website.findMany({
      where: { userId: session.user.id },
      select: { id: true, title: true, url: true, moderationStatus: true },
      orderBy: { title: "asc" },
    }),
    getMembershipEntitlements(session.user.id),
  ]);

  return (
    <AppShell
      title="Create Campaign"
      subtitle={`Membership ${entitlements.membership} · priority tiers unlocked: ${entitlements.allowedPriorities.join(", ")}`}
    >
      <CampaignCreateForm
        websites={websites}
        allowedPriorities={entitlements.allowedPriorities}
      />
    </AppShell>
  );
}
