"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { MailTier } from "@prisma/client";

type Economy = {
  standardCost: number;
  boostedCost: number;
  featuredCost: number;
  premiumSoloCost: number;
  paidSoloUpgradeCost: number;
  maxRecipientsStandard: number;
  maxRecipientsBoosted: number;
  maxRecipientsFeatured: number;
  maxRecipientsPremiumSolo: number;
};

const TIER_META: Record<
  MailTier,
  { label: string; costKey: keyof Economy; capKey: keyof Economy }
> = {
  standard: {
    label: "Standard",
    costKey: "standardCost",
    capKey: "maxRecipientsStandard",
  },
  boosted: {
    label: "Boosted",
    costKey: "boostedCost",
    capKey: "maxRecipientsBoosted",
  },
  featured: {
    label: "Featured",
    costKey: "featuredCost",
    capKey: "maxRecipientsFeatured",
  },
  premium_solo: {
    label: "Premium Solo",
    costKey: "premiumSoloCost",
    capKey: "maxRecipientsPremiumSolo",
  },
};

export function MailComposeForm({
  economy,
  unlockedTiers,
  balance,
}: {
  economy: Economy;
  unlockedTiers: MailTier[];
  balance: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [tier, setTier] = useState<MailTier>(unlockedTiers[0] ?? "standard");
  const [paidSolo, setPaidSolo] = useState(false);

  const base = Number(economy[TIER_META[tier].costKey]);
  const upgrade = paidSolo || tier === "premium_solo" ? economy.paidSoloUpgradeCost : 0;
  // premium_solo already includes solo treatment in service; avoid double-counting display for premium_solo default
  const displayUpgrade =
    tier === "premium_solo" ? economy.paidSoloUpgradeCost : upgrade;
  const total =
    tier === "premium_solo"
      ? economy.premiumSoloCost + economy.paidSoloUpgradeCost
      : base + (paidSolo ? economy.paidSoloUpgradeCost : 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          subject: fd.get("subject"),
          body: fd.get("body"),
          ctaUrl: fd.get("ctaUrl") || undefined,
          ctaLabel: fd.get("ctaLabel") || undefined,
          tier,
          paidSoloUpgrade: paidSolo || tier === "premium_solo",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Send failed");
        return;
      }
      setOk(
        `Sent to ${data.mail?.recipientCount ?? "network"} members · ${total} hits spent`,
      );
      (e.target as HTMLFormElement).reset();
      setPaidSolo(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="gh-glass space-y-4 p-5">
      <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
        Compose network mail
      </h2>
      <p className="text-sm text-[var(--text-muted)]">
        Reach active Glitter Hits members with credit-priced mailings. Paid Solo upgrades pin
        you to the top of inboxes.
      </p>

      <label className="block text-sm">
        Subject
        <input
          name="subject"
          required
          minLength={3}
          maxLength={120}
          className="gh-input mt-1 w-full"
          placeholder="Get Seen this week…"
        />
      </label>

      <label className="block text-sm">
        Message
        <textarea
          name="body"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          className="gh-input mt-1 w-full"
          placeholder="Tell the network what you're launching…"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          CTA URL
          <input name="ctaUrl" type="url" className="gh-input mt-1 w-full" placeholder="https://" />
        </label>
        <label className="block text-sm">
          CTA label
          <input name="ctaLabel" className="gh-input mt-1 w-full" placeholder="Visit site" />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Mail tier</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(Object.keys(TIER_META) as MailTier[]).map((t) => {
            const unlocked = unlockedTiers.includes(t);
            const meta = TIER_META[t];
            return (
              <label
                key={t}
                className={`rounded-xl border px-3 py-3 text-sm ${
                  tier === t ? "border-[var(--neon-cyan)]/50 bg-[var(--bg-glass)]" : "border-[var(--border-glass)]"
                } ${unlocked ? "cursor-pointer" : "opacity-40"}`}
              >
                <input
                  type="radio"
                  name="tier"
                  className="mr-2"
                  disabled={!unlocked}
                  checked={tier === t}
                  onChange={() => setTier(t)}
                />
                {meta.label} · {economy[meta.costKey]} hits · up to{" "}
                {economy[meta.capKey]} members
                {!unlocked ? " (upgrade)" : ""}
              </label>
            );
          })}
        </div>
      </fieldset>

      {tier !== "premium_solo" ? (
        <label className="flex items-start gap-3 rounded-xl border border-[var(--border-glass)] px-3 py-3 text-sm">
          <input
            type="checkbox"
            checked={paidSolo}
            onChange={(e) => setPaidSolo(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Paid Solo upgrade</span>
            <span className="block text-[var(--text-muted)]">
              +{economy.paidSoloUpgradeCost} hits — featured inbox placement & expanded reach.
            </span>
          </span>
        </label>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          Premium Solo includes paid-solo placement (+{displayUpgrade} hits in total).
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-muted)]">
          Total: <strong className="text-[var(--text)]">{total}</strong> hits · balance {balance}
        </p>
        <button type="submit" disabled={pending} className="gh-btn gh-btn-primary">
          {pending ? "Sending…" : "Send mailing"}
        </button>
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {ok ? <p className="text-sm text-[var(--success)]">{ok}</p> : null}
    </form>
  );
}
