"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { MembershipTier } from "@prisma/client";

type Pack = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  credits: number;
  priceCents: number;
  badge: string | null;
};

type Plan = {
  tier: MembershipTier;
  name: string;
  priceCents: number;
  perks: string[];
  websiteSlots: number;
  enabled: boolean;
};

export function StoreClient({
  packs,
  memberships,
  membershipCreditCosts,
  cashCheckoutEnabled,
  membershipCheckoutEnabled,
  currentMembership,
  balance,
  mailEconomy,
}: {
  packs: Pack[];
  memberships: Plan[];
  membershipCreditCosts: Record<string, number>;
  cashCheckoutEnabled: boolean;
  membershipCheckoutEnabled: boolean;
  currentMembership: MembershipTier;
  balance: number;
  mailEconomy: {
    standardCost: number;
    boostedCost: number;
    featuredCost: number;
    premiumSoloCost: number;
    paidSoloUpgradeCost: number;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const order: MembershipTier[] = ["free", "plus", "premium", "vip"];

  function upgrade(tier: Exclude<MembershipTier, "free">) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upgrade_membership", tier }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Upgrade failed");
        return;
      }
      setMessage(`Upgraded to ${tier}. Spent ${data.cost} hits.`);
      router.refresh();
    });
  }

  function buyPack(packId: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "buy_pack", packId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Purchase unavailable");
        return;
      }
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      setMessage("Pack purchased.");
      router.refresh();
    });
  }

  function buyMembershipCash(tier: Exclude<MembershipTier, "free">) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "buy_membership_cash", tier }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Checkout unavailable");
        return;
      }
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      setError("Checkout did not return a URL.");
    });
  }

  return (
    <div className="space-y-10">
      <div className="gh-glass flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-[var(--text-muted)]">Your balance</p>
          <p className="text-2xl font-bold">{balance} hits</p>
        </div>
        <p className="gh-badge">Membership: {currentMembership}</p>
      </div>

      {(message || error) && (
        <p className={`text-sm ${error ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
          {error || message}
        </p>
      )}

      <section>
        <h2 className="mb-3 font-[family-name:var(--font-syne)] text-xl font-semibold">
          Membership
        </h2>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Unlock higher mail tiers and website slots. Pay with Glitter Hits now
          {membershipCheckoutEnabled ? ", or cash when checkout is live" : ""}.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {memberships.map((plan) => {
            const creditCost = membershipCreditCosts[plan.tier];
            const currentIdx = order.indexOf(currentMembership);
            const planIdx = order.indexOf(plan.tier);
            const owned = planIdx <= currentIdx;
            const canBuy = plan.tier !== "free" && !owned && typeof creditCost === "number";
            return (
              <div key={plan.tier} className="gh-glass p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  {owned ? <span className="gh-badge">Current</span> : null}
                </div>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {plan.websiteSlots} website slots
                  {plan.priceCents > 0
                    ? ` · $${(plan.priceCents / 100).toFixed(2)}/mo when cash is on`
                    : ""}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-[var(--text)]/80">
                  {plan.perks.map((perk) => (
                    <li key={perk}>· {perk}</li>
                  ))}
                </ul>
                {canBuy ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => upgrade(plan.tier as Exclude<MembershipTier, "free">)}
                      className="gh-btn gh-btn-primary text-sm"
                    >
                      Upgrade · {creditCost} hits
                    </button>
                    {membershipCheckoutEnabled && plan.priceCents > 0 ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          buyMembershipCash(plan.tier as Exclude<MembershipTier, "free">)
                        }
                        className="gh-btn gh-btn-ghost text-sm"
                      >
                        Pay ${(plan.priceCents / 100).toFixed(2)}/mo
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-[family-name:var(--font-syne)] text-xl font-semibold">
          Credit packs
        </h2>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          {cashCheckoutEnabled
            ? "Promotional credit packs via checkout."
            : "Cash packs are staged. Earn hits by Surfing — or ask admin to enable purchases."}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packs.map((pack) => (
            <div key={pack.id} className="gh-glass p-5">
              {pack.badge ? <p className="gh-badge mb-2">{pack.badge}</p> : null}
              <h3 className="font-semibold">{pack.name}</h3>
              <p className="mt-2 text-2xl font-bold">{pack.credits}</p>
              <p className="text-sm text-[var(--text-muted)]">hits</p>
              <p className="mt-2 text-sm">${(pack.priceCents / 100).toFixed(2)}</p>
              <button
                type="button"
                disabled={pending || !cashCheckoutEnabled}
                onClick={() => buyPack(pack.id)}
                className="gh-btn gh-btn-ghost mt-4 w-full text-sm"
              >
                {cashCheckoutEnabled ? "Buy" : "Coming soon"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="gh-glass p-5">
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
          Network mail pricing
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Solo mailings spend Glitter Hits. Paid Solo upgrades add featured inbox placement.
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
      </section>
    </div>
  );
}
