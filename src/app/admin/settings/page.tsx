import { getEconomySettings } from "@/lib/settings/economy";
import { prisma } from "@/lib/db";
import { EconomyForm } from "@/components/admin/EconomyForm";
import { MonetizationToggles } from "@/components/admin/MonetizationToggles";

export default async function AdminSettingsPage() {
  const [economy, features] = await Promise.all([
    getEconomySettings(),
    prisma.monetizationFeature.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <EconomyForm economy={economy} />
      <MonetizationToggles features={features} />
    </div>
  );
}
