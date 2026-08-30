import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { getCreditHistory } from "@/lib/credits/ledger";
import { prisma } from "@/lib/db";
import { formatCredits } from "@/lib/utils";
import { DailyRewardButton } from "@/components/credits/DailyRewardButton";

export const metadata: Metadata = { title: "Credits" };

export default async function CreditsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const ledger = await getCreditHistory(session.user.id, 100);

  return (
    <AppShell
      title="Glitter Hits"
      subtitle="Promotional credits — not crypto, not Glitter Coins. Every movement is ledgered."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="gh-glass p-5">
          <p className="text-sm text-[var(--text-muted)]">Balance</p>
          <p className="mt-2 text-3xl font-bold">{formatCredits(user.creditBalance)}</p>
        </div>
        <div className="gh-glass p-5">
          <p className="text-sm text-[var(--text-muted)]">Lifetime earned</p>
          <p className="mt-2 text-3xl font-bold">{formatCredits(user.lifetimeEarned)}</p>
        </div>
        <div className="gh-glass p-5">
          <p className="text-sm text-[var(--text-muted)]">Lifetime spent</p>
          <p className="mt-2 text-3xl font-bold">{formatCredits(user.lifetimeSpent)}</p>
        </div>
      </div>
      <DailyRewardButton />
      <p className="mt-4 text-sm text-[var(--text-muted)]">
        Need more hits or membership unlocks?{" "}
        <a href="/store" className="text-[var(--neon-cyan)]">
          Visit the Store
        </a>
        .
      </p>
      <div className="gh-glass mt-6 p-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
          Transaction history
        </h2>
        <ul className="mt-4 space-y-3">
          {ledger.map((entry) => (
            <li key={entry.id} className="flex justify-between gap-3 border-b border-[var(--border-glass)] pb-3 text-sm">
              <div>
                <p>{entry.description}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {entry.type} · {entry.createdAt.toISOString()}
                </p>
              </div>
              <div className="text-right">
                <p className={entry.amount >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                  {entry.amount >= 0 ? "+" : ""}
                  {formatCredits(entry.amount)}
                </p>
                <p className="text-xs text-[var(--text-muted)]">bal {formatCredits(entry.balanceAfter)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
