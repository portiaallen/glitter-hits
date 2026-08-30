import { getEconomySettings } from "@/lib/settings/economy";
import { prisma } from "@/lib/db";
import { EconomyForm } from "@/components/admin/EconomyForm";
import { MonetizationToggles } from "@/components/admin/MonetizationToggles";
import { getActiveMonthlyTheme } from "@/lib/experience/monthly-theme";
import Link from "next/link";

export default async function AdminSettingsPage() {
  const [economy, features, theme] = await Promise.all([
    getEconomySettings(),
    prisma.monetizationFeature.findMany({ orderBy: { name: "asc" } }),
    getActiveMonthlyTheme(),
  ]);

  return (
    <div className="space-y-6">
      <div className="gh-glass flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-semibold">Theme of the Month</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Live now: <strong className="text-[var(--text)]">{theme.name}</strong> —{" "}
            {theme.tagline}
          </p>
        </div>
        <Link href="/admin/experience" className="gh-btn gh-btn-primary text-sm">
          Change monthly theme
        </Link>
      </div>
      <EconomyForm economy={economy} />
      <MonetizationToggles features={features} />
    </div>
  );
}
