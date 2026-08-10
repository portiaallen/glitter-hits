import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const features = await prisma.monetizationFeature.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHero
        title="Free exchange first. Premium when you need it."
        description="The core Surf ↔ Campaign loop is useful on its own. Monetization streams are individually toggleable — never a launch blocker."
        eyebrow="Pricing"
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="gh-glass mb-8 p-6 sm:p-8">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold">Free</h2>
          <p className="mt-2 text-[var(--text-muted)]">
            Earn Glitter Hits by discovering sites. Spend them promoting yours. Directory,
            referrals, achievements, and analytics included.
          </p>
          <Link href="/signup" className="gh-btn gh-btn-primary mt-6">
            Join free
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
