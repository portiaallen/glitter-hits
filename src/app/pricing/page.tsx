import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/layout/PageHero";
import { MEMBERSHIP_PLANS, DEFAULT_MAIL_ECONOMY, getMailEconomy } from "@/lib/mail/service";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const [features, mailEconomy] = await Promise.all([
    prisma.monetizationFeature.findMany({ orderBy: { name: "asc" } }),
    getMailEconomy().catch(() => DEFAULT_MAIL_ECONOMY),
  ]);

  return (
    <div>
      <PageHero
        title="Free exchange first. Premium when you need it."
        description="Earn Glitter Hits by Surfing. Spend them on campaigns, network mail, and membership upgrades. Cash packs stay optional."
        eyebrow="Pricing"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-10 grid gap-4 lg:grid-cols-2">
          {MEMBERSHIP_PLANS.map((plan) => (
            <div key={plan.tier} className="gh-glass p-6">
              <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
                {plan.name}
              </h2>
              <p className="mt-2 text-[var(--text-muted)]">
                {plan.priceCents === 0
                  ? "Free forever core loop"
                  : `$${(plan.priceCents / 100).toFixed(2)}/mo when cash checkout is enabled — or unlock with hits in the Store`}
              </p>
              <ul className="mt-4 space-y-1 text-sm text-white/80">
                {plan.perks.map((perk) => (
                  <li key={perk}>· {perk}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="gh-glass mb-10 p-6 sm:p-8">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
            Network mail
          </h2>
          <p className="mt-2 text-[var(--text-muted)]">
            Credit-priced member mailings. Add a Paid Solo upgrade for featured inbox placement.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
            <li>Standard · {mailEconomy.standardCost} hits</li>
            <li>Boosted · {mailEconomy.boostedCost} hits</li>
            <li>Featured · {mailEconomy.featuredCost} hits</li>
            <li>Premium Solo · {mailEconomy.premiumSoloCost} hits</li>
            <li className="sm:col-span-2">
              Paid Solo upgrade · +{mailEconomy.paidSoloUpgradeCost} hits
            </li>
          </ul>
          <Link href="/store" className="gh-btn gh-btn-primary mt-6">
            Open Store
          </Link>
        </div>

        <h2 className="mb-4 font-[family-name:var(--font-syne)] text-xl font-semibold">
          Revenue architecture
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.key} className="gh-glass p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{f.name}</h3>
                <span className="gh-badge">{f.enabled ? "Available" : "Coming soon"}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {f.description || "Admin-toggleable monetization feature."}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
